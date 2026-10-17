from pathlib import Path
import json,math
R=Path('/home/diego/projects/malpaco/.cache/t34-work');D=R/'docs/prototypes/new-game/T34/evidence/breadth-joint-r8ghb3fn';W=Path('/home/diego/projects/malpaco/.cache/t34-breadth-work/docs/prototypes/new-game/T34/breadth');base=json.loads((R/'docs/prototypes/new-game/T34/witness.json').read_text());source=[p.parent for p in W.glob('sample-*/report.json') if json.loads(p.read_text())['variant']=='global-label-fortyeight'][0]
def box(poly):
 xs=[p[0] for p in poly];ys=[p[1] for p in poly];return min(xs),min(ys),max(xs),max(ys)
def center(poly):
 x,y,u,v=box(poly);return((x+u)/2,(y+v)/2)
reference={i['id']:center(i['polygon']) for i in base['islands']};gs=[]
for seed in[0,1,2,7,42,1994]:
 g=json.loads((source/f'seed-{seed}.json').read_text())['result']['geography'];width=g['bounds']['width'];height=g['bounds']['height']
 choices=[]
 for xflip in [False,True]:
  for yflip in [False,True]:
   cost=0
   for i in g['islands']:
    x,y=center(i['polygon']);a,b=reference[i['id']];cost+=((width-x if xflip else x)-a)**2+((height-y if yflip else y)-b)**2
   choices.append((cost,xflip,yflip))
 _,xf,yf=min(choices)
 def point(p):return[width-p[0] if xf else p[0],height-p[1] if yf else p[1]]
 for i in g['islands']:i['polygon']=[point(p)for p in i['polygon']]
 for p in g['provinces']:p['polygon']=[point(v)for v in p['polygon']];p['labelAt']=point(p['labelAt'])
 for route in g['entranceReservations']:route['points']=[point(v)for v in route['points']]
 gs.append(g)
metrics=[]
for i in range(9):
 bs=[box(g['islands'][i]['polygon']) for g in gs];centers=[center(g['islands'][i]['polygon'])for g in gs];ws=[(b[2]-b[0])/2048 for b in bs];hs=[(b[3]-b[1])/2048 for b in bs]
 metrics.append({'island':gs[0]['islands'][i]['id'],'width_css_range':[min(ws),max(ws)],'height_css_range':[min(hs),max(hs)],'max_center_displacement_css':max(math.dist(a,b)/2048 for a in centers for b in centers)})
(D/'diversity-smoke.json').write_text(json.dumps({'global_mirrors_factored_out':True,'sampled_seeds':[g['seed']for g in gs],'metrics':metrics,'scope':'Six-seed measured dimensions/placements only. No universal or full breadth acceptance claim.'},indent=2)+'\n')
def svg(g):
 poly=lambda ps:' '.join(f'{x/2048:.3f},{y/2048:.3f}'for x,y in ps)
 shapes=''.join(f'<polygon points="{poly(p["polygon"])}" fill="hsl({int(p["island"].split("_")[1])*43%360} 30% 68%)" stroke="#3f4c43" stroke-width="0.6"/>'for p in g['provinces']);routes=''.join(f'<polyline points="{poly(r["points"])}" fill="none" stroke="#46636a" stroke-width="1.8" stroke-dasharray="4 3"/>'for r in g['entranceReservations']);labels=''.join(f'<text x="{p["labelAt"][0]/2048:.3f}" y="{p["labelAt"][1]/2048:.3f}" text-anchor="middle" font-size="11">{p["id"].split("_")[1]}</text>'for p in g['provinces']);return'<svg viewBox="0 0 800 460">'+shapes+routes+labels+'</svg>'
(D/'gallery-normalized.html').write_text('<!doctype html><meta charset="utf-8"><title>T34 normalized joint smoke</title><style>body{font-family:system-ui;background:#f6f4ec;margin:16px}main{display:grid;grid-template-columns:1fr 1fr;gap:14px}article{background:#dce8e8;padding:8px}svg{width:100%;display:block}h2{font-size:16px;margin:0}</style><h1>T34 joint smoke — mirrors factored out</h1><p>Diagnostic partial geometry only. Country IDs shown. Not a delivered generator or approved appearance.</p><main>'+''.join(f'<article><h2>Seed {g["seed"]}</h2>'+svg(g)+'</article>'for g in gs)+'</main>')
print(json.dumps(metrics))
