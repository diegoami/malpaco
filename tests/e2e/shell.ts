// Shared helpers for the full-viewport shell (T79): game content lives in one
// requested card over the map, so a test opens the card it needs and closes it.
import {expect} from '@playwright/test';
import type {Page} from '@playwright/test';

// T97: the menu holds Help, New game, the scoreboard (T101: the history icon only with `?log`, the
// speed beside Pause), and files on test routes; a card
// choice, with your hand for assistive technology, lives only in Current choice. The Information
// card is gone (its objective is in Help).
export type Surface = 'actions' | 'cards' | 'menu' | 'details' | 'settings' | 'countries';
type Card = 'actions' | 'menu' | 'countries';
const cardOf: Record<Surface, Card> = {actions: 'actions', cards: 'actions', menu: 'menu', details: 'menu', settings: 'menu', countries: 'countries'};
const openers: Record<Card, string> = {actions: '#open-required-action', menu: '#open-game-menu', countries: '#open-countries'};

/**
 * T101: while a computer plays, the menu and Countries icons wait hidden and a pause brings them
 * back, as a player would do it. A card opened that way resumes play when it closes.
 */
const pausedForCard = new WeakSet<Page>();

/** Opens a card unless it is already open. */
export async function openSurface(page: Page, surface: Surface): Promise<void> {
  if (!await page.locator('#battle-action-rail').count()) return; // the setup page and legacy routes have no cards
  const drawer = page.locator('#game-focus-drawer');
  const card = cardOf[surface];
  if (await drawer.isVisible() && await drawer.getAttribute('data-surface') === card) return;
  if (card !== 'actions' && await page.locator('.game-overlay[data-quiet="true"]').count() && !await page.locator(openers[card]).isVisible()) {
    await page.locator('#game-pause-button').click(); pausedForCard.add(page);
    await expect(page.locator(openers[card])).toBeVisible();
  }
  // Current choice has no resting icon: it opens by itself for a choice, or from the folded choice's return icon.
  // With no pending choice there is no Current choice card: callers then act on the map or read hidden state.
  // T97: the folded strip waits while another card is open, so that card closes first.
  if (card === 'actions' && await drawer.isVisible()) await closeSurface(page);
  if (card === 'actions' && !await page.locator(openers.actions).isVisible()) return;
  await page.locator(openers[card]).click();
  await expect(drawer).toHaveAttribute('data-surface', card);
  await expect(drawer).toBeVisible();
}

export async function closeSurface(page: Page): Promise<void> {
  // Choice, result and information cards carry no close button: Escape returns to the map.
  if (await page.locator('#game-focus-drawer').isVisible()) {
    if (await page.locator('#close-game-drawer').isVisible()) await page.locator('#close-game-drawer').click();
    else if (await page.locator('#close-result-card').isVisible()) await page.locator('#close-result-card').click();
    else await page.keyboard.press('Escape');
  }
  await expect(page.locator('#game-focus-drawer')).toBeHidden();
  if (pausedForCard.delete(page) && await page.locator('#game-pause-button').getAttribute('aria-label') === 'Resume game') await page.locator('#game-pause-button').click();
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
      // T97: the folded strip waits while another card is open, so a choice returns once that card has closed.
      if (previous === 'actions' && !await drawer.isVisible() && await page.locator(openers.actions).isVisible()) await openSurface(page, 'actions');
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

/**
 * Compact or Detailed was the panel detail setting; T97 retired it with the totals it sized
 * (owner, #244), so both modes render the one minimal card and this only records the call.
 */
export async function setDetail(_page: Page, _mode: string): Promise<void> {}

/** A card control is shown in the open card: visible, enabled, and hit at its centre once scrolled into view. */
export async function reachableInCard(locator: import('@playwright/test').Locator): Promise<void> {
  await expect(locator).toBeVisible(); await expect(locator).toBeEnabled();
  await locator.scrollIntoViewIfNeeded();
  expect(await locator.evaluate(node => {
    const r = node.getBoundingClientRect(), card = node.closest('#game-focus-drawer'), d = card?.getBoundingClientRect(), hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    return !!d && r.top >= d.top - 1 && r.bottom <= d.bottom + 1 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1 && !!hit && (hit === node || node.contains(hit));
  }), 'control is reachable inside the open card').toBe(true);
}

/**
 * T97: cards and notices float over the map (owner, #240), so a country may lie under one. A
 * driver taps a country with the mouse where nothing covers it, and otherwise with the keyboard,
 * which acts the same (Enter on a focused country).
 */
export async function activate(locator: import('@playwright/test').Locator): Promise<void> {
  const clear = await locator.evaluate(n => { const r = (n.querySelector('.cell') ?? n).getBoundingClientRect(), hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return !!hit && n.contains(hit); });
  if (clear) await locator.click(); else { await locator.focus(); await locator.press('Enter'); }
}

/** Drive the real entry controls for gameplay tests; launcher tests inspect them directly. */
export async function startGameIfNeeded(page: Page): Promise<void> {
 const launcher=page.locator('#game-launcher');
 if(!await launcher.count())return;
 if(await launcher.getAttribute('data-mode')==='saved')await launcher.locator('#resume-game').click();
 else await launcher.locator('#start-game').click();
 // Move off the disappearing launcher so its click position does not hover a map country.
 await page.mouse.move(0,0);
 await expect(page.locator('#geographic-map [data-country]').first()).toBeVisible({timeout:60000});
}
export async function visitGame(page: Page, url: string): Promise<void> {
 await page.goto(url);await startGameIfNeeded(page);
}
export async function reloadGame(page: Page): Promise<void> {
 await page.reload();await startGameIfNeeded(page);
}
/** Result → Settings → Start is an explicit new-game action. */
export async function startFromResult(page: Page): Promise<void> {
 await page.locator('#give-up-new-game').click();
 await expect(page.locator('#game-launcher')).toBeVisible();await startGameIfNeeded(page);
}
