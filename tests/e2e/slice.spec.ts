import { expect, test as base } from "@playwright/test";
import type { Locator, Page, TestInfo } from "@playwright/test";
import { classicRules, pairResults } from "../../src/core";
import { SEATS } from "../../src/ui/palette";

// The slice, driven the way a player drives it: by clicks. A fixed seed fixes the
// deal, so every run starts from the same board.
const URL = "/?seed=1994";

// The app's fixed seat order (PLAYERS in src/ui/app.ts). The owner colours come
// from the palette (src/ui/palette.ts), so the gates below hold the painted
// board against what the palette says each owner looks like — never against the
// page's own fill, which would agree with any wrong colour it was given.
const OWNER_SEAT: Record<string, number> = { blue: 0, amber: 1 };

interface OwnerExpectation {
  /** The palette colour, as RGB 0-255. */
  rgb: number[];
  /** The second seat is painted with the hatch stripes over its base colour. */
  hatched: boolean;
}

const OWNER_EXPECTATION: Record<string, OwnerExpectation> = Object.fromEntries(
  Object.entries(OWNER_SEAT).map(([owner, seat]) => {
    const hex = SEATS[seat]?.color ?? "";
    const rgb = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
    return [owner, { rgb, hatched: seat === 1 }];
  }),
);

/**
 * The gate thresholds. Basis: [measured] on the clean board over this map, both
 * viewports, pinned Chromium — the numbers and their margins are recorded in
 * docs/spike.md, "The painted-board gate, measured". The per-pixel colour
 * tolerance, 28, is a literal inside `paintedShares` (it runs in the page).
 */
/** Fraction of a province's sampled pixels that must match its owner's colour. Clean minimum [measured]: 0.795 at 1280x800 (Hoko), 0.814 at 1920x1080 (Ventflanko) — a margin of at least 9.5 points. */
const PAINT_THRESHOLD = 0.7;
/** An owner's colour must sit this far from the sea, or the comparison proves nothing. Clean minimum [measured]: 88. */
const SEA_DISTANCE = 60;
/** A badge or a name is painted only if its pixels, inside the province, show this much contrast. Clean boards measure 317-413; hidden labels at most the hatch stripes' 74-208. */
const LABEL_SPREAD: Record<string, number> = { badge: 240, name: 300, "badge-count": 240 };

interface Holding {
  owner: string;
  armies: number;
}

async function holdings(page: Page): Promise<Record<string, Holding>> {
  return page.$$eval(".province", (groups) =>
    Object.fromEntries(
      groups.map((g) => [
        (g as SVGElement).dataset["province"] as string,
        { owner: (g as SVGElement).dataset["owner"] as string, armies: Number((g as SVGElement).dataset["armies"]) },
      ]),
    ),
  );
}

const province = (page: Page, id: string): Locator => page.locator(`.province[data-province="${id}"]`);
const total = (h: Record<string, Holding>) => Object.values(h).reduce((sum, p) => sum + p.armies, 0);

/** Waits for every finite animation and transition, so a picture is never taken mid-fade. */
async function settle(page: Page): Promise<void> {
  await page.evaluate(() =>
    Promise.all(document.getAnimations().filter((a) => a.effect?.getComputedTiming().iterations !== Infinity).map((a) => a.finished)),
  );
}

async function shot(page: Page, info: TestInfo, name: string): Promise<void> {
  await settle(page);
  await page.screenshot({ path: `screenshots/${info.project.name}/${name}.png` });
}

/**
 * What is actually painted. Takes a real screenshot and, for each province, reads
 * the pixels at a grid of points inside its polygon (clear of its badge and name),
 * comparing them with what its owner's palette colour is — not with the page's own
 * fill, so a province painted in another owner's colour fails here. Opacity, an
 * overlay, a missing paint or a wrong colour all fail, though the DOM still reports
 * a perfectly good board.
 *
 * The hatched seat is compared against the whole segment from its base colour down
 * to the 28%-darker hatched shade (anti-aliased stripe edges count); the unhatched
 * seat against its base colour only, so no seat accepts a darker shade it never
 * wears.
 */
async function paintedShares(page: Page): Promise<
  { id: string; owner: string; share: number; samples: number; fill: string; expected: string; sea: number }[]
