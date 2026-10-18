from pathlib import Path
import hashlib,json,os,shutil,stat,subprocess,time,tempfile,urllib.request,socket
root=Path.cwd();base=Path(__file__).resolve().parent;sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();results=[];error=None
outputs=['dist','release','.cache','.vite','node_modules/.vite','node_modules/.vite-temp','node_modules/.cache'];beforeOutputs={}
def write(n,x):(base/n).write_text(json.dumps(x,indent=2)+'\n')
def inventory(p):
 if not p.exists():return {'exists':False}
 row={'exists':True,'directory':p.is_dir(),'mode':stat.S_IMODE(p.stat().st_mode),'members':{}}
 if p.is_dir():
  for f in sorted(p.rglob('*')):
   item={'directory':f.is_dir(),'mode':stat.S_IMODE(f.stat().st_mode)}
   if f.is_file():item['sha256']=sha(f)
   row['members'][str(f.relative_to(p))]=item
 else:row['sha256']=sha(p)
 return row
def copy(a,b):
 b.parent.mkdir(parents=True,exist_ok=True)
 if a.is_dir():shutil.copytree(a,b,symlinks=True)
 else:shutil.copy2(a,b)
def run(name,args,env=None):
 start=time.monotonic();log=base/'logs'/f'{name}-stdout-stderr.txt'
 with log.open('w')as stream:p=subprocess.run(args,cwd=root,env=env,stdin=subprocess.DEVNULL,stdout=stream,stderr=subprocess.STDOUT)
 row={'name':name,'command':args,'exit':p.returncode,'seconds':round(time.monotonic()-start,3),'log':str(log.relative_to(root))};results.append(row);write('commands.json',results);print(json.dumps(row),flush=True);assert p.returncode==0,name
