from pathlib import Path
import subprocess,tempfile,json,hashlib
D=Path('docs/prototypes/new-game/T34').resolve();R=Path.cwd();out=Path(tempfile.mkdtemp(prefix='r2-final-',dir=D/'evidence'));results=[]
checks=[('r2-final-focused',['npx','vitest','run','tests/core/island-geography.test.ts']),('r2-final-sweep',['node','docs/prototypes/new-game/T34/sweep.mjs']),('r2-final-units',['npm','test']),('r2-final-build',['npm','run','build']),('r2-final-browser',['python3',str(D/'run-browser.py'),'r2-final-browser','--suites','tests/e2e/reference-complete-game.spec.ts,tests/e2e/reference-game.spec.ts,tests/e2e/versioned-match.spec.ts,tests/e2e/entry.spec.ts'])]
for label,cmd in checks:
 command=cmd if label.endswith('browser') else ['python3',str(D/'run-command.py'),label,*cmd]
 p=subprocess.run(command,cwd=R,capture_output=True);(out/(label+'.json')).write_text(json.dumps({'command':command,'exit':p.returncode,'output':p.stdout.decode(),'stderr':p.stderr.decode()},indent=2)+'\n');results.append({'label':label,'exit':p.returncode});print(json.dumps(results[-1]),flush=True)
 if p.returncode:break
(out/'report.json').write_text(json.dumps({'results':results,'coreSha256':hashlib.sha256((R/'src/core/island-geography.ts').read_bytes()).hexdigest(),'allPassed':len(results)==5 and all(r['exit']==0 for r in results)},indent=2)+'\n');print(str(out),flush=True);assert len(results)==5 and all(r['exit']==0 for r in results)
