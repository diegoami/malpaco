from pathlib import Path
import json,subprocess,os,hashlib,stat,time,signal,re
root=Path.cwd();base=Path(__file__).resolve().parent;package=Path('/tmp/malpaco-t75-label-gap-bmsp3ozd/malpaco-playable')
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def write(n,d):(base/n).write_text(json.dumps(d,indent=2)+'\n')
paths={root/p for p in subprocess.check_output(['git','ls-files','-z']).decode().split('\0') if p};paths.update(p for p in (root/'docs').rglob('*') if p.is_file() and not p.is_relative_to(base));paths.update(p for p in package.rglob('*') if p.is_file());paths.update([root/'node_modules/playwright-core/lib/coreBundle.js',root/'node_modules/playwright-core/browsers.json',root/'node_modules/playwright-core/package.json',root/'node_modules/playwright/package.json',root/'node_modules/@playwright/test/package.json'])
gitdir=Path(subprocess.check_output(['git','rev-parse','--absolute-git-dir'],text=True).strip());common=Path(subprocess.check_output(['git','rev-parse','--path-format=absolute','--git-common-dir'],text=True).strip());paths.update([gitdir/'HEAD',gitdir/'index',common/'refs/heads/task/T75-playable-border-release']);paths={p for p in paths if p.is_file() and not p.is_relative_to(base)}
def inventory():return {str(p):{'sha256':sha(p),'mode':stat.S_IMODE(p.stat().st_mode),'bytes':p.stat().st_size} for p in sorted(paths)}
start=time.monotonic();before=inventory();write('before.json',before);commands=[]
for variant in ['default','legacy']:
 env=dict(os.environ);env['DEBUG']='pw:browser';env.pop('PLAYWRIGHT_LEGACY_SCREENSHOT',None)
 if variant=='legacy':env['PLAYWRIGHT_LEGACY_SCREENSHOT']='1'
 argv=['node',str(base/'child.mjs'),variant];tick=time.monotonic();row={'variant':variant,'argv':argv,'DEBUG':'pw:browser','PLAYWRIGHT_LEGACY_SCREENSHOT':env.get('PLAYWRIGHT_LEGACY_SCREENSHOT')}
 with open(base/(variant+'-stdout-stderr-debug.txt'),'w') as log:
  p=subprocess.Popen(argv,stdin=subprocess.DEVNULL,stdout=log,stderr=subprocess.STDOUT,env=env,start_new_session=True)
  try:row['exit']=p.wait(timeout=45)
  except subprocess.TimeoutExpired:row['timedOut45s']=True;os.killpg(p.pid,signal.SIGTERM);p.wait();row['exit']=p.returncode
 row['seconds']=time.monotonic()-tick;commands.append(row);write('commands.json',commands);print(json.dumps(row),flush=True)
after=inventory();write('after.json',after);write('preservation.json',{'protectedFiles':len(before),'unchanged':before==after,'seconds':time.monotonic()-start,'source80':sha(root/'src/ui/generatedGeographyPresentation.ts'),'packageFiles':len(list(package.rglob('*'))),'bothChildProcessesWaited':True})
if before!=after:raise SystemExit(2)