head=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip();assert head.startswith('cb8e320b')
files=[root/str(p)for p in subprocess.check_output(['git','ls-files','-z']).decode().split('\0')if p]
files +=[p for p in (root/'docs/prototypes/new-game/T75').rglob('*')if p.is_file()and not p.is_relative_to(base)]
gitdir=Path((root/'.git').read_text().strip().removeprefix('gitdir: '));common=(gitdir/(gitdir/'commondir').read_text().strip()).resolve();files +=[gitdir/'HEAD',gitdir/'index',common/(gitdir/'HEAD').read_text().strip().removeprefix('ref: ')]
files=[p for p in set(files)if not p.is_relative_to(base)];before={str(p.relative_to(root))if p.is_relative_to(root)else str(p):{'sha256':sha(p),'mode':stat.S_IMODE(p.stat().st_mode)}for p in sorted(files)};write('before-manifest.json',before)
extract=Path(tempfile.mkdtemp(prefix='malpaco-t75-corrected-'));write('extraction.json',{'ownedOutsideParent':str(extract),'sourceCommit':head})
try:
 for rel in outputs:
  p=root/rel;beforeOutputs[rel]=inventory(p)
  if p.exists():copy(p,base/'output-backups'/rel)
 write('output-before.json',beforeOutputs)
 run('01-committed-proof',['python3','docs/prototypes/new-game/T75/production/verify-adoption.py'])
 run('02-integrated-npm-test',['npm','test'])
 run('03-static-package',['node','docs/prototypes/playable/acceptance.mjs',str(extract)])
 copy(extract/'malpaco-playable',base/'extracted-package')
 package=extract/'malpaco-playable';packageHashes={str(p.relative_to(package)):sha(p)for p in package.rglob('*')if p.is_file()};build=json.loads((package/'BUILD.json').read_text());assert build['sourceCommit']==head
 write('artifact.json',{'archiveSha256':sha(root/'release/malpaco-playable.tar.gz'),'archiveBytes':(root/'release/malpaco-playable.tar.gz').stat().st_size,'extractionParent':str(extract),'packageHashes':packageHashes,'BUILD':build,'officialRelease':False})
 specs=['geographic-presentation.spec.ts','geographic-board.spec.ts','geographic-review-guards.spec.ts','battle-panel-fit.spec.ts','cards.spec.ts','computer-cards.spec.ts','cards-result-layout.spec.ts','match-save.spec.ts','versioned-match.spec.ts','playback-controls.spec.ts','playback-edge-cases.spec.ts','compact-panels.spec.ts','game-event-log.spec.ts'];write('executed-spec-hashes.json',{str(Path('tests/e2e')/n):sha(root/'tests/e2e'/n)for n in specs})
 env=dict(os.environ,PLAYABLE_EXTRACTED_DIR=str(extract),PLAYABLE_EVIDENCE_DIR=str(base),PLAYWRIGHT_JSON_OUTPUT_FILE=str(base/'browser-report.json'),PLAYWRIGHT_HTML_OUTPUT_DIR=str(base/'playwright-report'),PLAYWRIGHT_HTML_OPEN='never')
 for key in ['COMPLETE','COMPUTER','DEFAULT_ENTRY','FINISHED_COPY','SETUP','GENERATED','MATCH_SAVE','RETRY_VALIDATION','HELP','GEOGRAPHIC','PLAYBACK','T75_SCREENSHOTS']:env[key if key=='T75_SCREENSHOTS'else key+'_EVIDENCE_DIR']=str(base/'screenshots')
 args=['npx','playwright','test','--config','playwright.release.config.ts',*specs,'--workers=2','--reporter=list,html,json'];start=time.monotonic();worker=next(p for p in packageHashes if 'worker' in p and p.endswith('.js'));url='http://127.0.0.1:4175/'+worker;http=[]
 with (base/'logs/04-extracted-browser-stdout-stderr.txt').open('w')as stream:
  child=subprocess.Popen(args,env=env,stdin=subprocess.DEVNULL,stdout=stream,stderr=subprocess.STDOUT)
  while child.poll()is None and time.monotonic()-start<120:
   try:
    with urllib.request.urlopen(url,timeout=2)as response:data=response.read();http.append({'url':url,'status':response.status,'contentType':response.headers.get('content-type'),'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'matchesExtractedWorker':hashlib.sha256(data).hexdigest()==packageHashes[worker]});break
   except Exception:time.sleep(.2)
  write('worker-http.json',http);code=child.wait()
 row={'name':'04-extracted-browser','command':args,'exit':code,'seconds':round(time.monotonic()-start,3),'expectedCases':166,'expectedSpecs':13};results.append(row);write('commands.json',results);write('browser-finished.json',row);print(json.dumps(row),flush=True)
 report=json.loads((base/'browser-report.json').read_text());rows=[]
 def visit(s):
  for spec in s.get('specs',[]):
   for test in spec.get('tests',[]):
    for result in test.get('results',[]):rows.append({'file':spec.get('file',s.get('file')),'title':spec['title'],'project':test['projectName'],'expectedStatus':test.get('expectedStatus'),'status':result['status'],'retry':result.get('retry',0),'durationMs':result['duration'],'errors':result.get('errors',[])})
  for sub in s.get('suites',[]):visit(sub)
 visit(report);write('individual-results.json',rows)
 assert code==0 and len(rows)==166 and all(r['status']=='passed'and r['retry']==0 for r in rows)and http and http[0]['matchesExtractedWorker']
 assert packageHashes=={str(p.relative_to(package)):sha(p)for p in package.rglob('*')if p.is_file()}
except BaseException as e:error=repr(e);print(error,flush=True)
finally:
 for rel in outputs:
  p=root/rel
  if p.exists():
   copy(p,base/'fresh-outputs'/rel)
   if p.is_dir():shutil.rmtree(p)
   else:p.unlink()
  if beforeOutputs.get(rel,{}).get('exists'):copy(base/'output-backups'/rel,p)
 afterOutputs={rel:inventory(root/rel)for rel in outputs};write('output-after.json',afterOutputs)
 changed=[]
 for name,row in before.items():
  p=Path(name)if name.startswith('/')else root/name
  if not p.exists()or sha(p)!=row['sha256']or stat.S_IMODE(p.stat().st_mode)!=row['mode']:changed.append(name)
 s=socket.socket();closed=s.connect_ex(('127.0.0.1',4175))!=0;s.close();receipt={'sourceCommit':head,'commands':results,'error':error,'protectedFiles':len(before),'changedProtectedInputs':changed,'outputTreesExact':beforeOutputs==afterOutputs,'server4175Closed':closed,'sourceProviderSha256':sha(root/'src/ui/generatedGeographyPresentation.ts'),'officialRelease':False,'remaining':'Independent correction review, owner acceptance and green final CI remain main-owned.'};write('validation.json',receipt);print(json.dumps(receipt),flush=True);assert not changed and beforeOutputs==afterOutputs and closed
if error:raise SystemExit(1)
