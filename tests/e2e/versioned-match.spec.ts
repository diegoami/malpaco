import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { mkdirSync, mkdtempSync, readFileSync } from "node:fs";
import { join } from "node:path";
import * as codec from "../../src/core/match-save";
import { apply } from "../../src/core";
import type { GameState } from "../../src/core";
import { envelope, logicalState, pinned } from "../core/versioned-match-fixture";
import type { PinnedMatch } from "../core/versioned-match-fixture";
import {openSurface,withSurface} from './shell';

const country = (page: Page, id: string) => page.locator(`[data-country="${id}"]`);
const api = codec as typeof codec & { deserializeVersionedMatch?: (text: string) => { state: GameState } };
const decode = (text: string) => (api.deserializeVersionedMatch?.(text) ?? codec.deserializeMatch(text)).state;
async function download(page: Page) {
  const pending = page.waitForEvent("download");
  await withSurface(page,'settings',()=>page.getByRole("button", { name: "Save game", exact: true }).click());
  const file = await pending;
  expect(file.suggestedFilename()).toMatch(/^malpaco-\d+\.json$/);
  return readFileSync((await file.path())!, "utf8");
}
async function upload(page: Page, text: string, name = "resume.json") {
  await page.getByLabel("Load game", { exact: true }).setInputFiles({ name, mimeType: "application/json", buffer: Buffer.from(text) });
}
async function paint(page: Page, expected: Record<string, unknown>) {
  const owners = expected["ownerOf"] as Record<string, string>, armies = expected["armies"] as Record<string, number>;
  const actual = await page.locator("[data-country]").evaluateAll(nodes => Object.fromEntries(nodes.map(n => [n.getAttribute("data-country"), [n.getAttribute("data-owner"), Number(n.getAttribute("data-armies"))]])));
  expect(actual).toEqual(Object.fromEntries(Object.keys(owners).map(id => [id, [owners[id], armies[id]]])));
}
async function check(page: Page, fixture: PinnedMatch) {
  await expect(page.locator("[data-country]")).toHaveCount(46);
  await expect.poll(async () => await page.locator("[data-country]").evaluateAll(nodes => Object.fromEntries(nodes.map(n => [n.getAttribute("data-country"), Number(n.getAttribute("data-armies"))])))).toEqual(fixture.expected["armies"]);
  await paint(page, fixture.expected);
  const text = await download(page);
  expect(JSON.parse(text)).toEqual(envelope(fixture.options, fixture.actions));
  expect(logicalState(decode(text))).toEqual(fixture.expected);
  return text;
}
async function setup(page: Page) {
  await page.goto("/?view=reference-game&control=manual");
  await expect(page.getByRole("heading", { name: "New reference game", exact: true })).toBeVisible();
}
async function capture(page: Page, label: string, project: string) {
  const root = process.env["VERSIONED_MATCH_EVIDENCE_DIR"] ?? "screenshots";
  mkdirSync(root, { recursive: true });
  const selectors = "#reference-save-game,#reference-load-game-file,.match-error:not(:empty),#turn-title,#confirm-capture-button,#confirm-friendly-move-button,#victory-reason";
  // T79: the file controls live in the settings card; with it open, save, load and any error fit together.
  await openSurface(page, "settings");
  // The menu card scrolls: each control is measured once scrolled into view, as a player would reach it.
  const boxes = await page.locator(selectors).evaluateAll(nodes => nodes.filter(n => n.getClientRects().length).map(n => {
    n.scrollIntoView({ block: "nearest" }); const r = n.getBoundingClientRect(); return { id: n.id, font: parseFloat(getComputedStyle(n).fontSize), fits: r.left >= 0 && r.top >= 0 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1 };
  }));
  expect(boxes.map(b => b.id)).toEqual(expect.arrayContaining(["reference-save-game", "reference-load-game-file"]));
  expect(boxes.filter(b => !b.fits || b.font < 12)).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: join(mkdtempSync(join(root, "versioned-")), `${label}-${project}.png`) });
}
function errorsOn(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  return errors;
}

test("placement download/upload retains full original options and continues placement", async ({ page }, info) => {
  const errors = errorsOn(page), fixture = pinned("placement");
  await setup(page); await upload(page, fixture.text); const text = await check(page, fixture);
  await capture(page, "placement", info.project.name);
  await withSurface(page,'settings',()=>page.getByRole("button", { name: "New game", exact: true }).click());
  await page.getByLabel("Seed", { exact: true }).fill("42");
  await upload(page, text); await check(page, fixture);
  const action = fixture.next!.action;
  if (action.kind !== "reinforce") throw Error("Pinned placement must continue reinforcement");
  await country(page, action.province).click();
  expect(logicalState(decode(await download(page)))).toEqual(fixture.next!.expected);
  await paint(page, fixture.next!.expected); expect(errors).toEqual([]);
});

