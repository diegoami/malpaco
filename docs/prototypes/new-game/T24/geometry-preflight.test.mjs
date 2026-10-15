import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkConstraint } from './contract.mjs';
import { witness } from './witness.mjs';
const cases={
  cells:[
    ['non-finite vertex',b=>b.provinces[0].polygon[0][0]=NaN],
    ['zero-area cell',b=>b.provinces[0].polygon=[[40,25],[50,25],[60,25]]],
    ['self-intersecting cell',b=>b.provinces[0].polygon=[[40,25],[90,75],[40,75],[90,25]]],
    ['disconnected multi-polygon',b=>b.provinces[0].polygon=[b.provinces[0].polygon,b.provinces[1].polygon]],
    ['overlapping countries',b=>b.provinces[1].polygon=structuredClone(b.provinces[0].polygon)],
    ['gap in subdivision',b=>{b.provinces[0].polygon[1][0]-=2;b.provinces[0].polygon[2][0]-=2;}],
    ['cell outside silhouette',b=>{b.provinces[0].polygon=b.provinces[0].polygon.map(([x,y])=>[x-2,y]);}],
    ['overlapping islands',b=>b.islands[1].polygon=structuredClone(b.islands[0].polygon)],
    ['missing silhouette',b=>delete b.islands[0].polygon],
  ],
  borders:[
    ['missing shared-boundary edge',b=>b.provinces[0].borders.pop()],
    ['spurious edge over a gap',b=>b.provinces[0].borders.push('w0p4')],
    ['point contact is not a border',b=>{b.provinces[0].borders.push('w0p6');b.provinces.find(p=>p.id==='w0p6').borders.push('w0p0');}],
    ['short T-junction boundary missing',b=>{const p=b.provinces.find(p=>p.id==='w1p6');p.borders=p.borders.filter(id=>id!=='w1p2');}],
  ],
  coasts:[
    ['endpoint missing',b=>delete b.routes[0].points],
    ['wrong country coast',b=>b.routes[0].points[0]=[40,50]],
    ['endpoint inside source',b=>b.routes[0].points[0]=structuredClone(b.provinces[4].labelAt)],
    ['off coast',b=>b.routes[0].points[0][0]+=2],
    ['coast endpoint away from midpoint',b=>b.routes[0].points[0][1]+=5],
    ['endpoint on internal boundary',b=>b.routes[0].points[0]=[240,50]],
    ['destination endpoint wrong',b=>b.routes[0].points[b.routes[0].points.length-1]=[355,75]],
  ],
  intersections:[
    ['route through unrelated island',b=>b.routes[0].points.splice(1,0,[405,230])],
    ['route re-enters source',b=>b.routes[0].points.splice(1,0,[265,50])],
    ['route touches unrelated coastline',b=>b.routes[0].points.splice(1,0,[330,180])],
    ['missing route geometry',b=>delete b.routes[0].points],
  ],
  labels:[
    ['missing label',b=>delete b.provinces[0].labelAt],
    ['non-finite label',b=>b.provinces[0].labelAt=[NaN,20]],
    ['overlapping hit squares',b=>b.provinces[1].labelAt=[b.provinces[0].labelAt[0]+39,b.provinces[0].labelAt[1]]],
    ['insufficient 44px gap',b=>b.provinces[1].labelAt=[b.provinces[0].labelAt[0]+43,b.provinces[0].labelAt[1]]],
    ['undersized hit box',b=>b.provinces[0].hitSizeCss=39],
    ['undersized count text',b=>b.provinces[0].countTextCss=13],
    ['insufficient contrast',b=>b.provinces[0].countContrast=4.4],
    ['label outside country',b=>b.provinces[0].labelAt=[10,10]],
    ['hit area clipped by coast',b=>b.provinces[0].labelAt=[41,50]],
    ['unscaled positions cannot prove minimum-window fit',b=>{b.bounds.width*=2;b.bounds.height*=2;}],
    ['invalid frame',b=>b.bounds.width=0],
  ],
};
for(const [constraint,mutations] of Object.entries(cases)) {
  test(`${constraint}: positive geometric control`,()=>assert.deepEqual(checkConstraint(constraint,witness()),[]));
  for(const [name,mutate] of mutations)test(`${constraint}: rejects ${name}`,()=>{
    const board=witness();mutate(board);
    assert.ok(checkConstraint(constraint,board).length>0,`${constraint} bypass: ${name}`);
  });
}
