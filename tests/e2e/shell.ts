// Shared helpers for the full-viewport shell (T79): game content lives in one
// requested card over the map, so a test opens the card it needs and closes it.
import {expect} from '@playwright/test';
import type {Page} from '@playwright/test';

// T92: totals, history and settings share the menu card; phase details are the information card.
export type Surface = 'actions' | 'cards' | 'menu' | 'info' | 'details' | 'settings' | 'phase' | 'countries';
type Card = 'actions' | 'cards' | 'menu' | 'info' | 'countries';
// The hand rests in the menu card too, so Cards opens the menu.
const cardOf: Record<Surface, Card> = {actions: 'actions', cards: 'menu', menu: 'menu', info: 'info', details: 'menu', settings: 'menu', phase: 'info', countries: 'countries'};
const openers: Record<Card, string> = {actions: '#open-required-action', cards: '#open-game-cards', menu: '#open-game-menu', info: '#game-info-button', countries: '#open-countries'};

/** Opens a card unless it is already open. */
export async function openSurface(page: Page, surface: Surface): Promise<void> {
  if (!await page.locator('#battle-action-rail').count()) return; // the setup page and legacy routes have no cards
  const drawer = page.locator('#game-focus-drawer');
  const card = cardOf[surface];
  if (await drawer.isVisible() && await drawer.getAttribute('data-surface') === card) return card === 'actions' ? expandBattleSettings(page) : undefined;
  // Current choice has no resting icon: it opens by itself for a choice, or from the folded choice's return icon.
  // With no pending choice there is no Current choice card: callers then act on the map or read hidden state.
  if (card === 'actions' && !await page.locator(openers.actions).isVisible()) return expandBattleSettings(page);
  await page.locator(openers[card]).click();
  await expect(drawer).toHaveAttribute('data-surface', card);
  await expect(drawer).toBeVisible();
  if (card === 'actions') await expandBattleSettings(page);
}

/** The attack card keeps Stop at and Speed behind its settings icon; tests that set them open it. */
async function expandBattleSettings(page: Page): Promise<void> {
  const button = page.locator('#game-focus-drawer #battle-settings-button');
  if (await button.isVisible() && await button.getAttribute('aria-expanded') === 'false') await button.click();
}

export async function closeSurface(page: Page): Promise<void> {
  // Choice, result and information cards carry no close button: Escape returns to the map.
  if (await page.locator('#game-focus-drawer').isVisible()) {
    if (await page.locator('#close-game-drawer').isVisible()) await page.locator('#close-game-drawer').click();
    else if (await page.locator('#close-result-card').isVisible()) await page.locator('#close-result-card').click();
    else await page.keyboard.press('Escape');
  }
  await expect(page.locator('#game-focus-drawer')).toBeHidden();
}

/** Runs `body` with a card open, then restores the previous card (or none). */
export async function withSurface<T>(page: Page, surface: Surface, body: () => Promise<T>): Promise<T> {
  const drawer = page.locator('#game-focus-drawer');
  const previous = await page.locator('#battle-action-rail').count() && await drawer.isVisible() ? await drawer.getAttribute('data-surface') as Card : null;
  if (!await page.locator('#battle-action-rail').count()) return body();
  await openSurface(page, surface);
  try { return await body(); } finally {
    // Skipped when the body replaced the match or returned to setup.
    if (await drawer.count()) {
      if (previous && previous !== cardOf[surface]) await openSurface(page, previous);
      // A finished choice cannot be reopened: then the borrowed card simply closes.
      if (!previous || (previous !== cardOf[surface] && await drawer.getAttribute('data-surface') === cardOf[surface])) await closeSurface(page);
    }
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
