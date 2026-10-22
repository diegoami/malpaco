// T79 acceptance: the full-viewport map shell on both supported hosts, across the
// 0.2.0 viewport matrix and its seams (docs/plans/release-0.2.0-acceptance.md).
import {expect, test} from '@playwright/test';
import type {Page, TestInfo} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {apply, attackTargets, deserializeVersionedMatch} from '../../src/core';
import type {GameState} from '../../src/core';
import {closeSurface, openSurface, saveVia} from './shell';
import type {Surface} from './shell';

const MATRIX = ['320x568', '390x844', '568x320', '667x375', '844x390', '768x1024', '1024x768', '1280x800', '1920x1080'];
// Width seams 680/1100 ±1 and height seams 320/500/600 ±1, plus the 240 px reduced-height fallback.
const SEAMS = ['679x800', '680x800', '681x800', '1099x800', '1100x800', '1101x800', '1024x319', '1024x320', '1024x321', '1024x499', '1024x500', '1024x501', '1024x599', '1024x600', '1024x601', '640x240', '844x240'];
const SURFACES: Surface[] = ['menu', 'info'];
type Box = {x: number; y: number; width: number; height: number};
const size = (s: string) => { const [width, height] = s.split('x').map(Number); return {width: width!, height: height!}; };

/** A legal human placement: the T71 reinforcement fixture with every seat human. */
function placement(host: string): {text: string; state: GameState} {
  const envelope = JSON.parse(readFileSync(`fixtures/new-game/T71/fixtures/${host}-reinforcement.json`, 'utf8'));
  envelope.options.seats = envelope.options.seats.map(() => ({kind: 'human'})); envelope.options.computerStrengths = [];
  const text = JSON.stringify(envelope), state = deserializeVersionedMatch(text).state;
  expect(state.phase).toBe('reinforce'); expect(state.reinforcementPool).toBeGreaterThan(1);
  return {text, state};
}

async function begin(page: Page, host: string, text: string): Promise<string[]> {
  const errors: string[] = []; page.on('pageerror', e => errors.push(String(e)));
  await page.clock.install({time: new Date('2026-10-21T12:00:00Z')}); await page.clock.pauseAt(new Date('2026-10-21T12:00:01Z'));
  await page.goto(host === 'reference' ? '/?view=reference-game' : '/?setup');
  await page.evaluate(() => { const create = URL.createObjectURL.bind(URL); URL.createObjectURL = blob => { Reflect.set(window, 'shellSave', blob); return create(blob); }; });
  const old = await page.getByLabel('Load game', {exact: true}).elementHandle();
  await page.getByLabel('Load game', {exact: true}).setInputFiles({name: 'shell.json', mimeType: 'application/json', buffer: Buffer.from(text)});
  await expect.poll(() => old!.evaluate(e => e.isConnected)).toBe(false);
  await expect(page.locator('[data-country]')).toHaveCount(46);
  return errors;
}

/** Waits for the camera to settle after a layout change (ResizeObserver runs a frame later). */
async function settle(page: Page): Promise<void> {
  let last = '';
  await expect.poll(async () => { const now = await page.locator('[data-camera-zoom]').getAttribute('viewBox') ?? ''; const same = now === last; last = now; return same; }, {intervals: [50, 50, 100, 100]}).toBe(true);
}

