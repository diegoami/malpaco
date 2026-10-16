"""Retain baseline compatibility and frozen fixture checks."""
from pathlib import Path
import subprocess,json,hashlib,tempfile,sys
root=Path(__file__).resolve().parent;repo=root.parents[3]
base="094887184312fcaecf6ba2a183a56a489d7bf33b"
sha=lambda b:hashlib.sha256(b).hexdigest()
paths=subprocess.check_output(["git","ls-tree","-r","--name-only",base,"tests","data","docs/prototypes/new-game/T63/board.json","docs/prototypes/new-game/T63/map.svg"],cwd=repo,text=True).splitlines()
records=[]
for name in paths:
 expected=subprocess.check_output(["git","show",base+":"+name],cwd=repo)
 actual=(repo/name).read_bytes();records.append({"path":name,"expected":sha(expected),"actual":sha(actual),"equal":expected==actual})
manifest=json.loads((root/"fixtures/manifest.json").read_text())
fixtures=[]
for name,expected in manifest["files"].items():
 actual=sha((root/"fixtures"/name).read_bytes());fixtures.append({"path":name,"expected":expected,"actual":actual,"equal":expected==actual})
out=Path(tempfile.mkdtemp(prefix=sys.argv[1]+"-",dir=root/"evidence"))
report={"baseline":base,"inherited":records,"fixtures":fixtures}
(out/"report.json").write_text(json.dumps(report,indent=2)+"\n")
assert all(r["equal"] for r in records+fixtures)
print(json.dumps({"output":str(out.relative_to(repo)),"inherited":len(records),"fixtures":len(fixtures),"allEqual":True}))
