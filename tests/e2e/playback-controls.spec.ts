import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { activePlayer, apply, computerAction } from "../../src/core";
import type { GameState } from "../../src/core";
import { deserializeVersionedMatch, serializeVersionedMatch, REFERENCE_MATCH_IDENTITY } from "../../src/core/match-save";
import { pinned } from "../core/versioned-match-fixture";
import { fixture } from "./battle-fixture";
import {closeSurface,openSurface,withSurface} from './shell';
import { COMPUTER_STEP_TIME } from "../../src/ui/computerTurnLoop";

const pause = (p: Page) => p.locator("#game-pause-button");
const speed = (p: Page) => p.locator("#game-speed");
async function save(p: Page) {
  await withSurface(p,'settings',()=>p.getByRole("button", { name: "Save game", exact: true }).click());
  return p.evaluate(() => (Reflect.get(window, "playbackSaveBlob") as Blob).text());
}
/**
 * T101: while a computer plays the menu waits until a pause, and a pause restarts the wait before
 * the next action; a check in the middle of a wait reads the same save without opening the menu.
 */
async function saveMidWait(p: Page) {
  await p.locator("#reference-save-game").dispatchEvent("click");
  return p.evaluate(() => (Reflect.get(window, "playbackSaveBlob") as Blob).text());
}
async function load(p: Page, text: string) {
  const previousInput = await p.getByLabel("Load game", { exact: true }).elementHandle();
  await p.getByLabel("Load game", { exact: true }).setInputFiles({ name: "playback.json", mimeType: "application/json", buffer: Buffer.from(text) });
  await expect.poll(() => previousInput!.evaluate(node => node.isConnected)).toBe(false);
  await expect(p.locator("[data-country]")).toHaveCount(46);
}
async function begin(p: Page, manual = false) {
  await p.clock.install({ time: new Date("2026-10-17T12:00:00Z") });
  await p.clock.pauseAt(new Date("2026-10-17T12:00:00Z"));
  await p.goto(`/?view=reference-game${manual ? "&control=manual" : ""}&log`);
  // Keep references to callbacks even after clearTimeout: cancellation alone is insufficient.
  await p.evaluate(() => {
    // Read the actual exported Blob, avoiding Chromium's repeated-download throttle.
    const create = URL.createObjectURL.bind(URL);
    URL.createObjectURL = blob => { Reflect.set(window, "playbackSaveBlob", blob); return create(blob); };
    const original = window.setTimeout.bind(window), callbacks: (() => void)[] = [];
    Reflect.set(window, "playbackCallbacks", callbacks);
    window.setTimeout = ((fn: TimerHandler, ms?: number, ...args: unknown[]) => {
      if (typeof fn === "function" && ms !== undefined && ms >= 100 && ms <= 5000) callbacks.push(fn as () => void);
      return original(fn, ms, ...args);
    }) as typeof window.setTimeout;
  });
}
async function stale(p: Page) {
  expect(await p.evaluate(() => (Reflect.get(window, "playbackCallbacks") as unknown[]).length)).toBeGreaterThan(0);
  await p.evaluate(() => { for (const callback of [...Reflect.get(window, "playbackCallbacks") as (() => void)[]]) callback(); });
}
async function totals(p: Page, state?: GameState) {
  const s = state ?? deserializeVersionedMatch(await save(p)).state;
  // T97: totals are no longer on screen (owner, #244); the map's painted armies still match the engine.
  await openSurface(p, "details");

  for (const player of s.players) {
    const total = p.locator(`[data-player="${player.id}"] [data-testid="player-army-total"]`);
    const owned = s.map.provinces.filter(country => s.ownerOf[country.id] === player.id);
    const expected = owned.reduce((sum, country) => sum + s.armies[country.id]!, 0);
    const painted = await p.locator(`[data-country][data-owner="${player.id}"]`).evaluateAll(nodes => nodes.reduce((sum, node) => sum + Number((node as HTMLElement).dataset["armies"]), 0));
    expect(painted).toBe(expected);
    await expect(total).toHaveText(new RegExp(`Total armies\\s*:?\\s*${expected}$`, "i"));
    await expect(total).toBeHidden();
  }
  // T101: a menu opened during a computer turn paused it; closing the menu resumes play.
  await closeSurface(p);
  return s;
}
async function visibleControls(p: Page) {
  // T92: Pause rests in its corner; T101: the speed choice beside it, and the event log (with `?log`) in the menu card.
  for (const control of [pause(p), speed(p)]) {
    await expect(control).toBeVisible();
    expect(await control.evaluate(node => {
      const r = node.getBoundingClientRect();
      return r.left >= 0 && r.top >= 0 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1;
    })).toBe(true);
  }
  await expect(pause(p)).toBeEnabled();
  await expect(speed(p)).toBeVisible(); await expect(speed(p)).toBeEnabled();
  await speed(p).focus(); await expect(speed(p)).toBeFocused();
  await speed(p).press("Home"); await speed(p).press("End");
  await withSurface(p, "settings", async () => {
    await expect(p.locator("#game-focus-drawer #game-speed")).toHaveCount(0); await expect(p.locator("#game-log-button")).toBeVisible();
  });
}
async function screenshot(p: Page, name: string, project: string) {
  const root = process.env["PLAYBACK_EVIDENCE_DIR"] ?? "screenshots";
  mkdirSync(root, { recursive: true });
  await p.screenshot({ path: join(root, `playback-${name}-${project}.png`) });
}
function pendingComputer() {
  const f = pinned("human-loss");
  let s = deserializeVersionedMatch(serializeVersionedMatch(f.options, [], REFERENCE_MATCH_IDENTITY)).state;
  for (const action of f.actions) {
    const next = apply(s, action); if (!next.ok) throw Error(next.error); s = next.state;
    if (s.phase === "capture" && activePlayer(s)?.kind === "computer") return serializeVersionedMatch(f.options, s.history, REFERENCE_MATCH_IDENTITY);
  }
  throw Error("Pinned replay has no computer capture");
}
function nextComputer(s: GameState) {
  const action = computerAction(s); if (!action) throw Error("Expected automatic action");
  const next = apply(s, action); if (!next.ok) throw Error(next.error); return next.state;
}