> {
  await page.mouse.move(2, 400); // no hover outline over the board
  await settle(page);
  const b64 = (await page.screenshot()).toString("base64");
  return page.evaluate(async ({ png, palette }: { png: string; palette: Record<string, OwnerExpectation> }) => {
    const img = new Image();
    img.src = `data:image/png;base64,${png}`;
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D;
    ctx.drawImage(img, 0, 0);
    const pixel = (x: number, y: number) => Array.from(ctx.getImageData(Math.round(x), Math.round(y), 1, 1).data.slice(0, 3));
    /** Distance from a point to the segment a-b (a point when a equals b). */
    const segDist = (p: number[], a: number[], b: number[]) => {
      const ab = [b[0]! - a[0]!, b[1]! - a[1]!, b[2]! - a[2]!];
      const ap = [p[0]! - a[0]!, p[1]! - a[1]!, p[2]! - a[2]!];
      const len2 = ab[0]! * ab[0]! + ab[1]! * ab[1]! + ab[2]! * ab[2]!;
      const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, (ap[0]! * ab[0]! + ap[1]! * ab[1]! + ap[2]! * ab[2]!) / len2));
      return Math.hypot(p[0]! - (a[0]! + t * ab[0]!), p[1]! - (a[1]! + t * ab[1]!), p[2]! - (a[2]! + t * ab[2]!));
    };
    const svg = document.querySelector("#map") as unknown as SVGSVGElement;
    const ctm = svg.getScreenCTM() as DOMMatrix;
    const corner = svg.getBoundingClientRect();
    const sea = pixel(corner.left + 6, corner.top + 6);
    const out = [];
    for (const g of Array.from(document.querySelectorAll(".province"))) {
      const owner = (g as SVGElement).dataset["owner"] as string;
      const expected = palette[owner] as { rgb: number[]; hatched: boolean };
      const path = g.querySelector(".shape") as unknown as SVGGeometryElement;
      const fill = getComputedStyle(path).fill;
      // The hatch stripes are black at 28% opacity over the base colour.
      const shaded = expected.rgb.map((c) => c * (1 - 0.28));
      const badge = g.querySelector(".badge") as SVGGElement;
      const [lx, ly] = (badge.getAttribute("transform")?.match(/-?[\d.]+/g) ?? ["0", "0"]).map(Number) as [number, number];
      const half = (g.querySelector(".name") as unknown as SVGTextElement).getBBox().width / 2 + 10;
      const box = path.getBBox();
      let samples = 0;
      let match = 0;
      for (let x = box.x; x < box.x + box.width; x += 12) {
        for (let y = box.y; y < box.y + box.height; y += 12) {
          if (!path.isPointInFill(new DOMPoint(x, y))) continue;
          if (Math.abs(x - lx) < half && y > ly - 30 && y < ly + 48) continue; // under the badge or the name
          const at = new DOMPoint(x, y).matrixTransform(ctm);
          samples++;
          if (segDist(pixel(at.x, at.y), expected.rgb, expected.hatched ? shaded : expected.rgb) <= 28) match++;
        }
      }
      out.push({
        id: (g as SVGElement).dataset["province"] as string,
        owner,
        share: samples ? match / samples : 0,
        samples,
        fill,
        expected: `rgb(${expected.rgb.join(", ")})`,
        sea: segDist(expected.rgb, sea, sea),
      });
    }
    return out;
  }, { png: b64, palette: OWNER_EXPECTATION });
}

/**
 * Overlay hygiene: the FROM-to-TARGET arrow must not run over any badge or name,
 * and each legal-target marker must sit wholly inside its own province, clear of
 * every label. Returns the problems found (empty when clean).
 */
