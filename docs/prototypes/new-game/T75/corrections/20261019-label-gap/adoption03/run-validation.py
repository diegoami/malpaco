from pathlib import Path
import hashlib,json,os,shutil,stat,subprocess,time,tempfile,urllib.request,socket,tarfile,re,traceback
root=Path.cwd();base=Path(__file__).resolve().parent;results=[];error=None;server=None;child=None
outputs=['screenshots','dist','release','.cache','.vite','node_modules/.vite','node_modules/.vite-temp','node_modules/.cache','test-results','test-results-release','playwright-report','playwright-report-release']
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def write(n,x):
 p=base/n;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(x,indent=2)+'\n')
def inventory(p):
 if not p.exists():return {'exists':False}
 row={'exists':True,'directory':p.is_dir(),'mode':stat.S_IMODE(p.stat().st_mode),'members':{}}
 for f in sorted(p.rglob('*')) if p.is_dir() else []:
  item={'directory':f.is_dir(),'mode':stat.S_IMODE(f.stat().st_mode)}
  if f.is_symlink():item['symlink']=os.readlink(f)
  elif f.is_file():item.update(sha256=sha(f),bytes=f.stat().st_size)
  row['members'][str(f.relative_to(p))]=item
 if p.is_file():row['sha256']=sha(p)
 return row
def copy(a,b):
 b.parent.mkdir(parents=True,exist_ok=True)
 if a.is_dir():shutil.copytree(a,b,symlinks=True)
 else:shutil.copy2(a,b)
def run(name,args,env=None):
 tick=time.monotonic();log=base/'logs'/f'{name}-stdout-stderr.txt';log.parent.mkdir(parents=True,exist_ok=True);print('starting '+name,flush=True)
 with log.open('w') as stream:p=subprocess.run(args,cwd=root,env=env,stdin=subprocess.DEVNULL,stdout=stream,stderr=subprocess.STDOUT)
 row={'name':name,'argv':args,'exit':p.returncode,'seconds':time.monotonic()-tick,'log':str(log.relative_to(root))};results.append(row);write('commands.json',results);print(json.dumps(row),flush=True)
 if p.returncode:raise RuntimeError(name+' failed; no retry')
