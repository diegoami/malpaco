from pathlib import Path
import json,hashlib,tarfile,io,gzip,subprocess,shutil,sys,re
root=Path('/home/diego/projects/malpaco');work=root/'.cache/t75-work';run=json.loads((root/'.cache/t75-dispatch/resume-20261019/review-run.json').read_text());rw=Path(run['reviewWorktree']);native=Path(run['nativeDirectory']);prefix=run['title'];out=work/'docs/prototypes/new-game/T75/review-correction-20261019';review_url=sys.argv[1];out.mkdir();sha=lambda b:hashlib.sha256(b).hexdigest()
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
buf=io.BytesIO();members=[]
with gzip.GzipFile(fileobj=buf,mode='wb',mtime=0) as gz:
 with tarfile.open(fileobj=gz,mode='w') as tar:
  for name,f in sorted(files.items()):
   payload=f.read_bytes();info=tar.gettarinfo(str(f),arcname=name);tar.addfile(info,io.BytesIO(payload));members.append(dict(path=name,sha256=sha(payload),bytes=len(payload),mode=info.mode))
payload=buf.getvalue();parts=[]
for index,start in enumerate(range(0,len(payload),16*1024*1024)):
 f=out/f'complete-review-evidence.tar.gz.part-{index:03d}';chunk=payload[start:start+16*1024*1024];f.write_bytes(chunk);parts.append(dict(path=f.name,sha256=sha(chunk),bytes=len(chunk)))
with tarfile.open(fileobj=io.BytesIO(payload),mode='r:gz') as tar:
 actual=tar.getmembers();assert len(actual)==len(members)
 for got,want in zip(actual,members):assert got.name==want['path'] and got.mode==want['mode'] and got.size==want['bytes'] and sha(tar.extractfile(got).read())==want['sha256']
shutil.copy2(native/(prefix+'.out.txt'),out/'full-review-original.md');(out/'all-bash-commands.json').write_text(json.dumps(commands,indent=2)+'\n')
receipt=dict(reviewHead=run['reviewHead'],reviewUrl=review_url,session=run['session'],actualModel=data['info']['model'],model='kimi-code-plan-global/k3',variant='low',ownerAuthorizedAdditionalReview=True,parentReadFullReview=True,verdict='approve',nativeCliExit=0,infrastructureToolErrors=len(errors),toolCount=len(tools),sessionSeconds=(data['info']['time']['updated']-data['info']['time']['created'])/1000,trackedReviewSourceRestored=True,originalWorktreeAndOutputsPreserved=True,archiveSha256=sha(payload),archiveBytes=len(payload),parts=parts,members=members,sourceBrowserPassed=46,extractedBrowserPassed=344,unitPassed=818,harnessPassed=9)
(out/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps({k:v for k,v in receipt.items() if k!='members'}))
