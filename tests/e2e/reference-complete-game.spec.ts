import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { activePlayer, apply, victoryRules } from "../../src/core";
import type { Action, GameOptions, GameState } from "../../src/core";
import { createReferenceGame } from "../../src/core/reference-game";
import { referenceMap } from "../../src/core/reference-map";
import { deserializeVersionedMatch } from "../../src/core/match-save";

const fixture = JSON.parse(readFileSync(new URL("../../docs/prototypes/new-game/T33/fixtures/conquest.json", import.meta.url), "utf8")) as {
  options: GameOptions; actions: Action[]; expected: { actions: number; computerActions: number; humanActions: number; winner: string };
};
const country = (page: Page, id: string) => page.locator(`[data-country="${id}"]`);
function step(state: GameState, action: Action) {
  const result = apply(state, action); if (!result.ok) throw Error(JSON.stringify(action) + ": " + result.error); return result.state;
}
async function save(page: Page) {
  const event = page.waitForEvent("download"); await page.getByRole("button", {name: "Save game", exact: true}).click();
  return readFileSync((await (await event).path())!, "utf8");
}
async function paint(page: Page, state: GameState) {
  expect(await page.locator("[data-country]").evaluateAll(nodes => Object.fromEntries(nodes.map(n => [n.getAttribute("data-country"), [n.getAttribute("data-owner"), Number(n.getAttribute("data-armies"))]])))).toEqual(Object.fromEntries(state.map.provinces.map(p => [p.id, [state.ownerOf[p.id], state.armies[p.id]]])));
}

test("real human/computer setup, friendly move, pending save/resume, elimination and conquest", async ({page}, info) => {
  test.setTimeout(240_000);
  const root = process.env["REFERENCE_COMPLETE_EVIDENCE_DIR"] ?? "screenshots"; mkdirSync(root, {recursive: true});
  const evidence = mkdtempSync(join(root, `reference-complete-${info.project.name}-`));
  const errors: string[] = []; page.on("pageerror", e => errors.push(e.message)); page.on("console", m => {if (m.type() === "error") errors.push(m.text());});
  const screenshot = async (name: string) => { await page.mouse.move(0, 0); await page.screenshot({path: join(evidence, name + ".png"), animations: "disabled"}); };
  await page.clock.install({time: new Date("2026-10-17T00:00:00Z")}); await page.clock.pauseAt(new Date("2026-10-17T12:00:00Z"));
  await page.goto("/");
  await expect(page.getByLabel("Seat 1 control", {exact: true})).toHaveValue("human");
  for (let seat = 2; seat <= 4; seat++) await expect(page.getByLabel(`Seat ${seat} control`, {exact: true})).toHaveValue("computer");
  await page.getByLabel("Seed", {exact: true}).fill(String(fixture.options.seed));
  await page.getByLabel("Seats", {exact: true}).selectOption("2");
  await page.getByLabel("Domination win", {exact: true}).uncheck();
  await page.getByRole("button", {name: "Start game", exact: true}).click();
  const opening = createReferenceGame(referenceMap, fixture.options, victoryRules(fixture.options)); if (!opening.ok) throw Error(opening.errors.join(";"));
  let state = opening.state;
  expect(deserializeVersionedMatch(await save(page)).options).toEqual(fixture.options);
  await paint(page, state); await screenshot("opening");
  let index = 0, resumed = false, moved = false, battle = false, computer = false, eliminated = false;
  const assertSaved = async (name: string) => { const text = await save(page); writeFileSync(join(evidence, name + ".json"), text); expect(deserializeVersionedMatch(text).state).toEqual(state); return text; };
  while (index < fixture.actions.length) {
    if (activePlayer(state)!.kind === "computer") {
      if (!computer) { await expect(page.locator("#reference-computer-status")).toBeVisible(); await expect(page.locator("#end-turn-button")).toBeDisabled(); await screenshot("computer-turn"); computer = true; }
      let steps = 0;
      do { state = step(state, fixture.actions[index++]!); steps++; } while (index < fixture.actions.length && activePlayer(state)!.kind === "computer" && state.phase !== "finished");
      await page.clock.runFor(steps * 350);
      await paint(page, state); await assertSaved(`handoff-${index}`);
      continue;
    }
    const action = fixture.actions[index++]!;
    if (action.kind === "reinforce") await country(page, action.province).click();
    else if (action.kind === "endReinforcement") await page.locator("#start-combat-button").click();
    else if (action.kind === "endTurn") await page.locator("#end-turn-button").click();
    else if (action.kind === "attack") {
      if (await country(page, action.from).getAttribute("aria-pressed") !== "true") await country(page, action.from).click();
      await country(page, action.to).click();
      if (!battle) { await screenshot("battle"); battle = true; }
    } else if (action.kind === "friendlyMove") {
      await page.locator("#start-friendly-move-button").click(); await country(page, action.from).click(); await country(page, action.to).click();
      await page.locator("#friendly-move-amount").fill(String(action.amount)); await screenshot("friendly-move");
      await page.locator("#confirm-friendly-move-button").click(); moved = true;
    } else if (action.kind === "captureMove") {
      const pending = state.pendingCapture!;
      await expect(page.locator("#capture-amount")).toHaveAttribute("min", String(pending.min)); await expect(page.locator("#capture-amount")).toHaveAttribute("max", String(pending.max));
      if (!resumed) {
        const text = await assertSaved("pending-capture"); await screenshot("pending-capture");
        await page.reload(); await expect(page.locator("#reference-setup")).toBeVisible();
        await page.getByLabel("Load game", {exact: true}).setInputFiles({name: "resume.json", mimeType: "application/json", buffer: Buffer.from(text)});
        await expect(page.locator("#capture-amount")).toHaveAttribute("max", String(pending.max));
        await assertSaved("resumed-capture"); await paint(page, state); await screenshot("save-resume"); resumed = true;
      }
      await page.locator("#capture-amount").fill(String(action.amount)); await page.locator("#confirm-capture-button").click();
    } else throw Error("Unexpected human action " + action.kind);
    state = step(state, action);
    if (action.kind !== "reinforce") await paint(page, state);
    if (!eliminated && state.players.some(p => p.eliminated)) { eliminated = true; const dead = state.players.find(p => p.eliminated)!; await expect(page.locator(`[data-player="${dead.id}"] .score-num`)).toContainText("0 provinces"); await screenshot("elimination"); }
  }
  expect(index).toBe(fixture.expected.actions); expect([resumed, moved, battle, computer, eliminated]).toEqual([true,true,true,true,true]);
  expect(state.phase).toBe("finished"); expect(state.winner).toBe("seat1"); expect(state.result!.reason).toBe("conquest");
  await expect(page.locator("#victory-reason")).toContainText(/conquest|all.*46|46.*countr/i);
  await expect(page.locator("#turn-title")).toContainText("Seat 1");
  await expect(page.locator('[data-result-player="seat1"] [data-result-countries]')).toHaveText("46");
  await assertSaved("winner"); await screenshot("winner");
  const finished = await save(page); await country(page, state.map.provinces[0]!.id).click(); await page.clock.runFor(4000); expect(await save(page)).toBe(finished);
  await page.getByRole("button", {name: "New game", exact: true}).click(); await expect(page.locator("#reference-setup")).toBeVisible();
  expect(errors).toEqual([]);
  writeFileSync(join(evidence, "summary.json"), JSON.stringify({url: page.url(), options: fixture.options, actions: index, computerActions: fixture.expected.computerActions, humanActions: fixture.expected.humanActions, winner: state.winner, observed: {resumed, moved, battle, computer, eliminated}, errors}, null, 2));
});
