"""Original static concepts, revision 7: map-first decisions and readable feedback.
Run: python3 docs/plans/finished-game-vision/draw-sketches.py
No application imports, assets, randomness or production generator changes.
"""
from html import escape
from pathlib import Path
from math import sin, cos, hypot
import runpy

REFERENCE = runpy.run_path(str(Path(__file__).with_name("geography-reference-forms.py")))

ROOT = Path(__file__).parent / 'sketches'
ROOT.mkdir(exist_ok=True)
SEA, INK, MUTED = '#102b36', '#f0f1de', '#c0d3cb'
PANEL, LINE, GOLD = '#173d47', '#517580', '#ffd06b'
OWNERS = ['#239cdb', '#f47745', '#92c83e', '#b86cdb']
ICONS = {
    'menu': 'M15 18H33 M15 24H33 M15 30H33',
    'pause': 'M19 16V32 M29 16V32',
    'fit': 'M14 21V14H21 M27 14H34V21 M34 27V34H27 M21 34H14V27 M22 22L14 14 M26 22L34 14 M26 26L34 34 M22 26L14 34',
    'end': 'M16 36V12 M16 13H34L29 20L34 27H16',
    'attack': 'M15 14L32 31 M14 20L20 14 M26 32L32 26 M33 14L16 31 M28 14L34 20 M16 26L22 32',
    'fast': 'M13 15L25 24L13 33Z M25 15L37 24L25 33Z',
    'start': 'M15 15L29 24L15 33Z M33 13V23 M28 18H38',
    'new': 'M15 12H29L35 18V36H15Z M29 12V19H35 M25 23V31 M21 27H29',
    'combat': 'M13 31L31 13L35 13L35 17L17 35 M12 27L21 36 M11 36L14 33 M27 27L36 25V32L32 36L27 32Z',
    'move': 'M12 18H33 M27 12L34 18L27 24 M36 30H15 M21 24L14 30L21 36',
    'watch': 'M11 24Q24 8 37 24Q24 40 11 24Z M20 24A4 4 0 1 0 28 24A4 4 0 1 0 20 24',
    'play': 'M19 14L34 24L19 34Z',
    'options': 'M14 17H34 M14 24H34 M14 31H34 M19 14V20 M29 21V27 M22 28V34',
    'load': 'M13 19V34H35V19H26L23 15H13Z M24 20V29 M20 25L24 29L28 25',
    'details': 'M15 32V25 M24 32V17 M33 32V22 M13 36H35',
    'history': 'M14 20A12 12 0 1 1 14 29 M14 14V21H21 M24 18V25L29 28',
    'check': 'M14 24L21 31L35 16', 'minus': 'M16 24H32',
    'plus': 'M16 24H32 M24 16V32', 'fold': 'M16 28L24 20L32 28',
    'repeat': 'M14 20A11 11 0 1 1 14 29 M14 14V21H21 M22 19L29 24L22 29Z',
    'stop': 'M17 26V17Q17 13 20 15V23 M20 23V12Q22 9 24 12V23 M24 23V13Q27 10 28 14V25 M28 25V18Q31 16 32 20V32Q29 38 23 37L17 33L12 26Q12 22 15 24L20 29',
    'help': 'M19 18Q19 12 25 13Q33 14 29 21L24 25V28 M24 34V35',
    'unfold': 'M16 19L24 27L32 19 M16 33H32',
    'focus': 'M15 24A9 9 0 1 0 33 24A9 9 0 1 0 15 24 M24 10V19 M24 29V38 M10 24H19 M29 24H38',
    'info': 'M24 22V32 M24 15V16', 'close': 'M17 17L31 31 M31 17L17 31',
}

