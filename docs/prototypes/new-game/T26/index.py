"""Create a fresh immutable source/evidence/archive index for this revision."""
from pathlib import Path
import subprocess,hashlib,json,tarfile,sys
root=Path(__file__).resolve().parent;repo=root.parents[3]
out=root/(sys.argv[1] if len(sys.argv)>1 else 'artifacts.sha256.json')
assert not out.exists(),'Use a new index name'
owned=subprocess.check_output(['git','ls-files','--cached','--others','--exclude-standard',str(root.relative_to(repo))],cwd=repo,text=True).splitlines()
extra=['src/main.ts','src/styles.css','tests/core/reference-game.test.ts','tests/core/reference-map-validation.test.ts','tests/e2e/reference-game.spec.ts','tests/helpers/complete-game.ts','docs/spike.md','docs/prototypes/new-game/T63/board.json','docs/prototypes/new-game/T63/map.svg','playwright.config.ts','package-lock.json']
paths={repo/p for p in owned+extra}|set((repo/'src/core').glob('*.ts'))|set((repo/'src/ui').glob('*.ts'))|set((repo/'tests/e2e/reference-game.spec.ts-snapshots').glob('*.png'))
paths=sorted(p for p in paths if p.is_file() and p!=out)
sha=lambda b:hashlib.sha256(b).hexdigest();archives={}
for p in paths:
 if p.name.endswith('.tar.gz'):
  with tarfile.open(p) as a:archives[str(p.relative_to(repo))]={m.name:sha(a.extractfile(m).read()) for m in a.getmembers() if m.isfile()}
out.write_text(json.dumps({'algorithm':'sha256','pathsRelativeTo':'repository root','excludes':[str(out.relative_to(repo))+' (self)','ignored loose originals preserved in archives'],'hashes':{str(p.relative_to(repo)):sha(p.read_bytes()) for p in paths},'archiveMembers':archives},indent=2)+'\n');print(out)
