"""Check inherited tests/data/goldens; --runtime also proves preflight restoration."""
from pathlib import Path
import hashlib,json,subprocess,sys,tempfile
root=Path(__file__).resolve().parent;repo=root.parents[3];base='63cda030a9ed7a485527c9851eb5423e72cb29cb'
scope=['tests','data','docs/prototypes/new-game/T63/board.json','docs/prototypes/new-game/T63/map.svg']
if '--runtime' in sys.argv:scope+=['src']
paths=subprocess.check_output(['git','ls-tree','-r','--name-only',base,'--',*scope],cwd=repo,text=True).splitlines()
sha=lambda b:hashlib.sha256(b).hexdigest()
rows=[]
for name in paths:
 expected=subprocess.check_output(['git','show',base+':'+name],cwd=repo);actual=(repo/name).read_bytes()
 rows.append({'path':name,'expected':sha(expected),'actual':sha(actual),'equal':actual==expected})
out=Path(tempfile.mkdtemp(prefix='protected-',dir=root/'evidence'))
(out/'report.json').write_text(json.dumps({'base':base,'scope':scope,'files':rows},indent=2)+'\n')
assert all(r['equal'] for r in rows)
print('Protected',len(rows),'inherited files:',out.relative_to(repo))
