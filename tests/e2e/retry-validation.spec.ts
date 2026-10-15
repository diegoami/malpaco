import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createGame, defaultOptions, deserializeMatch } from "../../src/core";

async function save(page: Page) {
  const event = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save game", exact: true }).click();
  const path = await (await event).path();
  return deserializeMatch(readFileSync(path!, "utf8"));
}

function expectedOpening(seats: number, computers: boolean) {
  const options = {
    ...defaultOptions(),
    seed: 1994,
    seats: Array.from({ length: seats }, (_, i) => ({ kind: computers && i > 0 ? "computer" as const : "human" as const })),
    computerStrengths: computers ? Array.from({ length: seats - 1 }, () => "Normal" as const) : [],
  };
  const result = createGame(options);
  if (!result.ok) throw new Error(result.errors.join("; "));
  return { options, state: result.state };
}

async function fitAndCapture(page: Page, name: string, project: string) {
  const controls = await page.locator(".generated-error h1,.generated-error label,.generated-error input,.generated-error button,.generated-error [role=alert],.generated-error p").evaluateAll(nodes => nodes.filter(node => !node.classList.contains("retry-validation") || !!node.textContent?.trim()).map(node => {
    const box = node.getBoundingClientRect();
    const style = getComputedStyle(node);
    return { text: node.textContent, x: box.x, y: box.y, right: box.right, bottom: box.bottom, width: box.width, height: box.height, font: parseFloat(style.fontSize), fits: (node as HTMLElement).scrollWidth <= (node as HTMLElement).clientWidth };
  }));
  const viewport = page.viewportSize()!;
  expect(controls.length).toBeGreaterThan(0);
  for (const control of controls) {
    expect(control.width, JSON.stringify(control)).toBeGreaterThan(0);
    expect(control.height, JSON.stringify(control)).toBeGreaterThan(0);
    expect(control.font, JSON.stringify(control)).toBeGreaterThanOrEqual(12);
    expect(control.x, JSON.stringify(control)).toBeGreaterThanOrEqual(0);
    expect(control.y, JSON.stringify(control)).toBeGreaterThanOrEqual(0);
    expect(control.right, JSON.stringify(control)).toBeLessThanOrEqual(viewport.width);
    expect(control.bottom, JSON.stringify(control)).toBeLessThanOrEqual(viewport.height);
    expect(control.fits, JSON.stringify(control)).toBe(true);
  }
  expect(await page.evaluate(() => ({ width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight })))
    .toEqual({ width: viewport.width, height: viewport.height });
  const directory = process.env["RETRY_VALIDATION_EVIDENCE_DIR"]
    ? join(process.env["RETRY_VALIDATION_EVIDENCE_DIR"]!, "captures")
    : "docs/prototypes/retry-validation/captures";
  mkdirSync(directory, { recursive: true });
  await page.screenshot({ path: join(directory, `${name}-${project}.png`) });
}

test("refusal retry validates edited seeds and recovers with preserved settings", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", error => { if (error.type() === "error") errors.push(error.text()); });
  await page.clock.install();
  await page.clock.pauseAt(new Date());

  for (const { seats, computers } of [{ seats: 3, computers: false }, { seats: 4, computers: true }]) {
    const opponents = computers ? "&opponents=computer" : "";
    const refusalUrl = `/?view=generated-game&seed=1506&seats=${seats}${opponents}`;
    await page.goto(refusalUrl);
    await expect(page.getByRole("heading", { name: "Malpaco" })).toBeVisible();
    const generationError = page.locator(".generated-error > div[role=alert]");
    await expect(generationError).toContainText(/generation failed/i);
    await expect(page.locator("[data-country]")).toHaveCount(0);
    await fitAndCapture(page, `refusal-${computers ? "computers" : "humans"}`, info.project.name);

    // Retrying the original refused seed must keep the genuine generator error visible.
    await page.getByRole("button", { name: "Retry", exact: true }).click();
    await expect(page).toHaveURL(refusalUrl);
    await expect(generationError).toContainText(/generation failed/i);
    await expect(page.locator("[data-country]")).toHaveCount(0);

    for (const invalid of ["", "-1", "1.5", "4294967296"]) {
      const seed = page.getByLabel("Seed", { exact: true });
      await seed.fill(invalid);
      await page.getByRole("button", { name: "Retry", exact: true }).click();
      await expect(page).toHaveURL(refusalUrl);
      await expect(page.locator(".retry-validation")).toBeVisible();
      await expect(page.locator(".retry-validation")).toContainText(/seed/i);
      await expect(page.locator("[data-country]")).toHaveCount(0);
      if (invalid === "") await expect(seed).toHaveValue("");
      else await expect(seed).toHaveValue(invalid);
      await fitAndCapture(page, `invalid-${invalid === "" ? "empty" : invalid.replaceAll(".", "-")}-${computers ? "computers" : "humans"}`, info.project.name);

      // Restore the actual refusal state before exercising the next invalid value.
      await seed.fill("1506");
      await page.getByRole("button", { name: "Retry", exact: true }).click();
      await expect(page).toHaveURL(refusalUrl);
      await expect(generationError).toContainText(/generation failed/i);
    }

    const seed = page.getByLabel("Seed", { exact: true });
    await seed.fill("1994");
    if (computers) await page.keyboard.press("Enter");
    else await page.getByRole("button", { name: "Retry", exact: true }).click();
    await expect(page).toHaveURL(`/?view=generated-game&seed=1994&seats=${seats}${opponents}`);
    await expect(page.locator("[data-country]")).toHaveCount(46);
    expect(await save(page)).toEqual(expectedOpening(seats, computers));
    expect(errors).toEqual([]);
  }
});
