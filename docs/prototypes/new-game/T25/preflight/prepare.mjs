import { readFileSync, writeFileSync } from 'node:fs';
import { html } from '../render.mjs';
const root=new URL('../',import.meta.url);
const g=readFileSync(new URL('../../../map-1994/preview.html',import.meta.url),'utf8');
const data=JSON.parse(g.match(/window\.T22_DATA=(.*?);\nwindow\.CURRENT_GEOMETRY=/s)[1]);
const board={bounds:data.bounds,islands:data.islands,provinces:data.provinces.map(p=>({...p,labelAt:p.center,borders:p.land,seaLanes:p.sea,hitSizeCss:40,countTextCss:14,countContrast:4.5})),routes:data.proposed.routes.map(r=>({from:r.from,to:r.to,points:r.path}))};
writeFileSync(new URL('preflight/g-board.json',root),JSON.stringify(board,null,2)+'\n',{flag:'wx'});
// Display the unmodified G graph/geometry in the acceptance renderer. The 800x460
// framing makes its compact-layout violations visible instead of hiding them.
writeFileSync(new URL('preflight/g.html',root),html(board,'G baseline: noncompliant'),{flag:'wx'});
const mock=JSON.parse(readFileSync(new URL('preflight/mock-board.json',root)));
writeFileSync(new URL('preflight/mock.html',root),html(mock,'Disposable schematic acceptance mock'),{flag:'wx'});
