import { expect, test as base } from "@playwright/test";
import { readFileSync, mkdirSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import type { Locator, Page } from "@playwright/test";
import { createGame, defaultOptions, attackTargets, apply, malpacoRules, serializeMatch } from "../../src/core";
import {withSurface} from './shell';

const topics = ["Seed and players", "Map and armies", "Reinforcements", "Attacking", "Turns and victory", "Computer turns", "Save and load"];
const test = base.extend<{ noBrowserErrors: void }>({
  noBrowserErrors: [async ({ page }, use) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
    await use();
    expect(errors, "browser errors").toEqual([]);
  }, { auto: true }],
});

async function capture(page: Page, name: string, project: string) {
  const root = process.env["HELP_EVIDENCE_DIR"];
  if (!root) return;
  await page.evaluate(async () => { await document.fonts.ready; });
  mkdirSync(root, { recursive: true });
  const dir = mkdtempSync(join(root, "help-"));
  await page.screenshot({ path: join(dir, `${name}-${project}.png`) });
}

async function expectDialogFits(page: Page, dialog: Locator) {
  const viewport = page.viewportSize()!;
  const geometry = await dialog.evaluate(element => {
    const box = element.getBoundingClientRect();
    const close = element.querySelector("button")!.getBoundingClientRect();
    return {
      dialog: { x: box.x, y: box.y, right: box.right, bottom: box.bottom, width: box.width, height: box.height, opacity: Number(getComputedStyle(element).opacity) },
      close: { x: close.x, y: close.y, right: close.right, bottom: close.bottom },
    };
  });
  expect(geometry.dialog.opacity).toBeGreaterThanOrEqual(0.99);
  expect(geometry.dialog.width).toBeGreaterThan(0);
  expect(geometry.dialog.height).toBeGreaterThan(0);
  expect(geometry.dialog.x).toBeGreaterThanOrEqual(0);
  expect(geometry.dialog.y).toBeGreaterThanOrEqual(0);
  expect(geometry.dialog.right).toBeLessThanOrEqual(viewport.width);
  expect(geometry.dialog.bottom).toBeLessThanOrEqual(viewport.height);
  expect(geometry.close.x).toBeGreaterThanOrEqual(geometry.dialog.x);
  expect(geometry.close.y).toBeGreaterThanOrEqual(geometry.dialog.y);
  expect(geometry.close.right).toBeLessThanOrEqual(geometry.dialog.right);
  expect(geometry.close.bottom).toBeLessThanOrEqual(geometry.dialog.bottom);
  expect(geometry.close.x).toBeGreaterThanOrEqual(0);
  expect(geometry.close.y).toBeGreaterThanOrEqual(0);
  expect(geometry.close.right).toBeLessThanOrEqual(viewport.width);
  expect(geometry.close.bottom).toBeLessThanOrEqual(viewport.height);
}

async function downloadedMatch(page: Page) {
  const event = page.waitForEvent("download");
  await withSurface(page,'settings',()=>page.getByRole("button", { name: "Save game", exact: true }).click());
  return readFileSync((await (await event).path())!, "utf8");
}

