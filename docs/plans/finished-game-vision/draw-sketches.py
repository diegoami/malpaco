"""Original static concepts, revision 3: portrait rotation, fit and focus views.
Run: python3 docs/plans/finished-game-vision/draw-sketches.py
No application imports, assets, randomness or production generator changes.
"""
from html import escape
from pathlib import Path
from math import sin, cos, pi, hypot

ROOT = Path(__file__).parent / 'sketches'
ROOT.mkdir(exist_ok=True)
SEA, INK, MUTED = '#102b36', '#f0f1de', '#c0d3cb'
PANEL, LINE, GOLD = '#173d47', '#517580', '#edcf89'
OWNERS = ['#729b94', '#a37d67', '#8e9c69', '#8d819f']
ICONS = {
    'menu': 'M15 18H33 M15 24H33 M15 30H33',
    'pause': 'M19 16V32 M29 16V32',
    'fit': 'M18 14H14V18 M30 14H34V18 M34 30V34H30 M18 34H14V30 M20 24H28 M24 20V28',
    'end': 'M15 24H30 M25 18L31 24L25 30 M35 16V32',
    'attack': 'M15 14L32 31 M14 20L20 14 M26 32L32 26 M33 14L16 31 M28 14L34 20 M16 26L22 32',
    'play': 'M19 14L34 24L19 34Z',
    'options': 'M14 17H34 M14 24H34 M14 31H34 M19 14V20 M29 21V27 M22 28V34',
    'load': 'M13 19V34H35V19H26L23 15H13Z M24 20V29 M20 25L24 29L28 25',
    'details': 'M15 32V25 M24 32V17 M33 32V22 M13 36H35',
    'history': 'M14 20A12 12 0 1 1 14 29 M14 14V21H21 M24 18V25L29 28',
    'check': 'M14 24L21 31L35 16', 'minus': 'M16 24H32',
    'plus': 'M16 24H32 M24 16V32', 'fold': 'M16 28L24 20L32 28',
    'info': 'M24 22V32 M24 15V16', 'close': 'M17 17L31 31 M31 17L17 31',
}

class Drawing:
    def __init__(self, w, h, title, description):
        self.w, self.h = w, h
        self.p = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" role="img" aria-labelledby="title desc">', f'<title id="title">{escape(title)}</title>', f'<desc id="desc">{escape(description)}</desc>', '<style>text{font-family:Arial,sans-serif}path{stroke-linecap:round;stroke-linejoin:round}</style>']
        self.rect(0, 0, w, h, SEA, extra='data-layer="full-viewport-map"')
    def rect(self, x, y, w, h, fill=PANEL, radius=0, stroke=None, extra=''):
        self.p.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{fill}" rx="{radius}" {extra}' + (f' stroke="{stroke}"' if stroke else '') + '/>')
    def path(self, path, fill='none', stroke=LINE, width=1, extra=''):
        self.p.append(f'<path d="{path}" fill="{fill}" stroke="{stroke}" stroke-width="{width}" {extra}/>')
    def text(self, x, y, value, size=16, colour=INK, anchor='start', weight=400):
        self.p.append(f'<text x="{x}" y="{y}" fill="{colour}" font-size="{size}" text-anchor="{anchor}" font-weight="{weight}">{escape(str(value))}</text>')
    def icon(self, x, y, kind, label, primary=False, active=False):
        self.p.append(f'<g role="img" aria-label="{escape(label)}" data-icon="{kind}" transform="translate({x} {y})"><title>{escape(label)}</title>')
        self.rect(0, 0, 48, 48, GOLD if primary else PANEL, 14, GOLD if active else LINE)
        self.path(ICONS[kind], stroke=SEA if primary else INK, width=2)
        self.p.append('</g>')
    def save(self, name):
        (ROOT / name).write_text('\n'.join(self.p + ['</svg>'])+'\n')

def coast_path(points):
    out=[f'M {points[0][0]:.2f} {points[0][1]:.2f}']
    for i in range(len(points)):
        a,b,c,e=[points[j % len(points)] for j in (i-1,i,i+1,i+2)]
        out.append(f'C {b[0]+(c[0]-a[0])/6:.2f} {b[1]+(c[1]-a[1])/6:.2f} {c[0]-(e[0]-b[0])/6:.2f} {c[1]-(e[1]-b[1])/6:.2f} {c[0]:.2f} {c[1]:.2f}')
    return ' '.join(out)+' Z'

def cell_for(seed, seeds):
    """Static territorial notation; these cells do not define game topology."""
    poly=[(-180,-180),(180,-180),(180,180),(-180,180)]
    for other in seeds:
        if other==seed: continue
        nx,ny=other[0]-seed[0],other[1]-seed[1]
        limit=(other[0]**2+other[1]**2-seed[0]**2-seed[1]**2)/2
        result=[]
        for a,b in zip(poly,poly[1:]+poly[:1]):
            fa,fb=a[0]*nx+a[1]*ny-limit,b[0]*nx+b[1]*ny-limit
            if fa<=0: result.append(a)
            if (fa<=0)!=(fb<=0):
                f=fa/(fa-fb)
                result.append((a[0]+f*(b[0]-a[0]),a[1]+f*(b[1]-a[1])))
        poly=result
    return poly