/** Every overlay requirement at the current viewport; returns the measured rectangles. */
async function audit(page: Page, label: string, insets = {top: 0, right: 0, bottom: 0, left: 0}) {
  const data = await page.evaluate(insets => {
    const rect = (e: Element) => { const r = e.getBoundingClientRect(); return {x: r.x, y: r.y, width: r.width, height: r.height}; };
    const shown = (e: Element) => e.getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden';
    const groups: Record<string, Element[]> = {
      menu: [...document.querySelectorAll('#game-status button')].filter(shown),
      pause: [...document.querySelectorAll('.game-corner-end button')].filter(shown),
      pool: [...document.querySelectorAll('#placement-pool')].filter(shown),
      notice: [...document.querySelectorAll('#active-seat-notice, #game-folded-choice')].filter(shown),
      rail: [...document.querySelectorAll('#battle-action-rail button')].filter(shown),
      camera: [...document.querySelectorAll('.map-camera-controls button')].filter(shown),
      card: [...document.querySelectorAll('#game-focus-drawer')].filter(shown),
    };
    const controls = Object.entries(groups).flatMap(([group, list]) => list.map(e => ({group, id: e.id || e.className, rect: rect(e),
      hit: (() => { const r = e.getBoundingClientRect(), h = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return !!h && (h === e || e.contains(h)); })()})));
    // A coarse grid of probes: a probe that lands on an overlay must land inside one of its controls.
    const strays: string[] = [];
    for (let y = insets.top + 2; y < innerHeight - insets.bottom; y += 12) for (let x = insets.left + 2; x < innerWidth - insets.right; x += 12) {
      const h = document.elementFromPoint(x, y); if (!h) { strays.push(`${x},${y}:none`); continue; }
      if (h.closest('.board')) continue;
      const leaf = h.closest('#game-focus-drawer, #game-folded-choice, #active-seat-notice, #placement-pool, #game-status button, .game-corner-end button, #battle-action-rail button, .map-camera-controls button');
      const inside = leaf && (() => { const r = leaf.getBoundingClientRect(); return x >= r.left - 1 && x <= r.right + 1 && y >= r.top - 1 && y <= r.bottom + 1; })();
      if (!inside) strays.push(`${x},${y}:${h.id || h.className || h.tagName}`);
    }
    const ids = [...document.querySelectorAll('[id]')].map(e => e.id), duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
    const svg = document.querySelector('[data-camera-zoom]')!;
    return {map: rect(svg), controls, strays: strays.slice(0, 5), strayCount: strays.length, duplicates,
      overflow: {width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight, innerWidth, innerHeight}};
  }, insets);
  const {width, height} = page.viewportSize()!;
  // The map rectangle is the viewport minus the safe insets.
  expect.soft(data.map, `${label}: map rect`).toEqual({x: insets.left, y: insets.top, width: width - insets.left - insets.right, height: height - insets.top - insets.bottom});
  expect.soft(data.overflow.width, `${label}: no horizontal page overflow`).toBeLessThanOrEqual(data.overflow.innerWidth);
  expect.soft(data.overflow.height, `${label}: no vertical page overflow`).toBeLessThanOrEqual(data.overflow.innerHeight);
  expect.soft(data.duplicates, `${label}: unique ids`).toEqual([]);
  expect.soft(data.strays, `${label}: overlays intercept no hits outside their own controls (${data.strayCount})`).toEqual([]);
  const within = (r: Box) => r.x >= insets.left - 0.5 && r.y >= insets.top - 0.5 && r.x + r.width <= width - insets.right + 0.5 && r.y + r.height <= height - insets.bottom + 0.5;
  for (const c of data.controls) {
    expect.soft(c.hit, `${label}: ${c.id} is uncovered`).toBe(true);
    expect.soft(within(c.rect), `${label}: ${c.id} lies inside the safe viewport`).toBe(true);
    if (!['card', 'notice'].includes(c.group)) { expect.soft(c.rect.width, `${label}: ${c.id} target width`).toBeGreaterThanOrEqual(44); expect.soft(c.rect.height, `${label}: ${c.id} target height`).toBeGreaterThanOrEqual(44); }
  }
  // Overlays never cover each other: controls of different groups are disjoint.
  const overlap = (a: Box, b: Box) => a.x < b.x + b.width - 0.5 && b.x < a.x + a.width - 0.5 && a.y < b.y + b.height - 0.5 && b.y < a.y + a.height - 0.5;
  for (const a of data.controls) for (const b of data.controls)
    if (a.group < b.group) expect.soft(overlap(a.rect, b.rect), `${label}: ${a.id} and ${b.id} do not overlap`).toBe(false);
  return data;
}

