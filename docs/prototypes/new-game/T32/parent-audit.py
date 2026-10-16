"""Protect inherited assertions, goldens, data and frozen replay files against T31."""
from pathlib import Path
import subprocess,json,hashlib,tempfile,sys
root=Path(__file__).resolve().parent;repo=root.parents[3];base='6117f4f408e79791a64cf1678ad084c8793fe8c3'
paths=subprocess.check_output(['git','ls-tree','-r','--name-only',base,'tests','data','docs/prototypes/new-game/T63/board.json','docs/prototypes/new-game/T63/map.svg','docs/prototypes/new-game/T31/fixtures'],cwd=repo,text=True).splitlines()
aligned={f'tests/e2e/{name}.spec.ts' for name in ['battle-accessibility','battle-controls','friendly-feedback','friendly-move','victory-options']}
sha=lambda b:hashlib.sha256(b).hexdigest();records=[]
for p in paths:
 old=subprocess.check_output(['git','show',base+':'+p],cwd=repo);expected=old
 if p in aligned:expected=old.decode().replace('/?view=reference-game"','/?view=reference-game&control=manual"').replace('getByLabel("Human seats")','getByLabel("Seats",{exact:true})').encode()
 actual=(repo/p).read_bytes();records.append({'path':p,'original':sha(old),'expected':sha(expected),'actual':sha(actual),'declaredFixtureAlignment':p in aligned,'equal':actual==expected})
out=Path(tempfile.mkdtemp(prefix=sys.argv[1]+'-',dir=root/'evidence'))
(out/'report.json').write_text(json.dumps({'baseline':base,'records':records,'allEqual':all(r['equal'] for r in records)},indent=2)+'\n')
assert all(r['equal'] for r in records)
print(json.dumps({'output':str(out.relative_to(repo)),'protectedFiles':len(records),'allEqual':True}))
