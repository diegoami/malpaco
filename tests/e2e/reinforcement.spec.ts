import { expect, test as base } from "@playwright/test";
import type { Locator, Page, TestInfo } from "@playwright/test";

const test = base.extend<{ cleanConsole: void }>({
  cleanConsole: [async ({ page }, use) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    await use();
    expect(errors).toEqual([]);
  }, { auto: true }],
});

const phase = (page: Page): Locator => page.locator("#turn-phase");
const remaining = (page: Page): Locator => page.locator("#reinforcement-pool");
const startCombat = (page: Page): Locator => page.getByRole("button", { name: "Start combat", exact: true });
async function pool(page: Page): Promise<number> {
  const value = Number(await remaining(page).innerText());
  expect(Number.isSafeInteger(value)).toBe(true);
  expect(value).toBeGreaterThanOrEqual(0);
  return value;
}
async function army(province: Locator): Promise<number> {
  const shown = Number(await province.locator(".badge-count").textContent());
  expect(shown).toBe(Number(await province.getAttribute("data-armies")));
  return shown;
}
async function screenshot(page: Page, info: TestInfo, name: string): Promise<void> {
  await page.mouse.move(2, 400);
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(document.getAnimations().filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity).map((animation) => animation.finished));
  });
  await page.screenshot({ path: `screenshots/${info.project.name}/reinforcement-${name}.png` });
}
async function enterCombat(page: Page): Promise<void> {
  await expect(phase(page)).toHaveText("Reinforcement");
  const count = await pool(page);
  expect(count).toBeGreaterThan(0);
  await expect(startCombat(page)).toBeDisabled();
  await expect(page.getByRole("button", { name: "Attack", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "End turn", exact: true })).toBeDisabled();
  const province = page.locator(".province.is-mine").first();
  const before = await army(province);
  for (let i = 0; i < count; i++) {
    await province.click();
    await expect(remaining(page)).toHaveText(String(count - i - 1));
    await expect(province.locator(".badge-count")).toHaveText(String(before + i + 1));
  }
  expect(await army(province)).toBe(before + count);
  await expect(startCombat(page)).toBeEnabled();
  await startCombat(page).click();
  await expect(phase(page)).toHaveText("Attack");
  await expect(page.getByRole("button", { name: "End turn", exact: true })).toBeEnabled();
}
async function attackByClicks(page: Page): Promise<void> {
  const ids = await page.locator(".province.is-mine").evaluateAll((groups) => groups.map((g) => g.getAttribute("data-province")!));
  let selected = false;
  for (const id of ids) {
    await page.locator(`.province[data-province="${id}"]`).click();
    const targets = page.locator('.province[data-target="true"]');
    if (await targets.count()) {
      await targets.first().click();
      selected = true;
      break;
    }
  }
  expect(selected, "the player can choose a legal attack by clicks").toBe(true);
  await page.getByRole("button", { name: "Attack", exact: true }).click();
  const dialog = page.locator("#result-dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.locator(".die.attacker")).toHaveCount(1);
  await expect(dialog.locator(".die.defender")).toHaveCount(1);
  await expect(dialog.locator(".die.attacker .pip").first()).toBeVisible();
  await expect(dialog.locator(".die.defender .pip").first()).toBeVisible();
  await expect(dialog.locator(".verdict")).toHaveCount(1);
  await expect(dialog.locator(".verdict")).toBeVisible();
  await expect(dialog.locator(".detail")).not.toHaveText("");
}

test.beforeEach(async ({ page }) => {
  await page.goto("/?seed=1994");
  await expect(page.locator("body")).toHaveAttribute("data-ready", "true");
});

test("placement spends only on owned provinces, then combat hands off a fresh pool", async ({ page }, info) => {
  await expect(page.locator("#map")).toBeVisible();
  await expect(page.locator(".province .shape")).toHaveCount(14);
  await expect(phase(page)).toHaveText("Reinforcement");
  await expect(page.locator("#income-base")).toBeVisible();
  await expect(page.locator("#income-island")).toBeVisible();
  const baseIncome = Number(await page.locator("#income-base").innerText());
  const islandIncome = Number(await page.locator("#income-island").innerText());
  expect(baseIncome).toBeGreaterThan(0);
  expect(islandIncome).toBeGreaterThanOrEqual(0);
  const count = await pool(page);
  expect(count).toBe(baseIncome + islandIncome);
  await screenshot(page, info, "opening");
  const enemy = page.locator(".province:not(.is-mine)").first();
  const enemyBefore = await army(enemy);
  await enemy.click();
  expect(await army(enemy)).toBe(enemyBefore);
  expect(await pool(page)).toBe(count);
  await enterCombat(page);
  await attackByClicks(page);
  await screenshot(page, info, "combat");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "End turn", exact: true }).click();
  await expect(page.locator("#turn-title")).toHaveText("Amber's turn");
  await expect(phase(page)).toHaveText("Reinforcement");
  expect(await pool(page)).toBeGreaterThan(0);
  await expect(page.locator('.province[data-selected="true"]')).toHaveCount(0);
  await expect(page.locator('.province[data-target="true"]')).toHaveCount(0);
  await screenshot(page, info, "handoff");
});

test("both seats place armies and enter combat before returning to Blue in round two", async ({ page }) => {
  await enterCombat(page);
  await page.getByRole("button", { name: "End turn", exact: true }).click();
  await expect(page.locator("#turn-title")).toHaveText("Amber's turn");
  await enterCombat(page);
  await page.getByRole("button", { name: "End turn", exact: true }).click();
  await expect(page.locator("#turn-title")).toHaveText("Blue's turn");
  await expect(phase(page)).toHaveText("Reinforcement");
  await expect(page.locator(".turn-sub")).toContainText("Round 2");
  expect(await pool(page)).toBeGreaterThan(0);
});
