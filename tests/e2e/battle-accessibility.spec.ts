import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { fixture, map, step } from "./battle-fixture";
import { mkdirSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import {openSurface,setDetail,withSurface} from './shell';

const country = (page: Page, id: string) => page.locator(`[data-country="${id}"]`);
async function ready(page: Page, kind: "manual" | "capture") {
  const f = fixture(kind);
  await page.clock.install(); await page.clock.pauseAt(new Date());
  await page.goto("/?view=reference-game&control=manual");
  await page.getByLabel("Seed", { exact: true }).fill(String(f.seed));
  await page.getByRole("button", { name: "Start game", exact: true }).click();
  for (let n = 0; n < f.placements; n++) await country(page, f.from).click();
  await page.locator("#start-combat-button").click();
  await country(page, f.from).click(); await country(page, f.to).click({modifiers:["Shift"]});
  await openSurface(page,'actions');await page.locator("#battle-stop-threshold").fill("1");
  await openSurface(page,'actions');await page.locator("#battle-stop-threshold").press("Tab");
  await openSurface(page,'actions');await page.locator("#battle-speed").selectOption("fast");
  return f;
}
async function capture(page: Page, name: string, project: string) {
  const dir = process.env["BATTLE_EVIDENCE_DIR"] ?? "screenshots";
  mkdirSync(dir, { recursive: true });
  await page.screenshot({ path: join(mkdtempSync(join(dir, "accessibility-")), `${name}-${project}.png`) });
}
async function fits(page: Page, selectors: string[]) {
  const bounds = await page.locator(selectors.join(",")).evaluateAll(nodes => nodes.map(node => {
    const box = node.getBoundingClientRect();
    return { id: node.id, fits: box.width > 0 && box.height > 0 && box.left >= 0 && box.top >= 0 && box.right <= innerWidth && box.bottom <= innerHeight };
  }));
  expect(bounds).toHaveLength(selectors.length);
  expect(bounds.filter(b => !b.fits)).toEqual([]);
}

test("capture confirmation, quantities and context fit together with an accurate phase", async ({ page }, info) => {
  const errors: string[] = []; page.on("pageerror", e => errors.push(e.message));
  const f = await ready(page, "capture");
  // T82: one explicit Attack opens the battle that Fight on continues.
  await page.locator("#single-exchange-button").click();
  await page.locator("#fight-on-button").click();
  let state = step(step(f.ready, { kind: "attack", from: f.from, to: f.to }), { kind: "attack", from: f.from, to: f.to });
  while (state.phase === "attack") { await page.clock.runFor(200); state = step(state, { kind: "attack", from: f.from, to: f.to }); }
  await expect(page.locator("#turn-phase")).toHaveText("Capture move-in");
  // T71's focused capture presentation hides inactive combat controls in both modes.
  // Required move-in controls and source/target context must still fit together.
  for (const detail of ["compact", "detailed"]) {
    // T92: the capture card is the sketch's preview, amount and slider; the pair stays for assistive technology.
    await setDetail(page,detail); await openSurface(page, "actions");
    await fits(page, ["#capture-preview", "#capture-amount", "#capture-minimum-button", "#capture-maximum-button", "#capture-less-button", "#capture-more-button", "#confirm-capture-button"]);
    for (const id of ["battle-status", "fight-on-button", "single-exchange-button", "stop-battle-button"])
      await expect(page.locator("#" + id)).toBeHidden();
  }
  await expect(page.getByLabel("Armies to move", { exact: true })).toHaveAttribute("min", "1");
  await expect(page.getByRole("button", { name: "Move one more army", exact: true })).toBeVisible();
  await capture(page, "capture-controls-fit", info.project.name);
  expect(errors).toEqual([]);
});

test("keyboard Stop retains focus across an exchange; new game cancels work and remembers preferences", async ({ page }, info) => {
  const errors: string[] = []; page.on("pageerror", e => errors.push(e.message));
  const f = await ready(page, "manual");
  const oldEnd = await page.locator("#end-turn-button").elementHandle();
  // T82: one explicit Attack opens the battle that Fight on continues (one more exchange in the count).
  await page.locator("#single-exchange-button").click();
  await page.locator("#fight-on-button").click();
  await page.locator("#stop-battle-button").focus(); await page.clock.runFor(200);
  await expect(page.locator("#stop-battle-button")).toBeFocused();
  await page.keyboard.press("Enter");
  const count = f.ready.history.length + 3;
  await openSurface(page,'actions');await expect(page.getByRole("region", { name: "Battle controls", exact: true })).toHaveAttribute("data-history-count", String(count));
  await oldEnd!.evaluate(n => n.dispatchEvent(new MouseEvent("click", { bubbles: true })));
  await page.clock.runFor(2000);
  await openSurface(page,'actions');await expect(page.getByRole("region", { name: "Battle controls", exact: true })).toHaveAttribute("data-history-count", String(count));
  await capture(page, "keyboard-stop", info.project.name);
  await page.locator("#fight-on-button").click();
  await withSurface(page,'settings',()=>page.locator('#new-game-button').click());
  await expect(page.getByRole("heading", { name: "New reference game", exact: true })).toBeVisible();
  await page.clock.runFor(2000);
  await page.getByRole("button", { name: "Start game", exact: true }).click();
  for (const p of map.provinces) await expect(country(page, p.id)).toHaveAttribute("data-armies", String(f.start.armies[p.id]));
  await openSurface(page,'actions');await expect(page.locator("#battle-stop-threshold")).toHaveValue("1");
  await openSurface(page,'actions');await expect(page.locator("#battle-speed")).toHaveValue("fast");
  await page.clock.runFor(2000);
  for (const p of map.provinces) await expect(country(page, p.id)).toHaveAttribute("data-armies", String(f.start.armies[p.id]));
  expect(errors).toEqual([]);
});
