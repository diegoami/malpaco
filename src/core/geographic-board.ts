import {DeterministicRng} from './rng';
import {generateIslandGeographyWithRng} from './island-geography';
import type {GeographyResult} from './island-geography';
import type {GameMap, Province} from './types';
import {flavourNames,themeFor} from './flavour-names';
import type {NameChoice} from './flavour-names';

export type GeographicBoardResult =
  | (Extract<GeographyResult,{ok:true}> & {map:GameMap})
  | Extract<GeographyResult,{ok:false}>;

/** T35: already reserved T34 crossings become the authoritative playable edges.
 * C-BON-02 / decision 12; T24 contract.mjs bonus constraint: size/2 plus distinct
 * entrance countries, minimum 2. Positions stay Q2048.
 */
export function generateGeographicBoardWithRng(rng:DeterministicRng,options:{attempts?:number}={}):GeographicBoardResult {
  const partial=generateIslandGeographyWithRng(rng,options);
  if(!partial.ok)return partial;
  const g=partial.geography;
  const provinces:Province[]=g.provinces.map((p,i)=>({
    id:p.id,name:`Country ${i+1}`,island:p.island,
    polygon:p.polygon.map(([x,y])=>[x,y] as const),labelAt:[...p.labelAt] as const,
    borders:[...p.borders],
    seaLanes:g.entranceReservations.flatMap(r=>r.from===p.id?[r.to]:r.to===p.id?[r.from]:[]),
  }));
  const map:GameMap={id:`geographic-1-${g.seed}`,name:'Geographic islands',bounds:{...g.bounds},provinces,
    islands:g.islands.map((island,i)=>({id:island.id,name:`Island ${i+1}`,provinces:[...island.provinces],
      bonus:Math.max(2,Math.floor(island.provinces.length/2)+provinces.filter(p=>p.island===island.id&&p.seaLanes.length>0).length),
    })),
  };
  return {...partial,map};
}

export function generateGeographicBoard(seed:number,options:{attempts?:number}={}):GeographicBoardResult {
  return generateGeographicBoardWithRng(new DeterministicRng(seed),options);
}

/** T94: rename a generated map's islands and countries from a theme; numbered keeps the map as it is. */
export function nameGeographicMap(map:GameMap,choice:NameChoice,seed:number):GameMap {
  const theme=themeFor(choice,seed);
  if(!theme)return map;
  const area=(id:string)=>map.provinces.filter(p=>p.island===id).reduce((sum,p)=>sum+Math.abs(p.polygon.reduce((a,[x,y],i)=>{const [u,v]=p.polygon[(i+1)%p.polygon.length]!;return a+x*v-u*y;},0)),0);
  const names=flavourNames(theme,seed,map.islands.map(i=>({id:i.id,provinces:i.provinces,area:area(i.id)})));
  return {...map,provinces:map.provinces.map(p=>({...p,name:names.provinces[p.id]!})),islands:map.islands.map(i=>({...i,name:names.islands[i.id]!}))};
}
