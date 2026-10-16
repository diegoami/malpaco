"""Create a fresh immutable source/evidence/archive index for this revision."""
from pathlib import Path
import subprocess,hashlib,json,tarfile,sys
root=Path(__file__).resolve().parent;repo=root.parents[3]
out=root/(sys.argv[1] if len(sys.argv)>1 else 'artifacts.v2.sha256.json')
assert not out.exists(),'Use a new index name'
owned=subprocess.check_output(['git','ls-files','--cached','--others','--exclude-standard',str(root.relative_to(repo))],cwd=repo,text=True).splitlines()
extra=['docs/tasks/T27.md','RUN-NOTES.md',*['tests/e2e/'+n+'.spec.ts' for n in ['complete-game','match-save','reference-game','generated-game','game-setup','computer','slice']],'src/main.ts','src/styles.css','tests/core/reference-game.test.ts','tests/core/reference-map-validation.test.ts','tests/e2e/reference-game.spec.ts','tests/helpers/complete-game.ts','docs/spike.md','docs/prototypes/new-game/T63/board.json','docs/prototypes/new-game/T63/map.svg','playwright.config.ts','package-lock.json']
paths={repo/p for p in owned+extra}|set((repo/'src/core').glob('*.ts'))|set((repo/'tests/core').glob('capture-choice*.ts'))|set((repo/'src/ui').glob('*.ts'))|set((repo/'tests/e2e/reference-game.spec.ts-snapshots').glob('*.png'))
paths=sorted(p for p in paths if p.is_file() and p!=out)
sha=lambda b:hashlib.sha256(b).hexdigest();archives={}
for p in paths:
 if p.name.endswith('.tar.gz'):
  with tarfile.open(p) as a:archives[str(p.relative_to(repo))]={m.name:sha(a.extractfile(m).read()) for m in a.getmembers() if m.isfile()}
records=[('file',p,h) for p,h in {str(p.relative_to(repo)):sha(p.read_bytes()) for p in paths}.items()]+[('member',p,n,h) for p,members in archives.items() for n,h in members.items()]
parts=[]
for i in range(0,len(records),60):
 part=out.with_name(out.stem+f'.part-{i//60:02d}.json');assert not part.exists()
 part.write_text(json.dumps({'records':records[i:i+60]},indent=2)+'\n')
 parts.append({'path':str(part.relative_to(repo)),'sha256':sha(part.read_bytes())})
out.write_text(json.dumps({'algorithm':'sha256','pathsRelativeTo':'repository root','parts':parts},indent=2)+'\n');print(out)
