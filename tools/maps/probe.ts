import {writeFileSync,appendFileSync} from 'node:fs';
import {performance} from 'node:perf_hooks';
import {createGeographicGame} from '../../src/core/geographic-game';
import {defaultOptions} from '../../src/core/options';
import {configurableRaidCardsRules} from '../../src/core/state';
const [out,countText]=process.argv.slice(2),count=Number(countText);
const records:Record<string,unknown>[]=[];
for(const size of [46,72,96] as const)for(let seed=0;seed<count;seed++){
 const started=performance.now();let record:Record<string,unknown>;
 try{
  const options={...defaultOptions(),seed,reinforcementDivisor:3 as const,...(size===46?{}:{regionCount:size,names:'numbered' as const})};
  const result=createGeographicGame(options,configurableRaidCardsRules(options),{},size===46?2:3);
  record={size,seed,ok:result.ok,milliseconds:Math.round(performance.now()-started),attempts:result.attempts,
   failures:result.failures.map(f=>({attempt:f.attempt,constraints:f.constraints})),
   ...(result.ok?{regions:result.state.map.provinces.length,islands:result.state.map.islands.length,lanes:result.geography.entranceReservations.length}: {errors:result.errors})};
 }catch(error){record={size,seed,ok:false,error:String(error),milliseconds:Math.round(performance.now()-started)};}
 records.push(record);appendFileSync(out+'/results.jsonl',JSON.stringify(record)+'\n');
}
const summary=[46,72,96].map(size=>{const rows=records.filter(r=>r.size===size),times=rows.map(r=>r.milliseconds as number).sort((a,b)=>a-b);return {size,seeds:rows.length,accepted:rows.filter(r=>r.ok).length,refused:rows.filter(r=>!r.ok&&!r.error).length,errors:rows.filter(r=>r.error).length,medianMs:times[Math.floor(times.length/2)],maxMs:times.at(-1),maxAttempts:Math.max(...rows.map(r=>Number(r.attempts??0))),rejectedAttempts:rows.reduce((n,r)=>n+(r.failures as unknown[]??[]).length,0)};});
writeFileSync(out+'/summary.json',JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify(summary,null,2));
