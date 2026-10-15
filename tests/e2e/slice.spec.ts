import { expect, test as base } from "@playwright/test";
import type { Locator, Page, TestInfo } from "@playwright/test";
import { malpacoRules, pairResults } from "../../src/core";
import { SEATS } from "../../src/ui/palette";

// The slice, driven the way a player drives it: by clicks. A fixed seed fixes the
// deal, so every run starts from the same board.
const URL = "/?view=authored-game&seed=1994";

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
/** Fraction of a province's sampled pixels that must match its owner's colour. Clean minimum [measured] in the pinned image: 76.5% at 1280x800 (Hoko), 80.4% at 1920x1080 (Hoko) — a margin of at least 6.5 points. */
const PAINT_THRESHOLD = 0.7;
/** An owner's colour must sit this far from the sea, or the comparison proves nothing. Clean minimum [measured]: 87.6-88.8 for blue, 206.6 for amber. */
const SEA_DISTANCE = 60;
/**
 * A badge or a name is painted only if its pixels, inside the province, show this
 * much contrast. On the clean board in the pinned image, badge/name/count measure
 * 290.5-408.8 (badge and name sampled every 3 px, the count every 1 px — see
 * below) and the initial 211.3-262.0 (every 1 px); hidden labels measure at most
 * the hatch stripes' and border stroke's 74-208, and a hidden initial exactly 0.
 * The floors keep at least 31 points below the clean minimum and 32 above the
 * hidden maximum.
 */
const LABEL_SPREAD: Record<string, number> = { badge: 240, name: 300, "badge-count": 240, "badge-initial": 180 };
/**
 * A hatched province is really hatched only if a share of its samples sits in the
 * hatch's dark stripes, not merely in the base-to-shaded segment the paint gate
 * accepts (that segment contains the plain base colour, so a hidden hatch passed
 * it — review round 2, R3). Clean amber provinces measure [measured] 23.1-36.9%
 * dark samples at both viewports in the pinned image; with
 * `.province.seat-1 .hatch { opacity: 0 }` nothing inside measures within 28 RGB
 * of the shaded colour, so 0% — the dark stroke, 52 away, does not count. The
 * floor sits 8.1 points under the clean minimum and 15 points over a hidden hatch.
 */
const HATCH_DARK_SHARE = 0.15;
/**
 * A die's pips must stand off its face by this much, measured on the screenshot:
 * the pip reader classifies a cell by whichever colour its centre is nearer,
 * which alone accepts pips one RGB level from the face — present to the machine,
 * unreadable to a player (review round 2, R1). Clean faces measure [measured]
 * 314.8-349.5 per lit cell, both sides, both viewports, and every unlit cell sits
 * exactly on the face; pips one level up measure 1. The floor keeps 149 points
 * between it and the evasion, 164 under the clean minimum.
 */
const PIP_CONTRAST = 150;
/** An unlit pip cell must show the die's face itself, within this distance. Clean faces measure 0 [measured]. */
const NEAR_FACE = 60;
/**
 * A verdict label must be painted, not merely present with the right class and
 * text: `.verdict { opacity: 0 }` erased every win/hold label from the picture
 * while the class and text checks passed (review round 2, R2). Painted verdicts
 * measure [measured] 161.2-258.6 spread on the dialog's flat surface at both
 * viewports (the tie's em-dash is the low end); a hidden one measures 0. The
 * floor keeps 41 points under the clean minimum and 120 over a hidden label.
 */
const VERDICT_SPREAD = 120;
/** A verdict's box must offer pixels to read, so a zero-sized label cannot pass on a technicality. */
const VERDICT_SAMPLES = 20;

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

/** Waits for the fonts and for every finite animation and transition, so a picture is never taken mid-fade or in a fallback font. */
async function settle(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(document.getAnimations().filter((a) => a.effect?.getComputedTiming().iterations !== Infinity).map((a) => a.finished));
  });
}

