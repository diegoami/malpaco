from pathlib import Path
import subprocess,time,json,hashlib,os,re,fcntl
E=Path(__file__).resolve().parent
W=Path('/home/diego/projects/malpaco/.cache/agy-t34-review')
argv=['/home/diego/.local/bin/agy','--model','claude-sonnet-5-5-high','--effort','high','--mode','plan','--output-format','stream-json','--print-timeout','12m','--log-file',str(E/'cli.log'),'--print',(E/'prompt.txt').read_text()]
discovery=subprocess.run(['/home/diego/.local/bin/agy','models'],stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
(E/'models.txt').write_bytes(discovery.stdout)
assert discovery.returncode==0 and b'claude-sonnet-5-5-high' in discovery.stdout
settings=Path('/home/diego/.gemini/antigravity-cli/settings.json')
lock=(E/'settings.lock').open('w');fcntl.flock(lock,fcntl.LOCK_EX)
original=settings.read_bytes(); mode=settings.stat().st_mode
config=json.loads(original)
commands=['git rev-parse HEAD','git status --short','git diff --stat 9215373e6020472c60fe7708dcd58802c4e9dccf HEAD','git diff 9215373e6020472c60fe7708dcd58802c4e9dccf HEAD -- src tests','npx vitest run tests/core/island-geography.test.ts']
config['permissions']={'allow':['command(regex:^'+re.escape(c)+'$)' for c in commands], 'deny':['write_file(*)']}
replacement=(json.dumps(config,indent=2)+'\n').encode()
(E/'permission-grants.json').write_text(json.dumps(config['permissions'],indent=2)+'\n')
settings.write_bytes(replacement)
start=time.time()
with (E/'output.jsonl').open('wb') as out:
 try:
  p=subprocess.run(argv,cwd=W,stdin=subprocess.DEVNULL,stdout=out,stderr=subprocess.STDOUT,timeout=900); code=p.returncode
 except subprocess.TimeoutExpired:
  code=124
 except BaseException:
  if settings.read_bytes()==replacement: settings.write_bytes(original);os.chmod(settings,mode)
  raise
if settings.read_bytes()==replacement:
 settings.write_bytes(original);os.chmod(settings,mode); restored=True
else:
 restored=False
receipt={'settings_restored':restored,'model':'claude-sonnet-5-5-high','reviewed_commit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=W,text=True).strip(),'exit_code':code,'duration_seconds':time.time()-start,'started_epoch':start,'mode':'plan','prompt_sha256':hashlib.sha256((E/'prompt.txt').read_bytes()).hexdigest(),'output_sha256':hashlib.sha256((E/'output.jsonl').read_bytes()).hexdigest()}
(E/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n')
print(json.dumps(receipt),flush=True)
