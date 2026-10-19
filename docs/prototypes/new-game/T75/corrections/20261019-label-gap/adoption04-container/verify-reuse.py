from pathlib import Path
import subprocess,hashlib,json,stat
root=Path.cwd();base=Path(__file__).resolve().parent;revision='8d669a275e9130134a3052239aa8abaefbf0c50c'
def tree(rev):
 rows={}
 for raw in subprocess.check_output(['git','ls-tree','-rz',rev]).split(b'\0'):
  if raw:
   info,path=raw.split(b'\t',1);mode,kind,blob=info.decode().split();rows[path.decode()]={'mode':mode,'blob':blob}
 return rows
a=tree(revision);b=tree('HEAD')
def selected(p):
 return p.startswith(('src/','tests/','tools/','public/','data/','docs/prototypes/dev-watch/issue187/','docs/prototypes/new-game/T71/fixtures/','docs/prototypes/new-game/T74/acceptance/','docs/prototypes/new-game/T75/production-candidate/','docs/prototypes/new-game/T75/preflight/phase-b-20261018-01/fixtures/','docs/prototypes/new-game/T36/')) or p in ['package.json','package-lock.json','playwright.config.ts','playwright.release.config.ts','vite.config.ts','tsconfig.json','docs/prototypes/new-game/T75/corrections/20261019-label-gap/candidate.ts','docs/prototypes/new-game/T75/corrections/20261019-label-gap/contract.md','docs/prototypes/new-game/T75/corrections/20261019-label-gap/FROZEN.json'] or Path(p).name.startswith('tsconfig')
paths={p for p in a if selected(p)}|{p for p in b if selected(p)};rows={}
for p in sorted(paths):
 assert a.get(p)==b.get(p),p
 data=subprocess.check_output(['git','show',revision+':'+p]);actual=root/p;assert actual.read_bytes()==data,p;assert bool(actual.stat().st_mode&0o111)==(a[p]['mode']=='100755'),p
 rows[p]={**a[p],'sha256':hashlib.sha256(data).hexdigest()}
artifact=json.loads((root/'docs/prototypes/new-game/T75/corrections/20261019-label-gap/adoption02/artifact.json').read_text());package=Path('/home/diego/projects/malpaco/.cache/runtime/tmp/malpaco-t75-label-gap-bmsp3ozd/malpaco-playable');hashes={str(p.relative_to(package)):hashlib.sha256(p.read_bytes()).hexdigest() for p in package.rglob('*') if p.is_file()};assert hashes==artifact['packageHashes'];archive=root/'docs/prototypes/new-game/T75/corrections/20261019-label-gap/adoption02/fresh-outputs/release/malpaco-playable.tar.gz';assert hashlib.sha256(archive.read_bytes()).hexdigest()==artifact['archiveSha256'];assert json.loads((package/'BUILD.json').read_text())['sourceCommit']==revision
receipt={'authorityCommit':revision,'currentHead':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'exactInputs':rows,'inputCount':len(rows),'packageHashes':hashes,'packageModes':{str(p.relative_to(package)):stat.S_IMODE(p.stat().st_mode) for p in package.rglob('*') if p.is_file()},'archiveSha256':artifact['archiveSha256'],'reusedActualResults':{'npmVitest':818,'npmHarness':9,'staticPackageFiles':10,'checksumEntries':9,'HTTPPaths':4},'newHeavyRuns':0,'limitation':'Only npm/static package reused; prior controls failed and old165/166 remains historical.'};(base/'reuse-receipt.json').write_text(json.dumps(receipt,indent=2)+'\n');print('Exact runtime/test/tool/fixture Git blob/mode and working-byte equalities:',len(rows),'package files:',len(hashes))