class Drawing:
    def __init__(self, w, h, title, description):
        self.w, self.h = w, h
        self.land=[]; self.badge_boxes=[]; self.panel_boxes=[]; self.control_boxes=[]
        self.label_specs=[]; self.centres=[]; self.pair_keys=None; self.scene=None
        self.p = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" role="img" aria-labelledby="title desc">', f'<title id="title">{escape(title)}</title>', f'<desc id="desc">{escape(description)}</desc>', '<style>text{font-family:Arial,sans-serif}path{stroke-linecap:round;stroke-linejoin:round}</style>']
        self.rect(0, 0, w, h, SEA, extra='data-layer="full-viewport-map"')
    def rect(self, x, y, w, h, fill=PANEL, radius=0, stroke=None, extra=''):
        self.p.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{fill}" rx="{radius}" {extra}' + (f' stroke="{stroke}"' if stroke else '') + '/>')
    def path(self, path, fill='none', stroke=LINE, width=1, extra=''):
        self.p.append(f'<path d="{path}" fill="{fill}" stroke="{stroke}" stroke-width="{width}" {extra}/>')
    def text(self, x, y, value, size=16, colour=INK, anchor='start', weight=400):
        self.p.append(f'<text x="{x}" y="{y}" fill="{colour}" font-size="{size}" text-anchor="{anchor}" font-weight="{weight}">{escape(str(value))}</text>')
    def icon(self, x, y, kind, label, primary=False, active=False):
        self.control_boxes.append((x,y,x+48,y+48))
        self.p.append(f'<g role="img" aria-label="{escape(label)}" data-icon="{kind}" transform="translate({x} {y})"><title>{escape(label)}</title>')
        self.rect(0, 0, 48, 48, GOLD if primary else PANEL, 14, GOLD if active else LINE)
        self.path(ICONS[kind], stroke=SEA if primary else INK, width=2)
        self.p.append('</g>')
    def save(self, name, folder=ROOT):
        before=len(self.p)
        render_labels(self)
        if self.label_specs:
            self.p=self.p[:self.label_insert]+self.p[before:]+self.p[self.label_insert:before]
        if self.scene:self.p[0]=self.p[0].replace('role="img"',f'data-scene="{self.scene}" role="img"')
        (folder / name).write_text('\n'.join(self.p + ['</svg>'])+'\n')

def coast_path(points):
    out=[f'M {points[0][0]:.2f} {points[0][1]:.2f}']
    for i in range(len(points)):
        a,b,c,e=[points[j % len(points)] for j in (i-1,i,i+1,i+2)]
        out.append(f'C {b[0]+(c[0]-a[0])/6:.2f} {b[1]+(c[1]-a[1])/6:.2f} {c[0]-(e[0]-b[0])/6:.2f} {c[1]-(e[1]-b[1])/6:.2f} {c[0]:.2f} {c[1]:.2f}')
    return ' '.join(out)+' Z'

def cell_path(points):
    out=[f'M {points[0][0]:.2f} {points[0][1]:.2f}']
    for a,b in zip(points,points[1:]+points[:1]):
        lo,hi=sorted([a,b]); length=hypot(hi[0]-lo[0],hi[1]-lo[1]) or 1
        normal=(-(hi[1]-lo[1])/length,(hi[0]-lo[0])/length)
        amount=min(9,length*.13)
        bend1=amount*sin((lo[0]+hi[1])/23)
        bend2=amount*cos((lo[1]-hi[0])/31)
        c1=(lo[0]+(hi[0]-lo[0])/3+normal[0]*bend1,lo[1]+(hi[1]-lo[1])/3+normal[1]*bend1)
        c2=(lo[0]+2*(hi[0]-lo[0])/3+normal[0]*bend2,lo[1]+2*(hi[1]-lo[1])/3+normal[1]*bend2)
        if a!=lo: c1,c2=c2,c1
        out.append(f'C {c1[0]:.2f} {c1[1]:.2f} {c2[0]:.2f} {c2[1]:.2f} {b[0]:.2f} {b[1]:.2f}')
    return ' '.join(out)+' Z'

# Original drawing sites: nine silhouettes, 46 illustrative cells; not a legal map.
ISLANDS=[(145,112,85,63,3),(382,100,105,34,3),(682,116,94,70,3),
         (180,313,108,44,3),(472,300,112,82,5),(808,315,108,42,5),
         (140,556,90,72,7),(430,544,110,44,7),(766,563,135,90,10)]
ISLAND_FAMILIES=["sicily","cuba","borneo","new-zealand","borneo","cuba","sicily","new-zealand","borneo"]
OWNERSHIP=[[0,1,2],[3,1,0],[2,0,3],[1,3,0],[0,1,2,3,0],
           [1,2,0,3,1],[2,0,1,1,3,0,2],[3,2,0,1,0,3,2],
           [0,1,2,3,1,0,2,3,0,1]]