test("labelled army totals follow ordinary actions and include eliminated players", async ({ page }, info) => {
  await begin(page); await page.getByRole("button", { name: "Start game", exact: true }).click();
  expect((await totals(page)).players).toHaveLength(4); await visibleControls(page); await screenshot(page, "default-four-seats", info.project.name);
  await load(page, pinned("placement").text);
  let s = await totals(page); const player = activePlayer(s)!;
  const own = s.map.provinces.find(country => s.ownerOf[country.id] === player.id)!.id;
  const before = s.armies[own]!;
  for (let i = 0; i < 3; i++) { await page.locator(`[data-country="${own}"]`).press("Enter"); s = await totals(page); }
  expect(s.armies[own]).toBe(before + 3);
  await visibleControls(page); await screenshot(page, "totals", info.project.name);
  await load(page, pinned("human-loss").text); s = await totals(page);
  expect(s.players.some(player => !s.map.provinces.some(country => s.ownerOf[country.id] === player.id))).toBe(true);
  await screenshot(page, "eliminated", info.project.name);
});

test("very slow spaces automatic actions by two seconds and changes no replay outcome", async ({ page }, info) => {
  await begin(page); await load(page, pendingComputer()); await visibleControls(page);
  await speed(page).selectOption("very-slow"); // T101: the speed choice sits beside Pause, outside the menu.
  let text = await save(page), s = deserializeVersionedMatch(text).state;
  for (let i = 0; i < 4; i++) {
    await page.clock.runFor(1999); expect(await saveMidWait(page)).toBe(text);
    await page.clock.runFor(1); const next = nextComputer(s);
    text = await save(page); s = await totals(page);
    expect(text).toBe(serializeVersionedMatch(deserializeVersionedMatch(text).options, next.history, REFERENCE_MATCH_IDENTITY));
  }
  await screenshot(page, "very-slow", info.project.name);
});