/** Every focusable control inside the open card can be scrolled into view and hit. */
async function cardReachable(page: Page, label: string) {
  const misses = await page.locator('#game-focus-drawer').evaluate(drawer => {
    const out: string[] = [];
    for (const e of drawer.querySelectorAll<HTMLElement>('button, input, select')) {
      if (!e.getClientRects().length || (e as HTMLInputElement).type === 'file') continue;
      e.scrollIntoView({block: 'nearest'});
      const r = e.getBoundingClientRect(), d = drawer.getBoundingClientRect(), h = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      if (!h || !(h === e || e.contains(h) || h.closest('label')?.contains(e)) || r.bottom > d.bottom + 1 || r.top < d.top - 1) out.push(e.id || e.textContent || e.tagName);
    }
    return out;
  });
  expect.soft(misses, `${label}: every card control is reachable`).toEqual([]);
}

/** T92: once the player has acted, the resting map carries corner icons and the pool number only. */
async function quiet(page: Page, label: string, pool: number) {
  const rest = await page.evaluate(() => {
    const shown = (e: Element) => e.getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden';
    const overlay = document.querySelector('.game-overlay')!;
    // Only text a player can see: icon labels at zero size and assistive-only text do not count.
    const walker = document.createTreeWalker(overlay, NodeFilter.SHOW_TEXT), seen: string[] = [];
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const parent = node.parentElement!;
      if (!node.textContent!.trim() || !shown(parent) || parseFloat(getComputedStyle(parent).fontSize) === 0 || parent.closest('.visually-hidden')) continue;
      seen.push(node.textContent!.trim());
    }
    return {text: seen.join(' '), controls: [...overlay.querySelectorAll('button')].filter(shown).length};
  });
  expect.soft(rest.text, `${label}: no prose on the resting map`).toBe(String(pool));
  expect.soft(rest.controls, `${label}: only corner controls rest on the map`).toBeLessThanOrEqual(6);
}

async function pool(page: Page, label: string, expected: number) {
  const chip = page.locator('#placement-pool');
  await expect.soft(chip, `${label}: pool visible`).toBeVisible();
  await expect.soft(page.locator('#placement-pool-count'), `${label}: pool number`).toHaveText(String(expected));
  await expect.soft(chip, `${label}: pool named`).toHaveAccessibleName(`${expected} ${expected === 1 ? 'army' : 'armies'} to place`);
}

async function evidence(page: Page, info: TestInfo, name: string, data: unknown) {
  await page.screenshot({path: info.outputPath(`${name}.png`)});
  await info.attach(name, {body: JSON.stringify(data), contentType: 'application/json'});
}