def drawing_coasts():
    return [coast_path([(a*rx,b*ry) for a,b in REFERENCE['outline'](ISLAND_FAMILIES[i],i)])
            for i,(x,y,rx,ry,n) in enumerate(ISLANDS)]

def owner_mark(d,x,y,owner,size=5,stroke=SEA):
    shapes=[f'M {x-size} {y-size}H {x+size}V {y+size}H {x-size}Z',
            f'M {x} {y-size-1}L {x+size+1} {y}L {x} {y+size+1}L {x-size-1} {y}Z',
            f'M {x-size} {y-size/2}L {x} {y-size-1}L {x+size} {y-size/2}V {y+size/2}L {x} {y+size+1}L {x-size} {y+size/2}Z',
            f'M {x-size} {y}a {size} {size} 0 1 0 {2*size} 0a {size} {size} 0 1 0 {-2*size} 0']
    d.path(shapes[owner],fill=OWNERS[owner],stroke=stroke,width=1.2)


def badge(d,x,y,value,owner,selected=False,role=None,preview=False,compact=False,country=None):
    # Count, owner shape and preview/selection treatments stay in screen space.
    d.p.append(f'<g data-country-badge="{country}" data-badge="{value}" data-owner="{owner}" data-badge-role="{role or "ordinary"}" data-preview="{str(preview).lower()}">')
    r=0.74 if compact else 1
    paths=[f'M {x-18} {y-18}H {x+18}V {y+18}H {x-18}Z',
           f'M {x} {y-23}L {x+23} {y}L {x} {y+23}L {x-23} {y}Z',
           f'M {x-20} {y-11}L {x} {y-22}L {x+20} {y-11}V {y+11}L {x} {y+22}L {x-20} {y+11}Z',
           f'M {x-19} {y}a 19 19 0 1 0 38 0a 19 19 0 1 0 -38 0']
    source=role=='source'
    d.p.append(f'<g transform="translate({x} {y}) scale({r}) translate({-x} {-y})">')
    d.path(paths[owner],fill=GOLD if source else SEA,stroke=INK if source else (GOLD if selected or preview else OWNERS[owner]),
           width=3 if source or role=='target' else 2,extra='stroke-dasharray="4 4"' if preview else '')
    d.p.append('</g>')
    d.text(x,y+5,value,14 if compact else 17,SEA if source else INK,'middle',700)
    d.p.append('</g>')
    size=19 if compact else 24
    d.badge_boxes.append((x-size,y-size,x+size,y+size))


def boxes_overlap(a,b,gap=3):
    return a[0]<b[2]+gap and a[2]>b[0]-gap and a[1]<b[3]+gap and a[3]>b[1]-gap