def cell_path(points):
    out=[f'M {points[0][0]:.2f} {points[0][1]:.2f}']
    for a,b in zip(points,points[1:]+points[:1]):
        lo,hi=sorted([a,b]); length=hypot(hi[0]-lo[0],hi[1]-lo[1]) or 1
        bend=3.5*sin((lo[0]+hi[1])/29)
        cx=(a[0]+b[0])/2-(hi[1]-lo[1])/length*bend
        cy=(a[1]+b[1])/2+(hi[0]-lo[0])/length*bend
        out.append(f'Q {cx:.2f} {cy:.2f} {b[0]:.2f} {b[1]:.2f}')
    return ' '.join(out)+' Z'

# Original drawing sites: nine silhouettes, 46 illustrative cells; not a legal map.
ISLANDS=[(145,112,74,54,3),(382,100,76,62,3),(682,116,100,59,3),
         (180,313,78,78,3),(472,300,112,82,5),(808,315,93,73,5),
         (140,556,87,74,7),(430,544,107,73,7),(766,563,135,90,10)]
SEEDS=[(-47,-15),(10,-36),(55,4),(-26,27),(28,43),(-68,32),(68,-32),(-5,58),(76,36),(-47,-57)]

def geography(d, device, scene):
    portrait=device in ('phone-portrait','tablet')
    focused=device=='phone-portrait' and scene in ('ordinary-turn','capture')
    if portrait:
        # The same world geometry turns as a whole. No reflow or regeneration.
        scale=min((d.w-32)/655,(d.h-40)/895)
        center=(477.5,347.5)
        if focused: scale,center=1.5,(453,274)
        def project(x,y):
            return d.w/2-(y-center[1])*scale,d.h/2+(x-center[0])*scale
        transform=f'translate({d.w/2} {d.h/2}) scale({scale}) rotate(90) translate({-center[0]} {-center[1]})'
    else:
        scale,center={'phone-landscape':(.83,(474,330)), 'desktop':(1.16,(475,344))}[device]
        ox,oy=d.w/2-center[0]*scale,d.h/2-center[1]*scale
        def project(x,y):
            return ox+x*scale,oy+y*scale
        transform=f'translate({ox:.2f} {oy:.2f}) scale({scale})'
    d.p.append(f'<g data-layer="geography" data-rotation="{90 if portrait else 0}" data-camera="{"focus" if focused else "overview"}" transform="{transform}">')
    coasts=[]
    for i,(x,y,rx,ry,n) in enumerate(ISLANDS):
        points=[]
        for k in range(18):
            angle=2*pi*k/18
            r=1+.16*sin(3*angle+i*.8)+.12*cos(5*angle-i*.6)+.07*sin(7*angle+i)
            points.append((rx*cos(angle)*r,ry*sin(angle)*r))
        coast=coast_path(points); coasts.append(coast)
        d.p.append(f'<g transform="translate({x} {y})">')
        d.path(coast,stroke='#214c56',width=12); d.path(coast,stroke='#2b5b62',width=5)
        d.p.append('</g>')
    links=[(0,1),(1,2),(0,3),(1,4),(2,5),(3,4),(4,5),(3,6),(4,7),(5,8),(6,7),(7,8)]
    for a,b in links:
        ax,ay,rx,ry,_=ISLANDS[a]; bx,by,sx,sy,_=ISLANDS[b]
        dx,dy=bx-ax,by-ay; length=hypot(dx,dy)
        aa,bb=min(rx,ry)*.91,min(sx,sy)*.91
        d.path(f'M {ax+dx/length*aa:.1f} {ay+dy/length*aa:.1f} L {bx-dx/length*bb:.1f} {by-dy/length*bb:.1f}',stroke='#729795',width=1.4,extra='stroke-dasharray="3 6"')
    selected=[]
    for i,(x,y,rx,ry,n) in enumerate(ISLANDS):
        coast=coasts[i]; seeds=[(a*rx/110,b*ry/80) for a,b in SEEDS[:n]]
        d.p.append(f'<g transform="translate({x} {y})"><defs><clipPath id="coast-{i}"><path d="{coast}"/></clipPath></defs><g clip-path="url(#coast-{i})">')
        for j,(sx,sy) in enumerate(seeds):
            owner=(i+j)%4
            if scene in ('late-game','result'): owner=0 if scene=='result' or (i+j)%9 else 1
            if i==4 and j==0: owner=0
            if i==4 and j==1: owner=0 if scene in ('capture','late-game','result') else 1
            d.path(cell_path(cell_for((sx,sy),seeds)),fill=OWNERS[owner],stroke='#bbceac',width=.8)
            shapes=[f'M {sx-2} {sy-2}H {sx+2}V {sy+2}H {sx-2}Z', f'M {sx} {sy-3}L {sx+3} {sy}L {sx} {sy+3}L {sx-3} {sy}Z', f'M {sx-3} {sy}Q {sx} {sy-6} {sx+3} {sy}Q {sx} {sy+6} {sx-3} {sy}Z', f'M {sx-3} {sy-2}L {sx+2} {sy-3}L {sx+3} {sy+2}L {sx-2} {sy+3}Z']
            d.path(shapes[owner],fill='#e3e7c5',stroke='none')
            if i==4 and j in (0,1): selected.append(project(x+sx,y+sy))
        d.p.append('</g>'); d.path(coast,stroke='#d4d8b4',width=1.3,extra='data-coast="outline"')
        if i in (1,4,8): d.path('M -3 1L 0 -4L 3 1V 5H -3Z',fill='#f2d69a',stroke='#3c5a52',width=.7,extra='transform="rotate(-90)"' if portrait else '')
        d.p.append('</g>')
    d.p.append('</g>')
    if scene in ('ordinary-turn','capture'):
        for k,(sx,sy) in enumerate(selected):
            value=[5,4][k] if scene=='capture' else [8,3][k]
            d.rect(round(sx-17,1),round(sy-18,1),34,34,SEA,17,GOLD)
            d.text(round(sx,1),round(sy+5,1),value,17,INK,'middle',700)
    return selected

