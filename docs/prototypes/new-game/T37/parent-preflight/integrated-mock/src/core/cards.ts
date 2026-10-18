// Approved designed variety-009..028,040, pinned ae298e37 variety.md (T23 inventory).
import { DeterministicRng } from './rng';
import type { GameState } from './types';
export type CardKind = 'Anchor'|'Compass'|'Lantern'|'Surge'|'Raid'|'Wild'|'Shield'|'Squall';
export const CARD_COMPOSITION: Readonly<Record<CardKind,number>> = Object.freeze({Anchor:11,Compass:7,Lantern:4,Surge:4,Raid:4,Wild:5,Shield:4,Squall:1});
export const HAND_LIMIT = 5;
export interface CardState {drawPile:CardKind[];discardPile:CardKind[];hands:Record<string,CardKind[]>;pendingDiscard?:{readonly player:string}}
export interface CardView {readonly drawCount:number;readonly discardCount:number;readonly handCounts:Readonly<Record<string,number>>;readonly hand:readonly CardKind[]}
export function cardView(state:GameState,viewer:string):CardView {
 const c=state.cards;return {drawCount:c?.drawPile.length??0,discardCount:c?.discardPile.length??0,handCounts:Object.fromEntries(state.players.map(p=>[p.id,c?.hands[p.id]?.length??0])),hand:[...(c?.hands[viewer]??[])]};
}
/** Stable deck-v1 protocol: kind order as above, top at index zero. */
export function initializeCards(state:GameState,rng:DeterministicRng):void {
 if(state.rules.cards!=='deck-v1')return;
 const cards=(Object.entries(CARD_COMPOSITION) as [CardKind,number][]).flatMap(([k,n])=>Array<CardKind>(n).fill(k));
 state.cards={drawPile:rng.shuffled(cards),discardPile:[],hands:Object.fromEntries(state.players.map(p=>[p.id,[]]))};
 state.rng=rng.snapshot();
}
export function drawReward(state:GameState):void {
 const c=state.cards!,player=state.players[state.currentPlayer]!.id;
 if(!c.drawPile.length){const rng=DeterministicRng.fromSnapshot(state.rng);c.drawPile=rng.shuffled(c.discardPile);c.discardPile=[];state.rng=rng.snapshot();}
 const card=c.drawPile.shift();if(!card)throw Error('Card conservation violated: no card to draw');
 if(card==='Squall'){c.discardPile.push(...c.hands[player]!,card);c.hands[player]=[];}else c.hands[player]!.push(card);
}
