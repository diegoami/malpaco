import { apply, createGame, defaultOptions } from "../../src/core";
import type { Action, GameOptions, GameState } from "../../src/core";
export function mixedOptions(seed = 1994, seats = 4): GameOptions {
  return {...defaultOptions(),seed,seats:Array.from({length:seats},(_,i)=>({kind:i===0?"human":"computer"})),computerStrengths:Array.from({length:seats-1},()=>"Normal")};
}
export function mixedOpening(seed = 1994, seats = 4): GameState {
  const r=createGame(mixedOptions(seed,seats));if(!r.ok)throw Error(r.errors.join("; "));return r.state;
}
export function step(state: GameState, action: Action): GameState {
  const r=apply(state,action);if(!r.ok)throw Error(`${JSON.stringify(action)}: ${r.error}`);return r.state;
}
export function passive(state: GameState): Action {
  if(state.phase!=="reinforce")return {kind:"endTurn"};
  if(!state.reinforcementPool)return {kind:"endReinforcement"};
  return {kind:"reinforce",province:state.map.provinces.find(p=>state.ownerOf[p.id]===state.players[state.currentPlayer]!.id)!.id,amount:state.reinforcementPool};
}
