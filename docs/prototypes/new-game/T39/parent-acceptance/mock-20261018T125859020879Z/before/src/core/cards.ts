/**
 * Owner-approved [designed] card rules, pinned variety.md at ae298e37:
 * https://github.com/diegoami/isle-wars-archaeology/blob/ae298e37c2f5177039e55767607f9345b6cb0e7a/design/variety.md
 * Local T23 inventory variety-009..017 gives every copy count; 018..028 gives
 * shuffle/draw order, five-card limit and Squall; 040 gives elimination discard.
 *
 * [designed] deck-v1 replay protocol: canonical kind order is the composition
 * property order below; copies are contiguous before Fisher-Yates; draw top is
 * index zero; discards append in existing hand order (then Squall). Searched the
 * pinned variety inventory and existing RNG/setup/save seams: the design leaves
 * those representations unspecified. They are frozen for cards/1 + schema 3.
 */
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
 if(state.rules.cards!=='deck-v1' && state.rules.cards!=='trade-v1')return;
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

/** Reserved for T39's separately versioned targeted Raid protocol; never active in trade-v1. */
export interface PendingRaid { readonly player:string }
export type TradeableCardKind='Anchor'|'Compass'|'Lantern'|'Surge'|'Raid';
/** [designed] approved T23 variety-030: one genuine kind, zero to two Wilds.
 * trade-v1 shares the frozen deck's representation and draw timing. The set
 * classifier includes Raid; effect availability belongs to the staged rules.
 */
export function classifyCardSet(cards:readonly CardKind[]):TradeableCardKind|null {
 if(cards.length!==3)return null;
 const genuine=cards.filter(k=>k!=='Wild');
 if(!genuine.length)return null;
 const kind=genuine[0]!;
 if(kind!=='Anchor'&&kind!=='Compass'&&kind!=='Lantern'&&kind!=='Surge'&&kind!=='Raid')return null;
 return genuine.every(k=>k===kind)?kind:null;
}
