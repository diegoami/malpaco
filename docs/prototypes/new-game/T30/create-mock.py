"""Disposable feasibility implementation; archive originals and restore before dispatch."""
from pathlib import Path
import hashlib,io,json,tarfile,tempfile
root=Path(__file__).resolve().parent;repo=root.parents[3]
paths=['src/core/types.ts','src/core/state.ts','src/core/setup.ts','src/core/index.ts','src/core/rules.ts','src/ui/referenceGame.ts','src/ui/referenceBattleGame.ts','src/styles.css','src/core/__t30_mock.ts']
assert not (repo/paths[-1]).exists()
out=Path(tempfile.mkdtemp(prefix='mock-',dir=root/'preflight'))
before={name:(repo/name).read_bytes() if (repo/name).exists() else None for name in paths}
with tarfile.open(out/'original-sources.tar.gz','w:gz') as a:
 for name,data in before.items():
  if data is not None:
   m=tarfile.TarInfo(name);m.size=len(data);a.addfile(m,io.BytesIO(data))
(out/'original-manifest.json').write_text(json.dumps({n:hashlib.sha256(b).hexdigest() if b is not None else None for n,b in before.items()},indent=2)+'\n')
def change(name,old,new):
 p=repo/name;s=p.read_text();assert s.count(old)==1,(name,old,s.count(old));p.write_text(s.replace(old,new))

