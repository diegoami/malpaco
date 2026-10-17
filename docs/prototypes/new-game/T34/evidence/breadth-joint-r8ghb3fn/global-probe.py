from pathlib import Path
import subprocess,json,tarfile,hashlib
R=Path(__file__).resolve().parents[5];D=Path(__file__).resolve().parent;core=R/'src/core/island-geography.ts';original=core.read_bytes();results=[]
try:
 for name,amplitude,jitter in [('global-sixteen',16,0),('global-thirtytwo',32,0),('global-fortyeight',48,0)]:
  candidate=original.decode().replace('rng.nextInt(0,Q/2)',f'rng.nextInt(0,{amplitude}*Q)').replace('rng.nextInt(-Q,Q)',f'rng.nextInt(-{jitter}*Q,{jitter}*Q)')
  candidate=candidate.replace('const offset=Math.max(Q-lo,Math.min(limit-Q-next[4]!,rng.nextInt(-0*Q,0*Q)));','const extent=next[4]!-lo;for(let j=1;j<5;j++)next[j]=lo+quotient(BigInt(next[j]!-lo)*BigInt(hi-lo),BigInt(extent));const offset=0;')
  candidate=candidate.replace(' for(const island of g.islands){\n  const countries=g.provinces.filter(p=>p.island===island.id),xw=axisWarp(island.polygon.map(p=>p[0]),g.bounds.width,rng),yw=axisWarp(island.polygon.map(p=>p[1]),g.bounds.height,rng);',' const xw=axisWarp(g.islands.flatMap(i=>i.polygon.map(p=>p[0])),g.bounds.width,rng),yw=axisWarp(g.islands.flatMap(i=>i.polygon.map(p=>p[1])),g.bounds.height,rng);\n for(const island of g.islands){\n  const countries=g.provinces.filter(p=>p.island===island.id);')
  assert 'const extent=' in candidate and 'const xw=axisWarp(g.islands.flatMap' in candidate
  core.write_text(candidate)
  with (D/(name+'.txt')).open('w') as f:r=subprocess.run(['node',str(D/'smoke.mjs'),name],cwd=R,stdout=f,stderr=subprocess.STDOUT,timeout=900)
  results.append({'variant':name,'exit':r.returncode});print(json.dumps(results[-1]),flush=True)
finally:core.write_bytes(original)
assert core.read_bytes()==original
(D/'global-probe-report.json').write_text(json.dumps({'variants':results,'core_restored':True},indent=2)+'\n')
