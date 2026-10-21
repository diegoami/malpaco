import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { deserializeVersionedMatch } from "../../src/core/match-save";
import {withSurface} from './shell';

const errors = (page: import("@playwright/test").Page) => {
  const seen: string[] = [];
  page.on("pageerror", error => seen.push(error.message));
  page.on("console", message => { if (message.type() === "error") seen.push(message.text()); });
  return seen;
};

async function expectFits(page: import("@playwright/test").Page) {
  const viewport = page.viewportSize()!;
  await expect.poll(() => page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    height: document.documentElement.scrollHeight,
  }))).toEqual({ width: viewport.width, height: viewport.height });
  for (const locator of [page.locator("#reference-setup"), page.locator("#reference-game"), page.locator("#game-setup"), page.locator("#generated-game"), page.locator("#generated-prototype"), page.locator("#map")]) {
    if (await locator.count()) {
      const box = await locator.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.y).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 1);
      expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height + 1);
    }
  }
}

test("explicit reference entry retains the playable match with one human and three computers", async ({ page }, info) => {
  const seen = errors(page);
  for (const route of ["/", "/?seed=42", "/?view=unknown&seed=42"]) {
    const explicit=new URL(route,"http://localhost");explicit.searchParams.set("view","reference-game");
    await page.goto(explicit.pathname+explicit.search);
    await expect(page.locator("#reference-setup")).toBeVisible();
    await expect(page.getByLabel("Seed", { exact: true })).toHaveValue(route === "/" ? "1994" : "42");
    await expect(page.getByLabel("Seats", { exact: true })).toHaveValue("4");
    for (let seat = 1; seat <= 4; seat++) {
      await expect(page.getByLabel(`Seat ${seat} control`, { exact: true })).toHaveValue(seat === 1 ? "human" : "computer");
    }
    await expectFits(page);
  }

  // Pause timers so the computer opener cannot race the entry assertions.
  await page.clock.install();
  await page.clock.pauseAt(new Date());
  await page.goto("/?view=reference-game&seed=1994");
  await page.getByRole("button", { name: "Start game", exact: true }).click();
  await expect(page.locator("#reference-game")).toBeVisible();
  await expect(page.locator("#reference-game")).toHaveAttribute("data-seats", "4");
  await expect(page.locator("#reference-game")).toHaveClass(/battle-reference/);
  const download = page.waitForEvent("download");
  await withSurface(page,'settings',()=>page.getByRole("button", { name: "Save game", exact: true }).click());
  const match = deserializeVersionedMatch(readFileSync((await (await download).path())!, "utf8"));
  expect(match.options.seats.map(seat => seat.kind)).toEqual(["human", "computer", "computer", "computer"]);
  expect(match.options.computerStrengths).toEqual(["Normal", "Normal", "Normal"]);
  expect(match.state.rules.combat.capture).toBe("choice");
  await expect(page.locator("#generated-game")).toHaveCount(0);
  await expectFits(page);
  const evidence = process.env["DEFAULT_ENTRY_EVIDENCE_DIR"];
  if (evidence) await page.screenshot({ path: `${evidence}/default-${info.project.name}.png`, fullPage: true });

  await withSurface(page,'settings',()=>page.getByRole("button", { name: "New game", exact: true }).click());
  await expect(page.locator("#reference-setup")).toBeVisible();
  await expect(page.getByLabel("Seed", { exact: true })).toHaveValue("1994");
  await expect(page.getByLabel("Seats", { exact: true })).toHaveValue("4");
  await expectFits(page);
  expect(seen).toEqual([]);
});

test("recognized entry routes remain explicit and authored data is available only by route", {tag: "@legacy"}, async ({ page }) => {
  const seen = errors(page);

  await page.goto("/?view=game-setup&seed=1994&seats=3");
  await expect(page.locator("#game-setup")).toBeVisible();
  await expect(page.getByLabel("Seed", { exact: true })).toHaveValue("1994");
  await expect(page.getByLabel("Human seats")).toHaveValue("3");
  await expectFits(page);

  await page.goto("/?view=generated-game&seed=1994&seats=3");
  await expect(page.locator("#generated-game")).toBeVisible();
  await expect(page.locator("#generated-game .score-row")).toHaveCount(3);
  await expectFits(page);

  await page.goto("/?view=generated-prototype&seed=1994");
  await expect(page.locator("#generated-prototype")).toBeVisible();
  await expectFits(page);

  await page.goto("/?view=authored-game&seed=1994");
  await expect(page.locator("#map")).toBeVisible();
  await expect(page.locator(".province")).toHaveCount(14);
  await expectFits(page);
  await withSurface(page,'settings',()=>page.getByRole("button", { name: "New game", exact: true }).click());
  await expect(page).toHaveURL(/view=authored-game/);
  expect(seen).toEqual([]);
});
