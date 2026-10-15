import fs from 'node:fs';
import path from 'node:path';
import { registerHooks,stripTypeScriptTypes } from 'node:module';
import { fileURLToPath } from 'node:url';
import { boardScale } from './contract.mjs';
import { box } from './geometry.mjs';
export const root=fileURLToPath(new URL('../../../../',import.meta.url));
registerHooks({
  resolve(specifier,context,next) {
    if(specifier.startsWith('.')&&context.parentURL?.endsWith('.ts')&&!path.extname(specifier))return next(`${specifier}.ts`,context);
    return next(specifier,context);
  },
  load(url,context,next) {
    if(url.endsWith('.ts'))return {format:'module',source:stripTypeScriptTypes(fs.readFileSync(new URL(url),'utf8')),shortCircuit:true};
    return next(url,context);
  },
});
const source=relative=>new URL(relative,`file://${root}/`);
export const {generateBoardBody}=await import(source('src/core/board-gen.ts'));
export const {DeterministicRng}=await import(source('src/core/rng.ts'));
const {layoutGeneratedBoard,coastOf}=await import(source('src/ui/prototype/layout.ts'));
// No production algorithm change. Retain its rules graph and actual polygons,
// silhouettes and label positions. Curves are sampled for failure diagnostics;
// endpoints are exact. Positive clearance of a curve is NOT certified here.
export function existingScene(map) {
  const board=structuredClone(layoutGeneratedBoard(map));
  board.islands=board.islands.map(i=>({...i,polygon:coastOf(board.provinces.filter(p=>p.island===i.id))}));
  const scale=boardScale(board);
  for(const p of board.provinces) {
    const bounds=box(p.polygon);
    p.hitSizeCss=Math.min(bounds[2]-bounds[0],bounds[3]-bounds[1])*scale; // upper bound only
    p.countTextCss=18*scale; // src/styles.css, generated-map .army-count
    p.countContrast=null; // rendered colour/contrast not measured; never invent a pass
  }
  const byId=new Map(board.provinces.map(p=>[p.id,p]));board.routes=[];
  for(const p of board.provinces)for(const id of p.seaLanes)if(p.id<id) {
    const [ax,ay]=p.labelAt,[bx,by]=byId.get(id).labelAt;
    const cx=(ax+bx)/2+(by-ay)*.08,cy=(ay+by)/2-(bx-ax)*.08;
    const points=Array.from({length:17},(_,j)=>{const t=j/16;return [(1-t)**2*ax+2*(1-t)*t*cx+t*t*bx,(1-t)**2*ay+2*(1-t)*t*cy+t*t*by];});
    board.routes.push({from:p.id,to:id,points});
  }
  return board;
}
