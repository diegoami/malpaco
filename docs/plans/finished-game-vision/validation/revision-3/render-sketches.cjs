// Render static documentation SVGs; never starts or imports the game.
// Requires the existing Playwright dependency and a Chromium executable.
// CHROMIUM_PATH=/usr/bin/chromium node <this-file> /tmp/malpaco-sketch-check
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
(async () => {
  const root = path.resolve(__dirname, '../../sketches');
  const output = process.argv[2] || '/tmp/malpaco-sketch-check';
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true,
  });
  const page = await browser.newPage();
  const files = fs.readdirSync(root).filter(n => n.endsWith('.svg')).sort();
  const report = { screens: files.length, canvasOrIconOrTextOverflows: [], quietMapVisibleText: [], fullViewportMaps: 0, rotatedPortraitViews: 0, portraitOverviewCoastOverflows: [] };
  for (const name of files) {
    const svg = fs.readFileSync(path.join(root, name), 'utf8');
    const [, w, h] = svg.match(/width="(\d+)" height="(\d+)"/);
    await page.setViewportSize({ width: +w, height: +h });
    await page.setContent('<style>html,body{margin:0;padding:0}</style>' + svg);
    const checks = await page.evaluate(() => {
      const svg = document.querySelector('svg');
      const { width, height } = svg.viewBox.baseVal;
      const map = document.querySelector('[data-layer="full-viewport-map"]');
      const bad = [...document.querySelectorAll('text, [data-icon]')].flatMap(el => {
        const b = el.getBoundingClientRect();
        return b.x < -1 || b.y < -1 || b.right > width + 1 || b.bottom > height + 1
          ? [{ element: el.tagName, value: el.textContent, x: b.x, y: b.y, right: b.right, bottom: b.bottom }] : [];
      });
      const geo = document.querySelector('[data-layer="geography"]');
      const rotated = geo.getAttribute('data-rotation') === '90';
      const coastOverflows = rotated && geo.getAttribute('data-camera') === 'overview'
        ? [...document.querySelectorAll('[data-coast]')].flatMap(el => {
          const b = el.getBoundingClientRect();
          return b.x < 0 || b.y < 0 || b.right > width || b.bottom > height
            ? [{ x: b.x, y: b.y, right: b.right, bottom: b.bottom }] : [];
        }) : [];
      return { rotated, coastOverflows, bad, text: [...document.querySelectorAll('text')].map(t => t.textContent),
        full: +map.getAttribute('x') === 0 && +map.getAttribute('y') === 0 &&
          +map.getAttribute('width') === width && +map.getAttribute('height') === height };
    });
    if (checks.bad.length) report.canvasOrIconOrTextOverflows.push({ name, bad: checks.bad });
    if (name.startsWith('quiet-map') && checks.text.length) report.quietMapVisibleText.push({ name, text: checks.text });
    if (checks.full) report.fullViewportMaps++;
    if (checks.rotated) report.rotatedPortraitViews++;
    if (checks.coastOverflows.length) report.portraitOverviewCoastOverflows.push({ name, bounds: checks.coastOverflows });
    await page.screenshot({ path: path.join(output, name.replace('.svg', '.png')) });
  }
  await browser.close();
  fs.writeFileSync(path.join(output, 'render-report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report));
  if (report.screens !== 24 || report.fullViewportMaps !== 24 ||
    report.canvasOrIconOrTextOverflows.length || report.quietMapVisibleText.length ||
    report.rotatedPortraitViews !== 12 || report.portraitOverviewCoastOverflows.length) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
