from pathlib import Path
import hashlib,subprocess,json,tempfile
root=Path(__file__).resolve().parent;repo=root.parents[3]
base="cb6b4a012131c2da2300d1378d86d7bb314b56ec"
allowed={'src/ui/battleView.ts', 'tests/e2e/friendly-move.spec.ts', 'tests/e2e/battle-controls.spec.ts', 'tests/e2e/battle-accessibility.spec.ts', 'tests/e2e/victory-options.spec.ts', 'src/ui/mapView.ts', 'src/ui/referenceMapView.ts', 'tests/e2e/versioned-match.spec.ts', 'tests/e2e/friendly-feedback.spec.ts', 'src/ui/referenceBattleGame.ts'}
args=["git","ls-tree","-r",base,"--","src","tests","data","docs/prototypes/new-game/T63","package.json","package-lock.json","playwright.config.ts","vite.config.ts"]
rows=[]
for line in subprocess.check_output(args,cwd=repo,text=True).splitlines():
 metadata,name=line.split("\t");expected=metadata.split()[2];p=repo/name;b=p.read_bytes();actual=hashlib.sha1(b"blob "+str(len(b)).encode()+b"\0"+b).hexdigest()
 rows.append({"path":name,"baseBlob":expected,"actualBlob":actual,"declaredInputChange":name in allowed,"matches":expected==actual})
out=Path(tempfile.mkdtemp(prefix="inheritance-",dir=root/"evidence"));(out/"report.json").write_text(json.dumps({"base":base,"files":rows},indent=2)+"\n")
assert all(r["matches"] or r["declaredInputChange"] for r in rows)
print(f"{len(rows)} inherited files checked; only {sum(not r['matches'] for r in rows)} declared input paths differ; {out.relative_to(repo)}")