def render_labels(d):
    if not d.label_specs:return
    obstacles=[] if d.scene in ('setup','result','elimination','help','reward') else d.panel_boxes+d.control_boxes
    placed={}; occupied=list(obstacles)
    # Every country in a fitted overview gets a >=14px count in its owner shape.
    # Independent leader lines allow thin schematic regions to remain identifiable.
    specs=sorted(d.label_specs,key=lambda s:(s['role'] is None,int(s['country'].split('-')[0])!=4,s['country']))
    for spec in specs:
        x,y=spec['x'],spec['y']
        if not (0<=x<=d.w and 0<=y<=d.h):continue
        radius=20 if spec['compact'] else 24
        candidates=[(x,y)]
        for ring in range(1,15):
            step=10*ring
            for dx,dy in [(0,-step),(-step,0),(step,0),(0,step),(-step,-step),(step,-step),(-step,step),(step,step)]:
                candidates.append((x+dx,y+dy))
        candidates+=sorted(((sx,sy) for sx in range(radius+4,d.w-radius-3,20) for sy in range(radius+4,d.h-radius-3,20)),key=lambda p:(p[0]-x)**2+(p[1]-y)**2)
        result=next(((sx,sy) for sx,sy in candidates if radius+3<=sx<=d.w-radius-3 and radius+3<=sy<=d.h-radius-3
                     and all(not boxes_overlap((sx-radius,sy-radius,sx+radius,sy+radius),box,1) for box in occupied)),None)
        if result is None:raise ValueError(f'No readable count slot for {spec["country"]} on {d.w}x{d.h}/{d.scene}')
        sx,sy=result; placed[spec['country']]=result
        occupied.append((sx-radius,sy-radius,sx+radius,sy+radius))
        if hypot(sx-x,sy-y)>6:
            d.path(f'M {x} {y}L {sx} {sy}',stroke=MUTED,width=1.2,extra='data-count-leader="true"')
        badge(d,sx,sy,spec['value'],spec['owner'],role=spec['role'],preview=spec['preview'],compact=spec['compact'],country=spec['country'])
    if d.pair_keys and all(k in placed for k in d.pair_keys):
        a,b=[placed[k] for k in d.pair_keys]
        dx,dy=b[0]-a[0],b[1]-a[1];length=hypot(dx,dy);ux,uy=dx/length,dy/length
        end=(b[0]-ux*28,b[1]-uy*28)
        d.path(f'M {a[0]+ux*28} {a[1]+uy*28}L {end[0]} {end[1]}',stroke=GOLD,width=3,extra='data-pair-arrow="true"')
        d.path(f'M {end[0]-ux*8-uy*5} {end[1]-uy*8+ux*5}L {end[0]} {end[1]}L {end[0]-ux*8+uy*5} {end[1]-uy*8-ux*5}',stroke=GOLD,width=3)
    for x,y in d.centres:
        if not (0<=x<=d.w and 0<=y<=d.h):continue
        candidates=[(x+dx,y+dy) for radius in (32,48,64,80) for dx,dy in ((radius,-radius),(-radius,-radius),(radius,radius),(-radius,radius))]
        sx,sy=next(((sx,sy) for sx,sy in candidates if 10<sx<d.w-10 and 10<sy<d.h-10 and all(not boxes_overlap((sx-6,sy-8,sx+6,sy+7),box,3) for box in occupied)),(x,y))
        d.path(f'M {x} {y}L {sx} {sy}',stroke=MUTED,width=1)
        d.p.append('<g data-centre="production">')
        d.path(f'M {sx-4} {sy}L {sx} {sy-6}L {sx+4} {sy}V {sy+5}H {sx-4}Z',fill='#f2d69a',stroke=SEA,width=1)
        d.p.append('</g>')
        occupied.append((sx-6,sy-8,sx+6,sy+7))


def scene_owners(scene):
    result=[]; index=0
    for i,(_,_,_,_,n) in enumerate(ISLANDS):
        row=[]
        for j in range(n):
            owner=OWNERSHIP[i][j]
            if scene=='late-game': owner=0 if index<34 else 1
            elif scene=='result': owner=0 if index<35 else 1
            elif scene=='elimination': owner=1+index%3
            else:
                if i==4 and j==0: owner=0
                if i==4 and j==1: owner=0 if scene in ('capture','folded-choice','computer-turn','return-to-turn') else 1
            row.append(owner);index+=1
        result.append(row)
    return result