test("Pause freezes computer play, rejects stale callbacks and replacement cancels the old match", async ({ page }, info) => {
  await begin(page); const pending = pendingComputer(); await load(page, pending);
  await speed(page).selectOption("normal"); await expect(pause(page)).toBeVisible();
  await pause(page).focus(); await pause(page).press("Enter"); await expect(pause(page)).toHaveText(/Resume/i);
  const frozen = await save(page); await stale(page); await page.clock.runFor(10000); expect(await save(page)).toBe(frozen); await totals(page);
  await screenshot(page, "paused-computer", info.project.name);
  // T101: Normal waits COMPUTER_STEP_TIME before each computer action.
  await pause(page).press("Space"); await page.clock.runFor(COMPUTER_STEP_TIME);
  const resumed = deserializeVersionedMatch(await save(page));
  expect(resumed.state.history).toEqual(nextComputer(deserializeVersionedMatch(frozen).state).history); await totals(page);
  await pause(page).click(); await load(page, pinned("placement").text);
  const replacement = await save(page); await stale(page); await page.clock.runFor(10000); expect(await save(page)).toBe(replacement); await totals(page);
  await load(page, pending); await withSurface(page,'settings',()=>page.getByRole("button", { name: "New game", exact: true }).click());
  await stale(page); await page.clock.runFor(10000);
  await expect(page.getByRole("heading", { name: "New reference game", exact: true })).toBeVisible();
});

// T97: there is no continuous battle (owner, #244); pause gates Fight presses instead.
test("global pause gates Fight, manual reinforcement and capture", async ({ page }, info) => {
  await begin(page, true); const f = fixture("manual");
  await page.getByLabel("Seed", { exact: true }).fill(String(f.seed));
  await page.getByRole("button", { name: "Start game", exact: true }).click();
  for (let i = 0; i < f.placements; i++) await page.locator(`[data-country="${f.from}"]`).click();
  await page.locator("#start-combat-button").click();
  await page.locator(`[data-country="${f.from}"]`).click();
  await page.locator(`[data-country="${f.to}"]`).click({ modifiers: ["Shift"] });
  await openSurface(page,'actions');await page.locator("#single-exchange-button").click(); await openSurface(page,'actions');await expect(page.getByRole("region", { name: "Battle controls", exact: true })).toHaveAttribute("data-running", "false");
  await totals(page); await visibleControls(page); await speed(page).selectOption("normal"); await openSurface(page,'actions'); await pause(page).click();
  const frozen = await save(page);
  for (const id of ["single-exchange-button", "end-turn-button", "start-friendly-move-button"]) await page.locator(`#${id}`).dispatchEvent("click");
  await page.locator(`[data-country="${f.to}"]`).press("Enter"); await stale(page); await page.clock.runFor(10000);
  expect(await save(page)).toBe(frozen); await totals(page); await screenshot(page, "paused-battle", info.project.name);
  await pause(page).click(); await page.clock.runFor(400); expect(await save(page)).toBe(frozen);
  await openSurface(page,'actions'); await page.locator("#single-exchange-button").click();
  const next = apply(deserializeVersionedMatch(frozen).state, { kind: "attack", from: f.from, to: f.to });
  if (!next.ok) throw Error(next.error);
  expect(deserializeVersionedMatch(await save(page)).state.history).toEqual(next.state.history); await totals(page);
  for (const name of ["placement", "pending-capture"]) {
    await load(page, pinned(name).text); await pause(page).click(); const text = await save(page), s = deserializeVersionedMatch(text).state;
    const own = s.map.provinces.find(country => s.ownerOf[country.id] === activePlayer(s)!.id)!.id;
    await page.locator(`[data-country="${own}"]`).press("Enter");
    for (const id of name === "placement" ? ["start-combat-button"] : ["confirm-capture-button"]) await page.locator(`#${id}`).dispatchEvent("click");
    await page.clock.runFor(10000); expect(await save(page)).toBe(text); await totals(page);
  }
});
