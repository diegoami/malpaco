import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { mkdirSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { armyTotal, defaultOptions, provincesOf, serializeMatch } from "../../src/core";
import type { Action, GameOptions, GameState } from "../../src/core";
import { ACTION_BUDGET, advance, nextAction, opening, policyFor } from "../helpers/complete-game";
import {withSurface} from './shell';

const country = (page: Page, id: string) => page.locator(`[data-country="${id}"]`);

function legalFinishedHistory() {
  const options: GameOptions = {
    ...defaultOptions(),
    seed: 1994,
    seats: Array.from({ length: 3 }, () => ({ kind: "human" as const })),
    computerStrengths: [],
  };
  let state = opening(options.seed, options.seats.length);
  const policy = policyFor(state);
  let beforeWinningAttack: GameState | undefined;
  let winningAttack: Action | undefined;
  for (let actions = 0; state.phase !== "finished" && actions < ACTION_BUDGET; actions++) {
    const action = nextAction(state, policy);
    const next = advance(state, action);
    if (next.phase === "finished") {
      beforeWinningAttack = state;
      winningAttack = action;
    }
    state = next;
  }
  if (!beforeWinningAttack || !winningAttack || winningAttack.kind !== "attack") {
    throw Error("legal fixture did not finish on a winning attack");
  }
  return {
    options,
    finished: state,
    before: beforeWinningAttack,
    winningAttack,
    nearVictorySave: serializeMatch(options, beforeWinningAttack.history),
    finishedSave: serializeMatch(options, state.history),
  };
}

async function upload(page: Page, text: string) {
  await page.getByLabel("Load game", { exact: true }).setInputFiles({
    name: "finished-copy.json",
    mimeType: "application/json",
    buffer: Buffer.from(text),
  });
}

async function playWinningAttack(page: Page, action: Extract<Action, { kind: "attack" }>) {
  const from = country(page, action.from);
  if (await from.getAttribute("aria-pressed") !== "true") await from.click();
  await country(page, action.to).click();
  await page.locator("#attack-button").click();
  await expect(page.locator("#result-dialog")).toBeVisible();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
}

async function assertFinishedPanel(page: Page, state: GameState) {
  const winner = state.players.find((player) => player.id === state.winner)!;
  await expect(page.locator("#turn-title")).toHaveText(`${winner.name} conquers the sea`);
  await expect(page.locator(".turn-sub")).toContainText("game is over");
  await expect(page.locator(".turn-sub")).toContainText("New game");
  await expect(page.locator(".pick")).toContainText("New game");
  await expect(page.locator("#hint")).toBeEmpty();
  await expect(page.locator(".steps")).toHaveCount(0);
  await expect(page.locator("#legend")).toBeHidden();
  await expect(page.locator(`[data-player="${winner.id}"] .score-num`)).toHaveText(`${provincesOf(state, winner.id).length} provinces · ${armyTotal(state, winner.id)} armies`);
  await expect(page.locator(".log")).toContainText(`${winner.name} wins`);
  await expect(page.locator("#seed")).toHaveText("seed 1994");
  for (const id of ["attack-button", "end-turn-button", "start-combat-button"]) {
    await expect(page.locator(`#${id}`)).toBeDisabled();
  }
  await expect(page.getByRole("button", { name: "New game", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Save game", exact: true })).toBeVisible();
  await expect(page.getByLabel("Load game", { exact: true })).toBeAttached();
}

async function assertFinishedFit(page: Page) {
  const elements = await page.locator("#turn-title, .turn-sub, .finished-guidance, #new-game-button, #seed").evaluateAll((nodes) =>
    nodes.filter((node) => !(node as HTMLElement).hidden).map((node) => {
      const box = node.getBoundingClientRect();
      const panel = node.closest(".panel")!.getBoundingClientRect();
      const range = document.createRange();
      range.selectNodeContents(node);
      return {
        text: node.textContent,
        box: { x: box.x, y: box.y, right: box.right, bottom: box.bottom, width: box.width, height: box.height },
        panel: { x: panel.x, y: panel.y, right: panel.right, bottom: panel.bottom },
        lines: Array.from(range.getClientRects()).map((line) => ({ x: line.x, y: line.y, right: line.right, bottom: line.bottom })),
      };
    }),
  );
  expect(elements.length).toBeGreaterThanOrEqual(5);
  const viewport = page.viewportSize()!;
  for (const element of elements) {
    const why = JSON.stringify(element);
    expect(element.box.width, why).toBeGreaterThan(0);
    expect(element.box.height, why).toBeGreaterThan(0);
    expect(element.box.x, why).toBeGreaterThanOrEqual(Math.max(0, element.panel.x));
    expect(element.box.y, why).toBeGreaterThanOrEqual(Math.max(0, element.panel.y));
    expect(element.box.right, why).toBeLessThanOrEqual(Math.min(viewport.width, element.panel.right) + 1);
    expect(element.box.bottom, why).toBeLessThanOrEqual(Math.min(viewport.height, element.panel.bottom) + 1);
    for (const line of element.lines) {
      expect(line.x, why).toBeGreaterThanOrEqual(element.box.x - 1);
      expect(line.right, why).toBeLessThanOrEqual(element.box.right + 1);
      expect(line.y, why).toBeGreaterThanOrEqual(element.box.y - 1);
      expect(line.bottom, why).toBeLessThanOrEqual(element.box.bottom + 1);
    }
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

async function capture(page: Page, name: string, project: string) {
  const root = process.env["FINISHED_COPY_EVIDENCE_DIR"] ?? "screenshots";
  mkdirSync(root, { recursive: true });
  const dir = mkdtempSync(join(root, "finished-copy-"));
  await page.screenshot({ path: join(dir, `${name}-${project}.png`) });
}

test("winning attack keeps coherent finished copy through Continue and Escape, then starts a fresh seeded game", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const fixture = legalFinishedHistory();

  await page.goto("/?view=game-setup");
  await upload(page, fixture.nearVictorySave);
  await expect(country(page, fixture.winningAttack.from)).toHaveAttribute("data-owner", fixture.finished.ownerOf[fixture.winningAttack.from]!);
  await expect(country(page, fixture.winningAttack.to)).toHaveAttribute("data-owner", fixture.before.ownerOf[fixture.winningAttack.to]!);
  await playWinningAttack(page, fixture.winningAttack);
  await assertFinishedPanel(page, fixture.finished);
  await assertFinishedFit(page);
  await capture(page, "winning-attack-finished", info.project.name);

  await page.keyboard.press("Escape");
  await assertFinishedPanel(page, fixture.finished);
  await assertFinishedFit(page);
  const beforeMapClick = await page.locator("[data-country]").evaluateAll((nodes) => nodes.map((node) => [node.getAttribute("data-owner"), node.getAttribute("data-armies")]));
  await country(page, fixture.finished.map.provinces[0]!.id).click();
  expect(await page.locator("[data-country]").evaluateAll((nodes) => nodes.map((node) => [node.getAttribute("data-owner"), node.getAttribute("data-armies")]))).toEqual(beforeMapClick);
  await capture(page, "winning-attack-escape", info.project.name);

  await withSurface(page,'settings',()=>page.getByRole("button", { name: "New game", exact: true }).click());
  await expect(page.getByRole("heading", { name: "New generated game" })).toBeVisible();
  await expect(page.getByLabel("Seed", { exact: true })).toHaveValue(String(fixture.options.seed));
  await expect(page.getByLabel("Human seats")).toHaveValue("3");
  await page.getByRole("button", { name: "Start game", exact: true }).click();
  const fresh = opening(fixture.options.seed, fixture.options.seats.length);
  await expect(page.locator("#turn-title")).toHaveText(`${fresh.players[fresh.currentPlayer]!.name}'s turn`);
  await expect(page.locator("#reinforcement-pool")).toHaveText(String(fresh.reinforcementPool));
  await expect(country(page, fresh.map.provinces[0]!.id)).toHaveAttribute("data-owner", fresh.ownerOf[fresh.map.provinces[0]!.id]!);
  expect(errors).toEqual([]);
});

test("loading a finished legal save keeps its winner, restart guidance, and frozen actions after Escape", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  const fixture = legalFinishedHistory();
  await page.goto("/?view=game-setup");
  await upload(page, fixture.finishedSave);
  await assertFinishedPanel(page, fixture.finished);
  await assertFinishedFit(page);
  await capture(page, "loaded-finished", info.project.name);
  await page.keyboard.press("Escape");
  await assertFinishedPanel(page, fixture.finished);
  await assertFinishedFit(page);
  expect(errors).toEqual([]);
});
