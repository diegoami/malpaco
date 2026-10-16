import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { mkdirSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { act, fixtureAction, plan, referenceMap, VICTORY_ACTION_BUDGET } from "./victory-fixture";
import type { CompleteAction, CompleteState } from "../core/victory-options-fixture";
import { opening, standings } from "../core/victory-options-fixture";

const country = (page: Page, id: string) => page.locator(`[data-country="${id}"]`);
async function capture(page: Page, label: string, project: string) {
  const root = process.env["VICTORY_EVIDENCE_DIR"] ?? "screenshots";
  mkdirSync(root, { recursive: true });
  await page.screenshot({ path: join(mkdtempSync(join(root, "victory-")), `${label}-${project}.png`) });
}
async function paint(page: Page, state: CompleteState) {
  const actual = await page.locator("[data-country]").evaluateAll(nodes => Object.fromEntries(nodes.map(n => [n.getAttribute("data-country"), [n.getAttribute("data-owner"), Number(n.getAttribute("data-armies"))]])));
  expect(actual).toEqual(Object.fromEntries(referenceMap.provinces.map(p => [p.id, [state.ownerOf[p.id], state.armies[p.id]]])));
}
async function clickAction(page: Page, action: CompleteAction) {
  if (action.kind === "reinforce") await country(page, action.province).click();
  else if (action.kind === "endReinforcement") await page.locator("#start-combat-button").click();
  else if (action.kind === "endTurn") await page.locator("#end-turn-button").click();
  else if (action.kind === "captureMove") await page.locator("#confirm-capture-button").click();
  else if (action.kind === "attack") {
    const from = country(page, action.from);
    if (await from.getAttribute("aria-pressed") !== "true") await from.click();
    await country(page, action.to).click();
    await page.locator("#single-exchange-button").click();
  } else throw Error(`Unhandled fixture click ${action.kind}`);
}
async function setup(page: Page, fixture: ReturnType<typeof plan>) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?view=reference-game&control=manual");
  await page.getByLabel("Seed", { exact: true }).fill("1994");
  await page.getByLabel("Seats",{exact:true}).selectOption(String(fixture.start.players.length));
  // Baseline can still reach the same deal/counts without missing controls;
  // kind affects neither this zero-share deal nor the manually driven actions.
  for (let i = 0; i < fixture.start.players.length; i++) {
    const control = page.getByLabel(`Seat ${i + 1} control`, { exact: true });
    if (await control.count()) await control.selectOption(fixture.start.players[i]!.kind!);
  }
  const domination = page.getByLabel("Domination win", { exact: true });
  if (await domination.count()) await domination.setChecked(fixture.kind === "domination");
  await page.getByRole("button", { name: "Start game", exact: true }).click();
  await paint(page, fixture.start);
}
async function drive(page: Page, fixture: ReturnType<typeof plan>) {
  let state = fixture.start;
  for (const action of fixture.actions) {
    await clickAction(page, action);
    state = act(state, action);
    if (action.kind === "attack" || action.kind === "captureMove" || action.kind === "endTurn") await paint(page, state);
  }
  return state;
}
async function freeze(page: Page, state: CompleteState) {
  for (const selector of ["#start-combat-button", "#end-turn-button", "#single-exchange-button", "#fight-on-button", "#start-friendly-move-button", "#confirm-capture-button", "#confirm-friendly-move-button"]) {
    const node = page.locator(selector);
    if (await node.count() && await node.isVisible()) await expect(node).toBeDisabled();
  }
  await country(page, referenceMap.provinces[0]!.id).dispatchEvent("click");
  await page.keyboard.press("Enter");
  await paint(page, state);
}
async function fit(page: Page) {
  const rows = await page.locator('#victory-reason,#victory-standings,#watch-computers-button,#stop-game-button,#new-game-button').evaluateAll(nodes => nodes.filter(n => n.getClientRects().length).map(n => { const b = n.getBoundingClientRect(); return { id: n.id, fits: b.left >= 0 && b.top >= 0 && b.right <= innerWidth && b.bottom <= innerHeight }; }));
  expect(rows.length).toBeGreaterThan(2);
  expect(rows.filter(r => !r.fits)).toEqual([]);
}

