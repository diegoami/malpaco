import {readFileSync} from 'node:fs';
import {deserializeVersionedMatch} from '../../src/core/match-save';

export const RESERVE_CASES=[
 {size:46,from:'province_26',to:'province_28',armies:5,distance:2},
 {size:72,from:'province_26',to:'province_29',armies:7,distance:3},
 {size:96,from:'province_32',to:'province_26',armies:6,distance:5},
] as const;
export function reserveFixture(size:number){
 const text=readFileSync(new URL(`../../fixtures/new-game/T128/stranded-${size}.json`,import.meta.url),'utf8').trim();
 return {text,...deserializeVersionedMatch(text)};
}