async function overlayProblems(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const problems: string[] = [];
    const labels = Array.from(document.querySelectorAll(".province")).flatMap((g) =>
      [".badge", ".name"].map((sel) => ({ id: (g as SVGElement).dataset["province"], r: (g.querySelector(sel) as Element).getBoundingClientRect() })),
    );
    const within = (x: number, y: number, r: DOMRect, pad: number) => x > r.left - pad && x < r.right + pad && y > r.top - pad && y < r.bottom + pad;
    const arrow = document.querySelector(".ov-arrow") as SVGPathElement | null;
    if (arrow) {
      const ctm = arrow.getScreenCTM() as DOMMatrix;
      const length = arrow.getTotalLength();
      for (let at = 0; at <= length; at += 4) {
        const p = arrow.getPointAtLength(at).matrixTransform(ctm);
        const hit = labels.find((l) => within(p.x, p.y, l.r, 1));
        if (hit) {
          problems.push(`the arrow runs over a label of ${hit.id}`);
          break;
        }
      }
    }
    for (const mark of Array.from(document.querySelectorAll(".crosshair"))) {
      const id = (mark as SVGElement).dataset["province"] as string;
      const shape = document.querySelector(`.province[data-province="${id}"] .shape`) as unknown as SVGGeometryElement;
      const [cx, cy] = (mark.getAttribute("transform")?.match(/-?[\d.]+/g) ?? ["0", "0"]).map(Number) as [number, number];
      const ring = [[0, 0], ...Array.from({ length: 8 }, (_, i) => [Math.cos((i * Math.PI) / 4) * 20, Math.sin((i * Math.PI) / 4) * 20])];
      if (!ring.every(([dx, dy]) => shape.isPointInFill(new DOMPoint(cx! + dx!, cy! + dy!)))) problems.push(`the marker on ${id} is not wholly inside it`);
      const box = mark.getBoundingClientRect();
      const over = labels.find((l) => box.left < l.r.right && box.right > l.r.left && box.top < l.r.bottom && box.bottom > l.r.top);
      if (over) problems.push(`the marker on ${id} sits on a label of ${over.id}`);
    }
    return problems;
  });
}

/** Clicks the active player's provinces until one offers a target; returns [from, firstTarget]. */
async function pickAttack(page: Page): Promise<[string, string]> {
  const mine = await page.$$eval(".province.is-mine", (gs) => gs.map((g) => (g as SVGElement).dataset["province"] as string));
  for (const from of mine) {
    await province(page, from).click();
    const targets = await page.$$eval('.province[data-target="true"]', (gs) => gs.map((g) => (g as SVGElement).dataset["province"] as string));
    if (targets[0] !== undefined) return [from, targets[0]];
  }
  throw new Error("the active player has no legal attack on this seed");
}

/** Every test opens the fixed-seed game and fails on any page error or console error. */
const test = base.extend<{ game: void }>({
  game: [
    async ({ page }, use) => {
      const problems: string[] = [];
      page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
      page.on("console", (m) => m.type() === "error" && problems.push(`console: ${m.text()}`));
      await page.goto(URL);
      await page.waitForSelector("body[data-ready=true]");
      await use();
      expect(problems).toEqual([]);
    },
    { auto: true },
  ],
});

test("the page loads with the title, the turn and both buttons", async ({ page }) => {
  await expect(page).toHaveTitle(/Malpaco/);
  await expect(page.getByRole("heading", { name: "Malpaco" })).toBeVisible();
  await expect(page.locator("#turn-title")).toHaveText("Blue's turn");
  await expect(page.getByRole("button", { name: "Attack" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "End turn" })).toBeEnabled();
});

test("all 14 provinces render, visible, on top, and told apart by more than colour", async ({ page }) => {
  const groups = page.locator(".province");
  await expect(groups).toHaveCount(14);

  // Non-blank gate: each province has a real, visible shape, and it is what a click at its badge would hit.
  const viewport = page.viewportSize() as { width: number; height: number };
  const ids = Object.keys(await holdings(page));
  expect(ids).toHaveLength(14);
  for (const id of ids) {
    const shape = province(page, id).locator(".shape");
    const box = await shape.boundingBox();
    expect(box, `${id} has no box`).not.toBeNull();
    expect(box!.width, `${id} is too narrow`).toBeGreaterThan(40);
    expect(box!.height, `${id} is too short`).toBeGreaterThan(40);
    expect(box!.x + box!.width, `${id} leaves the viewport`).toBeLessThanOrEqual(viewport.width);
    expect(box!.y + box!.height, `${id} leaves the viewport`).toBeLessThanOrEqual(viewport.height);
    const hit = await province(page, id).locator(".badge").evaluate((badge) => {
      const r = badge.getBoundingClientRect();
      const el = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      return el?.closest(".province")?.getAttribute("data-province") ?? null;
    });
    expect(hit, `${id} is covered or invisible at its badge`).toBe(id);
  }

  // Ownership: every province filled exactly with its owner's palette colour,
  // and the cues that do not depend on colour.
  const state = await holdings(page);
  const owners = new Set(Object.values(state).map((p) => p.owner));
  expect(owners).toEqual(new Set(["blue", "amber"]));
  const looks = await page.$$eval(".province", (gs) =>
    gs.map((g) => ({
      owner: (g as SVGElement).dataset["owner"],
      fill: getComputedStyle(g.querySelector(".shape") as Element).fill,
      hatch: getComputedStyle(g.querySelector(".hatch") as Element).display,
      initial: g.querySelector(".badge-initial")?.textContent,
      count: g.querySelector(".badge-count")?.textContent,
      armies: (g as SVGElement).dataset["armies"],
    })),
  );
  expect(new Set(looks.map((l) => l.fill)).size).toBe(2);
  for (const l of looks) {
    const seat = l.owner === undefined ? undefined : OWNER_SEAT[l.owner];
    const hex = seat === undefined ? "" : (SEATS[seat]?.color ?? "");
    const want = hex === "" ? "" : `rgb(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(", ")})`;
    expect(l.fill, `${l.owner}'s province is filled ${l.fill}, not the palette colour ${want}`).toBe(want);
    expect(l.count).toBe(l.armies);
    expect(l.initial).toBe(l.owner === "blue" ? "B" : "A");
    expect(l.hatch).toBe(l.owner === "blue" ? "none" : "block");
  }
});

