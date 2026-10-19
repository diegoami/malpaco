from pathlib import Path
import subprocess,hashlib,json,os,shutil,time,socket,urllib.request,traceback
root=Path.cwd(); own=root/'docs/prototypes/new-game/T75/preflight/native-actionability-20261019-01'
package=Path('/tmp/malpaco-t75-label-gap-bmsp3ozd/malpaco-playable')
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
try:
 assert subprocess.check_output(['git','rev-parse','HEAD']).decode().strip()=='22c163217a4452917b371b0d5a4708800428d7e3'
 assert json.loads((package/'BUILD.json').read_text())['sourceCommit']=='8d669a275e9130134a3052239aa8abaefbf0c50c'
 assert digest(package/'assets/generatedGeographyPresentation.worker-DbrcvUpT.js')['sha256']=='c98fd9efb3ba2c9e0a2ab29c416f1105b6d7247b9e4410d824e2906cb5c947ac'
 before=protected();beforeout=outputstate();beforepackage=tree(package)
 write('before-protected.json',before);write('before-outputs.json',beforeout);write('before-package.json',beforepackage)
 if (root/'screenshots').exists():shutil.copytree(root/'screenshots',own/'screenshots-backup',copy_function=shutil.copy2)
 write('screenshots-backup-receipt.json',{'source':tree(root/'screenshots'),'backup':tree(own/'screenshots-backup') if False else {str(p.relative_to(own/'screenshots-backup')):digest(p) for p in (own/'screenshots-backup').rglob('*') if p.is_file()},'historicalLimitation':'Backup preserves current bytes only. Earlier pre-adoption compact screenshot originals remain unproven.'})
 host={'loadavg':os.getloadavg(),'affinity':sorted(os.sched_getaffinity(0)),'cpuCount':os.cpu_count()}
 for p in ['/proc/self/status','/proc/self/cgroup','/sys/fs/cgroup/cpu.max','/sys/fs/cgroup/memory.max','/proc/loadavg']:
  try:host[p]=Path(p).read_text()
  except Exception as e:host[p]=str(e)
 host['processes']=subprocess.check_output(['ps','-eo','pid,ppid,comm,pcpu,pmem','--sort=-pcpu']).decode();write('host.json',host)
 with socket.socket() as s:s.bind(('127.0.0.1',4316))
 write('port-before.json',{'port':4316,'free':True,'time':time.time()})
 serverlog=open(own/'server-stdout-stderr.txt','w');argv=['node',str(package/'serve.mjs'),'--port','4316'];server=subprocess.Popen(argv,stdin=subprocess.DEVNULL,stdout=serverlog,stderr=subprocess.STDOUT)
 commands.append({'argv':argv,'pid':server.pid,'start':time.time()})
 for i in range(50):
  try:
   with urllib.request.urlopen('http://127.0.0.1:4316/',timeout=1) as response:assert response.status==200
   break
  except Exception:
   if server.poll() is not None:raise RuntimeError('owned server exited')
   time.sleep(.1)
 else:raise RuntimeError('owned server unavailable')
 print('native actionability diagnostic starting',flush=True)
 argv=['node',str(own/'diagnostic.mjs')];tick=time.monotonic()
 with open(own/'browser-stdout-stderr.txt','w') as log:result=subprocess.run(argv,stdin=subprocess.DEVNULL,stdout=log,stderr=subprocess.STDOUT)
 commands.append({'argv':argv,'exit':result.returncode,'durationSeconds':time.monotonic()-tick});code=result.returncode
 print('native actionability diagnostic finished exit',code,flush=True)
except Exception as e:write('driver-error.json',{'message':str(e),'stack':traceback.format_exc()})
finally:
 if server:
  server.terminate()
  try:server.wait(timeout=5)
  except subprocess.TimeoutExpired:server.kill();server.wait()
  commands[0]['exit']=server.returncode;commands[0]['closed']=True;serverlog.close()
 write('commands.json',commands)
 if 'before' in locals():
  after=protected();afterout=outputstate();afterpackage=tree(package)
  write('after-protected.json',after);write('after-outputs.json',afterout);write('after-package.json',afterpackage)
  receipt={'protectedFiles':len(before),'protectedUnchanged':before==after,'outputsUnchanged':beforeout==afterout,'packageUnchanged':beforepackage==afterpackage,'durationSeconds':time.time()-start,'driverExit':code,'serverClosed':server is None or server.poll() is not None}
  with socket.socket() as s:
   try:s.bind(('127.0.0.1',4316));receipt['portFreeAfter']=True
   except OSError:receipt['portFreeAfter']=False
  write('preservation.json',receipt)
  if not all(receipt[k] for k in ['protectedUnchanged','outputsUnchanged','packageUnchanged','serverClosed','portFreeAfter']):code=2
 print('driver exit',code,flush=True)
raise SystemExit(code)
