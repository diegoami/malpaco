from pathlib import Path
import subprocess,hashlib,json,os,shutil,time,socket,urllib.request,traceback
root=Path.cwd(); own=root/'docs/prototypes/new-game/T75/preflight/allocation-proposal-20261019-01'
package=Path('/home/diego/projects/malpaco/.cache/runtime/tmp/malpaco-t75-corrected-fc33zzrh/malpaco-playable')
def write(n,v):(own/n).write_text(json.dumps(v,indent=2)+'\n')
def digest(p):return {'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'size':p.stat().st_size,'mode':p.stat().st_mode&0o7777}
def tree(p):
 if not p.exists():return {'exists':False}
 out={}
 for f in sorted(p.rglob('*')) if p.is_dir() else [p]:
  if f.is_relative_to(own):continue
  if f.is_symlink():out[str(f)]={'symlink':os.readlink(f)}
  elif f.is_file():out[str(f)]=digest(f)
 return {'exists':True,'files':out}
tracked=subprocess.check_output(['git','ls-files','-z']).decode().split('\0');paths={root/p for p in tracked if p}
# Include retained untracked evidence as protected inputs, excluding our new evidence.
paths.update(p for p in (root/'docs').rglob('*') if p.is_file() and not p.is_relative_to(own))
gitdir=Path(subprocess.check_output(['git','rev-parse','--absolute-git-dir']).decode().strip());common=Path(subprocess.check_output(['git','rev-parse','--path-format=absolute','--git-common-dir']).decode().strip())
for p in [gitdir/'HEAD',gitdir/'index',common/'refs/heads/task/T75-playable-border-release',common/'packed-refs',root/'.git']:
 if p.is_file():paths.add(p)
def protected():return {str(p):digest(p) for p in sorted(paths) if p.is_file()}
outputs=['screenshots','dist','release','.cache','.vite','node_modules/.vite','node_modules/.vite-temp','test-results','test-results-release','playwright-report','playwright-report-release']
def outputstate():return {p:tree(root/p) for p in outputs}
start=time.time();commands=[];server=None;code=1
source=root/'src/ui/generatedGeographyPresentation.ts';saved=source.read_bytes();savedmode=source.stat().st_mode&0o7777;installed=False;backupsReady=False
try:
 assert subprocess.check_output(['git','rev-parse','HEAD']).decode().strip()=='66c2d16ec88ea3f4b8e897c949f23804c0c219d1'
 assert json.loads((package/'BUILD.json').read_text())['sourceCommit']=='cb8e320b73b0f134ac8c73ba210b554211b0a0ad'
 assert digest(package/'assets/generatedGeographyPresentation.worker-DGiQULpt.js')['sha256']=='8aa6884eafe24bffc4eae3a784a1c4178680077a30aaa6c5649d6587b0ac2ce7'
 before=protected();beforeout=outputstate();beforepackage=tree(package)
 write('before-protected.json',before);write('before-outputs.json',beforeout);write('before-package.json',beforepackage)
 for rel in outputs:
  if (root/rel).exists() and rel!='screenshots':shutil.copytree(root/rel,own/'output-backup'/rel,copy_function=shutil.copy2)
 backupsReady=True
 write('screenshots-preservation.json',{'source':tree(root/'screenshots'),'retainedBackup':'../cold-load-overlap-20261019-01/screenshots-backup','historicalLimitation':'Prior backup preserves current bytes only. Earlier pre-adoption compact screenshot originals remain unproven.'})
 host={'loadavg':os.getloadavg(),'affinity':sorted(os.sched_getaffinity(0)),'cpuCount':os.cpu_count()}
 for p in ['/proc/self/status','/proc/self/cgroup','/sys/fs/cgroup/cpu.max','/sys/fs/cgroup/memory.max','/proc/loadavg']:
  try:host[p]=Path(p).read_text()
  except Exception as e:host[p]=str(e)
 host['processes']=subprocess.check_output(['ps','-eo','pid,ppid,comm,pcpu,pmem','--sort=-pcpu']).decode();write('host.json',host)
 assert hashlib.sha256(saved).hexdigest()=='59137044a36f65ae303d80e4d5e90861cdbfdb66aa7ef04621152d71b89e1883'
 write('source-before.json',{'source':digest(source),'fullmode':savedmode})
 source.write_bytes((own/'candidate.ts').read_bytes());os.chmod(source,savedmode);installed=True
 def command(argv,logname):
  tick=time.monotonic();print('starting '+logname,flush=True)
  with open(own/logname,'w') as log:r=subprocess.run(argv,stdin=subprocess.DEVNULL,stdout=log,stderr=subprocess.STDOUT)
  commands.append({'argv':argv,'exit':r.returncode,'durationSeconds':time.monotonic()-tick,'log':logname});write('commands-progress.json',commands)
  print('finished '+logname+' exit '+str(r.returncode),flush=True)
  if r.returncode:raise RuntimeError('bounded command failed; stop')
 command(['node_modules/.bin/vitest','run','tests/ui/generated-geography-presentation.test.ts'],'unit-stdout-stderr.txt')
 command(['node_modules/.bin/vite','build','--outDir',str(own/'build')],'build-stdout-stderr.txt')
 shutil.copy2(root/'tools/release/serve.mjs',own/'build/serve.mjs')
 with socket.socket() as s:s.bind(('127.0.0.1',4313))
 write('port-before.json',{'port':4313,'free':True,'time':time.time()})
 serverlog=open(own/'server-stdout-stderr.txt','w');argv=['node',str(own/'build/serve.mjs'),'--port','4313'];server=subprocess.Popen(argv,stdin=subprocess.DEVNULL,stdout=serverlog,stderr=subprocess.STDOUT)
 commands.append({'argv':argv,'pid':server.pid,'start':time.time()})
 for i in range(50):
  try:
   with urllib.request.urlopen('http://127.0.0.1:4313/',timeout=1) as response:assert response.status==200
   break
  except Exception:
   if server.poll() is not None:raise RuntimeError('owned server exited')
   time.sleep(.1)
 else:raise RuntimeError('owned server unavailable')
 print('paired diagnostic starting',flush=True)
 argv=['node',str(own/'diagnostic.mjs')];tick=time.monotonic()
 with open(own/'browser-stdout-stderr.txt','w') as log:result=subprocess.run(argv,stdin=subprocess.DEVNULL,stdout=log,stderr=subprocess.STDOUT)
 commands.append({'argv':argv,'exit':result.returncode,'durationSeconds':time.monotonic()-tick});code=result.returncode
 print('paired diagnostic finished exit',code,flush=True)
except Exception as e:write('driver-error.json',{'message':str(e),'stack':traceback.format_exc()})
finally:
 if server:
  server.terminate()
  try:server.wait(timeout=5)
  except subprocess.TimeoutExpired:server.kill();server.wait()
  next(c for c in commands if c.get('pid')==server.pid).update({'exit':server.returncode,'closed':True});serverlog.close()
 write('commands.json',commands)
 if installed:source.write_bytes(saved);os.chmod(source,savedmode)
 if backupsReady:
  fresh=outputstate();write('fresh-outputs.json',fresh)
  for rel in outputs:
   current=root/rel
   if fresh[rel]!=beforeout[rel]:
    if current.exists():
     shutil.copytree(current,own/'fresh-output-copies'/rel,copy_function=shutil.copy2);shutil.rmtree(current)
    backup=own/'output-backup'/rel
    if backup.exists():current.parent.mkdir(parents=True,exist_ok=True);shutil.copytree(backup,current,copy_function=shutil.copy2)
 if 'before' in locals():
  after=protected();afterout=outputstate();afterpackage=tree(package)
  write('after-protected.json',after);write('after-outputs.json',afterout);write('after-package.json',afterpackage)
  receipt={'protectedFiles':len(before),'protectedUnchanged':before==after,'outputsUnchanged':beforeout==afterout,'packageUnchanged':beforepackage==afterpackage,'durationSeconds':time.time()-start,'driverExit':code,'sourceRestored':source.read_bytes()==saved and source.stat().st_mode&0o7777==savedmode,'serverClosed':server is None or server.poll() is not None}
  with socket.socket() as s:
   try:s.bind(('127.0.0.1',4313));receipt['portFreeAfter']=True
   except OSError:receipt['portFreeAfter']=False
  write('preservation.json',receipt)
  if not all(receipt[k] for k in ['protectedUnchanged','outputsUnchanged','packageUnchanged','sourceRestored','serverClosed','portFreeAfter']):code=2
 print('driver exit',code,flush=True)
raise SystemExit(code)
