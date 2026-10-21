import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { activePlayer, apply } from "../../src/core";
import { deserializeVersionedMatch, serializeVersionedMatch, REFERENCE_MATCH_IDENTITY } from "../../src/core/match-save";
import { pinned } from "../core/versioned-match-fixture";
import {withSurface} from './shell';
const dialog = (p: Page) => p.getByRole("dialog", { name: "Game event log", exact: true });
async function save(p: Page) {
  await withSurface(p,'settings',()=>p.getByRole("button", { name: "Save game", exact: true }).click());
  return p.evaluate(() => (Reflect.get(window, "eventLogSave") as Blob).text());
}
async function load(p: Page, text: string) {
  const previousInput = await p.getByLabel("Load game", { exact: true }).elementHandle();
  await p.getByLabel("Load game", { exact: true }).setInputFiles({ name: "event-log.json", mimeType: "application/json", buffer: Buffer.from(text) });
  await expect.poll(() => previousInput!.evaluate(node => node.isConnected)).toBe(false);
  await expect(p.locator("[data-country]")).toHaveCount(46);
}
async function begin(p: Page) {
  await p.clock.install({ time: new Date("2026-10-17T12:00:00Z") }); await p.clock.pauseAt(new Date("2026-10-17T12:00:00Z"));
  await p.goto("/?view=reference-game&control=manual");
  await p.evaluate(() => { const create = URL.createObjectURL.bind(URL); URL.createObjectURL = blob => { Reflect.set(window, "eventLogSave", blob); return create(blob); }; });
}
async function open(p: Page) {
  const button = p.locator("#game-log-button"); await expect(button).toBeVisible(); await button.focus(); await button.press("Enter"); await expect(dialog(p)).toBeVisible();
}
// Independent core replay is the oracle; no UI projection function is imported.
async function verify(p: Page, text: string) {
  const loaded = deserializeVersionedMatch(text);
  let before = deserializeVersionedMatch(serializeVersionedMatch(loaded.options, [], REFERENCE_MATCH_IDENTITY)).state;
  const rows = dialog(p).locator("[data-event-index]"); await expect(rows).toHaveCount(loaded.state.history.length + 1);
  const actual = await rows.evaluateAll(nodes => nodes.map(node => ({ index: node.getAttribute("data-event-index"), text: node.textContent!, regions: [...node.querySelectorAll("[data-region]")].map(cell => ({ id: cell.getAttribute("data-region"), text: cell.textContent! })) })));
  expect(actual.map(row => Number(row.index))).toEqual(Array.from({ length: actual.length }, (_, i) => i));
  expect(actual[0]!.text).toMatch(/initial deal/i);
  for (const country of before.map.provinces) {
    const cell = actual[0]!.regions.find(region => region.id === country.id)!; expect(cell).toBeDefined();
    expect(cell.text).toContain(country.name); expect(cell.text).toContain(`0 → ${before.armies[country.id]}`);
    expect(cell.text).toContain(before.players.find(player => player.id === before.ownerOf[country.id])!.name);
  }
  for (const [i, action] of loaded.state.history.entries()) {
    const result = apply(before, action); if (!result.ok) throw Error(result.error);
    const after = result.state, row = actual[i + 1]!;
    expect(row.text).toContain(`Round ${before.turnNumber}`); expect(row.text).toContain(activePlayer(before)!.name);
    for (const country of before.map.provinces) {
      const a = before.armies[country.id]!, b = after.armies[country.id]!;
      if (a === b && before.ownerOf[country.id] === after.ownerOf[country.id]) continue;
      const cell = row.regions.find(region => region.id === country.id); expect(cell, `${i + 1}: ${country.name}`).toBeDefined();
      expect(cell!.text).toContain(country.name); expect(cell!.text).toContain(`${a} → ${b}`);
      expect(cell!.text).toContain(`(${b - a >= 0 ? "+" : ""}${b - a})`);
      expect(cell!.text).toContain(before.players.find(player => player.id === before.ownerOf[country.id])!.name);
    }
    if (action.kind === "reinforce") expect(row.text).toMatch(/reinforcement placement/i);
    if (action.kind === "captureMove") expect(row.text).toMatch(/capture.*transfer/i);
    if (action.kind === "friendlyMove") expect(row.text).toMatch(/friendly.*transfer/i);
    if (result.outcome) {
      for (const [player, region, losses] of [[result.outcome.attacker, result.outcome.from, result.outcome.attackerLosses], [result.outcome.defender, result.outcome.to, result.outcome.defenderLosses]] as const) {
        const who = before.players.find(candidate => candidate.id === player)!.name;
        const where = before.map.provinces.find(country => country.id === region)!.name;
        expect(row.text).toContain(`${who} ${where}: ${losses} combat casualties`);
      }
      if (result.outcome.captured) expect(row.text).toContain(`${result.outcome.moved} capture transfer`);
    }
    if ((action.kind === "endTurn" || action.kind === "friendlyMove") && after.reinforcementPool > 0) expect(row.text).toMatch(new RegExp(`unplaced reinforcement income.*${after.reinforcementPool}`, "i"));
    for (const event of after.log.slice(before.log.length)) if (event.event === "eliminated" || event.event === "victory") expect(row.text).toContain(event.event);
    before = after;
  }
  return actual.map(row => row.text);
}

test("popup works by keyboard while paused, appends exactly once and resets for a new match", async ({ page }, info) => {
  await begin(page); await page.getByRole("button", { name: "Start game", exact: true }).click();
  let text = await save(page); const state = deserializeVersionedMatch(text).state;
  const own = state.map.provinces.find(country => state.ownerOf[country.id] === activePlayer(state)!.id)!.id;
  for (let i = 0; i < 3; i++) await page.locator(`[data-country="${own}"]`).press("Enter");
  await expect(page.locator("#game-pause-button")).toBeVisible(); await page.locator("#game-pause-button").click(); text = await save(page); await open(page); const rows = await verify(page, text);
  const root = process.env["PLAYBACK_EVIDENCE_DIR"] ?? "screenshots"; mkdirSync(root, { recursive: true }); await page.screenshot({ path: join(root, `game-event-log-${info.project.name}.png`) });
  await page.keyboard.press("Escape"); await expect(dialog(page)).not.toBeVisible(); expect(await save(page)).toBe(text);
  await open(page); expect(await verify(page, text)).toEqual(rows); await dialog(page).getByRole("button", { name: "Close game event log", exact: true }).press("Enter");
  await load(page, text); await open(page); expect(await verify(page, text)).toEqual(rows); await page.keyboard.press("Escape");
  await page.locator(`[data-country="${own}"]`).press("Enter"); text = await save(page); await open(page); expect((await verify(page, text)).length).toBe(rows.length + 1); await page.keyboard.press("Escape");
  await withSurface(page,'settings',()=>page.getByRole("button", { name: "New game", exact: true }).click()); await page.getByRole("button", { name: "Start game", exact: true }).click();
  text = await save(page); await open(page); expect(await verify(page, text)).toHaveLength(1);
});
for (const name of ["move-completed", "domination"]) test(`complete ${name} replay includes ordered army accounting beyond seven entries`, async ({ page }) => {
  await begin(page); const text = pinned(name).text; await load(page, text); const saved = await save(page); await open(page);
  const rows = await verify(page, saved); expect(rows.length).toBeGreaterThan(7);
  if (name === "domination") expect(rows.join(" ")).toMatch(/victory|game result/i);
  await page.keyboard.press("Escape"); expect(await save(page)).toBe(saved);
  await load(page, saved); await open(page); expect(await verify(page, saved)).toEqual(rows);
});