test("domination result names winner/reason, final standings, freezes and restarts", async ({ page }, info) => {
  test.setTimeout(240000);
  const errors: string[] = []; page.on("pageerror", e => errors.push(e.message));
  const fixture = plan("domination");
  await setup(page, fixture);
  const stale = await page.locator("#end-turn-button").elementHandle();
  const state = await drive(page, fixture);
  await expect(page.locator("#victory-reason")).toContainText(/domination/i);
  await expect(page.locator("#victory-reason")).toContainText(String(Object.values(state.ownerOf).filter(id => id === state.winner).length));
  await expect(page.locator("#turn-title")).toContainText(state.players.find(p => p.id === state.winner)!.name);
  await expect(page.locator("#victory-standings [data-result-player]")).toHaveCount(state.players.length);
  expect(await page.locator("[data-result-player]").evaluateAll(ns => ns.map(n => n.getAttribute("data-result-player")))).toEqual(standings(state).map(r => r.player));
  for (const player of state.players) {
    const countries = Object.values(state.ownerOf).filter(id => id === player.id).length;
    const row = page.locator(`[data-result-player="${player.id}"]`);
    await expect(row).toContainText(player.name);
    await expect(row.locator("[data-result-countries]")).toHaveText(String(countries));
    await expect(row.locator("[data-result-armies]")).toHaveText(String(standings(state).find(r => r.player === player.id)!.armies));
  }
  await stale!.evaluate(n => n.dispatchEvent(new MouseEvent("click", { bubbles: true })));
  await freeze(page, state); await fit(page); await capture(page, "domination", info.project.name);
  await page.locator("#new-game-button").click();
  await expect(page.getByRole("heading", { name: "New reference game", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Start game", exact: true }).click();
  await expect(page.locator("#victory-reason")).toHaveCount(0);
  expect(errors).toEqual([]);
  console.log(JSON.stringify({ kind: fixture.kind, actions: fixture.actions.length, winner: state.winner }));
});

test("round limit finishes after a complete rotated round and explains the score", async ({ page }, info) => {
  test.setTimeout(240000);
  const errors: string[] = []; page.on("pageerror", e => errors.push(e.message));
  let state = opening(1994, 2, { dominationWin: false, roundLimit: 20 });
  const fixture = { start: state, state, actions: [] as CompleteAction[], conqueror: "", kind: "human-loss" as const };
  await setup(page, fixture);
  // Change settings through the real setup; no loaded or injected position.
  await page.locator("#new-game-button").click();
  const limit = page.getByLabel("Round limit", { exact: true });
  if (await limit.count()) await limit.selectOption("20");
  await page.getByRole("button", { name: "Start game", exact: true }).click();
  const origin = state.currentPlayer;
  for (let turn = 0; turn < 40; turn++) {
    expect(state.currentPlayer).toBe((origin + turn) % 2);
    await expect(page.locator(".turn-sub")).toContainText(`Round ${1 + Math.floor(turn / 2)}`);
    while (state.phase === "reinforce") {
      const own = state.map.provinces.find(p => state.ownerOf[p.id] === state.players[state.currentPlayer]!.id)!;
      const action: CompleteAction = state.reinforcementPool ? { kind: "reinforce", province: own.id, amount: 1 } : { kind: "endReinforcement" };
      await clickAction(page, action); state = act(state, action);
    }
    await clickAction(page, { kind: "endTurn" }); state = act(state, { kind: "endTurn" });
  }
  await expect(page.locator("#victory-reason")).toContainText(/round.*limit/i);
  await expect(page.locator("#victory-reason")).toContainText(/arm|order|countr/i);
  await paint(page, state); await freeze(page, state); await fit(page);
  await capture(page, "round-limit", info.project.name);
  expect(errors).toEqual([]);
});

test("human loss offers Stop or Watch; Watch resumes computers and Stop freezes", async ({ page }, info) => {
  test.setTimeout(300000);
  const errors: string[] = []; page.on("pageerror", e => errors.push(e.message));
  const fixture = plan("human-loss");
  await setup(page, fixture);
  let state = await drive(page, fixture);
  await expect(page.locator("#victory-reason")).toContainText(/human.*eliminat|no human/i);
  await expect(page.locator("#watch-computers-button")).toBeVisible();
  await expect(page.locator("#stop-game-button")).toBeVisible();
  await freeze(page, state); await fit(page); await capture(page, "human-loss", info.project.name);
  const staleStop = await page.locator("#stop-game-button").elementHandle();
  await page.locator("#watch-computers-button").click(); state = act(state, { kind: "watchComputers" });
  await staleStop!.evaluate(n => n.dispatchEvent(new MouseEvent("click", { bubbles: true })));
  await paint(page, state);
  await expect(page.locator("#victory-reason")).toHaveCount(0);
  await expect(page.locator("#turn-title")).toContainText(state.players[state.currentPlayer]!.name);
  // Scheduling is T32. Drive actual remaining computer actions through the development UI.
  let handoffs = 0;
  for (let n = 0; n < VICTORY_ACTION_BUDGET && handoffs < 3; n++) {
    const action = fixtureAction(state, "human-loss", "");
    await clickAction(page, action); state = act(state, action);
    if (action.kind === "endTurn") { handoffs++; await paint(page, state); }
  }
  expect(handoffs).toBe(3);
  await expect(page.locator("#watch-computers-button")).toHaveCount(0);
  await capture(page, "watch-resumed", info.project.name);
  await page.locator("#new-game-button").click();
  await setup(page, fixture); state = await drive(page, fixture);
  await page.locator("#stop-game-button").click(); state = act(state, { kind: "stopGame" });
  await freeze(page, state); await fit(page); await capture(page, "human-loss-stopped", info.project.name);
  await expect(page.locator("#watch-computers-button")).toHaveCount(0);
  await page.locator("#new-game-button").click();
  await expect(page.getByRole("heading", { name: "New reference game", exact: true })).toBeVisible();
  expect(errors).toEqual([]);
  console.log(JSON.stringify({ kind: fixture.kind, actionsPerRun: fixture.actions.length, resumedHandoffs: handoffs }));
});
