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
  await openSurface(page,'actions');
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
  // T97: one Fight press is one exchange; press until the capture, each checked by the engine oracle.
  let state = f.ready;
  while (state.phase === "attack") {
    await page.locator("#single-exchange-button").click(); state = step(state, { kind: "attack", from: f.from, to: f.to });
    await expect(page.getByRole("region", { name: "Battle controls", exact: true })).toHaveAttribute("data-history-count", String(state.history.length));
  }
  await expect(page.locator("#turn-phase")).toHaveText("Capture move-in");
  // T71's focused capture presentation hides inactive combat controls in both modes.
  // Required move-in controls and source/target context must still fit together.
  for (const detail of ["compact", "detailed"]) {
    // T97: the capture card is −, the amount, + and Confirm; the pair stays for assistive technology.
    await setDetail(page,detail); await openSurface(page, "actions");
    await fits(page, ["#capture-amount", "#capture-less-button", "#capture-more-button", "#confirm-capture-button"]);
    for (const id of ["battle-status", "single-exchange-button"])
      await expect(page.locator("#" + id)).toBeHidden();
    await expect(page.locator("#capture-preview, #capture-minimum-button, #capture-maximum-button, #capture-range, #fight-on-button, #stop-battle-button")).toHaveCount(0);
  }
  await expect(page.getByLabel("Armies to move", { exact: true })).toHaveAttribute("min", "1");
  await expect(page.getByRole("button", { name: "Move one more army", exact: true })).toBeVisible();
  await capture(page, "capture-controls-fit", info.project.name);
  expect(errors).toEqual([]);
});

test("keyboard Fight retains focus across an exchange; new game cancels work and remembers preferences", async ({ page }, info) => {
  const errors: string[] = []; page.on("pageerror", e => errors.push(e.message));
  const f = await ready(page, "manual");
  await withSurface(page, 'settings', () => page.locator("#game-speed").selectOption("fast").then(() => undefined));
  await openSurface(page, 'actions');
  const oldEnd = await page.locator("#end-turn-button").elementHandle();
  // T97: Fight keeps keyboard focus through its own exchange, so Enter fights the next one.
  await page.locator("#single-exchange-button").focus(); await page.keyboard.press("Enter"); await page.clock.runFor(200);
  await expect(page.locator("#single-exchange-button")).toBeFocused();
  await page.keyboard.press("Enter");
  const count = f.ready.history.length + 2;
  await openSurface(page,'actions');await expect(page.getByRole("region", { name: "Battle controls", exact: true })).toHaveAttribute("data-history-count", String(count));
  await oldEnd!.evaluate(n => n.dispatchEvent(new MouseEvent("click", { bubbles: true })));
  await page.clock.runFor(2000);
  await openSurface(page,'actions');await expect(page.getByRole("region", { name: "Battle controls", exact: true })).toHaveAttribute("data-history-count", String(count));
  await capture(page, "keyboard-fight", info.project.name);
  await page.locator("#single-exchange-button").click();
  await withSurface(page,'settings',()=>page.locator('#new-game-button').click());
  await expect(page.getByRole("heading", { name: "New reference game", exact: true })).toBeVisible();
  await page.clock.runFor(2000);
  await page.getByRole("button", { name: "Start game", exact: true }).click();
  for (const p of map.provinces) await expect(country(page, p.id)).toHaveAttribute("data-armies", String(f.start.armies[p.id]));
  await withSurface(page,'settings',()=>expect(page.locator("#game-speed")).toHaveValue("fast"));
  await page.clock.runFor(2000);
  for (const p of map.provinces) await expect(country(page, p.id)).toHaveAttribute("data-armies", String(f.start.armies[p.id]));
  expect(errors).toEqual([]);
});
