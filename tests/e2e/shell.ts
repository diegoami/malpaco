// Shared helpers for the full-viewport shell (T79): game content lives in one
// requested card over the map, so a test opens the card it needs and closes it.
import {expect} from '@playwright/test';
import type {Page} from '@playwright/test';

export type Surface = 'actions' | 'cards' | 'details' | 'settings' | 'phase';
const openers: Record<Surface, string> = {actions: '#open-game-actions', cards: '#open-game-cards', details: '#open-game-details', settings: '#open-game-settings', phase: '#phase-details-button'};

/** Opens a card unless it is already open. */
export async function openSurface(page: Page, surface: Surface): Promise<void> {
  if (!await page.locator('#battle-action-rail').count()) return; // the setup page and legacy routes have no cards
  const drawer = page.locator('#game-focus-drawer');
  if (await drawer.isVisible() && await drawer.getAttribute('data-surface') === surface) return;
  await page.locator(openers[surface]).click();
  await expect(drawer).toHaveAttribute('data-surface', surface);
  await expect(drawer).toBeVisible();
}

export async function closeSurface(page: Page): Promise<void> {
  if (await page.locator('#game-focus-drawer').isVisible()) await page.locator('#close-game-drawer').click();
  await expect(page.locator('#game-focus-drawer')).toBeHidden();
}

/** Runs `body` with a card open, then restores the previous card (or none). */
export async function withSurface<T>(page: Page, surface: Surface, body: () => Promise<T>): Promise<T> {
  const drawer = page.locator('#game-focus-drawer');
  const previous = await page.locator('#battle-action-rail').count() && await drawer.isVisible() ? await drawer.getAttribute('data-surface') as Surface : null;
  if (!await page.locator('#battle-action-rail').count()) return body();
  await openSurface(page, surface);
  try { return await body(); } finally {
    if (previous && previous !== surface) await openSurface(page, previous);
    else if (!previous) await closeSurface(page);
  }
}

/** Saves through the settings card; the page must have stubbed URL.createObjectURL into `key`. */
export async function saveVia(page: Page, key: string): Promise<string> {
  return withSurface(page, 'settings', async () => {
    await page.getByRole('button', {name: 'Save game', exact: true}).click();
    return page.evaluate(k => (Reflect.get(window, k) as Blob).text(), key);
  });
}

/** Clicks a control that lives in a card (the card opens first when the shell is mounted). */
export async function clickIn(page: Page, surface: Surface, selector: string): Promise<void> {
  await withSurface(page, surface, () => page.locator(selector).click());
}

/** Chooses Compact or Detailed in the settings card. */
export async function setDetail(page: Page, mode: string): Promise<void> {
  await withSurface(page, 'settings', () => page.getByRole('combobox', {name: 'Panel detail', exact: true}).selectOption(mode).then(() => undefined));
}

/** A card control is shown in the open card: visible, enabled, and hit at its centre once scrolled into view. */
export async function reachableInCard(locator: import('@playwright/test').Locator): Promise<void> {
  await expect(locator).toBeVisible(); await expect(locator).toBeEnabled();
  await locator.scrollIntoViewIfNeeded();
  expect(await locator.evaluate(node => {
    const r = node.getBoundingClientRect(), card = node.closest('#game-focus-drawer'), d = card?.getBoundingClientRect(), hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    return !!d && r.top >= d.top - 1 && r.bottom <= d.bottom + 1 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1 && !!hit && (hit === node || node.contains(hit));
  }), 'control is reachable inside the open card').toBe(true);
}
