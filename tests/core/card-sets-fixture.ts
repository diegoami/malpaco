import {expect} from 'vitest';
import * as core from '../../src/core';
import {referenceMap} from '../../src/core/reference-map';
import type {Action,GameOptions,GameState,RuleSet,MatchIdentity} from '../../src/core';
import {canonical,COMPOSITION} from './card-deck-fixture';
import type {Kind,Deck} from './card-deck-fixture';
export type State=Omit<GameState,'phase'> & {phase:GameState['phase']|'cards';cards?:Deck};
export type TradeKind='Anchor'|'Compass'|'Lantern'|'Surge'|'Raid';
export type TradeAction=Action|{kind:'tradeCards';handIndices:readonly [number,number,number]}|{kind:'skipCards'};
export const api=core as typeof core & {tradeCardsRules?:(o?:Pick<GameOptions,'dominationWin'|'roundLimit'>)=>RuleSet;classifyCardSet?:(hand:readonly Kind[])=>TradeKind|null;REFERENCE_TRADE_CARD_MATCH_IDENTITY?:MatchIdentity;GEOGRAPHIC_TRADE_CARD_MATCH_IDENTITY?:MatchIdentity};
export function options(seed=1994):GameOptions{return {...core.defaultOptions(),seed,seats:[{kind:'human'},{kind:'human'},{kind:'human'},{kind:'human'}],computerStrengths:[],dominationWin:false};}
export function opening(seed=1994,geographic=false):State {
 const o=options(seed),rules=api.tradeCardsRules?.(o)??core.cardsRules(o);
 const result=geographic?core.createGeographicGame(o,rules):core.createReferenceGame(referenceMap,o,rules);if(!result.ok)throw Error(result.errors.join(';'));return result.state;
}
export const player=(s:State)=>s.players[s.currentPlayer]!.id;
export function cards(s:State):Deck{expect(s.cards).toBeDefined();return s.cards!;}
export function act(s:State,a:TradeAction):State{const r=core.apply(s as GameState,a as Action);if(!r.ok)throw Error(`${JSON.stringify(a)}: ${r.error}`);return r.state;}
export function arrange(s:State,hand:Kind[]):State{const rest=canonical();for(const kind of hand){const i=rest.indexOf(kind);if(i<0)throw Error('fixture overdraw');rest.splice(i,1);}const c=cards(s);c.hands=Object.fromEntries(s.players.map(p=>[p.id,[]]));c.hands[player(s)]=[...hand];c.drawPile=rest;c.discardPile=[];delete c.pendingDiscard;return s;}
export function conserved(s:State){const c=cards(s),all=[...c.drawPile,...c.discardPile,...Object.values(c.hands).flat()];expect(all.length).toBe(40);expect(Object.fromEntries(Object.keys(COMPOSITION).map(k=>[k,all.filter(x=>x===k).length]))).toEqual(COMPOSITION);}
export function endPlacement(s:State):State{const own=s.map.provinces.find(p=>s.ownerOf[p.id]===player(s))!.id;if(s.reinforcementPool)s=act(s,{kind:'reinforce',province:own,amount:s.reinforcementPool});return act(s,{kind:'endReinforcement'});}
export function reject(s:State,a:unknown){const before=structuredClone(s);expect(core.apply(s as GameState,a as Action).ok,JSON.stringify(a)).toBe(false);expect(s).toEqual(before);}
export const identity=(geographic=false):MatchIdentity=>(geographic?api.GEOGRAPHIC_TRADE_CARD_MATCH_IDENTITY:api.REFERENCE_TRADE_CARD_MATCH_IDENTITY)??{boardGenerator:{id:geographic?'geographic':'fixed-reference',version:1},rules:{id:'cards',version:2},actionSchemaVersion:4};
export {core};
export {frozen} from './card-deck-fixture';
export type {Kind};
