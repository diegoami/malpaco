from pathlib import Path
import subprocess,json,tarfile,hashlib
R=Path(__file__).resolve().parents[5];D=Path(__file__).resolve().parent;core=R/'src/core/island-geography.ts';original=core.read_bytes();results=[]
try:
 for name,amplitude,jitter in [('four-eight',4,8),('eight-sixteen',8,16),('twelve-twentyfour',12,24)]:
  candidate=original.decode().replace('rng.nextInt(0,Q/2)',f'rng.nextInt(0,{amplitude}*Q)').replace('rng.nextInt(-Q,Q)',f'rng.nextInt(-{jitter}*Q,{jitter}*Q)')
  core.write_text(candidate)
  with (D/(name+'.txt')).open('w') as f:r=subprocess.run(['node',str(D/'smoke.mjs'),name],cwd=R,stdout=f,stderr=subprocess.STDOUT,timeout=900)
  results.append({'variant':name,'exit':r.returncode});print(json.dumps(results[-1]),flush=True)
finally:core.write_bytes(original)
assert core.read_bytes()==original
(D/'probe-report.json').write_text(json.dumps({'variants':results,'core_restored':True},indent=2)+'\n')
