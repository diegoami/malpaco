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
beforeOutputs={};tickall=time.monotonic();extract=Path('/home/diego/projects/malpaco/.cache/runtime/tmp/malpaco-t75-label-gap-bmsp3ozd');write('extraction.json',{'existingParent':str(extract),'sourceCommit':'8d669a275e9130134a3052239aa8abaefbf0c50c','currentDocumentationCheckpoint':head,'reusedExistingPackage':True})
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
 run('00-verify-reused-inputs',['python3',str(base/'verify-reuse.py')])
 for d in ['logs','browser']: (base/d).mkdir(exist_ok=True)
 container='malpaco-t75-accept-container-20261019-01'
 image='sha256:eff16c30e6f3f4af0a03fa4b706120d5e9b0891c344a27d64559aff5900a4a27'
 args=['docker','run','--rm','--pull=never','--name',container,'--network','none','--shm-size=1g','--user',str(os.getuid())+':'+str(os.getgid()),'--mount','type=bind,src='+str(root)+',dst=/work,readonly','--mount','type=bind,src='+str(base)+',dst=/work/'+str(base.relative_to(root)),'--mount','type=bind,src='+str(extract)+',dst=/artifact,readonly','--workdir','/work',image,'node',str(Path('/work')/base.relative_to(root)/'container-run.mjs')]
 write('docker-command.json',{'argv':args,'imageId':image,'nonroot':True,'network':'none','shmBytes':1073741824,'repoReadOnly':True,'artifactReadOnly':True,'evidenceOnlyWritable':True})
 run('01-container-controls-and-FIRST166',args)
except BaseException as e:error=repr(e);write('error.json',{'error':error,'stack':traceback.format_exc()});print(error,flush=True)
finally:
 # Only this uniquely named container may be removed if it survived its waited command.
 name='malpaco-t75-accept-container-20261019-01'
 alive=subprocess.run(['docker','inspect',name],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL).returncode==0
 if alive:subprocess.run(['docker','rm','-f',name],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,check=True)
 write('container-closed.json',{'name':name,'absentAfter':subprocess.run(['docker','inspect',name],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL).returncode!=0,'cleanupRequired':alive})
 for rel in outputs:
  current=root/rel
  if current.exists():
   copy(current,base/'fresh-outputs'/rel)
   if current.is_dir():shutil.rmtree(current)
   else:current.unlink()
  if beforeOutputs.get(rel,{}).get('exists'):copy(base/'output-backups'/rel,current)
 afterOutputs={rel:inventory(root/rel) for rel in outputs};write('output-after.json',afterOutputs);changed=[]
 for name,row in before.items():
  file=Path(name)
  if not file.exists() or sha(file)!=row['sha256'] or stat.S_IMODE(file.stat().st_mode)!=row['mode']:changed.append(name)
 receipt={'sourceCommit':head,'commands':results,'error':error,'protectedFiles':len(before),'changedProtectedInputs':changed,'outputTreesExact':beforeOutputs==afterOutputs,'sourceProviderSha256':sha(root/'src/ui/generatedGeographyPresentation.ts'),'officialRelease':False,'transactionSeconds':time.monotonic()-tickall,'containerAbsent':subprocess.run(['docker','inspect','malpaco-t75-accept-container-20261019-01'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL).returncode!=0};write('validation.json',receipt);print(json.dumps(receipt),flush=True);assert not changed and beforeOutputs==afterOutputs and receipt['containerAbsent']
if error:raise SystemExit(1)
