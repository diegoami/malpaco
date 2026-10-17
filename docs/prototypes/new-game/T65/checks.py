from pathlib import Path
import subprocess,tempfile,json,hashlib,tarfile,sys
root=Path(__file__).resolve().parent
repo=root.parents[3]
out=Path(tempfile.mkdtemp(prefix="checks-",dir=root/"evidence"))
files=sorted({p for folder in ['src','tests','data/maps','docs/prototypes/new-game/T63'] for p in (repo/folder).rglob('*') if p.is_file()} | {p for folder in ['T24','T60','T62','T64'] for p in (repo/'docs/prototypes/new-game'/folder).glob('*.mjs')} | set(root.glob('*.mjs')) | {root/'CONTRACT.md',root/'acceptance/board.json',repo/'package.json',repo/'package-lock.json',root/'checks.py'})
sha=lambda b:hashlib.sha256(b).hexdigest()
inputs={str(p.relative_to(repo)):p.read_bytes() for p in files}
with tarfile.open(out/"source-inputs.tar.gz","w:gz") as tar:
 for p in files:tar.add(p,arcname=str(p.relative_to(repo)))
commands=[["npx","vitest","run","tests/ui/region-border-postprocess.test.ts"]] if "--focused" in sys.argv else [["npm","test"],["npm","run","build"],["git","diff","--check"]]
rows=[]
for index,command in enumerate(commands):
 with (out/f"{index}.txt").open("wb") as log:r=subprocess.run(command,cwd=repo,stdout=log,stderr=subprocess.STDOUT)
 rows.append({"command":command,"exit":r.returncode,"output":f"{index}.txt","sha256":sha((out/f"{index}.txt").read_bytes()),"tail":(out/f"{index}.txt").read_text()[-3500:]})
(out/"report.json").write_text(json.dumps({"commands":rows,"sourceHashes":{n:sha(b) for n,b in inputs.items()},"sourcesUnchangedDuringRun":all((repo/n).read_bytes()==b for n,b in inputs.items())},indent=2)+"\n")
print(json.dumps({"output":str(out.relative_to(repo)),"results":rows},indent=2))
raise SystemExit(any(r["exit"] for r in rows))