def geography(d, device, scene, counts=None, stage=None):
    portrait=device in ('phone-portrait','tablet')
    d.scene=scene
    active=scene in ('ordinary-turn','capture','inspection','folded-choice','computer-turn','return-to-turn','friendly-choice','friendly-move')
    focused=device.startswith('phone') and active
    coasts=drawing_coasts()
    points=[(x+a*rx,y+b*ry) for i,(x,y,rx,ry,n) in enumerate(ISLANDS)
            for a,b in REFERENCE['outline'](ISLAND_FAMILIES[i],i)]
    # Bounds include spline overshoot and shoreline strokes, not just island centres.
    xmin,ymin=min(x for x,y in points)-14,min(y for x,y in points)-14
    xmax,ymax=max(x for x,y in points)+14,max(y for x,y in points)+14
    center=((xmin+xmax)/2,(ymin+ymax)/2)
    spanx,spany=(ymax-ymin,xmax-xmin) if portrait else (xmax-xmin,ymax-ymin)
    scale=min((d.w-40)/spanx,(d.h-40)/spany)
    anchor=(d.w/2,d.h/2)
    # Wide active scenes temporarily reframe into the clear space beside controls.
    # This is a camera view, never a permanent panel or a rearranged world.
    if (active or scene=='late-game') and not device.startswith('phone'):
        if portrait:
            scale=min((d.w-80)/spanx,(d.h-360)/spany)
            anchor=(d.w/2,(d.h-270)/2)
        else:
            scale=min((d.w-410)/spanx,(d.h-100)/spany)
            anchor=((d.w-370)/2,d.h/2)
    if focused:
        _,sites=REFERENCE['regions'](ISLAND_FAMILIES[4],5,4)
        center=(472,300)
        scale=1.8 if portrait else 1.18
        anchor=(d.w/2 if portrait else d.w*.28,d.h*.44 if portrait else d.h*.48)
    if portrait:
        def project(x,y): return anchor[0]-(y-center[1])*scale,anchor[1]+(x-center[0])*scale
        transform=f'translate({anchor[0]} {anchor[1]}) scale({scale}) rotate(90) translate({-center[0]} {-center[1]})'
    else:
        def project(x,y): return anchor[0]+(x-center[0])*scale,anchor[1]+(y-center[1])*scale
        transform=f'translate({anchor[0]} {anchor[1]}) scale({scale}) translate({-center[0]} {-center[1]})'
    d.p.append(f'<g data-layer="geography" data-rotation="{90 if portrait else 0}" data-camera="{"focus" if focused else "overview"}" transform="{transform}">')
    for i,(x,y,rx,ry,n) in enumerate(ISLANDS):
        d.p.append(f'<g transform="translate({x} {y})">')
        d.path(coasts[i],stroke='#214c56',width=10)
        d.path(coasts[i],stroke='#3c7071',width=4)
        d.p.append('</g>')
    links=[(0,1),(1,2),(0,3),(1,4),(2,5),(3,4),(4,5),(3,6),(4,7),(5,8),(6,7),(7,8)]
    for a,b in links:
        ax,ay,rx,ry,_=ISLANDS[a]; bx,by,sx,sy,_=ISLANDS[b]
        dx,dy=bx-ax,by-ay; length=hypot(dx,dy)
        aa,bb=min(rx,ry)*.91,min(sx,sy)*.91
        d.path(f'M {ax+dx/length*aa:.1f} {ay+dy/length*aa:.1f} L {bx-dx/length*bb:.1f} {by-dy/length*bb:.1f}',stroke='#89aaa4',width=1.5,extra='stroke-dasharray="3 6"')
    selected=[]; central_owners=[]
    default_counts={0:8,1:3,2:6,3:2,4:4}
    if scene in ('capture','folded-choice','computer-turn','return-to-turn'): default_counts.update({0:4,1:3})
    if scene=='friendly-move': default_counts.update({0:5,4:7})
    default_counts.update(counts or {})
    owners=scene_owners(scene)
    captured=scene in ('capture','folded-choice','computer-turn','return-to-turn')
    for i,(x,y,rx,ry,n) in enumerate(ISLANDS):
        polygons,sites=REFERENCE['regions'](ISLAND_FAMILIES[i],n,i)
        seeds=[(a*rx,b*ry) for a,b in sites]
        d.p.append(f'<g transform="translate({x} {y})"><defs><clipPath id="coast-{i}"><path d="{coasts[i]}"/></clipPath></defs><g clip-path="url(#coast-{i})">')
        highlights=[]
        for j,(sx,sy) in enumerate(seeds):
            owner=owners[i][j]
            path=cell_path([(a*rx,b*ry) for a,b in polygons[j]])
            dim=stage in ('target','pair','feedback','running','friendly') and not (i==4 and j in ((0,4) if stage=='friendly' else (0,1,3)))
            d.path(path,fill=OWNERS[owner],stroke='#d0dfbf',width=.9,extra=f'data-country="{i}-{j}" data-owner="{owner}"'+(' opacity=".35"' if dim else ''))
            if i==4 and active:
                role='legal' if j in (0,4) and stage=='source' else ('source' if j==0 and stage in ('target','pair','feedback','running') else ('target' if j==1 and stage in ('pair','feedback','running') else ('legal' if j in (1,3) and stage=='target' else ('source' if j==0 and stage=='friendly' else ('target' if j==4 and stage=='friendly' else None)))))
                if role: highlights.append((path,role))
            # Quiet geographical detail: small inset contours, no terrain colours/text.
            if j%3==0:
                d.path(f'M {sx-9} {sy+11}q 10 -5 19 1',stroke='#dce9c2',width=.65,extra='opacity=".24"')
            if i==4:
                selected.append(project(x+sx,y+sy)); central_owners.append(owner)
            value=default_counts[j] if i==4 else 1+(i*3+j)%8
            role=('source' if j==0 else ('target' if j==(4 if stage=='friendly' else 1) and stage!='target' else None)) if i==4 and stage in ('target','pair','feedback','running','friendly') else None
            d.label_specs.append({'country':f'{i}-{j}','x':project(x+sx,y+sy)[0],'y':project(x+sx,y+sy)[1],
                                  'value':value,'owner':owner,'role':role,'compact':not (focused and i==4),
                                  'preview':scene in ('capture','folded-choice','friendly-move') and i==4 and j in ((0,4) if scene=='friendly-move' else (0,1))})
        for path,role in highlights:
            d.path(path,stroke=INK if role=='legal' else GOLD,width=(2.5 if role=='legal' else 4)/scale,extra=f'data-selection="{role}"'+(' stroke-dasharray="9 7"' if role!='source' else ''))
        d.p.append('</g>')
        d.path(coasts[i],stroke='#dce4be',width=1.4,extra=f'data-coast="outline" data-island="{i}"')
        d.land.append((i,[project(x+a*rx,y+b*ry) for a,b in REFERENCE['outline'](ISLAND_FAMILIES[i],i)]))
        if i in (1,4,8): d.centres.append(project(x,y))
        d.p.append('</g>')
    d.p.append('</g>')
    if stage in ('pair','feedback','running','friendly'):
        d.pair_keys=('4-0','4-4' if stage=='friendly' else '4-1')
    d.label_insert=len(d.p)
    return selected


