from pathlib import Path
import subprocess,time,json,hashlib
E=Path(__file__).resolve().parent
W=Path('/home/diego/projects/malpaco/.cache/agy-t34-review')
argv=['/home/diego/.local/bin/agy','--model','claude-sonnet-5-5-high','--effort','high','--mode','plan','--output-format','stream-json','--print-timeout','12m','--log-file',str(E/'cli.log'),'--print',(E/'prompt.txt').read_text()]
discovery=subprocess.run(['/home/diego/.local/bin/agy','models'],stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
(E/'models.txt').write_bytes(discovery.stdout)
assert discovery.returncode==0 and b'claude-sonnet-5-5-high' in discovery.stdout
start=time.time()
with (E/'output.jsonl').open('wb') as out:
 try:
  p=subprocess.run(argv,cwd=W,stdin=subprocess.DEVNULL,stdout=out,stderr=subprocess.STDOUT,timeout=900); code=p.returncode
 except subprocess.TimeoutExpired:
  code=124
receipt={'model':'claude-sonnet-5-5-high','reviewed_commit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=W,text=True).strip(),'exit_code':code,'duration_seconds':time.time()-start,'started_epoch':start,'mode':'plan','prompt_sha256':hashlib.sha256((E/'prompt.txt').read_bytes()).hexdigest(),'output_sha256':hashlib.sha256((E/'output.jsonl').read_bytes()).hexdigest()}
(E/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n')
print(json.dumps(receipt),flush=True)
