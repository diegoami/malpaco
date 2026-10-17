from pathlib import Path
import subprocess,tempfile,json,hashlib,shutil,sys
root=Path(__file__).resolve().parent
repo=root.parents[3]
out=Path(tempfile.mkdtemp(prefix="controls-",dir=root/"evidence"))
sha=lambda b:hashlib.sha256(b).hexdigest()
paths=[root/"layout.mjs",root/"render.mjs",repo/"src/ui/referenceMapView.ts",root/"board.json",root/"map.svg",root/"preview.html"]
original={p:p.read_bytes() for p in paths}
for p,b in original.items():
 dest=out/"originals"/p.relative_to(repo);dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(b)
shutil.copy2(__file__,out/"script-input.py")
layout=original[root/"layout.mjs"].decode()
ending=" board.routes=routed;\n return board;"
assert layout.count(ending)==1
tail=lambda code:layout.replace(ending," board.routes=routed;\n "+code+"\n return board;")
view=original[repo/"src/ui/referenceMapView.ts"].decode()
star='x:Number(n.querySelector(".count")!.getAttribute("x"))-25,y:Number(n.querySelector(".count")!.getAttribute("y"))-28'
assert view.count(star)==1
render=original[root/"render.mjs"].decode()
start=render.index("export function svg(board){");end=render.index("export const html=",start)
quiet='\n.country .name{font-size:9px;font-weight:400;stroke:none}.country:is(:hover,:focus,.selected) .name{font-size:12px;font-weight:600;stroke:#f8f2e2;stroke-width:1.5}</style>'
raw_caption=render[:start]+"export const svg=board=>inheritedSvg(board).replace('</style>',"+json.dumps(quiet)+");\n"+render[end:]
cases=[
 ("coast-identity",root/"layout.mjs","export const coastPostprocess=input=>structuredClone(input);\n","unit",False),
 ("graph-metadata",root/"layout.mjs",tail("board.provinces[0].borders=[];"),"unit",False),
 ("capture-port-inland",root/"layout.mjs",tail("board.routes[0].points[0]=[...board.provinces.find(p=>p.id===board.routes[0].from).labelAt];"),"unit",False),
 ("label-outside-country",root/"layout.mjs",tail("board.provinces[0].labelAt=[...board.islands.find(i=>i.id===board.provinces[0].island).polygon[0]];"),"unit",False),
 ("stateful-construction","layout", "let mutationCalls=0;\n"+tail("board.provinces[0].polygon[0][0]+=(++mutationCalls%2)/1024;"),"unit",False),
 ("old-painted-map",repo/"src/ui/referenceMapView.ts",view.replace("T64/map.svg?raw","T63/map.svg?raw"),"playable",False),
 ("canonical-star-positions",repo/"src/ui/referenceMapView.ts",view.replace(star,'x:_map.provinces.find(p=>p.id===id)!.labelAt[0]-25,y:_map.provinces.find(p=>p.id===id)!.labelAt[1]-10'),"playable",False),
 ("caption-reservations",root/"render.mjs",raw_caption,"browser",True),
]
rows=[]
for name,p,mutant,kind,rebuild in cases:
 if len(sys.argv)>1 and name not in sys.argv[1:]:continue
 if p=="layout":p=root/"layout.mjs"
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
  command=["python3",str(root/"checks.py"),"--focused"] if kind=="unit" else ["python3",str(root/"run.py")]+(["--grep","playable geography"] if kind=="playable" else [])
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
