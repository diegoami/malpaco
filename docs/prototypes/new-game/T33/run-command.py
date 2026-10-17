"""Retain one exact command in a fresh owned evidence directory."""
from pathlib import Path
import subprocess,tempfile,tarfile,io,hashlib,json,sys
root=Path(__file__).resolve().parent;repo=root.parents[3]
(root/'evidence').mkdir(exist_ok=True)
out=Path(tempfile.mkdtemp(prefix=sys.argv[1]+'-',dir=root/'evidence'))
inputs={str(p.relative_to(repo)):p.read_bytes() for folder in ['src/core','src/ui','tests/core','tests/ui','tests/e2e'] for p in (repo/folder).rglob('*.ts')}
inputs.update({str(p.relative_to(repo)):p.read_bytes() for p in (repo/'docs/prototypes/new-game/T31/fixtures').glob('*.json')})
inputs['docs/prototypes/new-game/T63/board.json']=(repo/'docs/prototypes/new-game/T63/board.json').read_bytes()
for folder in ['T24','T60','T62','T64','T65']:
 for p in (repo/'docs/prototypes/new-game'/folder).glob('*'):
  if p.is_file():inputs[str(p.relative_to(repo))]=p.read_bytes()
for name in ['package.json','package-lock.json','vitest.config.ts','docs/prototypes/map-1994/preview.html']:
 p=repo/name
 if p.is_file():inputs[name]=p.read_bytes()
for folder in ['src','tests','data',str(root.relative_to(repo)/'fixtures')]:
 for p in (repo/folder).rglob('*'):
  if p.is_file():inputs[str(p.relative_to(repo))]=p.read_bytes()
for name in ['docs/prototypes/new-game/T64/acceptance/board.json','docs/prototypes/new-game/T65/acceptance/board.json']:
 inputs[name]=(repo/name).read_bytes()
with tarfile.open(out/'source-inputs.tar.gz','w:gz') as a:
 for name,data in inputs.items():entry=tarfile.TarInfo(name);entry.size=len(data);a.addfile(entry,io.BytesIO(data))
r=subprocess.run(sys.argv[2:],cwd=repo,capture_output=True)
sha=lambda b:hashlib.sha256(b).hexdigest()
streams={'stdout.txt':r.stdout,'stderr.txt':r.stderr}
with tarfile.open(out/'raw-logs.tar.gz','w:gz') as a:
 for name,data in streams.items():entry=tarfile.TarInfo(name);entry.size=len(data);entry.mtime=0;a.addfile(entry,io.BytesIO(data))
with tarfile.open(out/'raw-logs.tar.gz') as a:assert all(a.extractfile(n).read()==b for n,b in streams.items())
report={'sourceHashes':{p:sha(b) for p,b in inputs.items()},'sourcesUnchangedDuringRun':all((repo/p).read_bytes()==b for p,b in inputs.items()),'command':sys.argv[2:],'exit':r.returncode,'stdoutTail':r.stdout.decode(errors='replace')[-4000:],'stderrTail':r.stderr.decode(errors='replace')[-4000:],'archiveSha256':sha((out/'raw-logs.tar.gz').read_bytes()),'archiveMemberHashes':{n:sha(b) for n,b in streams.items()}}
(out/'report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'output':str(out.relative_to(repo)),'exit':r.returncode,'stdoutTail':report['stdoutTail'],'stderrTail':report['stderrTail']},indent=2));sys.exit(r.returncode)
