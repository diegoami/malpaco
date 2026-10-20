// Render static documentation SVGs; never starts or imports the game.
// Requires the existing Playwright dependency and a Chromium executable.
// CHROMIUM_PATH=/usr/bin/chromium node <this-file> /tmp/malpaco-sketch-check
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
(async () => {
  const root = path.resolve(__dirname, '../..');
  const output = process.argv[2] || '/tmp/malpaco-sketch-check';
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true,
  });
  const page = await browser.newPage();
  const files = ['sketches', 'walkthrough', 'geography-studies'].flatMap(directory => fs.readdirSync(path.join(root, directory)).filter(n => n.endsWith('.svg')).sort().map(name => ({ directory, name })));
  const report = { screens: files.length, galleryScreens: files.filter(f => f.directory === 'sketches').length, walkthroughScreens: files.filter(f => f.directory === 'walkthrough').length, studyScreens: files.filter(f => f.directory === 'geography-studies').length, canvasOrIconOrTextOverflows: [], quietMapVisibleText: [], fullViewportMaps: 0, rotatedPortraitViews: 0, overviewCoastOverflows: [], badgeOverlaps: [] };
  for (const { directory, name } of files) {
    const svg = fs.readFileSync(path.join(root, directory, name), 'utf8');
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
      const rotated = geo?.getAttribute('data-rotation') === '90';
      const coastOverflows = geo && geo.getAttribute('data-camera') === 'overview'
        ? [...document.querySelectorAll('[data-coast]')].flatMap(el => {
          const b = el.getBoundingClientRect();
          return b.x < 0 || b.y < 0 || b.right > width || b.bottom > height
            ? [{ x: b.x, y: b.y, right: b.right, bottom: b.bottom }] : [];
        }) : [];
      const badges = [...document.querySelectorAll('[data-badge]')];
      const surfaces = [...document.querySelectorAll('[data-layer="context"], [data-icon]')];
      const overlaps = [];
      const intersects = (a,b) => a.x < b.right-2 && a.right > b.x+2 && a.y < b.bottom-2 && a.bottom > b.y+2;
      badges.forEach((el,i) => {
        const a=el.getBoundingClientRect();
        for (const other of [...badges.slice(i+1),...surfaces]) {
          const b=other.getBoundingClientRect();
          if (intersects(a,b)) overlaps.push({badge:el.getAttribute('data-badge'),other:other.getAttribute('data-badge') || other.getAttribute('data-icon') || 'context'});
        }
      });
      return { rotated, coastOverflows, bad, overlaps, text: [...document.querySelectorAll('text')].map(t => t.textContent),
        full: +map.getAttribute('x') === 0 && +map.getAttribute('y') === 0 &&
          +map.getAttribute('width') === width && +map.getAttribute('height') === height };
    });
    if (checks.overlaps.length) report.badgeOverlaps.push({ name, overlaps: checks.overlaps });
    if (checks.bad.length) report.canvasOrIconOrTextOverflows.push({ name, bad: checks.bad });
    if (name.startsWith('quiet-map') && checks.text.length) report.quietMapVisibleText.push({ name, text: checks.text });
    if (checks.full) report.fullViewportMaps++;
    if (checks.rotated) report.rotatedPortraitViews++;
    if (checks.coastOverflows.length) report.overviewCoastOverflows.push({ name, bounds: checks.coastOverflows });
    await page.screenshot({ path: path.join(output, name.replace('.svg', '.png')) });
  }
  await browser.close();
  fs.writeFileSync(path.join(output, 'render-report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report));
  if (report.screens !== 65 || report.fullViewportMaps !== 65 || report.galleryScreens !== 40 || report.walkthroughScreens !== 20 || report.studyScreens !== 5 ||
    report.canvasOrIconOrTextOverflows.length || report.quietMapVisibleText.length ||
    report.rotatedPortraitViews !== 40 || report.overviewCoastOverflows.length || report.badgeOverlaps.length) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