test("the board is painted: the pixels inside every province are its owner's palette colour", async ({ page }) => {
  const shares = await paintedShares(page);
  expect(shares).toHaveLength(14);
  for (const p of shares) {
    const want = OWNER_EXPECTATION[p.owner];
    expect(want, `no palette colour known for the owner '${p.owner}'`).toBeDefined();
    // The DOM layer: the fill the page claims must be the owner's palette colour.
    expect(p.fill, `${p.id} (${p.owner}) is filled ${p.fill}, not its owner's palette colour ${p.expected}`).toBe(p.expected);
    expect(p.samples, `${p.id}: no interior point to sample`).toBeGreaterThanOrEqual(6);
    expect(p.sea, `${p.id}: the owner's colour must differ from the sea, or this proves nothing`).toBeGreaterThan(SEA_DISTANCE);
    expect(p.share, `${p.id} is not painted in ${p.expected} (${Math.round(p.share * 100)}% of ${p.samples} sampled pixels)`).toBeGreaterThanOrEqual(
      PAINT_THRESHOLD,
    );
  }
});

test("every badge and name is actually painted, not merely present in the DOM", async ({ page }) => {
  await page.mouse.move(2, 400); // no hover outline or tooltip over the board
  await settle(page);
  const b64 = (await page.screenshot()).toString("base64");
  const labels = await page.evaluate(async (png) => {
    const img = new Image();
    img.src = `data:image/png;base64,${png}`;
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D;
    ctx.drawImage(img, 0, 0);
    const pixel = (x: number, y: number) => Array.from(ctx.getImageData(Math.round(x), Math.round(y), 1, 1).data.slice(0, 3));
    const svg = document.querySelector("#map") as unknown as SVGSVGElement;
    const inverse = (svg.getScreenCTM() as DOMMatrix).inverse();
    const out: { id: string; kind: string; spread: number; sampled: number }[] = [];
    for (const g of Array.from(document.querySelectorAll(".province"))) {
      const id = (g as SVGElement).dataset["province"] as string;
      const shape = g.querySelector(".shape") as unknown as SVGGeometryElement;
      for (const sel of [".badge", ".name", ".badge-count"]) {
        const el = g.querySelector(sel);
        if (!el) {
          out.push({ id, kind: sel.slice(1), spread: 0, sampled: 0 });
          continue;
        }
        const r = (el as Element).getBoundingClientRect();
        const lo = [255, 255, 255];
        const hi = [0, 0, 0];
        let sampled = 0;
        for (let x = r.left + 1; x < r.right; x += 3) {
          for (let y = r.top + 1; y < r.bottom; y += 3) {
            // Only pixels inside the province: a label straddling the coast has
            // sea and sand behind it, which would fake contrast when hidden.
            if (!shape.isPointInFill(new DOMPoint(x, y).matrixTransform(inverse))) continue;
            const px = pixel(x, y);
            for (const c of [0, 1, 2]) {
              lo[c] = Math.min(lo[c]!, px[c]!);
              hi[c] = Math.max(hi[c]!, px[c]!);
            }
            sampled++;
          }
        }
        out.push({ id, kind: sel.slice(1), spread: Math.hypot(hi[0]! - lo[0]!, hi[1]! - lo[1]!, hi[2]! - lo[2]!), sampled });
      }
    }
    return out;
  }, b64);
  expect(labels).toHaveLength(42); // 14 provinces, badge + name + count each
  for (const l of labels) {
    const floor = LABEL_SPREAD[l.kind];
    expect(floor, `no threshold known for a ${l.kind}`).toBeGreaterThan(0);
    expect(l.sampled, `${l.id} ${l.kind}: nothing to sample inside the province`).toBeGreaterThan(5);
    // Hidden with `opacity: 0`, the area is whatever the province paint alone
    // gives (flat fill, at most the hatch stripes and the border stroke);
    // painted, the white count and name stand against their dark backdrop.
    expect(l.spread, `${l.id} ${l.kind} shows no contrast — it is not painted`).toBeGreaterThanOrEqual(floor as number);
  }
});

