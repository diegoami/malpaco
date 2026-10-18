from pathlib import Path
import shutil,json,hashlib,subprocess
root=Path.cwd();out=root/'docs/prototypes/new-game/T39/parent-preflight';mock=out/'integrated-mock'
def read(p):return (root/p).read_text()
def save(p,s):
 t=mock/p;t.parent.mkdir(parents=True,exist_ok=True);t.write_text(s)
def change(p,old,new):
 s=read(p);assert old in s,p;save(p,s.replace(old,new))
save('src/core/raid.ts','''import type { DeterministicRng } from './rng';
/** Approved designed T23 variety-036, pinned ae298e37 variety.md: no upper cap.
 * One bounded rules-stream draw, including the degenerate 1..1 interval.
 * That draw-count convention is a stable designed raid-v1 replay protocol.
 */
export function raidStackAfter(armies:number,rng:Pick<DeterministicRng,'nextInt'>):number {
 return rng.nextInt(1,Math.max(1,Math.floor(armies/2)));
}
''')
s=read('src/core/cards.ts').replace('pendingDiscard?:{readonly player:string}}','pendingDiscard?:{readonly player:string};pendingRaid?:PendingRaid}')
s=s.replace("state.rules.cards!=='trade-v1')return;","state.rules.cards!=='trade-v1' && state.rules.cards!=='raid-v1')return;")
s=s.replace("/** Reserved for T39's separately versioned targeted Raid protocol; never active in trade-v1. */",'/** Public target choice after a Raid set is spent; absent in historical stages. */')
save('src/core/cards.ts',s)
s=read('src/core/types.ts').replace('export type Action =','export type Action =\n  | { readonly kind: "raidTarget"; readonly province: string }')
s=s.replace('export type LogEntry =','export type LogEntry =\n  | { readonly event: "raid"; readonly player:string; readonly province:string; readonly defender:string; readonly before:number; readonly after:number; readonly shielded:boolean; readonly turn:number }')
save('src/core/types.ts',s)
s=read('src/core/state.ts').replace('rules.cards === "trade-v1"','(rules.cards === "trade-v1" || rules.cards === "raid-v1")')
s=s.replace('...(state.cards.pendingDiscard?{pendingDiscard:{...state.cards.pendingDiscard}}:{})','...(state.cards.pendingDiscard?{pendingDiscard:{...state.cards.pendingDiscard}}:{}),...(state.cards.pendingRaid?{pendingRaid:{...state.cards.pendingRaid}}:{})')
s+='''
/** Frozen raid-v1 stage: T23 variety-036/037; old deck/trade factories stay exact. */
export function raidCardsRules(options:Pick<GameOptions,'dominationWin'|'roundLimit'>=defaultOptions()):RuleSet {
 return {...tradeCardsRules(options),id:'malpaco-card-raids',cards:'raid-v1'};
}
'''
save('src/core/state.ts',s)
s=read('src/core/setup.ts').replace('rules.cards === "trade-v1"','(rules.cards === "trade-v1" || rules.cards === "raid-v1")');save('src/core/setup.ts',s)
s=read('src/core/rules.ts');s="import { raidStackAfter } from './raid';\n"+s
s=s.replace("  const next = cloneState(state);","  if (state.cards?.pendingRaid && action.kind !== 'raidTarget') return {ok:false,error:'choose an enemy country for the raid'};\n  const next = cloneState(state);")
s=s.replace('  switch (action.kind) {',"  switch (action.kind) {\n    case 'raidTarget': return raidTarget(next,action.province);")
s=s.replace('state.rules.cards === "trade-v1"','(state.rules.cards === "trade-v1" || state.rules.cards === "raid-v1")')
s=s.replace("state.rules.cards==='deck-v1'||state.rules.cards==='trade-v1'","state.rules.cards==='deck-v1'||state.rules.cards==='trade-v1'||state.rules.cards==='raid-v1'")
s=s.replace("state.rules.cards!=='deck-v1'&&state.rules.cards!=='trade-v1'","state.rules.cards!=='deck-v1'&&state.rules.cards!=='trade-v1'&&state.rules.cards!=='raid-v1'")
s=s.replace("if(state.rules.cards!=='trade-v1'||state.phase", "if((state.rules.cards!=='trade-v1'&&state.rules.cards!=='raid-v1')||state.phase")
s=s.replace("if(kind==='Raid')return", "if(kind==='Raid'&&state.rules.cards!=='raid-v1')return")
s=s.replace(" // T23 variety-032/043: income", " if(kind==='Raid'){c.pendingRaid={player:p};return {ok:true,state,outcome:null};}\n // T23 variety-032/043: income")
s+='''
/** Approved designed variety-036/037: any enemy country, no owner/pool change.
 * [designed] stable raid-v1 protocol: first Shield in hand order; cancellation
 * uses no RNG. Every unshielded effect uses one bounded draw, including 1..1.
 */
function raidTarget(state:GameState,province:string):ApplyResult {
 const c=state.cards,p=activePlayer(state)!.id;
 if(state.rules.cards!=='raid-v1'||state.phase!=='cards'||!c?.pendingRaid||c.pendingRaid.player!==p)return {ok:false,error:'no raid target is pending'};
 if(!state.map.provinces.some(x=>x.id===province))return {ok:false,error:'unknown raid target'};
 const defender=state.ownerOf[province]!;
 if(defender===p||!state.players.some(x=>x.id===defender&&!x.eliminated))return {ok:false,error:'choose an enemy country'};
 const before=state.armies[province]!,hand=c.hands[defender]!,shield=hand.indexOf('Shield');
 if(shield>=0)c.discardPile.push(hand.splice(shield,1)[0]!);
 else {const rng=DeterministicRng.fromSnapshot(state.rng);state.armies[province]=raidStackAfter(before,rng);state.rng=rng.snapshot();}
 delete c.pendingRaid;state.phase='reinforce';
 state.log.push({event:'raid',player:p,province,defender,before,after:state.armies[province]!,shielded:shield>=0,turn:state.turnNumber});
 return {ok:true,state,outcome:null};
}
'''
save('src/core/rules.ts',s)
s=read('src/core/index.ts')+"\nexport {raidCardsRules} from './state';\nexport {raidStackAfter} from './raid';\nexport {REFERENCE_RAID_CARD_MATCH_IDENTITY,GEOGRAPHIC_RAID_CARD_MATCH_IDENTITY} from './match-save';\n";save('src/core/index.ts',s)
s=read('src/core/match-save.ts').replace('cardsRules, tradeCardsRules, victoryRules','cardsRules, tradeCardsRules, raidCardsRules, victoryRules')
pos=s.index('function supportedIdentity(')
s=s[:pos]+'''/** [designed] exact raid-v1 protocol; cards/1 and cards/2 remain frozen. */
export const REFERENCE_RAID_CARD_MATCH_IDENTITY:MatchIdentity=Object.freeze({boardGenerator:Object.freeze({id:'fixed-reference',version:1}),rules:Object.freeze({id:'cards',version:3}),actionSchemaVersion:5});
export const GEOGRAPHIC_RAID_CARD_MATCH_IDENTITY:MatchIdentity=Object.freeze({boardGenerator:Object.freeze({id:'geographic',version:1}),rules:Object.freeze({id:'cards',version:3}),actionSchemaVersion:5});
'''+s[pos:]
s=s.replace('  const tradeStage=cardStage', '  const raidStage=cardStage&&record(value.rules)&&value.rules.version===3;\n  const tradeStage=cardStage')
s=s.replace('(tradeStage?GEOGRAPHIC_TRADE_CARD_MATCH_IDENTITY:', '(raidStage?GEOGRAPHIC_RAID_CARD_MATCH_IDENTITY:tradeStage?GEOGRAPHIC_TRADE_CARD_MATCH_IDENTITY:').replace('(tradeStage?REFERENCE_TRADE_CARD_MATCH_IDENTITY:', '(raidStage?REFERENCE_RAID_CARD_MATCH_IDENTITY:tradeStage?REFERENCE_TRADE_CARD_MATCH_IDENTITY:')
s=s.replace('  switch (value.kind) {',"  switch (value.kind) {\n    case 'raidTarget': if(schema!==5)return fail();keys=['kind','province'];break;")
s=s.replace('if(schema!==4||', 'if((schema!==4&&schema!==5)||').replace("if(schema!==4)return fail();", "if(schema!==4&&schema!==5)return fail();")
s=s.replace('(schema!==3&&schema!==4)', '(schema!==3&&schema!==4&&schema!==5)')
s=s.replace("(identity.rules.version===2?tradeCardsRules(options):cardsRules(options))", "(identity.rules.version===3?raidCardsRules(options):identity.rules.version===2?tradeCardsRules(options):cardsRules(options))")
save('src/core/match-save.ts',s)
s=read('src/ui/gameEventLog.ts').replace('const ACTION_NAMES: Record<Action["kind"], string> = {','const ACTION_NAMES: Record<Action["kind"], string> = {\n  raidTarget: "Raid target",');save('src/ui/gameEventLog.ts',s)
s=read('src/ui/panel.ts').replace('    case "attack": {','''    case "raid":
      return entry.shielded ? `T${entry.turn} ${name(entry.player)} raid at ${where(entry.province)} cancelled by Shield` : `T${entry.turn} ${name(entry.player)} raids ${where(entry.province)}: ${entry.before} → ${entry.after}`;
    case "attack": {''');save('src/ui/panel.ts',s)
runtime=out/'runtime';runtime.mkdir(exist_ok=True);shutil.copytree(root/'src',runtime/'src',dirs_exist_ok=True)
for p in (mock/'src').rglob('*'):
 if p.is_file():shutil.copy2(p,runtime/p.relative_to(mock))
for name in ['tsconfig.json','docs/prototypes/new-game/T34/witness.json','docs/prototypes/new-game/T63/board.json','data/maps/small_sea.json']:
 p=runtime/name;p.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(root/name,p)
manifest={'base':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'files':[]}
for p in sorted((mock/'src').rglob('*.ts')):
 rel=p.relative_to(mock);original=root/rel
 manifest['files'].append({'path':str(rel),'candidateSha256':hashlib.sha256(p.read_bytes()).hexdigest(),'originalSha256':hashlib.sha256(original.read_bytes()).hexdigest() if original.exists() else None})
(out/'install-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