change('src/core/types.ts','  readonly movement?: "adjacent";','  readonly movement?: "adjacent";\n  readonly victoryOptions?: {readonly dominationWin:boolean;readonly roundLimit:20|30|40|null};')
change('src/core/types.ts','| "finished";','| "finished" | "human-loss";')
change('src/core/types.ts','  currentPlayer: number;','  roundOrigin?: number;\n  watchingComputers?: boolean;\n  result?: {reason:"conquest"|"last-seat"|"domination"|"round-limit"|"no-human-left";standings:{player:string;countries:number;armies:number}[]};\n  currentPlayer: number;')
change('src/core/types.ts','export type Action =','export type Action =\n  | {readonly kind:"watchComputers"}\n  | {readonly kind:"stopGame"}')
change('src/core/index.ts','export * from "./types";','export * from "./types";\nexport {victoryRules} from "./__t30_mock";')
change('src/core/state.ts','    currentPlayer: state.currentPlayer,','    ...(state.roundOrigin !== undefined ? {roundOrigin:state.roundOrigin} : {}),\n    ...(state.watchingComputers !== undefined ? {watchingComputers:state.watchingComputers} : {}),\n    ...(state.result ? {result:{reason:state.result.reason,standings:state.result.standings.map(r=>({...r}))}} : {}),\n    currentPlayer: state.currentPlayer,')
change('src/core/setup.ts','      map: board.map, rules, players, ownerOf, armies, currentPlayer: firstSeat,','      map: board.map, rules, players, ownerOf, armies, currentPlayer: firstSeat,\n      ...(rules.victoryOptions ? {roundOrigin:firstSeat,watchingComputers:false} : {}),')
change('src/core/rules.ts','import { attackTargets, resolve, whyNot } from "./combat";','import { attackTargets, resolve, whyNot } from "./combat";\nimport {mockComplete,mockChoice} from "./__t30_mock";')
change('src/core/rules.ts','  if (!activePlayer(state)) return','  if (state.phase === "human-loss" && action.kind !== "watchComputers" && action.kind !== "stopGame") return {ok:false,error:"Choose Watch or Stop."};\n  if (!activePlayer(state)) return')
change('src/core/rules.ts','  switch (action.kind) {','  switch (action.kind) {\n    case "watchComputers":\n    case "stopGame": return mockChoice(next,action.kind);')
change('src/core/rules.ts','  // Pinned core-rules.md Victory: after this turn\'s move, before next income.','  if (state.rules.victoryOptions) return mockComplete(state);\n  // Pinned core-rules.md Victory: after this turn\'s move, before next income.')
(repo/'src/core/__t30_mock.ts').write_text('''// Disposable feasibility only. Removed before production dispatch.
import {friendlyMoveRules} from "./state";
import {defaultOptions} from "./options";
import type {GameOptions} from "./options";
import {reinforcementIncome} from "./reinforcement";
import type {ApplyResult,GameState,RuleSet} from "./types";
export function victoryRules(options:Pick<GameOptions,"dominationWin"|"roundLimit">=defaultOptions()):RuleSet{return {...friendlyMoveRules(),id:"malpaco-victory",victoryOptions:{dominationWin:options.dominationWin,roundLimit:options.roundLimit}};}
function rows(s:GameState){const origin=s.roundOrigin??0;const order=(id:string)=>(s.players.findIndex(p=>p.id===id)-origin+s.players.length)%s.players.length;return s.players.map(p=>{const ids=s.map.provinces.filter(v=>s.ownerOf[v.id]===p.id).map(v=>v.id);return {player:p.id,countries:ids.length,armies:ids.reduce((n,id)=>n+s.armies[id]!,0)};}).sort((a,b)=>b.countries-a.countries||b.armies-a.armies||order(b.player)-order(a.player));}
function nextSeat(s:GameState){for(let n=1;n<=s.players.length;n++){const i=(s.currentPlayer+n)%s.players.length;if(!s.players[i]!.eliminated)return i;}return s.currentPlayer;}
function boundary(s:GameState){const origin=s.roundOrigin??0,rank=(i:number)=>(i-origin+s.players.length)%s.players.length;return rank(nextSeat(s))<=rank(s.currentPlayer);}
function handoff(s:GameState):ApplyResult{const complete=boundary(s);s.log.push({event:"turn_ended",player:s.players[s.currentPlayer]!.id,turn:s.turnNumber});s.currentPlayer=nextSeat(s);if(complete)s.turnNumber++;s.phase="reinforce";s.capturedThisTurn=false;s.reinforcementPool=reinforcementIncome(s,s.players[s.currentPlayer]!.id).total;return {ok:true,state:s,outcome:null};}
export function mockChoice(s:GameState,kind:"watchComputers"|"stopGame"):ApplyResult{if(s.phase!=="human-loss"||!s.rules.victoryOptions)return {ok:false,error:"No human-loss choice."};if(kind==="stopGame"){s.phase="finished";return {ok:true,state:s,outcome:null};}s.watchingComputers=true;delete s.result;return handoff(s);}
export function mockComplete(s:GameState):ApplyResult{
 const standings=rows(s),own=standings.find(r=>r.player===s.players[s.currentPlayer]!.id)!,options=s.rules.victoryOptions!;
 let reason:NonNullable<GameState["result"]>["reason"]|undefined,winner="";
 const full=standings.find(r=>r.countries===s.map.provinces.length);
 if(full){reason="conquest";winner=full.player;}
 else if(standings.filter(r=>r.countries>0).length===1){reason="last-seat";winner=standings[0]!.player;}
 else if(options.dominationWin&&own.countries>=Math.floor((3*s.map.provinces.length+3)/4)){reason="domination";winner=own.player;}
 else if(options.roundLimit!==null&&boundary(s)&&s.turnNumber>=options.roundLimit){reason="round-limit";winner=standings[0]!.player;}
 else if(!s.watchingComputers&&s.players.some(p=>p.kind==="human")&&s.players.filter(p=>p.kind==="human").every(p=>p.eliminated)){reason="no-human-left";}
 if(reason){s.result={reason,standings};s.winner=winner;s.phase=reason==="no-human-left"?"human-loss":"finished";if(winner)s.log.push({event:"victory",player:winner,turn:s.turnNumber});return {ok:true,state:s,outcome:null};}
 return handoff(s);
}
''')
change('src/ui/referenceGame.ts','import {friendlyMoveRules,defaultOptions}','import {victoryRules,defaultOptions}')
change('src/ui/referenceGame.ts','  const alert=h("p",{role:"alert"});','''  const alert=h("p",{role:"alert"});
  const controls=h("div");
  const drawControls=()=>{controls.replaceChildren(...Array.from({length:Number(count.value)},(_,i)=>{const select=h("select",{id:`reference-control-${i}`},h("option",{value:"human"},"Human"),h("option",{value:"computer"},"Computer"));return h("label",{for:`reference-control-${i}`},`Seat ${i+1} control`,select);}));};
  count.addEventListener("change",drawControls);drawControls();
  const domination=h("input",{type:"checkbox",id:"reference-domination"});domination.checked=true;
  const limit=h("select",{id:"reference-round-limit"},h("option",{value:"off"},"Off"),...[20,30,40].map(n=>h("option",{value:String(n)},String(n))));''')
