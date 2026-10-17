"""Mirror-normalized gallery from a completed100-seed sweep, never regenerated data."""
from pathlib import Path
import json,sys,math,hashlib,tempfile
D=Path(__file__).resolve().parent;R=Path.cwd();T=R/'docs/prototypes/new-game/T34';S=Path(sys.argv[1]);out=Path(tempfile.mkdtemp(prefix='family-gallery-',dir=T/'evidence'))
def box(poly):
 xs=[p[0] for p in poly];ys=[p[1] for p in poly];return min(xs),min(ys),max(xs),max(ys)
def center(poly):
 x,y,u,v=box(poly);return((x+u)/2,(y+v)/2)
normalized=[];groups={0:[],1:[],2:[]}
for seed in range(100):
 p=S/f'seed-{seed:02}.json';record=json.loads(p.read_text());result=record['result']
 if not result['ok']:continue
 g=result['geography'];w=g['bounds']['width'];h=g['bounds']['height'];anchor=next(i for i in g['islands']if i['id']=='island_7');x,y=center(anchor['polygon']);xf=x>w/2;yf=y>h/2
 def point(p):return[w-p[0]if xf else p[0],h-p[1]if yf else p[1]]
 for i in g['islands']:i['polygon']=[point(v)for v in i['polygon']]
 for p in g['provinces']:p['polygon']=[point(v)for v in p['polygon']];p['labelAt']=point(p['labelAt'])
 for r in g['entranceReservations']:r['points']=[point(v)for v in r['points']]
 byId={i['id']:i for i in g['islands']};largestY=center(byId['island_8']['polygon'])[1];smallY=center(byId['island_0']['polygon'])[1];plan=2 if h/3<largestY<2*h/3 else 1 if smallY>h/2 else 0
 normalized.append(g);groups[plan].append(g)
assert all(groups.values())
metrics=[]
for iid in [i['id']for i in normalized[0]['islands']]:
 bs=[box(next(i for i in g['islands']if i['id']==iid)['polygon'])for g in normalized];cs=[((b[0]+b[2])/2,(b[1]+b[3])/2)for b in bs];aspects=[(b[2]-b[0])/(b[3]-b[1])for b in bs];metrics.append({'island':iid,'aspectMin':min(aspects),'aspectMax':max(aspects),'aspectMaxOverMin':max(aspects)/min(aspects),'maxCentreDisplacementCss':max(math.dist(a,b)/2048 for a in cs for b in cs)})
selected=[g for plan in groups.values()for g in plan[:3]]
(out/'report.json').write_text(json.dumps({'sweep':str(S.relative_to(R)),'sweepReportSha256':hashlib.sha256((S/'report.json').read_bytes()).hexdigest(),'normalization':'island_7 fixed to upper-left quadrant, removing whole-board x/y reflections','plans':{str(k):[g['seed']for g in v]for k,v in groups.items()},'gallerySeeds':[g['seed']for g in selected],'islandMetrics':metrics,'scope':'Actual partial geographies, three true placement plans; IDs stable. No arbitrary planar-generator or owner appearance-approval claim.'},indent=2)+'\n')
def svg(g):
 poly=lambda ps:' '.join(f'{x/2048:.3f},{y/2048:.3f}'for x,y in ps)
 shapes=''.join(f'<polygon points="{poly(p["polygon"])}" fill="hsl({int(p["island"].split("_")[1])*43%360} 30% 68%)" stroke="#3f4c43" stroke-width="0.6"/>'for p in g['provinces']);routes=''.join(f'<polyline points="{poly(r["points"])}" fill="none" stroke="#46636a" stroke-width="1.8" stroke-dasharray="4 3"/>'for r in g['entranceReservations']);labels=''.join(f'<text x="{p["labelAt"][0]/2048:.3f}" y="{p["labelAt"][1]/2048:.3f}" text-anchor="middle" font-size="11">{p["id"].split("_")[1]}</text>'for p in g['provinces']);return'<svg viewBox="0 0 800 460">'+shapes+routes+labels+'</svg>'
(out/'gallery-normalized.html').write_text('<!doctype html><meta charset="utf-8"><title>T34 placement family</title><style>body{font-family:system-ui;background:#f6f4ec;margin:16px}main{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px}article{background:#dce8e8;padding:8px}svg{width:100%;display:block}h2{font-size:16px;margin:0}</style><h1>T34 placement family — mirrors removed</h1><p>Three placement plans, three measured seeds each. Partial geography and reserved crossings. Island7 remains upper left; country IDs shown.</p><main>'+''.join(f'<article><h2>Plan {k}, seed {g["seed"]}</h2>'+svg(g)+'</article>'for k,gs in groups.items()for g in gs[:3])+'</main>')
print(str(out))
