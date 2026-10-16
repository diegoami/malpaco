"""Retain one exact command in a fresh owned evidence directory."""
from pathlib import Path
import subprocess,tempfile,tarfile,io,hashlib,json,sys
root=Path(__file__).resolve().parent;repo=root.parents[3]
out=Path(tempfile.mkdtemp(prefix=sys.argv[1]+'-',dir=root/'evidence'))
r=subprocess.run(sys.argv[2:],cwd=repo,capture_output=True)
sha=lambda b:hashlib.sha256(b).hexdigest()
streams={'stdout.txt':r.stdout,'stderr.txt':r.stderr}
with tarfile.open(out/'raw-logs.tar.gz','w:gz') as a:
 for name,data in streams.items():entry=tarfile.TarInfo(name);entry.size=len(data);entry.mtime=0;a.addfile(entry,io.BytesIO(data))
with tarfile.open(out/'raw-logs.tar.gz') as a:assert all(a.extractfile(n).read()==b for n,b in streams.items())
report={'command':sys.argv[2:],'exit':r.returncode,'stdoutTail':r.stdout.decode(errors='replace')[-4000:],'stderrTail':r.stderr.decode(errors='replace')[-4000:],'archiveSha256':sha((out/'raw-logs.tar.gz').read_bytes()),'archiveMemberHashes':{n:sha(b) for n,b in streams.items()}}
(out/'report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'output':str(out.relative_to(repo)),'exit':r.returncode,'stdoutTail':report['stdoutTail'],'stderrTail':report['stderrTail']},indent=2));sys.exit(r.returncode)