test("pending capture reload keeps the choice and rejects a detached old confirm", async ({ page }, info) => {
  const errors = errorsOn(page), fixture = pinned("pending-capture");
  await setup(page); await upload(page, fixture.text); const text = await check(page, fixture);
  const pending = fixture.expected["pendingCapture"] as { defaultAmount: number };
  await openSurface(page,'actions');await expect(page.locator("#capture-amount")).toHaveValue(String(pending.defaultAmount));
  const oldConfirm = await page.locator("#confirm-capture-button").elementHandle();
  await upload(page, text); await check(page, fixture);
  await oldConfirm!.evaluate(n => n.dispatchEvent(new MouseEvent("click", { bubbles: true })));
  await check(page, fixture); await capture(page, "pending-capture", info.project.name);
  await openSurface(page,'actions');await page.locator("#capture-amount").fill("1"); await page.locator("#confirm-capture-button").click();
  expect(logicalState(decode(await download(page)))).toEqual(fixture.next!.expected);
  await paint(page, fixture.next!.expected); expect(errors).toEqual([]);
});

test("friendly move draft is transient; completed move restores exact next turn", async ({ page }, info) => {
  const errors = errorsOn(page), fixture = pinned("move-ready"), completed = pinned("move-completed");
  const action = fixture.next!.action;
  if (action.kind !== "friendlyMove") throw Error("Pinned move must be friendlyMove");
  await setup(page); await upload(page, fixture.text); await check(page, fixture);
  await page.locator("#start-friendly-move-button").click();
  await country(page, action.from).click(); await country(page, action.to).click();
  await openSurface(page,'actions');await page.locator("#friendly-move-amount").fill("1");
  await openSurface(page,'actions');const stale = await page.locator("#confirm-friendly-move-button").elementHandle();
  const draft = await check(page, fixture); await capture(page, "move-draft", info.project.name);
  await upload(page, draft); await check(page, fixture);
  await expect(page.locator("#start-friendly-move-button")).toBeVisible();
  await openSurface(page,'actions');await expect(page.locator("#confirm-friendly-move-button")).not.toBeVisible();
  await stale!.evaluate(n => n.dispatchEvent(new MouseEvent("click", { bubbles: true })));
  await check(page, fixture);
  await page.locator("#start-friendly-move-button").click();
  await country(page, action.from).click(); await country(page, action.to).click();
  await openSurface(page,'actions');await page.locator("#friendly-move-amount").fill("1"); await openSurface(page,'actions');await page.locator("#confirm-friendly-move-button").click();
  const moved = await check(page, completed);
  await page.reload(); await upload(page, moved); await check(page, completed);
  await capture(page, "move-completed", info.project.name); expect(errors).toEqual([]);
});

test("victory and human-loss choices survive real files and remain usable", async ({ page }, info) => {
  const errors = errorsOn(page);
  for (const name of ["domination", "round-limit", "stop"]) {
    const fixture = pinned(name); await setup(page); await upload(page, fixture.text);
    const text = await check(page, fixture); await expect(page.locator("#victory-reason")).toBeVisible();
    await page.reload(); await upload(page, text); await check(page, fixture);
    await expect(page.locator("#end-turn-button")).not.toBeVisible();
    await capture(page, name, info.project.name);
  }
  const loss = pinned("human-loss"); await setup(page); await upload(page, loss.text); await check(page, loss);
  await page.locator("#watch-computers-button").click(); await check(page, pinned("watch"));
  await upload(page, loss.text); await check(page, loss);
  await page.locator("#stop-game-button").click(); await check(page, pinned("stop"));
  expect(errors).toEqual([]);
});

