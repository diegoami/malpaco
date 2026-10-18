from pathlib import Path
import subprocess,time,json
root=Path('docs/prototypes/new-game/issue180/download-rate-correction/production');command=['python3',str(root/'verify-correction.py')];start=time.monotonic();result=subprocess.run(command,capture_output=True,text=True)
record={'argv':command,'exit':result.returncode,'seconds':time.monotonic()-start,'stdout':result.stdout,'stderr':result.stderr,'purpose':'Fresh bounded committed correction proof; no archive recomputation or heavy tests'}
(root/'verification.json').write_text(json.dumps(record,indent=2)+'\n');print(json.dumps(record));raise SystemExit(result.returncode)
