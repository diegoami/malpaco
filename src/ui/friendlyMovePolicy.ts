import {friendlyTargets,neighbours,province,ownerOf} from '../core';
import type {GameState} from '../core';

/** Owner choice #441: only a new mixed pair defaults toward its enemy border.
 * An explicit Swap uses controller.select directly, so redraws never undo it. */
export function preferredFriendlyPair(state:GameState,from:string,to:string):readonly [string,string]{
 const border=(id:string)=>neighbours(province(state.map,id)!).some(n=>ownerOf(state,n)!==ownerOf(state,id));
 return border(from)&&!border(to)&&friendlyTargets(state,to).includes(from)?[to,from]:[from,to];
}
