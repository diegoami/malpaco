from pathlib import Path
import shutil
root=Path.cwd(); out=root/'docs/prototypes/new-game/T37/parent-preflight/integrated-mock'
def save(path,s):
 p=out/path;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(s)
def read(path):return (root/path).read_text()
save('src/core/cards.ts','''// Approved designed variety-009..028,040, pinned ae298e37 variety.md (T23 inventory).
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
''')
s=read('src/core/types.ts');s="import type { CardState } from './cards';\n"+s
s=s.replace('export interface RuleSet {','export interface RuleSet {\n  readonly cards?: "deck-v1" | "trade-v1" | "raid-v1";')
s=s.replace('export type Action =','export type Action =\n  | { readonly kind: "discardCard"; readonly handIndex: number }')
s=s.replace('export interface GameState {','export interface GameState {\n  cards?: CardState;')
save('src/core/types.ts',s)
s=read('src/core/state.ts');s="import { initializeCards } from './cards';\n"+s
s=s.replace('/** Classic combat remains', '''/** Frozen T37 deck-only stage; later stages must retain this factory's semantics. */
export function cardsRules(options: Pick<GameOptions,"dominationWin"|"roundLimit"> = defaultOptions()):RuleSet {
 return {...victoryRules(options),id:'malpaco-cards',cards:'deck-v1'};
}

/** Classic combat remains''')
s=s.replace('    map: state.map,','''    ...(state.cards ? {cards:{drawPile:[...state.cards.drawPile],discardPile:[...state.cards.discardPile],hands:Object.fromEntries(Object.entries(state.cards.hands).map(([p,h])=>[p,[...h]])),...(state.cards.pendingDiscard?{pendingDiscard:{...state.cards.pendingDiscard}}:{})}} : {}),
    map: state.map,''')
s=s.replace('  if (rules.turnSequence === "reinforcement") {\n    const active', '  initializeCards(state,rng);\n  if (rules.turnSequence === "reinforcement") {\n    const active')
save('src/core/state.ts',s)
s=read('src/core/setup.ts');s="import { initializeCards } from './cards';\n"+s
s=s.replace('  if (rules.turnSequence === "reinforcement") {\n    state.reinforcementPool', '  initializeCards(state,rng);\n  if (rules.turnSequence === "reinforcement") {\n    state.reinforcementPool')
save('src/core/setup.ts',s)
s=read('src/core/rules.ts');s="import { drawReward, HAND_LIMIT } from './cards';\n"+s
s=s.replace('  const next = cloneState(state);','''  if (state.cards?.pendingDiscard && action.kind !== 'discardCard') return {ok:false,error:'choose a discard before drawing'};
  const next = cloneState(state);''')
s=s.replace('  switch (action.kind) {',"  switch (action.kind) {\n    case 'discardCard': return discardCard(next,action.handIndex);")
s=s.replace('function completeTurn(state: GameState): ApplyResult {','''function completeTurn(state: GameState): ApplyResult {
  if(state.rules.cards==='deck-v1' && state.cards && state.capturedThisTurn){
    const player=activePlayer(state)!.id;
    if(state.cards.hands[player]!.length===HAND_LIMIT){state.cards.pendingDiscard={player};return {ok:true,state,outcome:null};}
    drawReward(state);
  }
  return finalizeTurn(state);
}
function discardCard(state:GameState,index:number):ApplyResult {
  const c=state.cards,p=activePlayer(state)!.id;
  if(state.rules.cards!=='deck-v1'||!c?.pendingDiscard||c.pendingDiscard.player!==p)return {ok:false,error:'no card discard is pending'};
  if(!Number.isSafeInteger(index)||index<0||index>=c.hands[p]!.length)return {ok:false,error:'choose a card in your hand'};
  c.discardPile.push(c.hands[p]!.splice(index,1)[0]!);delete c.pendingDiscard;
  drawReward(state);return finalizeTurn(state);
}
function finalizeTurn(state: GameState): ApplyResult {''')
s=s.replace('      candidate.eliminated = true;','''      candidate.eliminated = true;
      if(state.cards){state.cards.discardPile.push(...state.cards.hands[candidate.id]!);state.cards.hands[candidate.id]=[];}''')