change('src/ui/referenceGame.ts','  form.onsubmit=e=>','  if(!legacy)form.insertBefore(h("div",{},controls,h("label",{for:"reference-domination"},"Domination win",domination),h("label",{for:"reference-round-limit"},"Round limit",limit)),alert);\n  form.onsubmit=e=>')
change('src/ui/referenceGame.ts','   try{const options={...defaultOptions(),seed:Number(seed),seats:Array.from({length:Number(seats)},()=>({kind:"human" as const})),computerStrengths:[]};','''   try{const specs=Array.from({length:Number(seats)},(_,i)=>({kind:!legacy&&(controls.querySelector(`#reference-control-${i}`) as HTMLSelectElement).value==="computer"?"computer" as const:"human" as const}));const options={...defaultOptions(),seed:Number(seed),seats:specs,computerStrengths:specs.filter(s=>s.kind==="computer").map(()=>"Normal" as const),dominationWin:domination.checked,roundLimit:limit.value==="off"?null:Number(limit.value) as 20|30|40};''')
change('src/ui/referenceGame.ts','legacy?undefined:friendlyMoveRules()','legacy?undefined:victoryRules(options)')
change('src/ui/referenceBattleGame.ts','  private readonly phaseActions: HTMLElement;','  private readonly phaseActions: HTMLElement;\n  private readonly resultEl=h("section",{class:"victory-panel"});')
change('src/ui/referenceBattleGame.ts','append(this.battle.el, this.friendly.el);','append(this.battle.el, this.friendly.el,this.resultEl);')
change('src/ui/referenceBattleGame.ts','|| state.phase === "finished";','|| state.phase === "finished" || state.phase === "human-loss";')
change('src/ui/referenceBattleGame.ts','    this.friendly.render(this.controller.view);','''    this.friendly.render(this.controller.view);
    this.resultEl.replaceChildren();
    if(state.result){
      this.phaseActions.style.display="none";this.battle.el.hidden=true;this.friendly.el.hidden=true;
      const reason=state.result.reason==="no-human-left"?"Every human eliminated":state.result.reason==="domination"?`Domination: ${state.result.standings.find(r=>r.player===state.winner)!.countries} of 46`:state.result.reason==="round-limit"?"Round limit: countries, armies, turn order":state.result.reason;
      const standings=h("div",{id:"victory-standings"},...state.result.standings.map(row=>h("div",{"data-result-player":row.player},h("span",{},state.players.find(p=>p.id===row.player)!.name),h("span",{"data-result-countries":""},String(row.countries)),h("span",{"data-result-armies":""},String(row.armies)))));
      this.resultEl.append(h("p",{id:"victory-reason"},reason),standings);
      if(state.phase==="human-loss")for(const [id,label,kind]of[["watch-computers-button","Watch computers","watchComputers"],["stop-game-button","Stop","stopGame"]]as const){const button=h("button",{type:"button",id},label);button.addEventListener("click",()=>this.controller.dispatch({kind},revision));this.resultEl.append(button);}
    }''')
with (repo/'src/styles.css').open('a') as f:f.write('\n/* Disposable T30 feasibility UI. */\n.victory-panel [data-result-player]{display:grid;grid-template-columns:1fr 50px 50px;gap:8px;padding:5px 0;}\n')
with tarfile.open(out/'initial-mock-sources.tar.gz','w:gz') as a:
 for name in paths:a.add(repo/name,arcname=name)
print(out.relative_to(repo))
