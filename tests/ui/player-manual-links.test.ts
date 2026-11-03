import {afterEach, expect, it, vi} from 'vitest';
import {manualHtml} from '../../tools/manual/render.mjs';

const {nodes} = vi.hoisted(() => ({nodes: [] as {attrs: Record<string, unknown>}[]}));
vi.mock('../../src/ui/dom', () => ({h: (_tag: string, attrs: Record<string, unknown> = {}) => {
  const node = {attrs, append() {}, addEventListener() {}};
  nodes.push(node);
  return node;
}}));
vi.mock('../../src/ui/icons', () => ({glyph: () => ({})}));
import {GameHelp} from '../../src/ui/help';

afterEach(() => { nodes.length = 0; vi.unstubAllEnvs(); });

for (const base of ['/', '/malpaco/']) {
  it(`opens the player manual inside the hosting path ${base}`, () => {
    vi.stubEnv('BASE_URL', base);
    new GameHelp();
    const link = nodes.find(node => node.attrs['id'] === 'full-player-manual');
    expect(link).toBeDefined();
    expect(new URL(String(link!.attrs['href']), `https://pages.example${base}`).href)
      .toBe(`https://pages.example${base}manual/index.html`);
  });

  it(`returns from the manual to the same game at ${base}`, () => {
    const href = /<a href="([^"]+)">Play Malpaco<\/a>/.exec(manualHtml())?.[1];
    expect(href).toBeDefined();
    expect(new URL(href!, `https://pages.example${base}manual/index.html`).href)
      .toBe(`https://pages.example${base}`);
  });
}
