from pathlib import Path
import shutil,json,hashlib
base=Path('docs/prototypes/new-game/T38/parent-preflight')
root=base/'mock'
root.mkdir(exist_ok=True)
shutil.copytree('src',root/'src',dirs_exist_ok=True)
for f in ['package.json','tsconfig.json','tsconfig.app.json','tsconfig.node.json','vite.config.ts']:
 if Path(f).exists(): shutil.copy2(f,root/f)
def edit(p,old,new):
 f=root/p;s=f.read_text();assert old in s,(p,old);f.write_text(s.replace(old,new))
edit('src/core/types.ts','export type Phase = "reinforce"','export type Phase = "cards" | "reinforce"')
edit('src/core/types.ts','export type Action =\n','export type Action =\n  | { readonly kind: "tradeCards"; readonly handIndices: readonly [number, number, number] }\n  | { readonly kind: "skipCards" }\n')
edit('src/core/cards.ts',"if(state.rules.cards!=='deck-v1')return;","if(state.rules.cards!=='deck-v1' && state.rules.cards!=='trade-v1')return;")
f=root/'src/core/cards.ts';f.write_text(f.read_text()+'''
/** Reserved for T39's separately versioned targeted Raid protocol; never active in trade-v1. */
export interface PendingRaid { readonly player:string }
export type TradeableCardKind='Anchor'|'Compass'|'Lantern'|'Surge'|'Raid';
/** [designed] approved T23 variety-030: one genuine kind, zero to two Wilds. */
export function classifyCardSet(cards:readonly CardKind[]):TradeableCardKind|null {
 if(cards.length!==3)return null;
 const genuine=cards.filter(k=>k!=='Wild');
 if(!genuine.length)return null;
 const kind=genuine[0]!;
 if(kind!=='Anchor'&&kind!=='Compass'&&kind!=='Lantern'&&kind!=='Surge'&&kind!=='Raid')return null;
 return genuine.every(k=>k===kind)?kind:null;
}
''')
f=root/'src/core/state.ts';f.write_text(f.read_text()+'''
/** [designed] T38 stage; T23 variety-029..035. deck-v1 remains frozen. */
export function tradeCardsRules(options:Pick<GameOptions,'dominationWin'|'roundLimit'>=defaultOptions()):RuleSet {
 return {...cardsRules(options),id:'malpaco-card-trades',cards:'trade-v1'};
}
''')
for p in ['src/core/state.ts','src/core/setup.ts','src/core/rules.ts']:
 edit(p,'phase: rules.turnSequence === "reinforcement" ? "reinforce" : "attack",','phase: rules.cards === "trade-v1" ? "cards" : rules.turnSequence === "reinforcement" ? "reinforce" : "attack",') if p!='src/core/rules.ts' else edit(p,'state.phase = state.rules.turnSequence === "reinforcement" ? "reinforce" : "attack";','state.phase = state.rules.cards === "trade-v1" ? "cards" : state.rules.turnSequence === "reinforcement" ? "reinforce" : "attack";')
