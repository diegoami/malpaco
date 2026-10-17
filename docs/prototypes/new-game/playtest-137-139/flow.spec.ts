import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { activePlayer, apply, computerAction } from "../../../../src/core";
import type { Action, GameState } from "../../../../src/core";
import { deserializeMatch, deserializeVersionedMatch } from "../../../../src/core/match-save";

const country = (page: Page, id: string) => page.locator(`[data-country="${id}"]`);
function step(state: GameState, action: Action) {
  const result = apply(state, action);
  if (!result.ok) throw Error(JSON.stringify(action) + ": " + result.error);
  return result.state;
}
async function save(page: Page) {
  // Pace downloads; this investigation does not measure download throughput.
  await new Promise(resolve => setTimeout(resolve, 150));
  const event = page.waitForEvent("download", {timeout: 15_000});
  await page.getByRole("button", {name: "Save game", exact: true}).click();
  return readFileSync((await (await event).path())!, "utf8");
}
function capturePlan(state: GameState, repeats = false) {
  for (const source of state.map.provinces.filter(p => state.ownerOf[p.id] === activePlayer(state)!.id)) {
    let ready = state;
    for (let i = 0; i < state.reinforcementPool; i++) ready = step(ready, {kind: "reinforce", province: source.id, amount: 1});
    ready = step(ready, {kind: "endReinforcement"});
    for (const to of [...source.borders, ...source.seaLanes]) {
      if (ready.ownerOf[to] === activePlayer(ready)!.id) continue;
      let next = ready, exchanges = 0;
      while (next.phase === "attack" && next.ownerOf[to] !== activePlayer(ready)!.id && next.armies[source.id]! > 1 && exchanges < 50) {
        next = step(next, {kind: "attack", from: source.id, to}); exchanges++;
      }
      if (exchanges >= (repeats ? 2 : 1) && (next.phase === "capture" ? next.pendingCapture!.max : next.armies[to]!) >= 3 && (next.phase === "capture" || next.ownerOf[to] === activePlayer(ready)!.id)) return {from: source.id, to, placements: state.reinforcementPool, ready, exchanges};
    }
  }
  throw Error("No bounded ordinary-action capture matching repeat and move-in requirements");
}
for (const modern of [true, false]) test(modern ? "root repeat, Stop, capture choice and real save/resume" : "owner legacy URL automatic capture and target clearing", async ({page}, info) => {
  test.setTimeout(120_000);
  const evidence = process.env["PLAYTEST_EVIDENCE_DIR"];
  if (!evidence) throw Error("Use run.py to retain the playtest");
  const dir = mkdtempSync(join(evidence, `${modern ? "root" : "legacy"}-${info.project.name}-`));
  const errors: string[] = []; page.on("pageerror", e => errors.push(e.message));
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  const read = (text: string) => modern ? deserializeVersionedMatch(text).state : deserializeMatch(text).state;
  let sequence = 0;
  async function checkpoint(name: string) {
    const text = await save(page); writeFileSync(join(dir, `${sequence++}-${name}.json`), text); return read(text);
  }
  async function screenshot(name: string) { await page.mouse.move(0, 0); await page.screenshot({path: join(dir, name + ".png"), fullPage: true, animations: "disabled"}); }
  await page.clock.install(); await page.clock.pauseAt(new Date("2026-10-17T12:00:00Z"));
  await page.goto(modern ? "/" : "/?view=generated-game&seed=1994&seats=4&opponents=computer");
  if (modern) {
    for (let seat = 1; seat <= 4; seat++) await expect(page.getByLabel(`Seat ${seat} control`, {exact: true})).toHaveValue(seat === 1 ? "human" : "computer");
    await page.getByRole("button", {name: "Start game", exact: true}).click();
  }
  let state = await checkpoint("opening");
  expect(state.rules.combat.capture).toBe(modern ? "choice" : "all");
  let expectedHuman = state, computerSteps = 0;
  while (activePlayer(expectedHuman)!.kind === "computer" && computerSteps < 400) {
    const action = computerAction(expectedHuman); if (!action) throw Error("No computer action");
    expectedHuman = step(expectedHuman, action); computerSteps++;
  }
  expect(activePlayer(expectedHuman)!.kind).toBe("human");
  await page.clock.runFor(computerSteps * 350);
  state = await checkpoint("after-computer-opener");
  expect(state.history).toEqual(expectedHuman.history);
  expect(activePlayer(state)!.kind).toBe("human");
  await checkpoint("human-turn"); await screenshot("opening");
  const plan = capturePlan(state, !modern);
  for (let i = 0; i < plan.placements; i++) await country(page, plan.from).click();
  await page.locator("#start-combat-button").click();
  expect((await checkpoint("ready")).history).toEqual(plan.ready.history); state = plan.ready;
  await country(page, plan.from).click(); await country(page, plan.to).click();
  await country(page, plan.to).click(); await country(page, plan.to).press("Enter");
  expect((await checkpoint("repeated-map-selection-no-attack")).history).toEqual(state.history);
  await screenshot("selected-target");
  const attack: Action = {kind: "attack", from: plan.from, to: plan.to};
  if (modern) {
    // Use a second enemy with a longer battle for repeat/Stop when available.
    // Seed 1994's concentrated capture is a one-exchange win; do not pretend it proves repetition.
    const readyText = await save(page);
    const repeated = state.map.provinces.flatMap(p => [...p.borders, ...p.seaLanes].map(to => ({kind: "attack" as const, from: p.id, to}))).find(action => {
      const first = apply(state, action); if (!first.ok || first.state.phase !== "attack") return false;
      return apply(first.state, action).ok;
    });
    if (!repeated) throw Error("No legal repeat pair in actual concentrated deal");
    await country(page, repeated.from).click(); await country(page, repeated.to).click();
    let repeatedState = state;
    for (let i = 0; i < 2; i++) {
      await page.locator("#single-exchange-button").click(); repeatedState = step(repeatedState, repeated);
      expect((await checkpoint("repeated-single")).history).toEqual(repeatedState.history);
      await expect(country(page, repeated.from)).toHaveAttribute("aria-pressed", "true");
      await expect(page.locator("#battle-target-name")).toHaveText(state.map.provinces.find(p => p.id === repeated.to)!.name);
    }
    await page.getByLabel("Load game", {exact: true}).setInputFiles({name: "ready.json", mimeType: "application/json", buffer: Buffer.from(readyText)});
    await expect(page.locator("#battle-source-name")).toHaveText("Choose your country");
    await country(page, repeated.from).click(); await country(page, repeated.to).click();
    await page.locator("#battle-stop-threshold").fill("1"); await page.locator("#battle-stop-threshold").press("Tab");
    await page.locator("#fight-on-button").click();
    const stopped = step(state, repeated);
    await page.locator("#stop-battle-button").click(); await page.clock.runFor(4000);
    expect((await checkpoint("stopped")).history).toEqual(stopped.history); await screenshot("stopped");
    await page.getByLabel("Load game", {exact: true}).setInputFiles({name: "ready.json", mimeType: "application/json", buffer: Buffer.from(readyText)});
    await expect(page.locator("#battle-source-name")).toHaveText("Choose your country");
    await country(page, plan.from).click(); await country(page, plan.to).click();
    await page.locator("#battle-stop-threshold").fill("1"); await page.locator("#battle-stop-threshold").press("Tab");
    await page.locator("#fight-on-button").click(); state = step(state, attack);
    for (let i = 1; i < plan.exchanges; i++) { await page.clock.runFor(350); state = step(state, attack); }
    expect((await checkpoint("capture-interrupted-fight")).history).toEqual(state.history);
    expect(state.phase).toBe("capture");
    await expect(page.locator("#confirm-capture-button")).toBeVisible();
    const pendingText = await save(page), pending = state.pendingCapture!;
    writeFileSync(join(dir, "pending-save.json"), pendingText);
    await screenshot("pending-capture");
    await country(page, plan.to).click(); await country(page, plan.to).press("Enter"); await page.clock.runFor(4000);
    expect((await checkpoint("capture-not-auto-confirmed")).history).toEqual(state.history);
    const quantities = [pending.min, Math.floor((pending.min + pending.max) / 2), pending.max];
    expect(new Set(quantities).size).toBe(3);
    for (const amount of quantities) {
      await page.getByLabel("Load game", {exact: true}).setInputFiles({name: "pending.json", mimeType: "application/json", buffer: Buffer.from(pendingText)});
      await expect(page.locator("#capture-amount")).toHaveAttribute("min", String(pending.min));
      await expect(page.locator("#capture-amount")).toHaveAttribute("max", String(pending.max));
      expect((await checkpoint("resumed-pending")).history).toEqual(state.history);
      await page.locator("#capture-amount").fill(String(amount)); await page.locator("#confirm-capture-button").click();
      const resolved = await checkpoint(`confirmed-${amount}`), expected = step(state, {kind: "captureMove", amount});
      expect(resolved.history).toEqual(expected.history); expect(resolved.armies).toEqual(expected.armies);
      expect(resolved.armies[plan.from]).toBeGreaterThanOrEqual(1);
      await screenshot(`confirmed-${amount}`);
    }
  } else {
    for (let i = 0; i < plan.exchanges; i++) {
      if (i) await country(page, plan.to).click();
      await page.locator("#attack-button").click(); state = step(state, attack);
      await expect(page.locator("#result-dialog")).toBeVisible();
      if (i === plan.exchanges - 1) {
        await expect(page.locator("#result-dialog")).toContainText("armies move in");
        await expect(page.locator("#capture-amount")).toHaveCount(0);
        await screenshot("automatic-capture-result");
      }
      await page.getByRole("button", {name: "Continue", exact: true}).click();
      expect((await checkpoint("legacy-exchange")).history).toEqual(state.history);
      await expect(page.locator("#attack-button")).toBeDisabled();
    }
    expect(state.ownerOf[plan.to]).toBe(activePlayer(state)!.id); expect(state.pendingCapture).toBeUndefined();
    await checkpoint("automatic-transfer-complete");
  }
  writeFileSync(join(dir, "observations.json"), JSON.stringify({url: page.url(), modern, seed: 1994, plan, errors, annotations: await page.locator(".army-count").allTextContents()}, null, 2));
  expect(errors).toEqual([]);
});
