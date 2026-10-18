from pathlib import Path
import subprocess,time,json,tarfile,hashlib,datetime
repo=Path.cwd();root=repo/'docs/prototypes/new-game/T36';out=root/'evidence/rework-native1/package-proof';out.mkdir()
sha=lambda p:hashlib.file_digest(p.open('rb'),'sha256').hexdigest()
head=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()
assert not subprocess.check_output(['git','diff','HEAD','--','src','tests/e2e/geographic-review-guards.spec.ts'],text=True).strip()
# Preserve every existing release/dist output before the standard packager replaces it.
prior=out/'prior-release-and-dist.tar.gz';files=sorted(p for folder in ['release','dist'] for p in (repo/folder).rglob('*') if p.is_file());before={str(p.relative_to(repo)):sha(p) for p in files}
with tarfile.open(prior,'w:gz') as a:
 for p in files:a.add(p,arcname=str(p.relative_to(repo)),recursive=False)
with tarfile.open(prior,'r|gz') as a:assert {m.name:hashlib.file_digest(a.extractfile(m),'sha256').hexdigest() for m in a if m.isfile()}==before
(out/'prior-output-receipt.json').write_text(json.dumps({'headBeforePackaging':head,'members':before,'archiveSha256':sha(prior),'allVerified':True},indent=2)+'\n')
def command(prefix,args):
 print(json.dumps({'phase':prefix,'command':args}),flush=True)
 child=subprocess.Popen(['python3',str(root/'run-command.py'),prefix,*args])
 while child.poll() is None:
  paths=list((root/'evidence').glob(prefix+'-*/stdout.txt'))
  if paths:
   link=out.parent/'current-actual-output.txt'
   if link.is_symlink():link.unlink()
   link.symlink_to(paths[0].resolve());break
  time.sleep(.1)
 assert child.wait()==0,prefix
 path=next((root/'evidence').glob(prefix+'-*/report.json'));r=json.loads(path.read_text());assert r['exit']==0 and r['sourcesUnchangedDuringRun'];return {'report':str(path.relative_to(repo)),'sha256':sha(path)}
package_report=command('rework1-package',['npm','run','package:playable'])
archive=repo/'release/malpaco-playable.tar.gz';copy=out/'malpaco-playable.tar.gz';copy.write_bytes(archive.read_bytes());assert sha(copy)==sha(archive)
extracted=out/'extracted';extracted.mkdir()
with tarfile.open(copy) as a:
 for m in a:
  assert not m.issym() and not m.islnk() and not Path(m.name).is_absolute() and '..' not in Path(m.name).parts
 a.extractall(extracted,filter='data')
package=extracted/'malpaco-playable';build=json.loads((package/'BUILD.json').read_text());assert build['sourceCommit']==head
checks={}
for line in (package/'SHA256SUMS').read_text().splitlines():
 digest,name=line.split('  ',1);assert sha(package/name)==digest;checks[name]=digest
capture=out/'captures';capture.mkdir();raw=out/'browser-output';raw.mkdir();relative=out.relative_to(repo)
args=['docker','run','--rm','--cpus','2','--user','1000:1000','-v',str(repo)+':/work','-v','/home/diego/projects/malpaco/node_modules:/work/node_modules:ro','--tmpfs','/work/node_modules/.vite-temp:rw,mode=1777','--tmpfs','/work/node_modules/.vite:rw,mode=1777','-e','PLAYABLE_EXTRACTED_DIR=/work/'+str(relative/'extracted'),'-e','PLAYABLE_EVIDENCE_DIR=/work/'+str(relative/'browser-output'),'-e','GEOGRAPHIC_EVIDENCE_DIR=/work/'+str(relative/'captures'),'-w','/work','mcr.microsoft.com/playwright:v1.63.0-noble','npx','playwright','test','tests/e2e/geographic-board.spec.ts','tests/e2e/geographic-review-guards.spec.ts','--config','playwright.release.config.ts','--workers=2']
browser_report=command('rework1-extracted',args)
assert subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()==head
receipt={'endedUtc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'committedRuntimeHead':head,'packageSha256':sha(copy),'build':build,'packageFileHashes':checks,'allExtractedChecksumsVerified':True,'packageReport':package_report,'browserReport':browser_report,'captures':{p.name:sha(p) for p in sorted(capture.glob('*.png'))},'scope':'Fresh extracted playable artifact, frozen geographic30 plus six new review guards; actual pinned2CPU/2worker command in report; prior outputs preserved.'}
(out/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps({'packageProof':str(out.relative_to(repo)),'committedRuntimeHead':head,'packageSha256':sha(copy),'captures':len(receipt['captures'])}),flush=True)
