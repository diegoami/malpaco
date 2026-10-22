import { test, expect } from "@playwright/test";
import { fixture } from "./battle-fixture";
import { pinned } from "../core/versioned-match-fixture";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import {openSurface,withSurface} from './shell';

// T97: Fight on and the card's own speed setting are gone (owner, #244): game speed lives in the menu,
// and a modal's Escape leaves the staged battle as it was, with nothing fought meanwhile.
test("modal Escape preserves the staged battle; game speed is the one speed control", async ({ page }, info) => {
  const f = fixture("manual"); await page.clock.install({ time: new Date("2026-10-17T12:00:00Z") }); await page.clock.pauseAt(new Date("2026-10-17T12:00:00Z"));
  await page.goto("/?view=reference-game&control=manual"); await page.getByLabel("Seed", { exact: true }).fill(String(f.seed));
  await page.getByRole("button", { name: "Start game", exact: true }).click();
  for (let i = 0; i < f.placements; i++) await page.locator(`[data-country="${f.from}"]`).click();
  await page.locator("#start-combat-button").click(); await page.locator(`[data-country="${f.from}"]`).click(); await page.locator(`[data-country="${f.to}"]`).click({ modifiers: ["Shift"] });
  await openSurface(page, "actions");
  await withSurface(page,'settings',()=>page.locator("#game-speed").selectOption("very-slow")); await openSurface(page,'actions');await expect(page.locator("#battle-speed, #battle-stop-threshold, #fight-on-button")).toHaveCount(0);
  await expect(page.locator("#game-pause-button")).not.toHaveAttribute("aria-pressed");
  await withSurface(page,'settings',()=>page.locator("#game-speed").selectOption("normal")); await expect(page.locator("#game-speed")).toHaveValue("normal");
  await openSurface(page,'actions'); await page.locator("#single-exchange-button").click();
  const battle = page.locator('section.battle-controls[aria-label="Battle controls"]'), count = Number(await battle.getAttribute("data-history-count"));
  await openSurface(page,'menu');await page.locator("#game-log-button").click(); const dialog = page.getByRole("dialog", { name: "Game event log", exact: true }); await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape"); await expect(dialog).not.toBeVisible(); await expect(battle).toHaveAttribute("data-running", "false");
  await page.clock.runFor(4000); await expect(battle).toHaveAttribute("data-history-count", String(count));
  await openSurface(page,'actions'); await page.locator("#single-exchange-button").click(); await expect(battle).toHaveAttribute("data-history-count", String(count + 1));
  await page.locator("#game-pause-button").click(); await withSurface(page,'settings',()=>page.locator("#game-speed").selectOption("very-slow")); await expect(page.locator("#game-speed")).toHaveValue("very-slow");
  await openSurface(page,'menu');await page.locator("#game-log-button").click(); await expect(dialog.locator("details")).not.toHaveAttribute("open", "");
  expect(await dialog.evaluate(node => getComputedStyle(node).backgroundColor)).not.toBe("rgba(0, 0, 0, 0)");
  expect(await dialog.evaluate(node => Number(getComputedStyle(node).opacity))).toBe(1);
  const close = dialog.getByRole("button", { name: "Close game event log", exact: true }); await expect(close).toBeInViewport();
  const root = process.env["PLAYBACK_EVIDENCE_DIR"] ?? "screenshots"; mkdirSync(root, { recursive: true }); await page.screenshot({ path: join(root, `production-modal-${info.project.name}.png`) });
});

