from pathlib import Path
import hashlib,json,subprocess,time,datetime,os,sys,shutil
root=Path.cwd();out=Path(__file__).resolve().parent;relative=out.relative_to(root)
frozen=json.loads((root/'docs/prototypes/new-game/T71/parent-acceptance/FROZEN-ACCEPTANCE.json').read_text())
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def snapshot():
 return {str(p.relative_to(root)):sha(p) for folder in ['src','tests','data'] for p in sorted((root/folder).rglob('*')) if p.is_file()}
before=snapshot()
for name in before:
 target=out/'inputs'/name;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(root/name,target)
receipt={'startedUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'inputHashes':before,'commands':[],'frozenExpected':frozen}
def save(): (out/'validation.json').write_text(json.dumps(receipt,indent=2)+'\n')
def run(name,args):
 assert all(sha(root/p)==s for p,s in frozen.items()),'Frozen acceptance changed'
 assert snapshot()==before,'Source changed before '+name
 started=time.monotonic();print('START '+name,flush=True)
 with (out/(name+'.stdout')).open('wb') as stdout,(out/(name+'.stderr')).open('wb') as stderr:result=subprocess.run(args,stdout=stdout,stderr=stderr)
 row={'name':name,'argv':args,'exit':result.returncode,'seconds':time.monotonic()-started,'inputsUnchanged':snapshot()==before};receipt['commands'].append(row);save();print(json.dumps(row),flush=True)
 if result.returncode or not row['inputsUnchanged']:sys.exit(result.returncode or 2)
def browser(name,files):
 args=['docker','run','--pull=never','--rm','--init','--ipc=host','--user',str(os.getuid())+':'+str(os.getgid()),'-v',str(root)+':/work','-w','/work']
 for key in ['COMPACT_PANEL_EVIDENCE_DIR','GEOGRAPHIC_EVIDENCE_DIR','PLAYBACK_EVIDENCE_DIR','REFERENCE_COMPLETE_EVIDENCE_DIR','VERSIONED_MATCH_EVIDENCE_DIR','FRIENDLY_EVIDENCE_DIR','BATTLE_EVIDENCE_DIR','COMPUTER_FLOW_EVIDENCE_DIR']:args+=['-e',key+'='+str(relative/(name+'-screenshots'))]
 args+=['mcr.microsoft.com/playwright:v1.63.0-noble','npx','playwright','test',*files,'--config',str(relative/'playwright.config.ts'),'--output','/work/'+str(relative/(name+'-results')),'--workers=2']
 run(name,args)
start=time.monotonic();save()
run('focused',['npx','vitest','run','tests/ui/compact-panels.test.ts'])
browser('compact-panels',['tests/e2e/compact-panels.spec.ts'])
run('full-tests',['npm','test'])
run('build',['npm','run','build'])
browser('affected',['tests/e2e/'+name+'.spec.ts' for name in ['battle-controls','friendly-move','versioned-match','playback-controls','playback-edge-cases','game-event-log','computer-turn-flow','reference-complete-game','geographic-review-guards','geographic-board']])
receipt['finishedUTC']=datetime.datetime.now(datetime.timezone.utc).isoformat();receipt['validationSeconds']=time.monotonic()-start;receipt['frozenActual']={p:sha(root/p) for p in frozen};receipt['allInputsUnchanged']=snapshot()==before;save();print('ALL VALIDATION PASSED',flush=True)
