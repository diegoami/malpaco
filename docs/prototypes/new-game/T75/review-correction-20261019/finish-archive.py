from pathlib import Path
import json,hashlib,tarfile,io,gzip,subprocess,shutil,sys,re
root=Path('/home/diego/projects/malpaco');work=root/'.cache/t75-work';run=json.loads((root/'.cache/t75-dispatch/resume-20261019/review-run.json').read_text());rw=Path(run['reviewWorktree']);native=Path(run['nativeDirectory']);prefix=run['title'];out=work/'docs/prototypes/new-game/T75/review-correction-20261019';review_url=sys.argv[1];assert out.is_dir();sha=lambda b:hashlib.sha256(b).hexdigest()
data=json.loads((native/(prefix+'.export.json')).read_text());errors=[];models=set();tools=[];commands=[]
for message in data['messages']:
 info=message.get('info',{})
 if info.get('role')=='assistant':
  models.add((info.get('providerID'),info.get('modelID')))
  if info.get('error'):errors.append(info['error'])
 for part in message.get('parts',[]):
  if part.get('type')=='tool':
   tools.append(part);state=part.get('state',{})
   if state.get('status')=='error':errors.append(part)
   if part.get('tool')=='bash':commands.append(dict(input=state.get('input'),status=state.get('status'),metadata=state.get('metadata'),output=state.get('output')))
assert not errors and models=={('kimi-code-plan-global','k3')} and data['info']['model']['variant']=='low'
assert subprocess.run(['git','diff','--quiet'],cwd=rw).returncode==0
files={}
for f in sorted(native.glob(prefix+'.*')):
 if f.is_file():files['native/'+f.name]=f
for name in subprocess.check_output(['git','ls-files','--others','--exclude-standard'],cwd=rw,text=True).splitlines():
 f=rw/name
 if f.is_file():files['scratch/'+name]=f
for name in ['review-evidence','screenshots','test-results','playwright-report','test-results-release','playwright-report-release','dist','release','.cache','docs/prototypes/retry-validation/captures']:
 for f in sorted((rw/name).rglob('*')):
  if f.is_file():files['scratch/'+str(f.relative_to(rw))]=f
for rel in ['.cache/t75-dispatch/resume-20261019/correction-review.log','.cache/t75-dispatch/resume-20261019/correction-review-brief.md','.cache/t75-dispatch/resume-20261019/review-run.json','.cache/t75-dispatch/resume-20261019/review-container-metadata-check.json','tools/harness/.review-t75-container-retained-local.mjs','.opencode/agents/reviewer-t75-container-retained.md']:
 files['parent/'+rel]=root/rel
for name in sorted(set(re.findall(r'/home/diego/\.local/share/harness-opencode/data/opencode/tool-output/tool_[A-Za-z0-9]+', json.dumps(data)))):
 f=Path(name);assert f.is_file(),name;files['native-tool-output/'+f.name]=f

import stat
archive_parts=sorted(out.glob('complete-review-evidence.tar.gz.part-*'));assert archive_parts
payload=b''.join(f.read_bytes() for f in archive_parts);parts=[dict(path=f.name,sha256=sha(f.read_bytes()),bytes=f.stat().st_size) for f in archive_parts];members=[]
with tarfile.open(fileobj=io.BytesIO(payload),mode='r:gz') as tar:
 actual=tar.getmembers();assert len(actual)==len(files)
 for got,(name,f) in zip(actual,sorted(files.items())):
  original=f.read_bytes();expectedmode=stat.S_IMODE(f.stat().st_mode)
  assert got.isfile() and got.name==name and got.mode==expectedmode and got.size==len(original) and sha(tar.extractfile(got).read())==sha(original),name
  members.append(dict(path=name,sha256=sha(original),bytes=len(original),mode=expectedmode))
(out/'archive-mode-correction.json').write_text(json.dumps(dict(initialVerifierExit=1,initialFailure='AssertionError comparing TarInfo full st_mode to serialized permission bits',correctAuthority='stat.S_IMODE of each original filesystem entry; regular file type checked separately',archiveRegenerated=False,allOriginalArchivePartBytesRetained=True,archiveSha256=sha(payload),verifiedFiles=len(members)),indent=2)+'\n')
shutil.copy2(native/(prefix+'.out.txt'),out/'full-review-original.md');(out/'all-bash-commands.json').write_text(json.dumps(commands,indent=2)+'\n')
receipt=dict(reviewHead=run['reviewHead'],reviewUrl=review_url,session=run['session'],actualModel=data['info']['model'],model='kimi-code-plan-global/k3',variant='low',ownerAuthorizedAdditionalReview=True,parentReadFullReview=True,verdict='approve',nativeCliExit=0,infrastructureToolErrors=len(errors),toolCount=len(tools),sessionSeconds=(data['info']['time']['updated']-data['info']['time']['created'])/1000,trackedReviewSourceRestored=True,originalWorktreeAndOutputsPreserved=True,archiveSha256=sha(payload),archiveBytes=len(payload),parts=parts,members=members,sourceBrowserPassed=46,extractedBrowserPassed=344,unitPassed=818,harnessPassed=9)
(out/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps({k:v for k,v in receipt.items() if k!='members'}))