test("bad loads and generated-map files preserve the live match, draft and controls", async ({ page }, info) => {
  const errors = errorsOn(page), fixture = pinned("move-ready");
  const action = fixture.next!.action;
  if (action.kind !== "friendlyMove") throw Error("Expected friendly move fixture");
  await setup(page); await upload(page, fixture.text); const before = await check(page, fixture);
  await page.locator("#start-friendly-move-button").click(); await country(page, action.from).click(); await country(page, action.to).click();
  const valid = envelope(fixture.options, fixture.actions);
  for (const invalid of ["{", JSON.stringify({ ...valid, version: 99 }), JSON.stringify({ ...valid, boardGenerator: { id: "fixed-reference", version: 99 } }), JSON.stringify({ ...valid, actions: [{ kind: "attack", from: "missing", to: "missing" }] }), pinned("legacy-progress").text]) {
    await upload(page, invalid); await openSurface(page,'settings');await expect(page.getByRole("alert")).toContainText(/Load failed:/i);
    if (invalid === pinned("legacy-progress").text) await expect(page.getByRole("alert")).toContainText(/generated.*map|map.*generated/i);
    expect(await download(page)).toBe(before); await paint(page, fixture.expected);
    await openSurface(page,'actions');await expect(page.locator("#confirm-friendly-move-button")).toBeEnabled();
  }
  await capture(page, "failed-load", info.project.name);
  await openSurface(page,'actions');await page.locator("#friendly-move-amount").fill("1"); await openSurface(page,'actions');await page.locator("#confirm-friendly-move-button").click();
  await check(page, pinned("move-completed")); expect(errors).toEqual([]);
});

test("new game and a successful later load invalidate slow file readers", async ({ page }) => {
  const errors = errorsOn(page);
  await page.addInitScript(() => {
    const original = File.prototype.text;
    File.prototype.text = function () {
      if (this.name !== "slow.json") return original.call(this);
      return new Promise<string>((resolve, reject) => {
        Reflect.set(window, "releaseT31Read", () => { original.call(this).then(resolve, reject); });
      });
    };
  });
  const placement = pinned("placement"), pending = pinned("pending-capture");
  await setup(page); await upload(page, placement.text); await check(page, placement);
  await upload(page, pending.text, "slow.json");
  await withSurface(page,'settings',()=>page.getByRole("button", { name: "New game", exact: true }).click());
  await page.getByLabel("Seed", { exact: true }).fill("42");
  await page.getByRole("button", { name: "Start game", exact: true }).click();
  const fresh = await download(page);
  await page.evaluate(() => (Reflect.get(window, "releaseT31Read") as () => void)());
  await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 0)));
  expect(await download(page)).toBe(fresh);
  await upload(page, pending.text, "slow.json"); await upload(page, placement.text); await check(page, placement);
  await page.evaluate(() => (Reflect.get(window, "releaseT31Read") as () => void)());
  await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 0)));
  await check(page, placement); expect(errors).toEqual([]);
});

test("successful load cancels queued fight-on work from the prior match", async ({ page }) => {
  const errors = errorsOn(page), fixture = pinned("move-ready"), restored = pinned("placement");
  await page.clock.install(); await page.clock.pauseAt(new Date());
  await setup(page); await upload(page, fixture.text); await check(page, fixture);
  const state = decode(fixture.text), mover = state.players[state.currentPlayer]!.id;
  const attacks = state.map.provinces.filter(p => state.ownerOf[p.id] === mover && state.armies[p.id]! > 2).flatMap(p => [...p.borders, ...p.seaLanes].filter(id => state.ownerOf[id] !== mover).map(to => ({ kind: "attack" as const, from: p.id, to })));
  const queued = attacks.find(action => { const result = apply(state, action); return result.ok && result.state.phase === "attack" && result.state.armies[action.from]! > 1; });
  if (!queued) throw Error("Pinned move-ready must permit a queued exchange for stale-timer acceptance");
  await country(page, queued.from).click(); await country(page, queued.to).click({modifiers:["Shift"]});
  await openSurface(page,'actions');await page.locator("#battle-stop-threshold").fill("1"); await openSurface(page,'actions');await page.locator("#battle-stop-threshold").press("Tab");
  await page.locator("#fight-on-button").click();
  await openSurface(page,'actions');await expect(page.getByRole("region", { name: "Battle controls", exact: true })).toHaveAttribute("data-running", "true");
  await upload(page, restored.text); await check(page, restored);
  await page.clock.runFor(10000); await check(page, restored);
  const next = restored.next!.action;
  if (next.kind !== "reinforce") throw Error("Expected reinforcement continuation");
  const result = apply(decode(restored.text), next); expect(result.ok).toBe(true);
  await country(page, next.province).click();
  expect(logicalState(decode(await download(page)))).toEqual(restored.next!.expected);
  expect(errors).toEqual([]);
});