head=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip();write('start.json',{'head':head,'provider':sha(root/'src/ui/generatedGeographyPresentation.ts'),'time':time.time()});assert sha(root/'src/ui/generatedGeographyPresentation.ts')=='80a79b8afac651479eb4eac4aa878f3a581a3c56ceab51a475ea23846d745c1d'
files={root/p for p in subprocess.check_output(['git','ls-files','-z']).decode().split('\0') if p};files.update(p for p in (root/'docs').rglob('*') if p.is_file())
gitdir=Path(subprocess.check_output(['git','rev-parse','--absolute-git-dir'],text=True).strip());common=Path(subprocess.check_output(['git','rev-parse','--path-format=absolute','--git-common-dir'],text=True).strip());files.update([gitdir/'HEAD',gitdir/'index',common/'refs/heads/task/T75-playable-border-release'])
files={p for p in files if p.is_file() and not p.is_relative_to(base)}
before={str(p):{'sha256':sha(p),'mode':stat.S_IMODE(p.stat().st_mode)} for p in sorted(files)};write('before-manifest.json',before)
beforeOutputs={};tickall=time.monotonic();extract=Path('/tmp/malpaco-t75-label-gap-bmsp3ozd');write('extraction.json',{'ownedOutsideParent':str(extract),'sourceCommit':'8d669a275e9130134a3052239aa8abaefbf0c50c','currentDocumentationCheckpoint':head,'reusedExistingPackage':True})
specnames=['geographic-presentation','geographic-board','geographic-review-guards','battle-panel-fit','cards','computer-cards','cards-result-layout','match-save','versioned-match','playback-controls','playback-edge-cases','compact-panels','game-event-log'];specs=[Path('tests/e2e')/(s+'.spec.ts') for s in specnames]
try:
 for rel in outputs:
  p=root/rel;beforeOutputs[rel]=inventory(p)
  if p.exists():copy(p,base/'output-backups'/rel)
 write('output-before.json',beforeOutputs)
 # Discover relative-import closure and output writers before any browser invocation.
 seen=set();queue=[root/p for p in specs];audit={};envkeys=set()
 while queue:
  p=queue.pop()
  if p in seen or not p.is_file():continue
  seen.add(p)
  if p.suffix not in ['.ts','.mjs','.js']:continue
  text=p.read_text();keys=set(re.findall(r'process\.env\[\s*[\'\"]([^\'\"]+)[\'\"]\s*\]',text));keys.update(re.findall(r'process\.env\.([A-Za-z_][A-Za-z_0-9]*)',text));envkeys.update(keys)
  lines=[{'line':i,'text':line} for i,line in enumerate(text.splitlines(),1) if re.search(r'screenshot\(|writeFile|mkdir|mkdtemp|outputPath\(|process\.env',line)]
  if lines or keys:audit[str(p.relative_to(root))]={'sha256':sha(p),'envKeys':sorted(keys),'writerAndEnvLines':lines}
  for rel in re.findall(r'(?:from\s*|import\s*)[\'\"]([^\'\"]+)[\'\"]',text):
   if not rel.startswith('.'):continue
   target=(p.parent/rel).resolve()
   for candidate in [target,Path(str(target)+'.ts'),Path(str(target)+'.js'),target/'index.ts']:
    if candidate.is_file():queue.append(candidate);break
 routes=['T75_SCREENSHOTS','GEOGRAPHIC_EVIDENCE_DIR','MATCH_SAVE_EVIDENCE_DIR','VERSIONED_MATCH_EVIDENCE_DIR','PLAYBACK_EVIDENCE_DIR','COMPACT_PANEL_EVIDENCE_DIR'];discovered={k for k in envkeys if k.endswith('_EVIDENCE_DIR') or k.endswith('_SCREENSHOTS')};assert discovered==set(routes),(discovered,routes)
 env=dict(os.environ);env.pop('GEOGRAPHIC_CORPUS_FILE',None)
 env.update(PLAYABLE_EXTRACTED_DIR=str(extract),PLAYABLE_EVIDENCE_DIR=str(base/'browser'),PLAYWRIGHT_JSON_OUTPUT_FILE=str(base/'browser/browser-report.json'),PLAYWRIGHT_HTML_OUTPUT_DIR=str(base/'browser/playwright-report'),PLAYWRIGHT_HTML_OPEN='never')
 for key in routes:env[key]=str(base/'browser/screenshots'/key);Path(env[key]).mkdir(parents=True)
 (base/'browser').mkdir(exist_ok=True)
 write('route-audit.json',{'specs':[str(p) for p in specs],'relativeImportClosure':[str(p.relative_to(root)) for p in sorted(seen)],'writers':audit,'discoveredWriterEnvKeys':sorted(discovered),'routedEnv':{k:env[k] for k in routes+['PLAYABLE_EXTRACTED_DIR','PLAYABLE_EVIDENCE_DIR','PLAYWRIGHT_JSON_OUTPUT_FILE','PLAYWRIGHT_HTML_OUTPUT_DIR','PLAYWRIGHT_HTML_OPEN']},'GEOGRAPHIC_CORPUS_FILE':'unset; unchanged default frozen corpus','outputPathRouting':'existing release config outputDir=PLAYABLE_EVIDENCE_DIR/test-results','oldScreenshotsBackedUp':beforeOutputs['screenshots']['exists']})
 write('executed-spec-hashes.json',{str(p):sha(root/p) for p in specs})
 run('01-committed-proof',['python3','docs/prototypes/new-game/T75/production/verify-adoption.py'])
 run('00-verify-reused-inputs',['python3',str(base/'verify-reuse.py')])
 package=extract/'malpaco-playable';copy(package,base/'extracted-package');build=json.loads((package/'BUILD.json').read_text());assert build['sourceCommit']=='8d669a275e9130134a3052239aa8abaefbf0c50c'
 packageHashes={str(p.relative_to(package)):sha(p) for p in package.rglob('*') if p.is_file()};archive=root/'docs/prototypes/new-game/T75/corrections/20261019-label-gap/adoption02/fresh-outputs/release/malpaco-playable.tar.gz';members=[]
 with tarfile.open(archive,'r:gz') as tar:
  for member in tar:
   row={'path':member.name,'bytes':member.size,'mode':member.mode,'directory':member.isdir()}
   if member.isfile():row['sha256']=hashlib.sha256(tar.extractfile(member).read()).hexdigest()
   members.append(row)
 write('artifact.json',{'archiveSha256':sha(archive),'archiveBytes':archive.stat().st_size,'extractionParent':str(extract),'packageHashes':packageHashes,'BUILD':build,'members':members,'officialRelease':False})
 with socket.socket() as sock:sock.bind(('127.0.0.1',4317))
 log=(base/'logs/04-controls-server-stdout-stderr.txt').open('w');server=subprocess.Popen(['node',str(package/'serve.mjs'),'--port','4317'],stdin=subprocess.DEVNULL,stdout=log,stderr=subprocess.STDOUT)
 try:
  for i in range(100):
   try:
    with urllib.request.urlopen('http://127.0.0.1:4317/',timeout=1) as response:assert response.status==200
    break
   except Exception:
    if server.poll() is not None:raise RuntimeError('control server exited')
    time.sleep(.1)
  else:raise RuntimeError('control server unavailable')
  run('04-three-controls',['node',str(base/'controls/profile.mjs')])
 finally:
  server.terminate()
  try:server.wait(timeout=5)
  except subprocess.TimeoutExpired:server.kill();server.wait()
  log.close();write('controls/server-closed.json',{'pid':server.pid,'exit':server.returncode,'closed':True});server=None
 original=json.loads((root/'docs/prototypes/new-game/T75/preflight/ci-diagnosis-20261019-01/trace-normal-unprofiled.json').read_text());comparisons=[]
 for name,clock,rate in [('normal-unprofiled',False,1),('mock-clock-polls',True,1),('throttle2',False,2)]:
  trace=json.loads((base/'controls'/('trace-'+name+'.json')).read_text());result=json.loads((base/'controls'/('result-'+name+'.json')).read_text());posts=[e for e in trace['events'] if e['event']=='worker-post'];replies=[e for e in trace['events'] if e['event']=='worker-reply'];at={e['event']:e['time'] for e in trace['events'][:6]}
  row={'name':name,'inputExact':trace['input']==original['input'],'outputExact':trace['output']==original['output'],'clock':result['clock'],'rate':result['rate'],'clockStayedPaused':not clock or result['clockBefore']==result['clockAfter'],'deriveCount':len(posts),'replyCount':len(replies),'workerMs':replies[0]['time']-posts[0]['time'],'coldMountMs':next(e['time'] for e in trace['events'] if e['event']=='map-mounted')-next(e['time'] for e in trace['events'] if e['event']=='file-text-start'),'warmIdentity':trace['keyCount']==1 and trace['allKeysEqual']};comparisons.append(row)
  assert row['inputExact'] and row['outputExact'] and row['clock']==clock and row['rate']==rate and row['clockStayedPaused'] and row['deriveCount']==row['replyCount']==1 and row['warmIdentity'] and not result.get('error')
  assert all(c['status']=='fulfilled' for op in result['operations'][:2] for c in op['readiness'])
  workername=Path(next(e['url'] for e in trace['events'] if e['event']=='worker-created')).name;assert sha(base/'controls'/('worker-'+name+'.js'))==packageHashes['assets/'+workername]
 write('controls/comparison.json',comparisons)
 # Exactly one canonical extracted run; preserve raw failure statuses before throwing.
 args=['npx','playwright','test','--config','playwright.release.config.ts',*[str(p) for p in specs],'--workers=2','--reporter=list,html,json'];start=time.monotonic();worker=next(p for p in packageHashes if 'worker' in p and p.endswith('.js'));url='http://127.0.0.1:4175/'+worker;http=[]
 print('starting05-extracted-browser',flush=True)
 with (base/'logs/05-extracted-browser-stdout-stderr.txt').open('w') as stream:
  child=subprocess.Popen(args,env=env,stdin=subprocess.DEVNULL,stdout=stream,stderr=subprocess.STDOUT)
  while child.poll() is None and time.monotonic()-start<120:
   try:
    with urllib.request.urlopen(url,timeout=2) as response:
     body=response.read();(base/'browser/worker-http-body.js').write_bytes(body);http.append({'url':url,'status':response.status,'contentType':response.headers.get('content-type'),'bytes':len(body),'sha256':hashlib.sha256(body).hexdigest(),'matchesExtractedWorker':hashlib.sha256(body).hexdigest()==packageHashes[worker]});break
   except Exception:time.sleep(.2)
  write('browser/worker-http.json',http);code=child.wait();child=None
 row={'name':'05-extracted-browser','argv':args,'exit':code,'seconds':time.monotonic()-start,'expectedCases':166,'expectedSpecs':13};results.append(row);write('commands.json',results);print(json.dumps(row),flush=True)
 report=json.loads((base/'browser/browser-report.json').read_text());rows=[]
 def visit(s):
  for spec in s.get('specs',[]):
   for test in spec.get('tests',[]):
    for result in test.get('results',[]):rows.append({'file':spec.get('file',s.get('file')),'title':spec['title'],'project':test['projectName'],'expectedStatus':test.get('expectedStatus'),'status':result['status'],'retry':result.get('retry',0),'durationMs':result['duration'],'errors':result.get('errors',[])})
  for sub in s.get('suites',[]):visit(sub)
 visit(report);write('browser/individual-results.json',rows);write('browser/failures.json',[r for r in rows if r['status']!='passed']);assert code==0 and len(rows)==166 and all(r['status']=='passed' and r['retry']==0 for r in rows) and http and http[0]['matchesExtractedWorker']
 assert packageHashes=={str(p.relative_to(package)):sha(p) for p in package.rglob('*') if p.is_file()}
