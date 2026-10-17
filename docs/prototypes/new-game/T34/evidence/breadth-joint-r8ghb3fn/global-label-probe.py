from pathlib import Path
import subprocess,json,tarfile,hashlib
R=Path(__file__).resolve().parents[5];D=Path(__file__).resolve().parent;core=R/'src/core/island-geography.ts';original=core.read_bytes();results=[]
try:
 for name,amplitude,jitter in [('global-label-sixteen',16,0),('global-label-thirtytwo',32,0),('global-label-fortyeight',48,0)]:
  candidate=original.decode().replace('rng.nextInt(0,Q/2)',f'rng.nextInt(0,{amplitude}*Q)').replace('rng.nextInt(-Q,Q)',f'rng.nextInt(-{jitter}*Q,{jitter}*Q)')
  candidate=candidate.replace('const offset=Math.max(Q-lo,Math.min(limit-Q-next[4]!,rng.nextInt(-0*Q,0*Q)));','const extent=next[4]!-lo;for(let j=1;j<5;j++)next[j]=lo+quotient(BigInt(next[j]!-lo)*BigInt(hi-lo),BigInt(extent));const offset=0;')
  candidate=candidate.replace(' for(const island of g.islands){\n  const countries=g.provinces.filter(p=>p.island===island.id),xw=axisWarp(island.polygon.map(p=>p[0]),g.bounds.width,rng),yw=axisWarp(island.polygon.map(p=>p[1]),g.bounds.height,rng);',' const xw=axisWarp(g.islands.flatMap(i=>i.polygon.map(p=>p[0])),g.bounds.width,rng),yw=axisWarp(g.islands.flatMap(i=>i.polygon.map(p=>p[1])),g.bounds.height,rng);\n for(const island of g.islands){\n  const countries=g.provinces.filter(p=>p.island===island.id);')
  assert 'const extent=' in candidate and 'const xw=axisWarp(g.islands.flatMap' in candidate
  candidate=candidate.replace("export function generateIslandGeography",'function repairLabels(g:IslandGeography):void {\n const half=20*Q;\n const hit=(v:GeoPoint,p:GeographyCountry):boolean=>{const[x,y]=v,box:GeoPoint[]=[[x-half,y-half],[x+half,y-half],[x+half,y+half],[x-half,y+half]];return !box.some(q=>locate(q,p.polygon)<0)&&!edges(box).some(([a,b])=>edges(p.polygon).some(([c,d])=>proper(a,b,c,d)));};\n const offsets:GeoPoint[]=[];for(let x=-24;x<=24;x++)for(let y=-24;y<=24;y++)offsets.push([x*Q,y*Q]);offsets.sort((a,b)=>norm2(a,[0,0])-norm2(b,[0,0])||a[0]-b[0]||a[1]-b[1]);\n for(let pass=0;pass<3;pass++)for(const p of g.provinces){\n  const free=(v:GeoPoint)=>!g.provinces.some(q=>q!==p&&Math.abs(v[0]-q.labelAt[0])<44*Q&&Math.abs(v[1]-q.labelAt[1])<47*Q);\n  if(hit(p.labelAt,p)&&free(p.labelAt))continue;\n  const origin=p.labelAt;\n  for(const o of offsets){const v:GeoPoint=[origin[0]+o[0],origin[1]+o[1]];if(free(v)&&hit(v,p)){p.labelAt=v;break;}}\n }\n}\n'+"export function generateIslandGeography").replace("warp(geography,rng);repairReservations", "warp(geography,rng);repairLabels(geography);repairReservations")
  core.write_text(candidate)
  with (D/(name+'.txt')).open('w') as f:r=subprocess.run(['node',str(D/'smoke.mjs'),name],cwd=R,stdout=f,stderr=subprocess.STDOUT,timeout=900)
  results.append({'variant':name,'exit':r.returncode});print(json.dumps(results[-1]),flush=True)
finally:core.write_bytes(original)
assert core.read_bytes()==original
(D/'global-label-probe-report.json').write_text(json.dumps({'variants':results,'core_restored':True},indent=2)+'\n')
