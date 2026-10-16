"""Prove old tests/data/goldens, parent assertions and CSS prefix remain intact."""
from pathlib import Path
import subprocess,hashlib,json,tempfile
root=Path(__file__).resolve().parent;repo=root.parents[3]
base='759faea5a6aab521cd9ee233c8343a90f881bcb7';parent='d400f24'
sha=lambda b:hashlib.sha256(b).hexdigest()
paths=subprocess.check_output(['git','ls-tree','-r','--name-only',base,'tests','data'],cwd=repo,text=True).splitlines()
paths += ['docs/prototypes/new-game/T63/board.json','docs/prototypes/new-game/T63/map.svg','src/ui/prototype/preview.ts']
records={}
for p in paths:
 b=subprocess.check_output(['git','show',base+':'+p],cwd=repo);current=(repo/p).read_bytes();assert b==current,p;records[p]=sha(b)
for p in ['tests/core/friendly-move.test.ts','tests/e2e/friendly-move.spec.ts']:
 b=subprocess.check_output(['git','show',parent+':'+p],cwd=repo);assert b==(repo/p).read_bytes(),p;records[p]=sha(b)
fixture='tests/e2e/friendly-fixture.ts';old=subprocess.check_output(['git','show',parent+':'+fixture],cwd=repo);assert (repo/fixture).read_bytes().startswith(old)
css=subprocess.check_output(['git','show',base+':src/styles.css'],cwd=repo);assert (repo/'src/styles.css').read_bytes().startswith(css)
out=Path(tempfile.mkdtemp(prefix='protected-',dir=root/'evidence'))
(out/'report.json').write_text(json.dumps({'base':base,'parent':parent,'unchanged':records,'oldCssExactPrefix':True,'parentFixtureExactPrefix':True},indent=2)+'\n');print(f'{len(records)} files byte-exact; CSS and parent fixture exact prefixes; {out.relative_to(repo)}')