edit('src/core/rules.ts',"import { drawReward, HAND_LIMIT }", "import { classifyCardSet, drawReward, HAND_LIMIT }")
edit('src/core/rules.ts',"case 'discardCard': return discardCard(next,action.handIndex);","case 'tradeCards': return tradeCards(next,action.handIndices);\n    case 'skipCards': return skipCards(next);\n    case 'discardCard': return discardCard(next,action.handIndex);")
edit('src/core/rules.ts',"state.rules.cards==='deck-v1' && state.cards", "(state.rules.cards==='deck-v1'||state.rules.cards==='trade-v1') && state.cards")
edit('src/core/rules.ts',"state.rules.cards!=='deck-v1'||!c?.pendingDiscard", "(state.rules.cards!=='deck-v1'&&state.rules.cards!=='trade-v1')||!c?.pendingDiscard")
f=root/'src/core/rules.ts';f.write_text(f.read_text()+'''
function skipCards(state:GameState):ApplyResult {
 if(state.rules.cards!=='trade-v1'||state.phase!=='cards'||!state.cards)return {ok:false,error:'not in the cards phase'};
 state.phase='reinforce';return {ok:true,state,outcome:null};
}
function tradeCards(state:GameState,indices:readonly number[]):ApplyResult {
 if(state.rules.cards!=='trade-v1'||state.phase!=='cards'||!state.cards)return {ok:false,error:'not in the cards phase'};
 const c=state.cards,p=activePlayer(state)!.id,hand=c.hands[p]!;
 if(!Array.isArray(indices)||indices.length!==3||new Set(indices).size!==3||indices.some(i=>!Number.isSafeInteger(i)||i<0||i>=hand.length))return {ok:false,error:'choose three distinct cards in your hand'};
 const kind=classifyCardSet(indices.map(i=>hand[i]!));
 if(!kind)return {ok:false,error:'those cards are not a set'};
 // T38 explicitly defers target/effect to T39's separately versioned Raid stage.
 if(kind==='Raid')return {ok:false,error:'Raid sets require the later targeted Raid rules'};
 const chosen=new Set(indices);
 c.discardPile.push(...hand.filter((_,i)=>chosen.has(i)));
 c.hands[p]=hand.filter((_,i)=>!chosen.has(i));
 // T23 variety-032/043: income was computed once on entry; no placement yet.
 if(kind==='Surge')state.reinforcementPool*=2;
 else state.reinforcementPool+=({Anchor:5,Compass:8,Lantern:15} as const)[kind];
 state.phase='reinforce';return {ok:true,state,outcome:null};
}
''')
edit('src/core/match-save.ts','import { cardsRules, victoryRules }','import { cardsRules, tradeCardsRules, victoryRules }')
edit('src/core/match-save.ts',"function supportedIdentity(value:","export const REFERENCE_TRADE_CARD_MATCH_IDENTITY:MatchIdentity=Object.freeze({boardGenerator:Object.freeze({id:'fixed-reference',version:1}),rules:Object.freeze({id:'cards',version:2}),actionSchemaVersion:4});\nexport const GEOGRAPHIC_TRADE_CARD_MATCH_IDENTITY:MatchIdentity=Object.freeze({boardGenerator:Object.freeze({id:'geographic',version:1}),rules:Object.freeze({id:'cards',version:2}),actionSchemaVersion:4});\nfunction supportedIdentity(value:")
edit('src/core/match-save.ts',"const expected = record(generator)","const tradeStage=cardStage&&record(value.rules)&&value.rules.version===2;\n  const expected = record(generator)")
edit('src/core/match-save.ts','? (cardStage?GEOGRAPHIC_CARD_MATCH_IDENTITY:GEOGRAPHIC_MATCH_IDENTITY) : (cardStage?REFERENCE_CARD_MATCH_IDENTITY:REFERENCE_MATCH_IDENTITY);','? (tradeStage?GEOGRAPHIC_TRADE_CARD_MATCH_IDENTITY:cardStage?GEOGRAPHIC_CARD_MATCH_IDENTITY:GEOGRAPHIC_MATCH_IDENTITY) : (tradeStage?REFERENCE_TRADE_CARD_MATCH_IDENTITY:cardStage?REFERENCE_CARD_MATCH_IDENTITY:REFERENCE_MATCH_IDENTITY);')
edit('src/core/match-save.ts',"case 'discardCard':","case 'tradeCards':\n      if(schema!==4||!Array.isArray(value.handIndices)||value.handIndices.length!==3||new Set(value.handIndices).size!==3||value.handIndices.some(i=>typeof i!=='number'||!Number.isSafeInteger(i)||i<0))return fail();\n      keys=['kind','handIndices'];break;\n    case 'skipCards':\n      if(schema!==4)return fail();keys=['kind'];break;\n    case 'discardCard':")
edit('src/core/match-save.ts',"if(schema!==3||typeof value.handIndex", "if((schema!==3&&schema!==4)||typeof value.handIndex")
edit('src/core/match-save.ts',"identity.rules.id==='cards'?cardsRules(options):victoryRules(options)","identity.rules.id==='cards'?(identity.rules.version===2?tradeCardsRules(options):cardsRules(options)):victoryRules(options)")
f=root/'src/core/index.ts';f.write_text(f.read_text()+"\nexport {tradeCardsRules} from './state';\nexport {classifyCardSet} from './cards';\nexport type {TradeableCardKind,PendingRaid} from './cards';\nexport {REFERENCE_TRADE_CARD_MATCH_IDENTITY,GEOGRAPHIC_TRADE_CARD_MATCH_IDENTITY} from './match-save';\n")
# Mechanical compile-only label scope proposed to parent; no real UI touched.
edit('src/ui/gameEventLog.ts','const ACTION_NAMES: Record<Action["kind"], string> = {','const ACTION_NAMES: Record<Action["kind"], string> = {\n  tradeCards: "Trade cards", skipCards: "Skip cards",')
edit('src/ui/gameEventLog.ts','const PHASE_NAMES: Record<GameState["phase"], string> = {','const PHASE_NAMES: Record<GameState["phase"], string> = {\n  cards: "Cards",')
manifest=[]
for p in sorted((root/'src').rglob('*')):
 if p.is_file():manifest.append({'path':str(p.relative_to(root)),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
(base/'mock-source-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('Mirrored complete actual source; only owned mock changed.')