for (const host of ['reference', 'geographic']) {
  test(`${host}: full-viewport map and overlays across the viewport matrix and seams; core unchanged`, async ({page}, info) => {
    test.setTimeout(240_000);
    const {text, state} = placement(host);
    const errors = await begin(page, host, text);
    const before = await saveVia(page, 'shellSave');
    expect(deserializeVersionedMatch(before).state).toEqual(state);
    for (const viewport of [...MATRIX, ...SEAMS]) {
      await page.setViewportSize(size(viewport)); await settle(page);
      const rest = await audit(page, `${viewport} rest`);
      await pool(page, `${viewport} rest`, state.reinforcementPool);
      if (MATRIX.includes(viewport)) await evidence(page, info, `${host}-${viewport}-rest`, rest);
      for (const surface of SURFACES) {
        await openSurface(page, surface); await settle(page);
        const open = await audit(page, `${viewport} ${surface}`);
        await pool(page, `${viewport} ${surface}`, state.reinforcementPool);
        await cardReachable(page, `${viewport} ${surface}`);
        if (MATRIX.includes(viewport) && surface === 'actions') await evidence(page, info, `${host}-${viewport}-current-choice`, open);
      }
      await closeSurface(page);
    }
    // Layout changes and requested cards never change the match.
    expect(await saveVia(page, 'shellSave')).toBe(before);
    expect(errors).toEqual([]);
  });

  test(`${host}: the pool stays visible throughout placement, and Start combat appears at zero`, async ({page}, info) => {
    const {text, state: initial} = placement(host);
    const errors = await begin(page, host, text);
    let state = initial;
    const owned = state.map.provinces.filter(p => state.ownerOf[p.id] === state.players[state.currentPlayer]!.id).map(p => p.id);
    for (const [n, viewport] of ['390x844', '667x375', '1280x800'].entries()) {
      await page.setViewportSize(size(viewport)); await settle(page);
      await pool(page, viewport, state.reinforcementPool);
      await expect(page.locator('#start-combat-button')).toBeHidden();
      if (n === 1) await openSurface(page, 'menu');
      if (n === 2) await closeSurface(page);
      const id = owned[n % owned.length]!;
      await page.locator(`[data-country="${id}"]`).click();
      const next = apply(state, {kind: 'reinforce', province: id, amount: 1}); if (!next.ok) throw Error(next.error); state = next.state;
      await pool(page, `${viewport} after one placement`, state.reinforcementPool);
      await audit(page, `${viewport} placing`);
      if (n !== 1) await quiet(page, `${viewport} placing`, state.reinforcementPool);
    }
    await closeSurface(page);
    while (state.reinforcementPool > 0) {
      await page.locator(`[data-country="${owned[0]}"]`).click();
      const next = apply(state, {kind: 'reinforce', province: owned[0]!, amount: 1}); if (!next.ok) throw Error(next.error); state = next.state;
      if (state.reinforcementPool) await pool(page, 'placing', state.reinforcementPool);
    }
    await expect(page.locator('#start-combat-button')).toBeVisible();
    await expect(page.locator('#start-combat-button')).toHaveAccessibleName('Start combat');
    await evidence(page, info, `${host}-pool-zero`, await audit(page, 'pool zero'));
    expect(deserializeVersionedMatch(await saveVia(page, 'shellSave')).state).toEqual(state);
    await page.locator('#start-combat-button').click();
    const combat = apply(state, {kind: 'endReinforcement'}); if (!combat.ok) throw Error(combat.error);
    await expect(page.locator('#placement-pool')).toBeHidden();
    await expect(page.locator('#active-seat-notice')).toContainText('attack');
    expect(deserializeVersionedMatch(await saveVia(page, 'shellSave')).state).toEqual(combat.state);
    expect(errors).toEqual([]);
  });

  test(`${host}: safe-area insets and the 240 px fallback keep the map and the card's Map return reachable`, async ({page}, info) => {
    const {text} = placement(host);
    const errors = await begin(page, host, text);
    const before = await saveVia(page, 'shellSave');
    const insets = {top: 24, right: 44, bottom: 34, left: 44};
    await page.evaluate(i => { for (const [k, v] of Object.entries(i)) document.documentElement.style.setProperty(`--safe-${k}`, `${v}px`); }, insets);
    for (const viewport of ['390x844', '844x390', '667x375']) {
      await page.setViewportSize(size(viewport)); await settle(page);
      await audit(page, `${viewport} safe`, insets);
      await openSurface(page, 'menu'); await settle(page);
      await evidence(page, info, `${host}-${viewport}-safe-insets`, await audit(page, `${viewport} safe card`, insets));
      await closeSurface(page);
    }
    await page.evaluate(() => { for (const k of ['top', 'right', 'bottom', 'left']) document.documentElement.style.removeProperty(`--safe-${k}`); });
    for (const viewport of ['640x240', '844x240']) {
      await page.setViewportSize(size(viewport)); await settle(page);
      await openSurface(page, 'settings'); await settle(page);
      const data = await audit(page, `${viewport} reduced height`);
      await cardReachable(page, `${viewport} reduced height`);
      // One vertical scroll owner holds the card's content; Map return and Pause stay in reach.
      expect(await page.locator('.game-drawer-content').evaluate(e => getComputedStyle(e).overflowY)).toBe('auto');
      await expect(page.locator('#close-game-drawer')).toHaveAccessibleName('Return to map');
      await expect(page.locator('#close-game-drawer')).toBeInViewport({ratio: 1});
      await expect(page.locator('#game-pause-button')).toBeInViewport({ratio: 1});
      await evidence(page, info, `${host}-${viewport}-reduced-height`, data);
      await page.locator('#close-game-drawer').click();
      await expect(page.locator('#open-game-menu')).toBeFocused();
    }
    expect(await saveVia(page, 'shellSave')).toBe(before);
    expect(errors).toEqual([]);
  });

  test(`${host}: the notice is a slim pill: tap for the hint, × or swipe dismisses, ordinary ones fade, refusals persist`, async ({page}) => {
    const {text, state: initial} = placement(host);
    const errors = await begin(page, host, text);
    await page.setViewportSize(size('390x844')); await settle(page);
    const notice = page.locator('#active-seat-notice'), hint = notice.locator('.game-notice-detail');
    await expect(notice).toBeVisible(); await expect(notice).toContainText('place armies');
    // One line at rest: the hint is for assistive technology until a tap opens it, which also stops the fade.
    expect((await notice.boundingBox())!.height).toBeLessThanOrEqual(46);
    await expect(hint).toHaveCount(0);
    await notice.locator('.game-notice-title').click(); await expect(hint).toBeVisible(); await expect(notice).toHaveAttribute('data-fading', 'false');
    await page.clock.runFor(5000); await expect(notice).toBeVisible();
    // × dismisses it, and it stays dismissed while the same notice stands.
    await page.locator('#dismiss-notice').click(); await expect(notice).toBeHidden();
    let state = initial;
    const owned = state.map.provinces.filter(p => state.ownerOf[p.id] === state.players[state.currentPlayer]!.id).map(p => p.id);
    while (state.reinforcementPool) { await page.locator(`[data-country="${owned[0]}"]`).click(); const r = apply(state, {kind: 'reinforce', province: owned[0]!, amount: 1}); if (!r.ok) throw Error(r.error); state = r.state; }
    await page.locator('#start-combat-button').click();
    const combat = apply(state, {kind: 'endReinforcement'}); if (!combat.ok) throw Error(combat.error); state = combat.state;
    // A new notice shows again, and an ordinary one fades after 4 s.
    await expect(notice).toBeVisible(); await expect(notice).toContainText('attack');
    await page.clock.runFor(3900); await expect(notice).toBeVisible();
    await page.clock.runFor(200); await expect(notice).toBeHidden();
    // A refusal persists until dismissed: here by a swipe.
    const source = owned.find(id => state.armies[id]! > 1)!;
    const distant = state.map.provinces.find(p => state.ownerOf[p.id] !== state.ownerOf[source] && !attackTargets(state, source).includes(p.id))!.id;
    await page.locator(`[data-country="${source}"]`).click(); await page.locator(`[data-country="${distant}"]`).click();
    await expect(notice).toBeVisible(); await page.clock.runFor(6000); await expect(notice).toBeVisible();
    const box = (await notice.boundingBox())!;
    await page.mouse.move(box.x + 20, box.y + box.height / 2); await page.mouse.down(); await page.mouse.move(box.x + 120, box.y + box.height / 2, {steps: 6}); await page.mouse.up();
    await expect(notice).toBeHidden();
    expect(deserializeVersionedMatch(await saveVia(page, 'shellSave')).state).toEqual(state);
    expect(errors).toEqual([]);
  });
}
