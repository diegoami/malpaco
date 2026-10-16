"""Create a new immutable revision index; never overwrite a prior measurement."""
from pathlib import Path
import subprocess,hashlib,tarfile,json,sys
root=Path(__file__).resolve().parent;repo=root.parents[3];out=root/sys.argv[1];assert not out.exists()
owned=subprocess.check_output(['git','ls-files','--cached','--others','--exclude-standard',str(root.relative_to(repo))],cwd=repo,text=True).splitlines()
extra=['docs/tasks/T30.md','docs/spike.md','RUN-NOTES.md','src/main.ts','src/styles.css','package-lock.json','playwright.config.ts','tests/helpers/complete-game.ts','docs/prototypes/new-game/T63/board.json','docs/prototypes/new-game/T63/map.svg','data/maps/small_sea.json']
paths={repo/p for p in owned+extra}|set((repo/'src/core').rglob('*.ts'))|set((repo/'src/ui').rglob('*.ts'))|set((repo/'tests/core').glob('*.ts'))|set((repo/'tests/ui').glob('*.ts'))|set((repo/'tests/e2e').glob('*.ts'))|set((repo/'tests/e2e').rglob('*.png'))
sha=lambda b:hashlib.sha256(b).hexdigest();records=[]
for p in sorted(paths):
 if not p.is_file() or p==out:continue
 records.append(['file',str(p.relative_to(repo)),sha(p.read_bytes())])
 if p.name.endswith('.tar.gz'):
  with tarfile.open(p) as a:
   records.extend(['member',str(p.relative_to(repo)),m.name,sha(a.extractfile(m).read())] for m in a.getmembers() if m.isfile())
parts=[]
for i in range(0,len(records),60):
 p=out.with_name(out.stem+f'.part-{i//60:02d}.json');assert not p.exists();p.write_text(json.dumps({'records':records[i:i+60]},indent=2)+'\n');parts.append({'path':str(p.relative_to(repo)),'sha256':sha(p.read_bytes())})
out.write_text(json.dumps({'algorithm':'sha256','parts':parts},indent=2)+'\n');print(out.relative_to(repo))