test("default four-seat controls fit and a paused computer is labelled paused", async ({ page }, info) => {
  await page.clock.install({ time: new Date("2026-10-17T12:00:00Z") }); await page.clock.pauseAt(new Date("2026-10-17T12:00:00Z")); await page.goto("/?view=reference-game");
  await page.getByRole("button", { name: "Start game", exact: true }).click();
  await expect(page.locator("#game-pause-button")).toBeInViewport();
  await withSurface(page, "menu", () => expect(page.locator("#game-log-button")).toBeInViewport());
  await withSurface(page, "settings", () => expect(page.locator("#game-speed")).toBeInViewport());
  // T97: the totals left the menu (owner, #244).
  await withSurface(page, "details", async () => { await expect(page.locator('[data-testid="player-army-total"]:visible')).toHaveCount(0); });
  const f = pinned("watch"); await page.getByLabel("Load game", { exact: true }).setInputFiles({ name: "watch.json", mimeType: "application/json", buffer: Buffer.from(f.text) });
  await page.locator("#game-pause-button").click(); await expect(page.locator("#reference-computer-status")).toHaveText(/Paused/); await expect(page.locator("#reference-computer-status")).not.toHaveText(/playing/);
  const root = process.env["PLAYBACK_EVIDENCE_DIR"] ?? "screenshots"; mkdirSync(root, { recursive: true }); await page.screenshot({ path: join(root, `production-paused-computer-${info.project.name}.png`) });
});

test("closing the event log does not steal focus from the next keyboard action", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-10-17T12:00:00Z") }); await page.clock.pauseAt(new Date("2026-10-17T12:00:00Z"));
  await page.goto("/?view=reference-game&control=manual"); await page.getByRole("button", { name: "Start game", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Game event log", exact: true }), button = page.locator("#game-log-button"), country = page.locator("[data-country]").first();
  await openSurface(page, "menu"); await button.focus(); await button.press("Enter"); await expect(dialog).toBeVisible(); await page.keyboard.press("Escape"); await expect(dialog).not.toBeVisible();
  await country.focus(); await page.locator("dialog.game-event-log").dispatchEvent("close"); await expect(country).toBeFocused();
  await country.press("Enter"); await expect(dialog).not.toBeVisible(); await withSurface(page,'settings',()=>page.getByRole("button", { name: "Save game", exact: true }).click());
});

test("failed load feedback stays readable without covering capture or playback controls", async ({ page }, info) => {
  await page.clock.install({ time: new Date("2026-10-17T12:00:00Z") }); await page.clock.pauseAt(new Date("2026-10-17T12:00:00Z"));
  await page.goto("/?view=reference-game&control=manual");
  const upload = (text: string) => page.getByLabel("Load game", { exact: true }).setInputFiles({ name: "bad-load.json", mimeType: "application/json", buffer: Buffer.from(text) });
  await upload(pinned("pending-capture").text); await expect(page.locator("#confirm-capture-button")).toBeVisible();
  for (const invalid of ["{", pinned("legacy-progress").text]) {
    // The error shows in the settings card that holds the files; the capture waits behind the required icon.
    await openSurface(page, "settings"); await upload(invalid); const error = page.getByRole("alert"); await expect(error).toContainText("Load failed:");
    expect(await error.evaluate(node => { const r = node.getBoundingClientRect(); return r.width > 200 && r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight; })).toBe(true);
    for (const id of ["game-log-button", "game-pause-button", "game-speed", "reference-save-game"]) {
      expect(await page.locator(`#${id}`).evaluate(node => { node.scrollIntoView({ block: "nearest" }); const r = node.getBoundingClientRect(); return r.width > 0 && r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight; }), id).toBe(true);
    }
    // T97: the capture's strip waits while the menu card is open, and returns once it closes.
    await expect(page.locator("#open-required-action")).toBeHidden(); await page.locator("#close-game-drawer").click();
    expect(await page.locator("#open-required-action").evaluate(node => { const r = node.getBoundingClientRect(); return r.width > 0 && r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight; })).toBe(true);
    await page.locator("#open-required-action").click(); await expect(page.locator("#confirm-capture-button")).toBeInViewport();
  }
  const root = process.env["PLAYBACK_EVIDENCE_DIR"] ?? "screenshots"; mkdirSync(root, { recursive: true }); await page.screenshot({ path: join(root, `production-invalid-load-${info.project.name}.png`) });
});