test("the layout fits the viewport: no page scroll, map and panel both fully visible", async ({ page }) => {
  const viewport = page.viewportSize() as { width: number; height: number };
  const scroll = await page.evaluate(() => ({ w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight }));
  expect(scroll.w).toBeLessThanOrEqual(viewport.width);
  expect(scroll.h).toBeLessThanOrEqual(viewport.height);
  const map = (await page.locator("#map").boundingBox())!;
  const panel = (await page.locator(".panel").boundingBox())!;
  expect(map.width).toBeGreaterThan(viewport.width * 0.6);
  expect(map.x + map.width).toBeLessThanOrEqual(panel.x + 1);
  for (const name of ["Attack", "End turn"]) {
    const b = (await page.getByRole("button", { name }).boundingBox())!;
    expect(b.y + b.height).toBeLessThanOrEqual(viewport.height);
  }
  // Province names must stay readable: at least 11 px as rendered (font size x the SVG's scale).
  const nameSize = await page.locator(".province .name").first().evaluate((t) => {
    const scale = (t as unknown as SVGGraphicsElement).getScreenCTM()!.a;
    return scale * parseFloat(getComputedStyle(t).fontSize);
  });
  expect(nameSize).toBeGreaterThanOrEqual(11);
});

for (const [width, height] of [
  [1366, 768],
  [1600, 900],
  [1920, 1080],
] as const) {
  test(`the panel never overflows at ${width}x${height}: New game and the seed in view, nothing to scroll`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await settle(page);
    const scroll = await page.evaluate(() => ({ w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight }));
    expect(scroll.w, `the page scrolls sideways at ${width}x${height}`).toBeLessThanOrEqual(width);
    expect(scroll.h, `the page scrolls at ${width}x${height}`).toBeLessThanOrEqual(height);
    const panel = await page.locator(".panel").evaluate((el) => ({ client: el.clientHeight, scroll: el.scrollHeight }));
    expect(panel.scroll, `the panel itself scrolls at ${width}x${height}`).toBeLessThanOrEqual(panel.client);
    for (const id of ["new-game-button", "seed"]) {
      const box = (await page.locator(`#${id}`).boundingBox())!;
      expect(box.y, `${id} is above the viewport at ${width}x${height}`).toBeGreaterThanOrEqual(0);
      expect(box.y + box.height, `${id} is below the viewport at ${width}x${height}`).toBeLessThanOrEqual(height);
      expect(box.x, `${id} is left of the viewport at ${width}x${height}`).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width, `${id} is right of the viewport at ${width}x${height}`).toBeLessThanOrEqual(width);
    }
  });
}

test("hovering a province outlines it and names it", async ({ page }) => {
  await province(page, "sulo").locator(".shape").hover();
  await expect(page.locator(".overlay .ov-hover")).toHaveCount(1);
  await expect(page.locator(".tip")).toBeVisible();
  await expect(page.locator(".tip strong")).toHaveText("Sulo");
  await page.mouse.move(2, 400);
  await expect(page.locator(".overlay .ov-hover")).toHaveCount(0);
});

