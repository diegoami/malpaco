import { expect, test } from "@playwright/test";

const errors = (page: import("@playwright/test").Page) => {
  const seen: string[] = [];
  page.on("pageerror", error => seen.push(error.message));
  page.on("console", message => { if (message.type() === "error") seen.push(message.text()); });
  return seen;
};

async function expectFits(page: import("@playwright/test").Page) {
  const viewport = page.viewportSize()!;
  await expect.poll(() => page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    height: document.documentElement.scrollHeight,
  }))).toEqual({ width: viewport.width, height: viewport.height });
  for (const locator of [page.locator("#game-setup"), page.locator("#generated-game"), page.locator("#generated-prototype"), page.locator("#map")]) {
    if (await locator.count()) {
      const box = await locator.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.y).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 1);
      expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height + 1);
    }
  }
}

test("root and unrecognized views open usable setup and start a mixed match", async ({ page }, info) => {
  const seen = errors(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "New generated game" })).toBeVisible();
  await expect(page.getByLabel("Seed", { exact: true })).toHaveValue("1994");
  await expect(page.getByLabel("Human seats")).toHaveValue("2");
  await expectFits(page);

  const evidence = process.env["DEFAULT_ENTRY_EVIDENCE_DIR"];
  if (evidence) await page.screenshot({ path: `${evidence}/default-${info.project.name}.png`, fullPage: true });

  await page.goto("/?seed=42&seats=2&opponents=computer");
  await expect(page.getByRole("heading", { name: "New generated game" })).toBeVisible();
  await expect(page.getByLabel("Seed", { exact: true })).toHaveValue("42");
  await expect(page.getByLabel("Total seats")).toHaveValue("2");
  await expect(page.getByLabel("Players", { exact: true })).toHaveValue("computer");

  await page.goto("/?view=unknown&seed=42&seats=2&opponents=computer");
  await expect(page.getByRole("heading", { name: "New generated game" })).toBeVisible();
  await expect(page.getByLabel("Seed", { exact: true })).toHaveValue("42");
  await expect(page.getByLabel("Total seats")).toHaveValue("2");
  await expect(page.getByLabel("Players", { exact: true })).toHaveValue("computer");
  await expectFits(page);

  await page.getByRole("button", { name: "Start game", exact: true }).click();
  await expect(page).toHaveURL(/view=generated-game&seed=42&seats=2&opponents=computer/);
  await expect(page.locator("#generated-game")).toBeVisible();
  await expect(page.locator("#generated-game .score-row")).toHaveCount(2);
  await expectFits(page);
  await page.getByRole("button", { name: "New game", exact: true }).click();
  await expect(page).toHaveURL(/view=game-setup&seed=42&seats=2&opponents=computer/);
  await expect(page.getByRole("heading", { name: "New generated game" })).toBeVisible();
  await expect(page.getByLabel("Seed", { exact: true })).toHaveValue("42");
  await expect(page.getByLabel("Total seats")).toHaveValue("2");
  await expect(page.getByLabel("Players", { exact: true })).toHaveValue("computer");
  await expectFits(page);
  expect(seen).toEqual([]);
});

test("recognized entry routes remain explicit and authored data is available only by route", async ({ page }) => {
  const seen = errors(page);

  await page.goto("/?view=game-setup&seed=1994&seats=3");
  await expect(page.locator("#game-setup")).toBeVisible();
  await expect(page.getByLabel("Seed", { exact: true })).toHaveValue("1994");
  await expect(page.getByLabel("Human seats")).toHaveValue("3");
  await expectFits(page);

  await page.goto("/?view=generated-game&seed=1994&seats=3");
  await expect(page.locator("#generated-game")).toBeVisible();
  await expect(page.locator("#generated-game .score-row")).toHaveCount(3);
  await expectFits(page);

  await page.goto("/?view=generated-prototype&seed=1994");
  await expect(page.locator("#generated-prototype")).toBeVisible();
  await expectFits(page);

  await page.goto("/?view=authored-game&seed=1994");
  await expect(page.locator("#map")).toBeVisible();
  await expect(page.locator(".province")).toHaveCount(14);
  await expectFits(page);
  await page.getByRole("button", { name: "New game", exact: true }).click();
  await expect(page).toHaveURL(/view=authored-game/);
  expect(seen).toEqual([]);
});
