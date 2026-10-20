"""Original illustrative studies of the owner's four real-world references.

Run: python3 docs/plans/finished-game-vision/draw-geography-studies.py
No source maps, coordinates, names or administrative borders are imported.
"""
from pathlib import Path
import runpy

BASE=Path(__file__).parent
api=runpy.run_path(str(BASE/'draw-sketches.py'))
Drawing,coast_path,cell_path=api['Drawing'],api['coast_path'],api['cell_path']
REF,OWNERS=api['REFERENCE'],api['OWNERS']
OUT=BASE/'geography-studies'
OUT.mkdir(exist_ok=True)

STUDIES=[
 ('sicily',7,206,126,'Sicily-inspired','Broad wedge, headlands and inland regions.'),
 ('cuba',7,218,71,'Cuba-inspired','Long curved spine; uneven coastal sections.'),
 ('borneo',10,163,131,'Borneo-inspired','Broad hinterland and smaller coastal districts.'),
 ('new-zealand',7,218,92,'New Zealand-inspired','Long axis, bays and unequal coastal strips.'),
]


def island(d,family,n,cx,cy,rx,ry):
    coast=coast_path([(x*rx,y*ry) for x,y in REF['outline'](family)])
    polygons,sites=REF['regions'](family,n)
    d.p.append(f'<g transform="translate({cx} {cy}) rotate({-16 if family=="new-zealand" else 0})">')
    d.path(coast,stroke='#245462',width=10)
    d.p.append(f'<defs><clipPath id="study-{family}"><path d="{coast}"/></clipPath></defs><g clip-path="url(#study-{family})">')
    for i,poly in enumerate(polygons):
        d.path(cell_path([(x*rx,y*ry) for x,y in poly]),fill=OWNERS[(i*3+1)%4],stroke='#d3e0c7',width=1.1)
        x,y=sites[i];d.rect(x*rx-2,y*ry-2,4,4,'#123340')
    d.p.append('</g>')
    d.path(coast,stroke='#d4dfc8',width=1.6,extra='data-coast="outline"')
    d.p.append('</g>')


sheet=Drawing(1040,958,'Original island and province-character studies',
              'Four newly drawn fictional geography studies inspired by Sicily, Cuba, Borneo and New Zealand. Coastlines and regions are original schematic illustrations, not traces, real administrative maps or valid game generator outputs. Captions are design-review annotations, not product labels.')
sheet.text(24,37,'Original island & region studies',27,weight=700)
sheet.text(24,65,'Real-world character · new coastlines and borders · illustrative game-sized regions',15,api['MUTED'])
for i,(family,n,rx,ry,title,caption) in enumerate(STUDIES):
    x=16+(i%2)*512;y=88+(i//2)*426
    sheet.rect(x,y,496,410,api['SEA'],18,api['LINE'])
    sheet.text(x+20,y+36,title,22,weight=700)
    island(sheet,family,n,x+248,y+207,rx,ry)
    sheet.text(x+20,y+365,caption,15)
    sheet.text(x+20,y+389,f'{n} original regions · reference for generation design',13,api['MUTED'])
    solo=Drawing(640,420,title+' original geography study',
                 caption+' Newly drawn coast and region boundaries, not a real map or generated-game fixture.')
    solo.text(24,36,title,24,weight=700)
    island(solo,family,n,320,211,rx*1.17,ry*1.10)
    solo.text(24,382,caption,17)
    solo.text(24,406,'Original reference study; region counts follow game examples.',13,api['MUTED'])
    solo.save(family+'.svg',OUT)
sheet.save('four-island-families.svg',OUT)
print(f'Wrote five original geography studies to {OUT}')