save('src/core/rules.ts',s)
s=read('src/core/index.ts');s += "\nexport { cardsRules } from './state';\nexport {CARD_COMPOSITION,HAND_LIMIT,cardView} from './cards';\nexport type {CardKind,CardState,CardView} from './cards';\nexport {REFERENCE_CARD_MATCH_IDENTITY,GEOGRAPHIC_CARD_MATCH_IDENTITY} from './match-save';\n"
save('src/core/index.ts',s)
s=read('src/core/match-save.ts');s=s.replace('import { victoryRules }','import { cardsRules, victoryRules }')
pos=s.index('function supportedIdentity(')
s=s[:pos]+'''/** Frozen deck-v1 stage; later card stages require their own exact tuples. */
export const REFERENCE_CARD_MATCH_IDENTITY:MatchIdentity=Object.freeze({boardGenerator:Object.freeze({id:'fixed-reference',version:1}),rules:Object.freeze({id:'cards',version:1}),actionSchemaVersion:3});
export const GEOGRAPHIC_CARD_MATCH_IDENTITY:MatchIdentity=Object.freeze({boardGenerator:Object.freeze({id:'geographic',version:1}),rules:Object.freeze({id:'cards',version:1}),actionSchemaVersion:3});
'''+s[pos:]
s=s.replace('''  const expected = record(generator) && generator.id === "geographic"
    ? GEOGRAPHIC_MATCH_IDENTITY : REFERENCE_MATCH_IDENTITY;''','''  const cardStage=record(value.rules)&&value.rules.id==='cards';
  const expected = record(generator) && generator.id === "geographic"
    ? (cardStage?GEOGRAPHIC_CARD_MATCH_IDENTITY:GEOGRAPHIC_MATCH_IDENTITY) : (cardStage?REFERENCE_CARD_MATCH_IDENTITY:REFERENCE_MATCH_IDENTITY);''')
s=s.replace('"Unsupported action schema version; expected 2."','`Unsupported action schema version; expected ${expected.actionSchemaVersion}.`')
s=s.replace('function versionedAction(value: unknown, index: number): Action {','function versionedAction(value: unknown, index: number, schema: number): Action {')
s=s.replace('  switch (value.kind) {','''  switch (value.kind) {
    case 'discardCard':
      if(schema!==3||typeof value.handIndex!=='number'||!Number.isSafeInteger(value.handIndex)||value.handIndex<0)return fail();
      keys=['kind','handIndex'];break;''')
s=s.replace('const actions = value.actions.map(versionedAction);','const actions = value.actions.map((action,index)=>versionedAction(action,index,identity.actionSchemaVersion));\n  const rules=identity.rules.id===\'cards\'?cardsRules(options):victoryRules(options);')
s=s.replace("createGeographicGame(options,victoryRules(options))",'createGeographicGame(options,rules)').replace('createReferenceGame(referenceMap,options,victoryRules(options))','createReferenceGame(referenceMap,options,rules)')
save('src/core/match-save.ts',s)
s=read('src/ui/gameEventLog.ts').replace('  reinforce: "Reinforcement placement",','  discardCard: "Card discard",\n  reinforce: "Reinforcement placement",')
save('src/ui/gameEventLog.ts',s)
# A self-contained source snapshot for probes; never install over production.
runtime=out/'runtime';runtime.mkdir(exist_ok=True)
shutil.copytree(root/'src',runtime/'src',dirs_exist_ok=True)
for p in (out/'src').rglob('*'):
 if p.is_file():shutil.copy2(p,runtime/p.relative_to(out))
