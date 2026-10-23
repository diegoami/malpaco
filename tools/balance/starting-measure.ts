import {appendFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {defaultOptions} from '../../src/core/options';
import {createGeographicGame} from '../../src/core/geographic-game';
import {configurableRaidCardsRules} from '../../src/core/state';
import {apply} from '../../src/core/rules';
import {computerAction} from '../../src/core/computer';
import {candidate,startingArmyCandidate,dealMetrics,distribution,incomes,summarize,PROTOCOL} from './experiment';
import type {Outcome} from './experiment';
const config=JSON.parse(process.argv[2]!) as {out:string;dealSeeds:number;gameSeeds:number};
const arms=['current-3','both-3','range-2','range-3','range-4'] as const;
const hash=(x:unknown)=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const groups=new Map<string,{deals:Record<string,unknown>[];games:(Outcome&Record<string,unknown>)[]}>();
const write=(name:string,row:unknown)=>appendFileSync(config.out+'/'+name+'.jsonl',JSON.stringify(row)+'\n');
const started=performance.now();
for(let seed=0;seed<Math.max(config.dealSeeds,config.gameSeeds);seed++)for(const regions of [46,72,96] as const)for(const seats of [2,3,4]){
 const options={...defaultOptions(),seed,names:'numbered' as const,reinforcementDivisor:3 as const,seats:Array.from({length:seats},()=>({kind:'computer' as const})),computerStrengths:Array(seats).fill('Normal'),...(regions===46?{}:{regionCount:regions})};
 let made:ReturnType<typeof createGeographicGame>|undefined,creationError:unknown;
 try{made=createGeographicGame(options,configurableRaidCardsRules(options),{},regions===46?2:3);}catch(error){creationError=error;}
 for(const arm of arms){
  const key=`${regions}/${seats}/${arm}`;if(!groups.has(key))groups.set(key,{deals:[],games:[]});const group=groups.get(key)!;
  const common={seed,regions,seats,arm};let dealWritten=false;
  try{
   if(creationError)throw creationError;
   if(!made?.ok){const row={...common,status:'refused',error:made?.errors.join('; ')};if(seed<config.dealSeeds){group.deals.push(row);write('deals',row);}if(seed<config.gameSeeds){const g={...row,variant:'both' as const,status:'refused' as const};group.games.push(g);write('games',g);}continue;}
   let state=arm==='current-3'?candidate(made.state,'current'):arm==='both-3'?candidate(made.state,'both'):startingArmyCandidate(made.state,Number(arm.at(-1)) as 2|3|4);
   const firstSeat=state.players[state.currentPlayer]!.id,metrics=dealMetrics(state),armyValues=Object.values(state.armies),totals=metrics.map(p=>p.armies);
   if(seed<config.dealSeeds){const row={...common,status:'generated',metrics,totalArmies:totals.reduce((a,b)=>a+b),armyGap:Math.max(...totals)-Math.min(...totals),minArmy:Math.min(...armyValues),maxArmy:Math.max(...armyValues),boardHash:hash(state.map.provinces),ownerHash:hash(state.ownerOf),firstSeat,gameRng:state.rng,computerRngs:state.computerRngs,cardsHash:hash(state.cards),stateHash:hash(state)};group.deals.push(row);write('deals',row);dealWritten=true;}
   if(seed>=config.gameSeeds)continue;
   let actions=0,round5:ReturnType<typeof incomes>|null=null;const eliminated=new Map<string,number>();
   while(state.phase!=='finished'&&actions<PROTOCOL.actionCap&&state.turnNumber<=PROTOCOL.roundCap){
    const action=computerAction(state);if(!action)throw Error('No action in '+state.phase);
    const next=apply(state,action);if(!next.ok)throw Error('Illegal '+action.kind+': '+next.error);state=next.state;actions++;
    for(const p of state.players)if(p.eliminated&&!eliminated.has(p.id))eliminated.set(p.id,state.turnNumber);
    if(!round5&&state.turnNumber===5&&state.phase!=='finished')round5=incomes(state);
   }
   const row={...common,variant:'both' as const,status:state.phase==='finished'?'finished' as const:'unfinished' as const,firstSeat,winner:state.winner,round:state.turnNumber,actions,round5,firstElimination:eliminated.size?Math.min(...eliminated.values()):null,eliminationsByRound5:[...eliminated.values()].filter(n=>n<=5).length,reason:state.result?.reason??null,historyHash:hash(state.history),finalRng:state.rng};group.games.push(row);write('games',row);
  }catch(error){const row={...common,variant:'both' as const,status:'error' as const,error:String(error)};if(seed<config.dealSeeds&&!dealWritten){group.deals.push(row);write('deals',row);}if(seed<config.gameSeeds){group.games.push(row);write('games',row);}}
 }
 if(seats===4&&regions===96&&(seed+1)%5===0)console.log(`${seed+1} seeds; ${Math.round(performance.now()-started)}ms`);
}
const summary={config,protocol:{...PROTOCOL,startingVersion:113,arms,armySalt:113,ranges:'1..maximum, equal aggregate budgets, fixed recurring divisor 3',comparison:'current and unchanged T105 both controls; new range arms use a common independent allocation stream; no event effects'},elapsedMs:Math.round(performance.now()-started),groups:Object.fromEntries([...groups].map(([key,g])=>[key,{deals:{scheduled:g.deals.length,generated:g.deals.filter(d=>d.status==='generated').length,refused:g.deals.filter(d=>d.status==='refused').length,errors:g.deals.filter(d=>d.status==='error').length,armyGap:distribution(g.deals.flatMap(d=>typeof d.armyGap==='number'?[d.armyGap]:[])),capViolatingSeeds:g.deals.filter(d=>Array.isArray(d.metrics)&&d.metrics.some((p:{capViolations:string[]})=>p.capViolations.length)).length},games:{...summarize(g.games),earlyEliminationGames:g.games.filter(g=>Number(g.eliminationsByRound5)>0).length,firstEliminationRound:distribution(g.games.flatMap(g=>typeof g.firstElimination==='number'?[g.firstElimination]:[]))}}]))};
writeFileSync(config.out+'/summary.json',JSON.stringify(summary,null,2)+'\n');console.log('Completed',summary.elapsedMs,'ms');
if([...groups.values()].some(g=>g.games.some(r=>r.status==='error')||g.deals.some(r=>r.status==='error')))process.exitCode=1;