test("selecting a province highlights it and its targets, dims the rest and enables Attack only with a target", async ({ page }) => {
  const [from, target] = await pickAttack(page);
  await expect(province(page, from)).toHaveAttribute("data-selected", "true");
  await expect(page.locator(".overlay .ov-selected")).toHaveCount(1);
  await expect(page.locator(".overlay .ov-target, .overlay .ov-chosen").first()).toBeVisible();
  await expect(page.locator(".province.is-dim").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Attack" })).toBeDisabled();

  await province(page, target).click();
  await expect(page.locator(".overlay .ov-chosen")).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Attack" })).toBeEnabled();
  await expect(page.locator("#hint")).toContainText("attacks");
  expect(await overlayProblems(page)).toEqual([]);

  await page.keyboard.press("Escape");
  await expect(page.locator(".overlay .ov-selected")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Attack" })).toBeDisabled();
});

test("legal-target markers and the arrow stay clear of every label, whichever province is selected", async ({ page }) => {
  const mine = await page.$$eval(".province.is-mine", (gs) => gs.map((g) => (g as SVGElement).dataset["province"] as string));
  let markers = 0;
  let arrows = 0;
  for (const from of mine) {
    await province(page, from).click();
    for (const target of await page.$$eval('.province[data-target="true"]', (gs) => gs.map((g) => (g as SVGElement).dataset["province"] as string))) {
      await province(page, target).click();
      markers += await page.locator(".crosshair").count();
      arrows += await page.locator(".ov-arrow").count();
      expect(await overlayProblems(page), `${from} -> ${target}`).toEqual([]);
    }
  }
  expect(markers + arrows).toBeGreaterThan(0); // the loop really visited something
});

test("an illegal target is refused with the reason, and nothing is selected as a target", async ({ page }) => {
  const [from] = await pickAttack(page);
  const forbidden = await page.$$eval('.province:not(.is-mine)[data-target="false"]', (gs) => (gs[0] as SVGElement).dataset["province"] as string);
  await province(page, forbidden).click();
  await expect(page.locator(".overlay .ov-chosen")).toHaveCount(0);
  await expect(page.locator("#hint")).not.toHaveText("");
  await expect(province(page, from)).toHaveAttribute("data-selected", "true");
});

test("one game, in sequence: select, attack by clicks, read the dice, end the turn (these are the screenshots)", async ({ page }, info) => {
  await shot(page, info, "01-start");
  const before = await holdings(page);
  const [from, to] = await pickAttack(page);
  await province(page, to).click();
  await page.mouse.move(2, 400); // off the map, so the tooltip does not cover the tags
  await shot(page, info, "02-selected");
  const logBefore = await page.locator(".log li").count();
  await page.getByRole("button", { name: "Attack" }).click();

  const dialog = page.locator("#result-dialog");
  await expect(dialog).toBeVisible();
  const attackerDice = await dialog.locator(".die.attacker").count();
  const defenderDice = await dialog.locator(".die.defender").count();
  expect(attackerDice).toBeGreaterThanOrEqual(1);
  expect(attackerDice).toBeLessThanOrEqual(3);
  expect(defenderDice).toBeGreaterThanOrEqual(1);
  expect(defenderDice).toBeLessThanOrEqual(2);
  // The engine's own losses (carried on the dialog) against the labels the player reads.
  const attackerLosses = Number(await dialog.getAttribute("data-attacker-losses"));
  const defenderLosses = Number(await dialog.getAttribute("data-defender-losses"));
  expect(await dialog.locator(".verdict.down").count()).toBe(attackerLosses);
  expect(await dialog.locator(".verdict.up").count()).toBe(defenderLosses);
  expect(attackerLosses + defenderLosses).toBe(Math.min(attackerDice, defenderDice));
  // Column by column: each label must match its two dice faces under the
  // engine's tie rule (classicRules' ties, which pairResults applies). Counting
  // labels alone cannot see a pair labelled the wrong way round.
  const ties = classicRules().combat.ties;
  const attackerFaces = await dialog.locator(".die.attacker").evaluateAll((els) => els.map((e) => Number((e as HTMLElement).dataset["face"])));
  const defenderFaces = await dialog.locator(".die.defender").evaluateAll((els) => els.map((e) => Number((e as HTMLElement).dataset["face"])));
  const paired = pairResults(ties, attackerFaces, defenderFaces);
  const verdicts = await dialog.locator(".verdict").all();
  expect(verdicts.length, "one label per dice column").toBe(Math.max(attackerFaces.length, defenderFaces.length));
  for (let i = 0; i < verdicts.length; i++) {
    const won = paired[i];
    const wantClass = won === undefined ? "none" : won === "attacker" ? "up" : "down";
    const wantText = won === undefined ? "\u2014" : won === "attacker" ? "\u25b2 wins" : "\u25bc holds";
    expect(await verdicts[i]!.getAttribute("class"), `column ${i + 1}: the label class must say ${wantClass}`).toContain(wantClass);
    expect(await verdicts[i]!.textContent(), `column ${i + 1}: the label text must read "${wantText}"`).toBe(wantText);
  }
  const kind = await dialog.getAttribute("data-outcome");
  await page.waitForTimeout(700); // let the dice finish tumbling before the picture
  await shot(page, info, "03-result");

  await page.getByRole("button", { name: "Continue" }).click();
  await expect(dialog).toBeHidden();
  await page.waitForTimeout(1000); // let the flash settle
  await page.mouse.move(2, 400);
  await shot(page, info, "04-after-attack");

  const after = await holdings(page);
  expect(after).not.toEqual(before); // the state changed
  expect(total(after)).toBeLessThan(total(before)); // an attack always costs somebody an army
  await expect(page.locator(".log li")).toHaveCount(Math.min(7, logBefore + 1));
  await expect(page.locator(".log li").first()).toContainText("\u2192");

  // The map shows exactly what the engine said.
  const mover = before[from]!.owner;
  if (kind === "captured") {
    expect(after[to]!.owner).toBe(mover);
    expect(after[from]!.armies + after[to]!.armies).toBe(before[from]!.armies - attackerLosses);
  } else if (kind === "lost") {
    expect(after[from]!.owner).not.toBe(mover);
  } else {
    expect(after[from]!.armies).toBe(before[from]!.armies - attackerLosses);
    expect(after[to]!.armies).toBe(before[to]!.armies - defenderLosses);
    expect(after[to]!.owner).toBe(before[to]!.owner);
  }

  // The same game, handed to the other player: this is the last picture.
  await page.getByRole("button", { name: "End turn" }).click();
  await expect(page.locator("#turn-title")).toHaveText("Amber's turn");
  await page.waitForTimeout(400);
  await page.mouse.move(2, 400);
  await shot(page, info, "05-amber-turn");
});

test("End turn passes play to the other player, whose provinces become the playable ones", async ({ page }) => {
  const blue = await page.$$eval(".province.is-mine", (gs) => gs.map((g) => (g as SVGElement).dataset["province"]));
  await page.getByRole("button", { name: "End turn" }).click();
  await expect(page.locator("#turn-title")).toHaveText("Amber's turn");
  const amber = await page.$$eval(".province.is-mine", (gs) => gs.map((g) => (g as SVGElement).dataset["province"]));
  expect(amber.length).toBeGreaterThan(0);
  expect(amber.filter((id) => blue.includes(id))).toEqual([]);
  expect(await page.$$eval(".province.is-mine", (gs) => gs.every((g) => (g as SVGElement).dataset["owner"] === "amber"))).toBe(true);
  await expect(page.locator(".toast")).toHaveText("Amber's turn");

  // Amber can attack too: the same clicks, from the other side.
  const [from, to] = await pickAttack(page);
  await province(page, to).click();
  await page.getByRole("button", { name: "Attack" }).click();
  await expect(page.locator("#result-dialog")).toBeVisible();
  await expect(page.locator("#result-dialog h2")).toContainText(`attacks`);
  await page.getByRole("button", { name: "Continue" }).click();
  expect(from).not.toBe(to);
});

test("a province can be selected and a target chosen with the keyboard alone", async ({ page }) => {
  const mine = await page.$$eval(".province.is-mine", (gs) => gs.map((g) => (g as SVGElement).dataset["province"] as string));
  let selected = "";
  for (const id of mine) {
    await province(page, id).focus();
    await page.keyboard.press("Enter");
    if ((await page.locator('.province[data-target="true"]').count()) > 0) {
      selected = id;
      break;
    }
  }
  expect(selected).not.toBe("");
  await expect(province(page, selected)).toHaveAttribute("data-selected", "true");
  const target = await page.$$eval('.province[data-target="true"]', (gs) => (gs[0] as SVGElement).dataset["province"] as string);
  await province(page, target).focus();
  await page.keyboard.press("Space");
  await expect(page.getByRole("button", { name: "Attack" })).toBeEnabled();
});
