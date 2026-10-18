"""Retain an exact preflight command and source bytes. No command runs on import."""
from pathlib import Path
from datetime import datetime, timezone
import subprocess,tempfile,tarfile,hashlib,json,sys,time,io
root=Path(__file__).resolve().parent;repo=root.parents[3]
(root/'evidence').mkdir(exist_ok=True)
out=Path(tempfile.mkdtemp(prefix=sys.argv[1]+'-',dir=root/'evidence'))
inputs={}
for folder in ['src','tests','data']:
 for p in (repo/folder).rglob('*'):
  if p.is_file():inputs[str(p.relative_to(repo))]=p.read_bytes()
for folder in ['T24','T34','T35','T60','T61','T62','T63','T64','T65','T36']:
 for p in (repo/'docs/prototypes/new-game'/folder).glob('*'):
  if p.is_file():inputs[str(p.relative_to(repo))]=p.read_bytes()
for name in ['package.json','package-lock.json','vite.config.ts','playwright.config.ts','playwright.release.config.ts','README.md','docs/play.md','tools/release/PLAY.md','docs/spike.md']:
 p=repo/name
 if p.is_file():inputs[name]=p.read_bytes()
for p in (repo/'docs/prototypes/new-game/T31/fixtures').glob('*.json'):inputs[str(p.relative_to(repo))]=p.read_bytes()
sha=lambda b:hashlib.sha256(b).hexdigest()
with tarfile.open(out/'source-inputs.tar.gz','w:gz') as archive:
 for name,data in sorted(inputs.items()):
  item=tarfile.TarInfo(name);item.size=len(data);archive.addfile(item,io.BytesIO(data))
started=datetime.now(timezone.utc).isoformat();clock=time.monotonic()
# Logs stream directly to files; a failed command and partial output remain intact.
with (out/'stdout.txt').open('wb') as stdout,(out/'stderr.txt').open('wb') as stderr:
 result=subprocess.run(sys.argv[2:],cwd=repo,stdout=stdout,stderr=stderr)
streams={p.name:sha(p.read_bytes()) for p in [out/'stdout.txt',out/'stderr.txt']}
report={'startedUtc':started,'endedUtc':datetime.now(timezone.utc).isoformat(),'durationSeconds':time.monotonic()-clock,'command':sys.argv[2:],'exit':result.returncode,'sourceHashes':{name:sha(data) for name,data in inputs.items()},'sourcesUnchangedDuringRun':all((repo/name).is_file() and (repo/name).read_bytes()==data for name,data in inputs.items()),'sourceArchiveHash':sha((out/'source-inputs.tar.gz').read_bytes()),'logHashes':streams}
(out/'report.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'output':str(out.relative_to(repo)),'exit':result.returncode,'stdoutTail':(out/'stdout.txt').read_text(errors='replace')[-4000:],'stderrTail':(out/'stderr.txt').read_text(errors='replace')[-4000:]},indent=2))
sys.exit(result.returncode)