except BaseException as e:error=repr(e);write('error.json',{'error':error,'stack':traceback.format_exc()});print(error,flush=True)
finally:
 if child and child.poll() is None:child.terminate();child.wait()
 if server and server.poll() is None:server.terminate();server.wait()
 for rel in outputs:
  p=root/rel
  if p.exists():
   copy(p,base/'fresh-outputs'/rel)
   if p.is_dir():shutil.rmtree(p)
   else:p.unlink()
  if beforeOutputs.get(rel,{}).get('exists'):copy(base/'output-backups'/rel,p)
 afterOutputs={rel:inventory(root/rel) for rel in outputs};write('output-after.json',afterOutputs);changed=[]
 for name,row in before.items():
  p=Path(name)
  if not p.exists() or sha(p)!=row['sha256'] or stat.S_IMODE(p.stat().st_mode)!=row['mode']:changed.append(name)
 closed={}
 for port in [4175,4317]:
  with socket.socket() as sock:closed[str(port)]=sock.connect_ex(('127.0.0.1',port))!=0
 receipt={'sourceCommit':head,'commands':results,'error':error,'protectedFiles':len(before),'changedProtectedInputs':changed,'outputTreesExact':beforeOutputs==afterOutputs,'serversClosed':closed,'sourceProviderSha256':sha(root/'src/ui/generatedGeographyPresentation.ts'),'officialRelease':False,'transactionSeconds':time.monotonic()-tickall,'remaining':'Independent correction review, owner acceptance and green final CI remain main-owned.'};write('validation.json',receipt);print(json.dumps(receipt),flush=True);assert not changed and beforeOutputs==afterOutputs and all(closed.values())
if error:raise SystemExit(1)