def card(d,w,h,y=None):
    context=y is not None
    if context and d.w>=700 and d.h>=500:
        if d.h>d.w:
            x=(d.w-w)/2; y=d.h-250+(0 if h<80 else 75)
        else:
            x=d.w-w-22; y=88 if h<80 else max(190,(d.h-h)/2)
    else:
        x=d.w-w-86 if d.h<500 and context else (d.w-w)/2
        y=d.h/2-h/2 if y is None else y
    if d.scene=='late-game' and d.h<500:x,y=16,104
    d.panel_boxes.append((x,y,x+w,y+h))
    d.rect(x,y,w,h,PANEL,18,LINE,extra='data-layer="context"')
    return x,y

def context_y(d,height=100):
    return d.h-height-104 if d.h>500 else d.h-height-82


def named_action(d,x,y,kind,label,primary=False):
    d.icon(x,y,kind,label,primary)
    d.text(x+24,y+67,label,14,INK,'middle',700)


def battle_controls(d,mode='pair',chance=91):
    x,y=card(d,304,112,context_y(d,112))
    if mode=='running':
        d.text(x+16,y+25,'Fight on · stop at 2 armies',16,weight=700)
        d.icon(x+25,y+36,'options','Change stop-at army amount')
        named_action(d,x+128,y+36,'stop','Stop',True)
    else:
        d.text(x+16,y+25,f'{chance}% capture · if fought to end',16,weight=700)
        named_action(d,x+25,y+36,'attack','Attack',True)
        if mode=='feedback': named_action(d,x+128,y+36,'repeat','Fight on')
        named_action(d,x+230,y+36,'close','Cancel')


def capture_controls(d):
    x,y=card(d,304,154,context_y(d,154))
    d.text(x+15,y+25,'Preview · 4 stay / 3 move',16,weight=700)
    d.icon(x+14,y+40,'minus','Move one fewer army')
    d.rect(x+68,y+40,48,48,SEA,8,GOLD,extra='data-draft="move-in"')
    d.text(x+92,y+69,'3',20,INK,'middle',700)
    d.path(f'M {x+78} {y+79}H {x+105}',stroke=GOLD,width=1)
    d.icon(x+122,y+40,'plus','Move one more army')
    d.icon(x+176,y+40,'check','Confirm total move-in of three',True)
    d.icon(x+230,y+40,'fold','Fold; keep pending move-in')
    d.text(x+15,y+110,'Tap amount to type · range 1–6',14,MUTED)
    d.text(x+15,y+139,'1',14,MUTED)
    d.path(f'M {x+40} {y+133}H {x+260}',stroke=LINE,width=4)
    d.path(f'M {x+128} {y+127}V {y+139}',stroke=GOLD,width=6)
    d.text(x+278,y+139,'6',14,MUTED)


