"""Preserve ignored reviewer outputs before temporary worktree cleanup."""
from pathlib import Path
import hashlib,io,json,subprocess,sys,tarfile,tempfile
root=Path(__file__).resolve().parent;source=Path(sys.argv[1]);out=Path(tempfile.mkdtemp(prefix=sys.argv[2]+"-",dir=root/"evidence"))
sha=lambda b:hashlib.sha256(b).hexdigest()
files={}
tracked=set(subprocess.check_output(["git","ls-files"],cwd=source,text=True).splitlines())
for folder in ["screenshots","test-results","playwright-report","docs/prototypes/new-game/T31/evidence"]:
 for path in (source/folder).rglob("*"):
  if path.is_file() and not path.is_symlink():
   try:
    name=str(path.relative_to(source))
    if folder.startswith("docs/") and name in tracked: continue
    files[name]=path.read_bytes()
   except FileNotFoundError: pass
for name in subprocess.check_output(["git","ls-files","--others","--exclude-standard"],cwd=source,text=True).splitlines():
 path=source/name
 if path.is_file() and not path.is_symlink(): files[name]=path.read_bytes()
outside=Path("/tmp/check-legacy.mjs")
if outside.is_file(): files["outside/check-legacy.mjs"]=outside.read_bytes()
# This is a filesystem checkpoint, not proof that outputs share one source revision.
for folder in ["src/core","src/ui","tests/core","tests/ui","tests/e2e"]:
 for path in (source/folder).rglob("*.ts"):files[str(path.relative_to(source))]=path.read_bytes()
files["capture-tool.py"]=Path(__file__).read_bytes()
with tarfile.open(out/"filesystem-checkpoint.tar.gz","x:gz") as archive:
 for name,data in files.items():entry=tarfile.TarInfo(name);entry.size=len(data);archive.addfile(entry,io.BytesIO(data))
with tarfile.open(out/"filesystem-checkpoint.tar.gz") as archive:assert all(archive.extractfile(n).read()==b for n,b in files.items())
head=subprocess.check_output(["git","rev-parse","HEAD"],cwd=source,text=True).strip()
report={"reviewWorktree":str(source),"reviewedHead":head,"kind":"filesystem checkpoint; not a command-input or complete-run receipt","files":{n:sha(b) for n,b in files.items()},"archiveSha256":sha((out/"filesystem-checkpoint.tar.gz").read_bytes())}
(out/"report.json").write_text(json.dumps(report,indent=2)+"\n")
print(json.dumps({"output":str(out),"files":len(files)}))
