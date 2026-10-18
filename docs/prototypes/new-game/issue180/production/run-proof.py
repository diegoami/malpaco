from pathlib import Path
import json,subprocess,time
root=Path('docs/prototypes/new-game/issue180/production');runs=[]
for label,extra in [('including-loose',[]),('committed-only',['--committed-only'])]:
 command=['python3',str(root/'verify-adoption.py'),*extra];start=time.monotonic();result=subprocess.run(command,capture_output=True,text=True)
 runs.append({'label':label,'argv':command,'exit':result.returncode,'seconds':time.monotonic()-start,'stdout':result.stdout,'stderr':result.stderr})
 if result.returncode:break
(root/'verification.json').write_text(json.dumps({'purpose':'Fresh read-only adoption/archive proof; no new heavy tests','runs':runs},indent=2)+'\n')
for run in runs:print(json.dumps(run))
raise SystemExit(runs[-1]['exit'])
