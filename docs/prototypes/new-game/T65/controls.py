from pathlib import Path
import subprocess,tempfile,json,hashlib,shutil,sys
root=Path(__file__).resolve().parent
repo=root.parents[3]
out=Path(tempfile.mkdtemp(prefix="controls-",dir=root/"evidence"))
sha=lambda b:hashlib.sha256(b).hexdigest()
paths=[root/"borders.mjs",repo/"src/ui/referenceMapView.ts",root/"board.json",root/"map.svg",root/"preview.html"]
original={p:p.read_bytes() for p in paths}
for p,b in original.items():
 dest=out/"originals"/p.relative_to(repo);dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(b)
shutil.copy2(__file__,out/"script-input.py")
layout=original[root/"borders.mjs"].decode()
assert layout.count(" return result;")==1
tail=lambda code:layout.replace(" return result;",code+"\n return result;")
view=original[repo/"src/ui/referenceMapView.ts"].decode()
cases=[
 ("border-identity",root/"borders.mjs","export const naturalizeBorders=input=>structuredClone(input);\n","unit",False),
 ("ignored-seed",root/"borders.mjs",layout.replace("seed=board.seed","seed=board.seed").replace("let hash=seed>>>0","let hash=1994>>>0"),"unit",False),
 ("independent-country-noise",root/"borders.mjs",tail("result.provinces[0].polygon[8][0]+=1;"),"unit",False),
 ("moved-coast",root/"borders.mjs",tail("result.islands[0].polygon[0][0]+=1;"),"unit",False),
 ("moved-label",root/"borders.mjs",tail("result.provinces[0].labelAt[0]+=1;"),"unit",False),
 ("old-painted-borders",repo/"src/ui/referenceMapView.ts",view.replace("T65/map.svg?raw","T64/map.svg?raw"),"playable",False),
]
rows=[]
for name,p,mutant,kind,rebuild in cases:
 if len(sys.argv)>1 and name not in sys.argv[1:]:continue
 if p=="layout":p=root/"borders.mjs"
 case=out/name;case.mkdir();(case/"mutated-source.txt").write_text(mutant)
 row={"name":name,"path":str(p.relative_to(repo)),"originalSha256":sha(original[p]),"mutatedSha256":sha(mutant.encode())}
 try:
  p.write_text(mutant)
  if rebuild:
   generated=case/"regenerated"
   with (case/"build.txt").open("wb") as log:build=subprocess.run(["node",str(root/"construct.mjs"),str(generated)],cwd=repo,stdout=log,stderr=subprocess.STDOUT)
   row["rebuildExit"]=build.returncode
   if build.returncode:raise RuntimeError("Mutant did not regenerate; not a behavioral negative")
   for asset_name in ["board.json","map.svg","preview.html"]:shutil.copy2(generated/asset_name,root/asset_name)
  command=["python3",str(root/"checks.py"),"--focused"] if kind=="unit" else ["python3",str(root/"run.py")]+(["--grep","playable shared borders"] if kind=="playable" else [])
  with (case/"output.txt").open("wb") as log:result=subprocess.run(command,cwd=repo,stdout=log,stderr=subprocess.STDOUT)
  row.update(command=command,exit=result.returncode)
  text=(case/"output.txt").read_text();report=json.loads(text)
  produced=repo/report["output"]
  negative=(produced/"0.txt").read_text() if kind=="unit" else (produced/"raw/output.txt").read_text()
  row["evidence"]=str(produced.relative_to(repo))
  row["assertionNegative"]=result.returncode!=0 and any(token in negative for token in ["AssertionError","expect(received)","Expected:"])
 except Exception as error:row.update(assertionNegative=False,error=repr(error))
 finally:
  for target,b in original.items():target.write_bytes(b)
  row["restored"]=all(target.read_bytes()==b for target,b in original.items())
  rows.append(row)
  (out/"report.json").write_text(json.dumps({"cases":rows,"allRestored":all(r["restored"] for r in rows)},indent=2)+"\n")
print(json.dumps({"output":str(out.relative_to(repo)),"cases":rows},indent=2))
assert rows and all(r["assertionNegative"] and r["restored"] for r in rows)
