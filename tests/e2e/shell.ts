// Shared helpers for the full-viewport shell (T79): game content lives in one
// requested card over the map, so a test opens the card it needs and closes it.
import {expect} from '@playwright/test';
import type {Page} from '@playwright/test';

export type Surface = 'actions' | 'cards' | 'details' | 'settings' | 'phase';
const openers: Record<Surface, string> = {actions: '#open-game-actions', cards: '#open-game-cards', details: '#open-game-details', settings: '#open-game-settings', phase: '#phase-details-button'};

/** Opens a card unless it is already open. */
export async function openSurface(page: Page, surface: Surface): Promise<void> {
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
