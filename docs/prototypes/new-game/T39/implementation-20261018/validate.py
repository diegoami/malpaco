from pathlib import Path
import hashlib,json,subprocess,time,datetime,os,sys,shutil
root=Path.cwd();out=Path(__file__).resolve().parent;relative=out.relative_to(root)
manifestPaths=['docs/prototypes/new-game/T39/parent-acceptance/FROZEN-ACCEPTANCE.json','docs/prototypes/new-game/T71/parent-acceptance/FROZEN-ACCEPTANCE.json']
groups={name:json.loads((root/name).read_text()) for name in manifestPaths};frozen={name:h for group in groups.values() for name,h in group.items()}
assert [len(g) for g in groups.values()]==[9,19] and len(frozen)==28
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();manifestHashes={name:sha(root/name) for name in manifestPaths}
def snapshot():return {str(p.relative_to(root)):sha(p) for folder in ['src','tests','data'] for p in sorted((root/folder).rglob('*')) if p.is_file()}
before=snapshot()
for name in before:
 target=out/'inputs'/name;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(root/name,target)
receipt={'sourceCommit':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'startedUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'inputHashes':before,'commands':[],'frozenExpected':groups,'manifestHashes':manifestHashes}
def save():(out/'validation.json').write_text(json.dumps(receipt,indent=2)+'\n')
def stable():return snapshot()==before and all(sha(root/p)==s for p,s in frozen.items()) and all(sha(root/p)==s for p,s in manifestHashes.items())
def run(name,args):
 assert stable(),'Inputs changed before '+name
 start=time.monotonic();print('START '+name,flush=True)
 with (out/(name+'.stdout')).open('wb') as stdout,(out/(name+'.stderr')).open('wb') as stderr:result=subprocess.run(args,stdout=stdout,stderr=stderr)
 row={'name':name,'argv':args,'exit':result.returncode,'seconds':time.monotonic()-start,'inputsUnchanged':stable()};receipt['commands'].append(row);save();print(json.dumps(row),flush=True)
 if result.returncode or not row['inputsUnchanged']:sys.exit(result.returncode or 2)
def browser(name,files,compact=False):
 shots=out/(name+'-screenshots');shots.mkdir()
 args=['docker','run','--pull=never','--rm','--init','--ipc=host','--user',str(os.getuid())+':'+str(os.getgid()),'-v',str(root)+':/work','-w','/work','-v',str(shots)+':/work/screenshots']
 for key in ['COMPACT_PANEL_EVIDENCE_DIR','GEOGRAPHIC_EVIDENCE_DIR','PLAYBACK_EVIDENCE_DIR','REFERENCE_COMPLETE_EVIDENCE_DIR','VERSIONED_MATCH_EVIDENCE_DIR','FRIENDLY_EVIDENCE_DIR','BATTLE_EVIDENCE_DIR','COMPUTER_FLOW_EVIDENCE_DIR']:args+=['-e',key+'='+str(relative/(name+'-screenshots'))]
 config='docs/prototypes/new-game/T71/parent-acceptance/playwright.config.ts' if compact else str(relative/'playwright.config.ts')
 args+=['-e','COMPACT_PANEL_RESULTS_DIR=/work/'+str(relative/(name+'-results')),'mcr.microsoft.com/playwright:v1.63.0-noble','npx','playwright','test',*files,'--config',config,'--output','/work/'+str(relative/(name+'-results')),'--workers=2'];run(name,args)
start=time.monotonic();save()
run('raid',['npx','vitest','run','tests/core/raid-shield.test.ts'])
run('replay',['npx','vitest','run','tests/core/raid-shield-replay.test.ts'])
run('full-tests',['npm','test'])
run('build',['npm','run','build'])
browser('affected',['tests/e2e/'+name+'.spec.ts' for name in ['versioned-match','reference-complete-game','game-event-log','geographic-review-guards']])
browser('compact',['tests/e2e/compact-panels.spec.ts'],True)
receipt['finishedUTC']=datetime.datetime.now(datetime.timezone.utc).isoformat();receipt['validationSeconds']=time.monotonic()-start;receipt['frozenActual']={group:{p:sha(root/p) for p in files} for group,files in groups.items()};receipt['allInputsUnchanged']=stable();save();print('ALL VALIDATION PASSED',flush=True)
