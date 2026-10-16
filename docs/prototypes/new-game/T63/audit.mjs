import {readFileSync} from 'node:fs';
import {isDeepStrictEqual} from 'node:util';
import {inspect} from '../T62/contract.mjs';
export const selectedPath=new URL('../T60/evidence/build-LrdPTV/coast-first.json',import.meta.url);
export const selected=()=>JSON.parse(readFileSync(selectedPath));
export const pair=(a,b)=>[a,b].sort().join('|');
export const edges=(board,field)=>[...new Set(board.provinces.flatMap(p=>p[field].map(n=>pair(p.id,n))))].sort();
export function audit(board){return {constraints:inspect(board),identity:isDeepStrictEqual(board,selected())?[]:['Reference differs from selected A (identity/opening/graph/bonuses/geometry)'],landEdges:edges(board,'borders').length,seaLinks:edges(board,'seaLanes').length};}
export const failures=r=>[...Object.entries(r.constraints).flatMap(([n,errors])=>errors.map(e=>`${n}: ${e}`)),...r.identity,...(JSON.stringify(Object.keys(r.constraints).sort())===JSON.stringify(['attachment','preserved','traceability','water'])?[]:['Missing adopted constraint groups']),...(r.landEdges===61&&r.seaLinks===15?[]:['Expected 61 land edges and15 sea links'])];
