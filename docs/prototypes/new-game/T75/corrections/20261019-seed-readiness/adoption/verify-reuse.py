from pathlib import Path
import subprocess,hashlib,json,stat
root=Path.cwd();base=Path(__file__).resolve().parent;revision='8d669a275e9130134a3052239aa8abaefbf0c50c'
def tree(rev):
 rows={}
 for raw in subprocess.check_output(['git','ls-tree','-rz',rev]).split(b'\0'):
  if raw:
   info,path=raw.split(b'\t',1);mode,kind,blob=info.decode().split();rows[path.decode()]={'mode':mode,'blob':blob}
 return rows
a=tree(revision);b=tree('HEAD');ci=tree('6391b169462431e958ff862f344436d73ef851c8');review=tree('87862df3');overlay=json.loads((root/'docs/prototypes/new-game/T75/corrections/20261019-seed-readiness/FROZEN.json').read_text())['replacement']
def selected(p):
 return p.startswith(('src/','tests/','tools/','public/','data/','docs/prototypes/dev-watch/issue187/','docs/prototypes/new-game/T71/fixtures/','docs/prototypes/new-game/T74/acceptance/','docs/prototypes/new-game/T75/production-candidate/','docs/prototypes/new-game/T75/preflight/phase-b-20261018-01/fixtures/','docs/prototypes/new-game/T36/')) or p in ['package.json','package-lock.json','playwright.config.ts','playwright.release.config.ts','vite.config.ts','tsconfig.json','docs/prototypes/new-game/T75/corrections/20261019-label-gap/candidate.ts','docs/prototypes/new-game/T75/corrections/20261019-label-gap/contract.md','docs/prototypes/new-game/T75/corrections/20261019-label-gap/FROZEN.json'] or Path(p).name.startswith('tsconfig')
paths={p for p in a if selected(p)}|{p for p in b if selected(p)};rows={}
assert paths=={p for p in ci if selected(p)}=={p for p in review if selected(p)},'exact selected input sets at CI/review'
for p in sorted(paths):
 assert a.get(p)==ci.get(p)==review.get(p),p+' CI/review baseline differs'
 data=subprocess.check_output(['git','show',revision+':'+p]);actual=root/p
 if p==overlay['path']:
  assert hashlib.sha256(data).hexdigest()==overlay['before'],p
  assert actual.read_bytes()==(root/overlay['canonical']).read_bytes() and hashlib.sha256(actual.read_bytes()).hexdigest()==overlay['after'],p
  assert b[p]['mode']==a[p]['mode'],p
  assert subprocess.check_output(['git','show','HEAD:'+p])==actual.read_bytes(),p
 else:
  assert a.get(p)==b.get(p),p
  assert actual.read_bytes()==data,p
 assert bool(actual.stat().st_mode&0o111)==(a[p]['mode']=='100755'),p
 rows[p]={**a[p],'historicalSha256':hashlib.sha256(data).hexdigest(),'currentSha256':hashlib.sha256(actual.read_bytes()).hexdigest(),'explicitOverlay':p==overlay['path']}
artifact=json.loads((root/'docs/prototypes/new-game/T75/corrections/20261019-label-gap/adoption02/artifact.json').read_text());package=Path('/home/diego/projects/malpaco/.cache/runtime/tmp/malpaco-t75-label-gap-bmsp3ozd/malpaco-playable');hashes={str(p.relative_to(package)):hashlib.sha256(p.read_bytes()).hexdigest() for p in package.rglob('*') if p.is_file()};assert hashes==artifact['packageHashes'];archive=root/'docs/prototypes/new-game/T75/corrections/20261019-label-gap/adoption02/fresh-outputs/release/malpaco-playable.tar.gz';assert hashlib.sha256(archive.read_bytes()).hexdigest()==artifact['archiveSha256'];assert json.loads((package/'BUILD.json').read_text())['sourceCommit']==revision
receipt={'priorReviewCommit':subprocess.check_output(['git','rev-parse','87862df3'],text=True).strip(),'priorCiCommit':'6391b169462431e958ff862f344436d73ef851c8','authorityCommit':revision,'currentHead':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'exactInputs':rows,'inputCount':len(rows),'packageHashes':hashes,'packageModes':{str(p.relative_to(package)):stat.S_IMODE(p.stat().st_mode) for p in package.rglob('*') if p.is_file()},'archiveSha256':artifact['archiveSha256'],'reusedActualResults':{'npmVitest':818,'npmHarness':9,'staticPackageFiles':10,'checksumEntries':9,'HTTPPaths':4},'newHeavyRuns':0,'limitation':'Runtime/package and unchanged tests reuse actual8d npm/static and CI6391 source344/extracted343+1 only; changed readiness test is validated separately, no historical run is relabeled.'};(base/'reuse-receipt.json').write_text(json.dumps(receipt,indent=2)+'\n');assert sum(row['explicitOverlay'] for row in rows.values())==1
print('Authenticated inputs:',len(rows),'exact prior runtime/test/tool/fixture inputs except one explicit readiness test overlay; package files:',len(hashes))