test("setup help is reachable, readable, scrollable and returns focus", async ({ page }, info) => {
  await page.goto("/?view=game-setup&seed=42&seats=3&opponents=computer");
  const seed = page.getByLabel("Seed", { exact: true });
  const players = page.getByLabel("Players", { exact: true });
  const seats = page.getByLabel("Total seats", { exact: true });
  await players.selectOption("computer");
  await seats.selectOption("3");
  const opener = page.getByRole("button", { name: "How to play", exact: true });
  await expect(opener).toBeVisible();
  await opener.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "How to play", exact: true });
  await expect(dialog).toBeVisible();
  await expectDialogFits(page, dialog);
  await expect(dialog.locator("h2")).toBeInViewport();
  await expect(dialog.locator("p").first()).toBeInViewport();
  for (const topic of topics) await expect(dialog.getByRole("heading", { name: topic, exact: true })).toBeVisible();
  const copy = (await dialog.locator("p").allTextContents()).join(" ").toLowerCase();
  for (const word of ["seed", "seat", "numeric", "army", "land", "sea", "reinforcement pool", "you own", "start combat", "adjacent", "two armies", "exchange", "end your turn", "eliminated", "every province", "computer", "pauses", "save game", "options", "history", "load game", "new game"]) expect(copy).toContain(word);
  // T151 corrected the classic attack rules; do not require its removed strength gate or Continue wording.
  const attacking = dialog.locator("section").filter({ has: page.getByRole("heading", { name: "Attacking", exact: true }) }).locator("p");
  await expect(attacking).toContainText("Select a source and an adjacent enemy");
  await expect(attacking).toContainText("source needs at least two armies");
  await expect(attacking).toContainText("Each Attack resolves one exchange");
  await expect(attacking).not.toContainText("at least as many armies as the defender");
  await expect(attacking).not.toContainText("choose Continue");
  await expect(attacking).toContainText("press it again to act again");
  const box = await dialog.evaluate(el => ({ scroll: el.scrollHeight, client: el.clientHeight, width: el.scrollWidth, clientWidth: el.clientWidth }));
  expect(box.width).toBeLessThanOrEqual(box.clientWidth);
  if (box.scroll > box.client) await dialog.evaluate(el => { el.scrollTop = el.scrollHeight; });
  await expectDialogFits(page, dialog);
  const viewport = page.viewportSize()!;
  const pageWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(pageWidth).toBeLessThanOrEqual(viewport.width);
  await expect(dialog.locator("p").last()).toBeInViewport();
  await expect(dialog.getByRole("button", { name: "Close", exact: true })).toBeVisible();
  await capture(page, "setup-help-end", info.project.name);
  await dialog.evaluate(el => { el.scrollTop = 0; });
  await capture(page, "setup-help-top", info.project.name);
  await dialog.getByRole("button", { name: "Close", exact: true }).press("Enter");
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
  await opener.press("Enter");
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
  await expect(seed).toHaveValue("42");
  await expect(players).toHaveValue("computer");
  await expect(seats).toHaveValue("3");
});

test("gameplay help preserves an active selection and downloaded match", async ({ page }, info) => {
  await page.goto("/?view=generated-game&seed=1994&seats=2");
  await expect(page.locator("#generated-game [data-country]")).toHaveCount(46);
  const opener = page.getByRole("button", { name: "How to play", exact: true });
  await expect(opener).toBeVisible();
  const initial = createGame({ ...defaultOptions(), seed: 1994, seats: [{ kind: "human" }, { kind: "human" }], computerStrengths: [] });
  if (!initial.ok) throw new Error(initial.errors.join("; "));
  let state = initial.state;
  const player = state.players[state.currentPlayer]!.id;
  const sourceId = state.map.provinces.find(p => state.ownerOf[p.id] === player && [...p.borders, ...p.seaLanes].some(id => state.ownerOf[id] !== player))!.id;
  const source = page.locator(`#generated-game [data-country="${sourceId}"]`);
  const pool = state.reinforcementPool;
  for (let i = 0; i < pool; i++) {
    await source.click();
    const next = apply(state, { kind: "reinforce", province: sourceId, amount: 1 });
    if (!next.ok) throw new Error(next.error);
    state = next.state;
  }
  await page.getByRole("button", { name: "Start combat", exact: true }).click();
  const combat = apply(state, { kind: "endReinforcement" });
  if (!combat.ok) throw new Error(combat.error);
  state = combat.state;
  const targetId = attackTargets(state, sourceId)[0]!;
  await source.click();
  await page.locator(`#generated-game [data-country="${targetId}"]`).click();
  await expect(source).toHaveAttribute("aria-pressed", "true");
  const before = await downloadedMatch(page);
  await opener.click();
  const dialog = page.getByRole("dialog", { name: "How to play", exact: true });
  await expect(dialog).toBeVisible();
  await expectDialogFits(page, dialog);
  for (const topic of topics) await expect(dialog.getByRole("heading", { name: topic, exact: true })).toBeVisible();
  await capture(page, "gameplay-help", info.project.name);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
  await expect(source).toHaveAttribute("aria-pressed", "true");
  expect(await downloadedMatch(page)).toBe(before);
  await expect(page.locator("#attack-button")).toBeEnabled();
  await page.getByRole("button", { name: "Attack", exact: true }).click();
  await expect(page.locator("#result-dialog")).toBeVisible();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  expect(await downloadedMatch(page)).not.toBe(before);
});

