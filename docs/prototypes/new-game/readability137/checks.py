from pathlib import Path
import subprocess,tempfile,json,hashlib
root=Path(__file__).resolve().parent
repo=root.parents[3]
out=Path(tempfile.mkdtemp(prefix="checks-",dir=root/"evidence"))
rows=[]
for index,command in enumerate([["npm","test"],["npm","run","build"],["git","diff","--check"]]):
 with (out/f"{index}.txt").open("wb") as log:r=subprocess.run(command,cwd=repo,stdout=log,stderr=subprocess.STDOUT)
 rows.append({"command":command,"exit":r.returncode,"output":f"{index}.txt","sha256":hashlib.sha256((out/f"{index}.txt").read_bytes()).hexdigest(),"tail":(out/f"{index}.txt").read_text()[-1500:]})
(out/"report.json").write_text(json.dumps(rows,indent=2)+"\n")
print(json.dumps({"output":str(out.relative_to(repo)),"results":rows},indent=2))
raise SystemExit(any(r["exit"] for r in rows))
