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
  const report = { screens: files.length, galleryScreens: files.filter(f => f.directory === 'sketches').length, walkthroughScreens: files.filter(f => f.directory === 'walkthrough').length, studyScreens: files.filter(f => f.directory === 'geography-studies').length, canvasOrIconOrTextOverflows: [], quietMapProse: [], fullViewportMaps: 0, rotatedPortraitViews: 0, overviewCoastOverflows: [], badgeOverlaps: [], panelLandOverlaps: [], centreOverlaps: [], countFailures: [], semanticFailures: [] };
  for (const { directory, name } of files) {
    const svg = fs.readFileSync(path.join(root, directory, name), 'utf8');
    const [, w, h] = svg.match(/width="(\d+)" height="(\d+)"/);
    await page.setViewportSize({ width: +w, height: +h });
    await page.setContent('<style>html,body{margin:0;padding:0}</style>' + svg);
    const checks = await page.evaluate(() => {
      const svg = document.querySelector('svg');
      const { width, height } = svg.viewBox.baseVal;
      const scene=svg.getAttribute('data-scene');
      const modal=['setup','result','elimination','help','reward'].includes(scene);
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
      const surfaces = modal ? [] : [...document.querySelectorAll('[data-layer="context"], [data-icon]')];
      const overlaps = [];
      const intersects = (a,b) => a.x < b.right-2 && a.right > b.x+2 && a.y < b.bottom-2 && a.bottom > b.y+2;
      badges.forEach((el,i) => {
        const a=el.getBoundingClientRect();
        for (const other of [...badges.slice(i+1),...surfaces]) {
          const b=other.getBoundingClientRect();
          if (intersects(a,b)) overlaps.push({badge:el.getAttribute('data-badge'),other:other.getAttribute('data-badge') || other.getAttribute('data-icon') || 'context'});
        }
      });
      const panels=[...document.querySelectorAll('[data-layer="context"]')];
      const coasts=[...document.querySelectorAll('[data-coast]')];
      const protectedCoasts=geo?.getAttribute('data-camera')==='focus' ? coasts.filter(el=>el.getAttribute('data-island')==='4') : coasts;
      const land=[];
      if(!modal) for(const panel of panels) {
        const a=panel.getBoundingClientRect();
        for(const coast of protectedCoasts) {
          const b=coast.getBoundingClientRect();
          const inv=coast.getScreenCTM().inverse();
          let hit=false;
          for(let x=Math.max(a.left,b.left)+2;x<Math.min(a.right,b.right)&&!hit;x+=4)
            for(let y=Math.max(a.top,b.top)+2;y<Math.min(a.bottom,b.bottom);y+=4)
              if(coast.isPointInFill(new DOMPoint(x,y).matrixTransform(inv))) {hit=true;break;}
          if(hit)land.push({island:coast.getAttribute('data-island'),panel:{x:a.x,y:a.y,width:a.width,height:a.height}});
        }
      }
      const centreBad=[...document.querySelectorAll('[data-centre]')].flatMap(el=>{
        const a=el.getBoundingClientRect();
        return badges.filter(other=>intersects(a,other.getBoundingClientRect())).map(other=>other.getAttribute('data-country-badge'));
      });
      const countBad=[];
      if(geo?.getAttribute('data-camera')==='overview' && badges.length!==46)countBad.push('Overview must contain all 46 count badges');
      if(badges.some(el=>+el.querySelector('text').getAttribute('font-size')<14))countBad.push('Count below 14px');
      const semanticBad=[];
      const blue=[...document.querySelectorAll('[data-country]')].filter(el=>el.getAttribute('data-owner')==='0').length;
      const labels=[...document.querySelectorAll('text')].map(el=>el.textContent);
      if(scene==='late-game'&&(blue!==34||!labels.includes('Domination · 34 / 35')))semanticBad.push('Wrong domination progress');
      if(scene==='result'&&(blue!==35||!labels.includes('Domination · 35 of 46')))semanticBad.push('Wrong domination result');
      if(scene==='elimination'&&blue!==0)semanticBad.push('Eliminated seat still owns countries');
      for(const text of document.querySelectorAll('text')) if(text.textContent.startsWith('Domination ·')) {
        const a=text.getBoundingClientRect();
        if(!panels.some(panel=>{const b=panel.getBoundingClientRect();return a.left>=b.left&&a.right<=b.right&&a.top>=b.top&&a.bottom<=b.bottom;}))
          semanticBad.push('Domination label outside its context');
      }
      for(const el of document.querySelectorAll('[data-icon]')) {
        const name=el.getAttribute('aria-label'),kind=el.getAttribute('data-icon');
        if(name==='Fast-forward'&&kind!=='fast')semanticBad.push('Fast-forward glyph collision');
        if(name==='Start combat'&&kind!=='combat')semanticBad.push('Start combat glyph collision');
        if(name==='New game'&&kind!=='new')semanticBad.push('New game glyph collision');
      }
      return { rotated, coastOverflows, bad, overlaps,land,centreBad,countBad,semanticBad, text: [...document.querySelectorAll('text')].map(t => t.textContent),
        full: +map.getAttribute('x') === 0 && +map.getAttribute('y') === 0 &&
          +map.getAttribute('width') === width && +map.getAttribute('height') === height };
    });
    if(checks.land.length)report.panelLandOverlaps.push({name,overlaps:checks.land});
    if(checks.centreBad.length)report.centreOverlaps.push({name,badges:checks.centreBad});
    if(checks.countBad.length)report.countFailures.push({name,failures:checks.countBad});
    if(checks.semanticBad.length)report.semanticFailures.push({name,failures:checks.semanticBad});
    if (checks.overlaps.length) report.badgeOverlaps.push({ name, overlaps: checks.overlaps });
    if (checks.bad.length) report.canvasOrIconOrTextOverflows.push({ name, bad: checks.bad });
    if (name.startsWith('quiet-map') && checks.text.some(t=>!/^[0-9]+$/.test(t))) report.quietMapProse.push({ name, text: checks.text });
    if (checks.full) report.fullViewportMaps++;
    if (checks.rotated) report.rotatedPortraitViews++;
    if (checks.coastOverflows.length) report.overviewCoastOverflows.push({ name, bounds: checks.coastOverflows });
    await page.screenshot({ path: path.join(output, name.replace('.svg', '.png')) });
  }
  await browser.close();
  fs.writeFileSync(path.join(output, 'render-report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report));
  if (report.screens !== 93 || report.fullViewportMaps !== 93 || report.galleryScreens !== 65 || report.walkthroughScreens !== 23 || report.studyScreens !== 5 ||
    report.canvasOrIconOrTextOverflows.length || report.quietMapProse.length ||
    report.rotatedPortraitViews !== 49 || report.overviewCoastOverflows.length || report.badgeOverlaps.length || report.panelLandOverlaps.length || report.centreOverlaps.length || report.countFailures.length || report.semanticFailures.length) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