/** Takes a settled screenshot for the artifact and returns it, base64, for pixel work. */
async function shot(page: Page, info: TestInfo, name: string): Promise<string> {
  await settle(page);
  return (await page.screenshot({ path: `screenshots/${info.project.name}/${name}.png` })).toString("base64");
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
 * wears. For the hatched seat it also reports the share of samples sitting in the
 * stripes themselves (`darkShare`), which the test gates separately: the segment
 * alone also contains the plain base colour, which is what a province with its
 * hatch hidden would show everywhere.
 */
async function paintedShares(page: Page): Promise<
  { id: string; owner: string; share: number; darkShare: number; samples: number; fill: string; expected: string; sea: number }[]
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
      let dark = 0;
      for (let x = box.x; x < box.x + box.width; x += 12) {
        for (let y = box.y; y < box.y + box.height; y += 12) {
          if (!path.isPointInFill(new DOMPoint(x, y))) continue;
          if (Math.abs(x - lx) < half && y > ly - 30 && y < ly + 48) continue; // under the badge or the name
          const at = new DOMPoint(x, y).matrixTransform(ctm);
          samples++;
          const px = pixel(at.x, at.y);
          if (segDist(px, expected.rgb, expected.hatched ? shaded : expected.rgb) <= 28) match++;
          // The dark share separates a drawn hatch from a merely declared one: the
          // stripes, not the base colour, sit within 28 of the shaded end.
          if (expected.hatched && segDist(px, shaded, shaded) <= 28) dark++;
        }
      }
      out.push({
        id: (g as SVGElement).dataset["province"] as string,
        owner,
        share: samples ? match / samples : 0,
        darkShare: samples ? dark / samples : 0,
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
 * The dice-face layout the dialog draws (resultDialog.ts' PIPS): for each face,
 * which of a die's nine cells, in DOM order, hold a pip.
 */
const DIE_PIPS: Record<number, readonly number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

const faceOf = (lit: number[]): number | null =>
  Number(Object.keys(DIE_PIPS).find((face) => DIE_PIPS[Number(face)]!.join(",") === lit.join(","))) || null;

/**
 * One die as drawn: which of its nine cells the screenshot shows lit, how far the
 * lit cells' pixels sit from the die's face (the pips' rendered contrast), and how
 * far the unlit cells' pixels sit from it (they must show the face itself).
 */
interface DieRead {
  lit: number[];
  minLitContrast: number;
  maxUnlitDelta: number;
}

/**
 * The faces as actually drawn: over a real screenshot, for every die the pixel at
 * each of its nine pip cells, classified against the colours that cell would paint
 * (its own background, or the die's face where the cell paints nothing). Reading
 * `data-face` instead passed a die whose pips were all hidden — a blank square the
 * player cannot read (review round 1, R2). Classification alone is not enough
 * either: it accepted pips painted one RGB level from the face, which a player
 * cannot read (review round 2, R1), so each die also reports the measured
 * contrast. Returns one `DieRead` per die, in DOM order; the caller maps them to
 * faces with `faceOf` and gates the distances.
 */
async function drawnDice(page: Page, png: string): Promise<{ attacker: DieRead[]; defender: DieRead[] }> {
  return page.evaluate(async (b64) => {
    const img = new Image();
    img.src = `data:image/png;base64,${b64}`;
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D;
    ctx.drawImage(img, 0, 0);
    const pixel = (x: number, y: number) => Array.from(ctx.getImageData(Math.round(x), Math.round(y), 1, 1).data.slice(0, 3));
    const rgb = (c: string): number[] => (c.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
    const paints = (c: string) => c !== "transparent" && !/rgba\(\s*0,\s*0,\s*0,\s*0\s*\)/.test(c);
    const read = (side: string): DieRead[] =>
      Array.from(document.querySelectorAll(`.die.${side}`)).map((die) => {
        const bg = rgb(getComputedStyle(die as HTMLElement).backgroundColor);
        const lit: number[] = [];
        let minLitContrast = Number.POSITIVE_INFINITY;
        let maxUnlitDelta = 0;
        Array.from(die.children).forEach((cell, i) => {
          const el = cell as HTMLElement;
          const r = el.getBoundingClientRect();
          if (r.width < 4 || r.height < 4) return; // no box: nothing can be drawn there
          const own = getComputedStyle(el).backgroundColor;
          const paint = paints(own) ? rgb(own) : bg;
          const px = pixel(r.left + r.width / 2, r.top + r.height / 2);
          const near = (c: number[]) => Math.hypot(px[0]! - c[0]!, px[1]! - c[1]!, px[2]! - c[2]!);
          if (near(paint) < near(bg)) {
            lit.push(i); // the cell shows its own paint, not the die's face
            minLitContrast = Math.min(minLitContrast, near(bg)); // rendered: pip against the face
          } else {
            maxUnlitDelta = Math.max(maxUnlitDelta, near(bg)); // rendered: the face must show through
          }
        });
        return { lit, minLitContrast, maxUnlitDelta };
      });
    return { attacker: read("attacker"), defender: read("defender") };
  }, png);
}

/**
 * Rendered contrast inside each matched element's box, from a real screenshot: the
 * Euclidean spread of its sampled pixels and how many pixels were sampled. A
 * label hidden with `opacity: 0` or `color: transparent` reads as whatever sits
 * behind it (flat surface, so near 0); a painted one stands out against it. The
 * sampled count exposes a label shrunk to nothing, whose empty box would
 * otherwise spread from its 255/0 defaults.
 */
async function paintedSpreads(page: Page, png: string, selector: string): Promise<{ text: string; spread: number; sampled: number }[]> {
  return page.evaluate(async ({ b64, selector }) => {
    const img = new Image();
    img.src = `data:image/png;base64,${b64}`;
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D;
    ctx.drawImage(img, 0, 0);
    const pixel = (x: number, y: number) => Array.from(ctx.getImageData(Math.round(x), Math.round(y), 1, 1).data.slice(0, 3));
    return Array.from(document.querySelectorAll(selector)).map((el) => {
      const r = el.getBoundingClientRect();
      const lo = [255, 255, 255];
      const hi = [0, 0, 0];
      let sampled = 0;
      for (let x = r.left + 0.5; x < r.right; x += 1) {
        for (let y = r.top + 0.5; y < r.bottom; y += 1) {
          const px = pixel(x, y);
          for (const c of [0, 1, 2]) {
            lo[c] = Math.min(lo[c]!, px[c]!);
            hi[c] = Math.max(hi[c]!, px[c]!);
          }
          sampled++;
        }
      }
      return {
        text: (el.textContent ?? "").trim(),
        spread: Math.hypot(hi[0]! - lo[0]!, hi[1]! - lo[1]!, hi[2]! - lo[2]!),
        sampled,
      };
    });
  }, { b64: png, selector });
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

/** Places the full income pool through province clicks, then opens combat. */
async function enterCombat(page: Page): Promise<void> {
  if (await page.locator("#turn-phase").innerText() !== "Reinforcement") return;
  const pool = Number(await page.locator("#reinforcement-pool").innerText());
  const owned = page.locator(".province.is-mine").first();
  for (let i = 0; i < pool; i++) await owned.click();
  await page.getByRole("button", { name: "Start combat" }).click();
  await expect(page.locator("#turn-phase")).toHaveText("Attack");
}

/** Clicks the active player's provinces until one offers a target; returns [from, firstTarget]. */
async function pickAttack(page: Page): Promise<[string, string]> {
  await enterCombat(page);
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
  await expect(page.locator("#turn-phase")).toHaveText("Reinforcement");
  await expect(page.locator("#income-base")).toBeVisible();
  await expect(page.locator("#income-island")).toBeVisible();
  await expect(page.getByRole("button", { name: "Start combat" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "End turn" })).toBeDisabled();
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
    if (want?.hatched) {
      expect(
        p.darkShare,
        `${p.id} wears the hatch only in its DOM: ${Math.round(p.darkShare * 100)}% of its samples sit in the hatch's dark stripes`,
      ).toBeGreaterThanOrEqual(HATCH_DARK_SHARE);
    }
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
      for (const sel of [".badge", ".name", ".badge-count", ".badge-initial"]) {
        const el = g.querySelector(sel);
        if (!el) {
          out.push({ id, kind: sel.slice(1), spread: 0, sampled: 0 });
          continue;
        }
        const r = (el as Element).getBoundingClientRect();
        // The initial's and the count's glyphs are small and anti-aliased: a
        // 3 px grid can step over a glyph's solid core and read a painted label
        // as low as 56 for an initial [measured], 236.8 for a one-digit count in
        // the pinned image, so both are sampled at every pixel.
        const step = sel === ".badge-initial" || sel === ".badge-count" ? 1 : 3;
        const lo = [255, 255, 255];
        const hi = [0, 0, 0];
        let sampled = 0;
        for (let x = r.left + 0.5; x < r.right; x += step) {
          for (let y = r.top + 0.5; y < r.bottom; y += step) {
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
  expect(labels).toHaveLength(56); // 14 provinces, badge + name + count + initial each
  for (const l of labels) {
    const floor = LABEL_SPREAD[l.kind];
    expect(floor, `no threshold known for a ${l.kind}`).toBeGreaterThan(0);
    expect(l.sampled, `${l.id} ${l.kind}: nothing to sample inside the province`).toBeGreaterThan(5);
    // Hidden with `opacity: 0`, the area is whatever the province paint alone
    // gives (flat fill, at most the hatch stripes and the border stroke);
    // painted, the white initial, count and name stand against their dark backdrop.
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
  for (const name of ["Start combat", "Attack", "End turn"]) {
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
  await enterCombat(page);
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
  const [from, to] = await pickAttack(page);
  const before = await holdings(page);
  await province(page, to).click();
  await page.mouse.move(2, 400); // off the map, so the tooltip does not cover the tags
  await shot(page, info, "02-selected");
  const logBefore = await page.locator(".log li").count();
  await page.getByRole("button", { name: "Attack" }).click();

  const dialog = page.locator("#result-dialog");
  await expect(dialog).toBeVisible();
  const attackerDice = await dialog.locator(".die.attacker").count();
  const defenderDice = await dialog.locator(".die.defender").count();
  expect(attackerDice).toBe(1);
  expect(defenderDice).toBe(1);
  // The engine's own losses (carried on the dialog) against the labels the player reads.
  const attackerLosses = Number(await dialog.getAttribute("data-attacker-losses"));
  const defenderLosses = Number(await dialog.getAttribute("data-defender-losses"));
  expect(await dialog.locator(".verdict.down").count()).toBe(attackerLosses);
  expect(await dialog.locator(".verdict.up").count()).toBe(defenderLosses);
  expect(attackerLosses + defenderLosses).toBe(Math.min(attackerDice, defenderDice));
  // Column by column: each label must match its two drawn dice faces under the
  // engine's tie rule (Malpaco's ties, which pairResults applies). Counting
  // labels alone cannot see a pair labelled the wrong way round, and reading
  // `data-face` cannot see a die whose pips were never drawn. The faces come
  // from the pip pixels of the very picture that becomes the artifact.
  await page.waitForTimeout(700); // let the dice finish tumbling before the picture
  const resultShot = await shot(page, info, "03-result");
  const drawn = await drawnDice(page, resultShot);
  expect(drawn.attacker, "a lit-cell set per attacker die").toHaveLength(attackerDice);
  expect(drawn.defender, "a lit-cell set per defender die").toHaveLength(defenderDice);
  const ties = malpacoRules().combat.ties;
  const attackerFaces = drawn.attacker.map((d, i) => {
    const face = faceOf(d.lit);
    expect(face, `attacker die ${i + 1} shows no readable face (lit cells: ${d.lit.join(", ") || "none"})`).not.toBeNull();
    return face as number;
  });
  const defenderFaces = drawn.defender.map((d, i) => {
    const face = faceOf(d.lit);
    expect(face, `defender die ${i + 1} shows no readable face (lit cells: ${d.lit.join(", ") || "none"})`).not.toBeNull();
    return face as number;
  });
  // A face must not merely classify: its pips must stand off the die's face by
  // their own rendered contrast, and its empty cells must show the face.
  for (const [side, reads] of [["attacker", drawn.attacker], ["defender", drawn.defender]] as const) {
    reads.forEach((d, i) => {
      expect(
        d.minLitContrast,
        `${side} die ${i + 1}: its pips sit only ${d.minLitContrast.toFixed(1)} RGB from the die's face — a player cannot read them`,
      ).toBeGreaterThanOrEqual(PIP_CONTRAST);
      expect(d.maxUnlitDelta, `${side} die ${i + 1}: an empty cell does not show the face (${d.maxUnlitDelta.toFixed(1)} off)`).toBeLessThanOrEqual(
        NEAR_FACE,
      );
    });
  }
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
  // The verdicts must also be painted: class and text alone passed with
  // `.verdict { opacity: 0 }`, which blanked every label in the picture.
  const verdictPixels = await paintedSpreads(page, resultShot, ".verdict");
  expect(verdictPixels, "one painted label per dice column").toHaveLength(verdicts.length);
  for (const v of verdictPixels) {
    expect(v.sampled, `the verdict "${v.text}" has no box to read`).toBeGreaterThan(VERDICT_SAMPLES);
    expect(v.spread, `the verdict "${v.text}" is not painted (contrast ${v.spread.toFixed(1)})`).toBeGreaterThanOrEqual(VERDICT_SPREAD);
  }
  const kind = await dialog.getAttribute("data-outcome");

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
  await enterCombat(page);
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
  await enterCombat(page);
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

// --- Goldens ----------------------------------------------------------------
// Three pictures pin the look (issue #2, scope item 8): pixel-by-pixel evasion
// chasing did not converge — each round found new ways to lie to the gates — so
// the whole board, the result dialog and the panel are pinned with Playwright's
// own image comparison, at both projects, on the fixed seed. Playwright's default
// comparison options apply: any pixel difference at all fails, so a golden only
// changes when the look changes, with its reason in the PR. Goldens are made and
// compared in the official image mcr.microsoft.com/playwright:v1.63.0-noble and
// nowhere else (fonts and Chromium builds differ between hosts); see
// docs/spike.md, "Goldens", for the exact command.

test("golden: the whole board as painted, hatched seat included", async ({ page }) => {
  await page.mouse.move(2, 400); // no hover outline over the board
  await settle(page);
  await expect(page.locator("#map")).toHaveScreenshot("board.png");
});

test("golden: the panel as laid out", async ({ page }) => {
  await page.mouse.move(2, 400);
  await settle(page);
  await expect(page.locator(".panel")).toHaveScreenshot("panel.png");
});

test("golden: the result dialog with its dice and verdicts", async ({ page }) => {
  const [, to] = await pickAttack(page);
  await province(page, to).click();
  await page.mouse.move(2, 400); // off the map, so no tooltip leans on the dialog
  await page.getByRole("button", { name: "Attack" }).click();
  await expect(page.locator("#result-dialog")).toBeVisible();
  await page.waitForTimeout(700); // let the dice finish tumbling; toHaveScreenshot freezes whatever is left
  await expect(page.locator("#result-dialog")).toHaveScreenshot("result-dialog.png");
});