def friendly_controls(d,choice=False):
    x,y=card(d,304,112 if choice else 158,context_y(d,112 if choice else 158))
    if choice:
        d.text(x+14,y+25,'Friendly neighbour · choose Move',16,weight=700)
        named_action(d,x+34,y+38,'move','Move armies',True)
        named_action(d,x+222,y+38,'close','Cancel')
    else:
        d.text(x+14,y+25,'Preview · 5 stay / 7 arrive',16,weight=700)
        d.icon(x+14,y+40,'minus','Move one fewer')
        d.rect(x+68,y+40,48,48,SEA,8,GOLD,extra='data-draft="friendly-move"')
        d.text(x+92,y+69,'3',20,INK,'middle',700)
        d.icon(x+122,y+40,'plus','Move one more')
        d.icon(x+176,y+40,'check','Move three and end turn',True)
        d.icon(x+230,y+40,'close','Cancel to return to attacks')
        d.text(x+200,y+112,'Move & end turn',14,INK,'middle',700)
        d.text(x+14,y+139,'Tap amount to type · range 1–7',14,MUTED)


def elimination_controls(d):
    x,y=card(d,304,194)
    d.text(x+152,y+36,'You were eliminated',23,INK,'middle',700)
    d.text(x+152,y+64,'Your result is recorded once.',14,MUTED,'middle')
    named_action(d,x+55,y+92,'watch','Watch computers',True)
    named_action(d,x+202,y+92,'stop','Stop game')


def turn_notice(d,title,detail=None):
    height=72 if detail else 48
    x,y=card(d,min(358,d.w-32),height,88 if d.h>500 else 72)
    d.text(x+16,y+28,title,17,weight=700)
    if detail: d.text(x+16,y+53,detail,14,MUTED)


def placement_pool(d,remaining):
    x,y=(d.w-90)/2,16
    d.rect(x,y,90,48,PANEL,12,LINE,extra=f'data-layer="context" data-pool="{remaining}"')
    d.panel_boxes.append((x,y,x+90,y+48))
    d.path(f'M {x+14} {y+32}H {x+36} M {x+18} {y+26}H {x+32} M {x+22} {y+20}H {x+28} M {x+25} {y+8}V {y+16}',stroke=INK,width=2)
    d.text(x+62,y+32,remaining,22,INK,'middle',700)


def base_controls(d,scene):
    d.icon(16,16,'menu','Menu: help, icon names, armies, history, files and settings')
    kind,label=('options','Match options') if scene=='setup' else (('close','Inspect final map') if scene in ('result','elimination') else ('pause','Pause or resume computer playback'))
    d.icon(d.w-64,16,kind,label)
    d.icon(16,d.h-64,'fit','Fit: show the whole archipelago')
    if scene in ('quiet-map','ordinary-turn','late-game','inspection'):
        if scene!='inspection': d.icon(d.w-64,d.h-64,'end','End turn only when legal')


SCENES={'quiet-map':'Resting map: permanent owner-shaped army counts, no prose',
        'setup':'Setup: named Start game and options on request',
        'ordinary-turn':'Turn: relevant neighbouring stacks, legal pair, odds and Attack',
        'capture':'Capture: pending preview, editable amount and range',
        'folded-choice':'Folded capture: pending draft and explicit return',
        'inspection':'Requested inspection: compare armies without placing',
        'computer-turn':'Computer turn: active owner, local reinforcement and fast-forward',
        'return-to-turn':'Human turn returns with recoverable changes',
        'late-game':'Requested objective and remaining fronts',
        'result':'Result: named New game and requested details',
        'friendly-choice':'Friendly neighbour: request Move or Cancel',
        'friendly-move':'Friendly movement: preview and Move-and-end-turn commit',
        'elimination':'Human elimination: Watch computers or Stop game'}
