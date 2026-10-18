"""Capture disposable production or restore saved baseline bytes, never Git reset.

capture LABEL archives candidate source/tests/docs; restore-baseline restores only
owned production/docs, leaving acceptance, evidence and append-only notes intact.
"""
from pathlib import Path
import hashlib,json,shutil,sys,tempfile,tarfile
root=Path(__file__).resolve().parent;repo=root.parents[3];prep=root/'parent-preflight'
sha=lambda b:hashlib.sha256(b).hexdigest()
active=json.loads((prep/'active-baseline.json').read_text()) if (prep/'active-baseline.json').is_file() else {'directory':'baseline','manifest':'baseline-manifest.json'}
baseline_directory=prep/active['directory']
baseline=json.loads((prep/active['manifest']).read_text())
new_sources=['src/ui/geographicGame.ts','src/ui/geographicMapView.ts','src/ui/matchPresentation.ts']
production=[name for name in baseline if name.startswith('src/') or name in ['README.md','docs/play.md','tools/release/PLAY.md','docs/spike.md']]
if sys.argv[1]=='capture':
 out=Path(tempfile.mkdtemp(prefix=sys.argv[2]+'-',dir=prep));members={}
 names=sorted(set([*baseline,*new_sources,'tests/e2e/geographic-board.spec.ts','tests/ui/geographic-game.test.ts']))
 for name in names:
  p=repo/name
  if not p.is_file():continue
  target=out/'sources'/name;target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(p,target);members[name]=sha(p.read_bytes())
 (out/'manifest.json').write_text(json.dumps({'scope':'Disposable parent preflight source snapshot, not producer adoption','files':members,'baseline':baseline,'newProductionPaths':new_sources},indent=2)+'\n')
 with tarfile.open(out/'candidate.tar.gz','w:gz') as archive:
  archive.add(out/'sources',arcname='sources');archive.add(out/'manifest.json',arcname='manifest.json')
 with tarfile.open(out/'candidate.tar.gz') as archive:
  actual={m.name.removeprefix('sources/'):sha(archive.extractfile(m).read()) for m in archive.getmembers() if m.isfile() and m.name.startswith('sources/')}
 assert actual==members
 (out/'archive-sha256.txt').write_text(sha((out/'candidate.tar.gz').read_bytes())+'\n');print(out.relative_to(repo))
elif sys.argv[1]=='restore-baseline':
 # Caller must capture candidate first. Only enumerated own newly-created files
 # may be removed; inherited/dirty paths outside the manifest are never touched.
 for name in production:
  saved=baseline_directory/name;assert sha(saved.read_bytes())==baseline[name]
  (repo/name).write_bytes(saved.read_bytes())
 for name in new_sources:
  p=repo/name
  if p.exists():p.unlink()
 assert all(sha((repo/name).read_bytes())==baseline[name] for name in production)
 assert all(not(repo/name).exists() for name in new_sources)
 receipt={'productionRestored':True,'files':{name:baseline[name] for name in production},'absent':new_sources}
 destination=Path(tempfile.mkdtemp(prefix='restoration-',dir=prep));(destination/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n');print(destination.relative_to(repo))
else:raise SystemExit('Expected capture LABEL or restore-baseline')
