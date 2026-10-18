"""Run an expected baseline failure with exact saved-content finally restoration.

Usage: python3 negative-proof.py LABEL COMMAND [ARGS...]
Preserves current candidate bytes before temporarily restoring the active baseline.
"""
from pathlib import Path
from datetime import datetime,timezone
import subprocess,tempfile,hashlib,json,sys,signal
root=Path(__file__).resolve().parent;repo=root.parents[3];prep=root/'parent-preflight'
active=json.loads((prep/'active-baseline.json').read_text());baseline=json.loads((prep/active['manifest']).read_text())
owned=[name for name in baseline if name.startswith('src/') or name in ['README.md','docs/play.md','docs/spike.md','tools/release/PLAY.md']]
owned+=['src/ui/geographicGame.ts','src/ui/geographicMapView.ts','src/ui/matchPresentation.ts']
saved={name:(repo/name).read_bytes() if(repo/name).exists() else None for name in owned};sha=lambda b:hashlib.sha256(b).hexdigest()
out=Path(tempfile.mkdtemp(prefix=sys.argv[1]+'-transaction-',dir=root/'evidence'));(out/'candidate-before').mkdir()
for name,data in saved.items():
 if data is not None:
  target=out/'candidate-before'/name;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data)
report={'command':sys.argv[2:],'activeBaseline':active,'startedUtc':datetime.now(timezone.utc).isoformat(),'beforeHashes':{name:sha(data) if data is not None else None for name,data in saved.items()}}
# Termination raises through finally rather than silently abandoning swapped source.
def interrupted(signum,_frame):raise SystemExit(128+signum)
signal.signal(signal.SIGTERM,interrupted)
try:
 subprocess.run([sys.executable,str(root/'source-state.py'),'restore-baseline'],cwd=repo,check=True)
 result=subprocess.run([sys.executable,str(root/'run-command.py'),sys.argv[1],*sys.argv[2:]],cwd=repo)
 report['negativeExit']=result.returncode;report['failedWithoutBehavior']=result.returncode!=0
finally:
 for name,data in saved.items():
  target=repo/name
  if data is None:
   if target.exists():target.unlink()
  else:target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data)
 report['candidateRestored']=all(((repo/name).read_bytes()==data) if data is not None else not(repo/name).exists() for name,data in saved.items())
 report['afterHashes']={name:sha((repo/name).read_bytes()) if(repo/name).exists() else None for name in saved}
 report['endedUtc']=datetime.now(timezone.utc).isoformat();(out/'report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'transaction':str(out.relative_to(repo)),'failedWithoutBehavior':report.get('failedWithoutBehavior'),'candidateRestored':report['candidateRestored']}))
assert report.get('failedWithoutBehavior') and report['candidateRestored']