test("computer help pauses, resumes and is discarded by New game", async ({ page }) => {
  await page.clock.install();
  await page.clock.pauseAt(new Date());
  await page.goto("/?view=game-setup&seed=1994&seats=2&opponents=computer");
  await page.getByLabel("Players", { exact: true }).selectOption("computer");
  await page.getByRole("button", { name: "Start game", exact: true }).press("Enter");
  const initial = createGame({ ...defaultOptions(), seed: 1994, seats: [{ kind: "human" }, { kind: "computer" }], computerStrengths: ["Normal"] }, malpacoRules());
  if (!initial.ok) throw new Error(initial.errors.join("; "));
  let state = initial.state;
  if (state.currentPlayer === 0) {
    const player = state.players[state.currentPlayer]!.id;
    const sourceId = state.map.provinces.find(p => state.ownerOf[p.id] === player && [...p.borders, ...p.seaLanes].some(id => state.ownerOf[id] !== player))!.id;
    const source = page.locator(`#generated-game [data-country="${sourceId}"]`);
    const pool = state.reinforcementPool;
    for (let i = 0; i < pool; i++) {
      await source.click();
      const next = apply(state, { kind: "reinforce", province: sourceId, amount: 1 });
      if (!next.ok) throw new Error(next.error);
      state = next.state;
    }
    await page.getByRole("button", { name: "Start combat", exact: true }).click();
    const combat = apply(state, { kind: "endReinforcement" });
    if (!combat.ok) throw new Error(combat.error);
    state = combat.state;
    await page.getByRole("button", { name: "End turn", exact: true }).click();
    const handoff = apply(state, { kind: "endTurn" });
    if (!handoff.ok) throw new Error(handoff.error);
    state = handoff.state;
  }
  await expect(page.locator("#seat-controller")).toContainText("Computer");
  const opener = page.getByRole("button", { name: "How to play", exact: true });
  const computerBefore = await downloadedMatch(page);
  await opener.click();
  const dialog = page.getByRole("dialog", { name: "How to play", exact: true });
  await expect(dialog).toBeVisible();
  await page.clock.runFor(1200);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  expect(await downloadedMatch(page)).toBe(computerBefore);
  await page.clock.runFor(350);
  expect(await downloadedMatch(page)).not.toBe(computerBefore);

  const humanOptions = { ...defaultOptions(), seed: 42, seats: [{ kind: "human" as const }, { kind: "human" as const }], computerStrengths: [] };
  const human = createGame(humanOptions, malpacoRules());
  if (!human.ok) throw new Error(human.errors.join("; "));
  const humanMatch = serializeMatch(humanOptions, human.state.history);
  await opener.click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "How to play" })).toBeHidden();
  await page.locator("#load-game-file").setInputFiles({ name: "human.json", mimeType: "application/json", buffer: Buffer.from(humanMatch) });
  await expect(page.locator("#seat-controller")).not.toContainText("Computer");
  const replacement = await downloadedMatch(page);
  await page.clock.runFor(1200);
  expect(await downloadedMatch(page)).toBe(replacement);
  await expect(page.getByRole("dialog", { name: "How to play" })).toHaveCount(0);
  await withSurface(page,'settings',()=>page.getByRole("button", { name: "New game", exact: true }).click());
  await expect(page).toHaveURL(/view=game-setup/);
  await page.clock.runFor(1200);
  await expect(page.getByRole("heading", { name: "New generated game" })).toBeVisible();
  await expect(page.getByRole("dialog", { name: "How to play" })).toHaveCount(0);
});
