from pathlib import Path
import subprocess,tarfile,hashlib,json,tempfile
root=Path(__file__).resolve().parent;repo=root.parents[3];index=repo/'src/core/index.ts';original=index.read_bytes();mock=repo/'src/core/__t27_preflight_mock.ts'
out=Path(tempfile.mkdtemp(prefix='mock-',dir=root/'preflight'))
assert not mock.exists()
code='''// @ts-nocheck
// Disposable parent pipeline mock, not the T27 implementation.
import {apply as inherited} from './rules';
import type {GameState,Action,ApplyResult,RuleSet} from './types';
import {malpacoRules,cloneState,livingPlayers} from './state';
export function captureChoiceRules():RuleSet{return {...malpacoRules(),id:'parent-mock-capture-choice'};}
export function apply(state:GameState,action:Action):ApplyResult{
 if(state.rules.id!=='parent-mock-capture-choice')return inherited(state,action);
 if(state.pendingCapture){
  if(action.kind!=='captureMove')return {ok:false,error:'choice required'};
  const p=state.pendingCapture,n=action.amount??p.defaultAmount;
  if(!Number.isSafeInteger(n)||n<p.min||n>p.max)return {ok:false,error:'invalid quantity'};
  const next=cloneState(state);next.armies[p.from]-=n-1;next.armies[p.to]+=n-1;
  next.pendingCapture=null;next.phase='attack';next.history.push(action);return {ok:true,state:next,outcome:null};
 }
 if(action.kind==='captureMove')return {ok:false,error:'no pending choice'};
 if(action.kind==='endTurn'&&livingPlayers(state).length===1){
  const next=cloneState(state);next.phase='finished';next.winner=livingPlayers(state)[0].id;
  next.log.push({event:'turn_ended',player:next.winner,turn:next.turnNumber},{event:'victory',player:next.winner,turn:next.turnNumber});next.history.push(action);return {ok:true,state:next,outcome:null};
 }
 const r=inherited({...state,rules:{...state.rules,combat:{...state.rules.combat,capture:'one'}}},action);
 if(!r.ok)return r;
 const next={...r.state,rules:state.rules};
 if(r.outcome?.captured){
  const max=next.armies[action.from];next.pendingCapture={from:action.from,to:action.to,min:1,max,defaultAmount:max};
  next.phase='capture';next.winner='';next.log=next.log.filter(e=>e.event!=='victory');
 }
 return {...r,state:next};
}
'''
records=[]
try:
 mock.write_text(code);index.write_text(original.decode().replace('export { apply, legalAttacks } from "./rules";','export { legalAttacks } from "./rules";\nexport {apply,captureChoiceRules} from "./__t27_preflight_mock";'))
 for label,cmd in [('mock-capture',['npx','vitest','run','tests/core/capture-choice.test.ts']),('mock-replay',['npx','vitest','run','tests/core/capture-choice-replay.test.ts']),('mock-unit',['npm','test']),('mock-build',['npm','run','build'])]:
  result=subprocess.run(['python3',str(root/'run-command.py'),label,*cmd],cwd=repo,capture_output=True,text=True);print(result.stdout,flush=True);records.append({'label':label,'exit':result.returncode});assert result.returncode==0,label
 for name,before,after,tests in [
  ('quantity',"if(!Number.isSafeInteger(n)||n<p.min||n>p.max)return {ok:false,error:'invalid quantity'};",'', ['tests/core/capture-choice.test.ts','tests/core/capture-choice-replay.test.ts']),
  ('conservation','next.armies[p.from]-=n-1;','', ['tests/core/capture-choice-replay.test.ts'])]:
  try:
   assert code.count(before)==1;mock.write_text(code.replace(before,after));(out/(name+'.mock.ts.snapshot')).write_bytes(mock.read_bytes())
   result=subprocess.run(['python3',str(root/'run-command.py'),'mock-negative-'+name,'npx','vitest','run',*tests],cwd=repo,capture_output=True,text=True);print(result.stdout,flush=True);records.append({'label':'mock-negative-'+name,'exit':result.returncode});assert result.returncode==1,name
  finally:mock.write_text(code)
finally:
 with tarfile.open(out/'mock-sources.tar.gz','w:gz') as a:
  a.add(mock,arcname='src/core/__t27_preflight_mock.ts');a.add(index,arcname='src/core/index.ts.mock')
 index.write_bytes(original);mock.unlink()
 (out/'restoration.json').write_text(json.dumps({'checks':records,'restoredExactly':index.read_bytes()==original,'indexSha256':hashlib.sha256(original).hexdigest(),'mockRemoved':not mock.exists()},indent=2)+'\n')