DEVICES={'phone-portrait':(390,844),'phone-landscape':(844,390),'tablet':(768,1024),'tablet-landscape':(1024,768),'desktop':(1280,800)}
def draw_gallery():
    for scene,meaning in SCENES.items():
        for device,(w,h) in DEVICES.items():
            d=Drawing(w,h,f'Malpaco · {meaning} · {device}',meaning+'. Revision 7 original static concept; not implemented or playtested. Full viewport map, fitted first-open/Fit in either orientation, same world quarter-turned in portrait. Upright owner-shaped count badges, local selection and temporary context. Illustrative stacks, odds, dice and changes are not an engine trace or generation evidence.')
            counts=({0:5,4:7} if scene=='friendly-move' else ({0:4,1:3,3:5} if scene in ('computer-turn','return-to-turn') else None))
            pair=geography(d,device,scene,counts,stage='pair' if scene=='ordinary-turn' else ('friendly' if scene in ('friendly-choice','friendly-move') else None))
            base_controls(d,scene)
            if scene=='setup':
                x,y=card(d,288,210)
                d.text(w/2,y+34,'Malpaco',25,INK,'middle',700)
                d.text(w/2,y+62,'1 human · 3 Normal',15,MUTED,'middle')
                d.text(w/2,y+85,'Goal · hold 35 of 46',14,INK,'middle')
                for j,(kind,label) in enumerate([('load','Load'),('start','Start game'),('options','Options')]):
                    named_action(d,x+30+j*90,y+108,kind,label,primary=kind=='start')
            elif scene=='friendly-choice': friendly_controls(d,True)
            elif scene=='friendly-move': friendly_controls(d)
            elif scene=='elimination': elimination_controls(d)
            elif scene=='ordinary-turn': battle_controls(d)
            elif scene=='capture': capture_controls(d)
            elif scene=='folded-choice':
                x,y=card(d,264,84,context_y(d,84))
                d.text(x+14,y+26,'Move-in pending · preview 4 / 3',15,weight=700)
                d.icon(x+106,y+33,'unfold','Return to pending move-in; does not confirm',True)
            elif scene=='inspection':
                turn_notice(d,'Inspect armies · no armies spent')
                x,y=card(d,286,88,context_y(d,88))
                for j,name in enumerate(['Blue','Orange','Lime','Purple']):
                    owner_mark(d,x+20+j*70,y+24,j,6)
                    d.text(x+20+j*70,y+49,name,13,INK,'middle')
                d.text(x+143,y+73,'Close inspection to place armies',14,MUTED,'middle')
                d.icon(w-64,h-64,'close','Close inspection and return to placement',True)
            elif scene=='computer-turn':
                turn_notice(d,'Purple · placing armies')
                sx,sy=pair[3]
                d.text(sx+31,sy-27,'+3',19,GOLD,'middle',700)
                x,y=card(d,192,88,context_y(d,88))
                named_action(d,x+72,y+8,'fast','Fast-forward',True)
            elif scene=='return-to-turn':
                placement_pool(d,4)
                turn_notice(d,'Your turn · place armies','Purple reinforced nearby. Tap to inspect.')
                sx,sy=pair[3]
                d.path(f'M {sx-29} {sy}a 29 29 0 1 0 58 0a 29 29 0 1 0 -58 0',stroke=GOLD,width=2,extra='stroke-dasharray="4 5"')
                x,y=card(d,192,88,context_y(d,88))
                named_action(d,x+72,y+8,'history','Changes',True)
            elif scene=='late-game':
                x,y=card(d,256,52,88 if h>500 else 72)
                owned=sum(row.count(0) for row in scene_owners(scene))
                d.text(x+128,y+32,f'Domination · {owned} / 35',16,INK,'middle')
                d.icon(w-64,h-124,'info','Close requested objective details',active=True)
            elif scene=='result':
                x,y=card(d,300,198)
                d.text(w/2,y+40,'You won',28,INK,'middle',700)
                d.text(x+150,y+68,'Domination · 35 of 46',16,MUTED,'middle')
                for j,(kind,label) in enumerate([('new','New game'),('details','Standings'),('history','History'),('load','Files')]):
                    d.icon(x+24+j*68,y+96,kind,label,primary=j==0)
                d.text(x+48,y+167,'New game',14,INK,'middle',700)
            d.save(f'{scene}-{device}.svg')

if __name__=='__main__':
    draw_gallery()
    print(f'Wrote {len(SCENES)*len(DEVICES)} original revision-7 SVG concepts')
