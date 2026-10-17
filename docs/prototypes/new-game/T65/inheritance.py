from pathlib import Path
import hashlib,subprocess,json,tempfile
root=Path(__file__).resolve().parent;repo=root.parents[3]
base="439856b"
allowed={'tests/e2e/coast-postprocess.spec.ts','src/ui/referenceMapView.ts','tests/e2e/reference-game.spec.ts','tests/e2e/reference-game.spec.ts-snapshots/reference-game-1280x800-linux.png','tests/e2e/reference-game.spec.ts-snapshots/reference-game-1920x1080-linux.png'}
args=["git","ls-tree","-r",base,"--","src","tests","data","docs/prototypes/new-game/T63","docs/prototypes/new-game/T64","docs/prototypes/map-1994","package.json","package-lock.json","playwright.config.ts","vite.config.ts"]
rows=[]
for line in subprocess.check_output(args,cwd=repo,text=True).splitlines():
 metadata,name=line.split("\t");expected=metadata.split()[2];p=repo/name;b=p.read_bytes();actual=hashlib.sha1(b"blob "+str(len(b)).encode()+b"\0"+b).hexdigest()
 rows.append({"path":name,"baseBlob":expected,"actualBlob":actual,"declaredInputChange":name in allowed,"matches":expected==actual})
out=Path(tempfile.mkdtemp(prefix="inheritance-",dir=root/"evidence"));(out/"report.json").write_text(json.dumps({"base":base,"files":rows},indent=2)+"\n")
assert all(r["matches"] or r["declaredInputChange"] for r in rows)
print(f"{len(rows)} inherited files checked; only {sum(not r['matches'] for r in rows)} declared input paths differ; {out.relative_to(repo)}")