def card(d,w,h,y=None):
    x=(d.w-w)/2; y=d.h/2-h/2 if y is None else y
    d.rect(x,y,w,h,PANEL,18,LINE,extra='data-layer="context"')
    return x,y

SCENES={'quiet-map':'Quiet map: no selection or visible text', 'setup':'Setup: a compact start choice over the map', 'ordinary-turn':'Turn: selected counts and explicit Attack icon', 'capture':'Capture: a temporary mandatory move-in choice', 'late-game':'Late game: objective requested by the player', 'result':'Result: concise outcome, details on request'}
DEVICES={'phone-portrait':(390,844),'phone-landscape':(844,390),'tablet':(768,1024),'desktop':(1280,800)}
for scene,meaning in SCENES.items():
    for device,(w,h) in DEVICES.items():
        d=Drawing(w,h,f'Malpaco · {meaning} · {device}',meaning+'. Revision 3, original static concept, not implemented or playtested. Portrait turns the same board 90 degrees. Quiet portrait is fitted; phone turn/capture show zoomed focus. Counts and action icons stay upright. Full-viewport original organic geography is schematic, not generation evidence. Text belongs to this interaction and clears when it ends; required choices remain recoverable.')
        pair=geography(d,device,scene)
        d.icon(16,16,'menu','Menu: cards, totals, history, files, settings, help and country list')
        kind,label=('options','Match options') if scene=='setup' else (('close','Dismiss result to inspect the final board') if scene=='result' else ('pause','Pause or resume'))
        d.icon(w-64,16,kind,label)
        d.icon(16,h-64,'fit','Fit board or focus selection')
        if scene not in ('setup','result','capture'): d.icon(w-64,h-64,'end','End turn; only when phase permits')
        if scene=='setup':
            x,y=card(d,280,156)
            d.text(w/2,y+34,'Malpaco',25,INK,'middle',700)
            d.text(w/2,y+63,'1 human · 3 Normal',15,MUTED,'middle')
            for j,(kind,label) in enumerate([('load','Load match'),('play','Start game'),('options','Change seed, seats and rules')]): d.icon(x+42+j*74,y+85,kind,label,primary=kind=='play')
        elif scene=='ordinary-turn':
            sx,sy=pair[1]
            d.icon(min(w-72,max(76,sx+40)),min(h-132,max(76,sy-23)),'attack','Attack: commit one exchange on this pair',True)
        elif scene=='capture':
            x,y=card(d,296,102,min(h-158,max(82,pair[0][1]+80)))
            d.text(x+20,y+29,'Move in',17,INK,weight=700)
            d.icon(x+14,y+42,'minus','Move fewer; respect controller minimum')
            d.rect(x+68,y+42,48,48,SEA,14,LINE); d.text(x+92,y+73,'3',20,INK,'middle',700)
            d.icon(x+122,y+42,'plus','Move more; respect controller maximum')
            d.icon(x+176,y+42,'check','Confirm capture move-in',True)
            d.icon(x+230,y+42,'fold','Fold; preserve draft and return badge')
        elif scene=='late-game':
            x,y=card(d,256,52,22 if w>500 else 78)
            d.text(w/2,y+32,'Conquest · 14 remaining',16,INK,'middle')
            d.icon(w-64,h-124,'info','Objective details; close information',active=True)
        elif scene=='result':
            x,y=card(d,300,174)
            d.text(w/2,y+43,'You won',28,INK,'middle',700); d.text(w/2,y+72,'Conquest',16,MUTED,'middle')
            for j,(kind,label) in enumerate([('play','New game'),('details','Final standings, seed and options'),('history','Full history'),('load','Match files')]): d.icon(x+24+j*68,y+102,kind,label,primary=j==0)
        d.save(f'{scene}-{device}.svg')
print(f'Wrote {len(SCENES)*len(DEVICES)} original revision-3 SVG concepts to {ROOT}')
