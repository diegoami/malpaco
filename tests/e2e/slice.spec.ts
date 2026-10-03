import { expect, test as base } from "@playwright/test";
import type { Locator, Page, TestInfo } from "@playwright/test";

// The slice, driven the way a player drives it: by clicks. A fixed seed fixes the
// deal, so every run starts from the same board.
const URL = "/?seed=1994";

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
 * comparing them with the owner's fill. Opacity, an overlay, a missing paint or a
 * wrong colour all fail here, though the DOM still reports a perfectly good board.
 */
async function paintedShares(page: Page): Promise<{ id: string; share: number; samples: number; fill: string; sea: number }[]> {
  await page.mouse.move(2, 400); // no hover outline over the board
  await settle(page);
  const b64 = (await page.screenshot()).toString("base64");
  return page.evaluate(async (data) => {
    const img = new Image();
    img.src = `data:image/png;base64,${data}`;
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D;
    ctx.drawImage(img, 0, 0);
    const pixel = (x: number, y: number) => Array.from(ctx.getImageData(Math.round(x), Math.round(y), 1, 1).data.slice(0, 3));
    const dist = (a: number[], b: number[]) => Math.hypot(a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!);
    const svg = document.querySelector("#map") as unknown as SVGSVGElement;
    const ctm = svg.getScreenCTM() as DOMMatrix;
    const corner = svg.getBoundingClientRect();
    const sea = pixel(corner.left + 6, corner.top + 6);
    const out = [];
    for (const g of Array.from(document.querySelectorAll(".province"))) {
      const path = g.querySelector(".shape") as unknown as SVGGeometryElement;
      const fill = getComputedStyle(path).fill;
      const base = (fill.match(/\d+/g) ?? []).slice(0, 3).map(Number);
      const hatched = base.map((c) => c * (1 - 0.28)); // the second seat's stripes darken the fill by 28%
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
          const got = pixel(at.x, at.y);
          samples++;
          if (dist(got, base) <= 28 || dist(got, hatched) <= 28) match++;
        }
      }
      out.push({ id: (g as SVGElement).dataset["province"] as string, share: samples ? match / samples : 0, samples, fill, sea: dist(base, sea) });
    }
    return out;
  }, b64);
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

  // Ownership: two colours, and the cues that do not depend on colour.
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
    expect(l.count).toBe(l.armies);
    expect(l.initial).toBe(l.owner === "blue" ? "B" : "A");
    expect(l.hatch).toBe(l.owner === "blue" ? "none" : "block");
  }
});

test("the board is painted: the pixels inside every province are its owner's colour", async ({ page }) => {
  const shares = await paintedShares(page);
  expect(shares).toHaveLength(14);
  for (const p of shares) {
    expect(p.samples, `${p.id}: no interior point to sample`).toBeGreaterThanOrEqual(6);
    expect(p.sea, `${p.id}: the owner's colour must differ from the sea, or this proves nothing`).toBeGreaterThan(60);
    expect(p.share, `${p.id} is not painted in ${p.fill} (${Math.round(p.share * 100)}% of ${p.samples} sampled pixels)`).toBeGreaterThanOrEqual(0.7);
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
