"""Original hand-authored geography studies for documentation, not a generator.

No traced coordinates, imported maps, real borders, game code or map data.
Four example families express the owner's named references at a high level.
This non-exhaustive illustration set is not a required generator taxonomy.
"""
from functools import lru_cache
from math import sin, hypot, ceil

FAMILIES=('sicily','cuba','borneo','new-zealand')
OUTLINES={
 'sicily':[(-1,-.34),(-.86,-.48),(-.62,-.49),(-.36,-.58),(-.13,-.54),(.08,-.66),(.28,-.70),(.49,-.75),(.75,-.82),(.96,-.96),(.89,-.65),(.96,-.35),(.84,-.16),(.87,.08),(.77,.25),(.88,.53),(.65,.68),(.54,.94),(.28,.75),(.12,.57),(-.12,.43),(-.30,.24),(-.48,.08),(-.68,-.06),(-.90,-.16)],
 'cuba':[(-1,-.25),(-.90,-.49),(-.71,-.59),(-.57,-.78),(-.38,-.55),(-.15,-.37),(.05,-.26),(.25,-.16),(.46,-.23),(.65,-.38),(.86,-.24),(1,.03),(.91,.28),(.73,.58),(.51,.62),(.34,.43),(.13,.50),(-.04,.29),(-.23,.20),(-.39,.05),(-.58,.13),(-.77,-.02),(-.95,.08)],
 'borneo':[(-.86,-.49),(-.61,-.60),(-.49,-.83),(-.25,-.85),(-.03,-.68),(.20,-.90),(.44,-.98),(.61,-.71),(.75,-.64),(.67,-.43),(.93,-.32),(1,-.06),(.84,.14),(.91,.34),(.68,.46),(.49,.67),(.19,.91),(-.08,.95),(-.34,.78),(-.56,.74),(-.64,.49),(-.81,.31),(-.73,.05),(-.92,-.17)],
 'new-zealand':[(-.97,.67),(-1,.31),(-.87,.16),(-.79,-.18),(-.67,-.34),(-.54,-.45),(-.47,-.78),(-.31,-.61),(-.22,-.32),(-.05,-.43),(.12,-.26),(.27,-.43),(.35,-.76),(.48,-.66),(.46,-.32),(.61,-.23),(.58,-.02),(.73,.05),(.80,-.09),(1,-.22),(.88,.10),(.73,.33),(.49,.28),(.34,.46),(.12,.34),(-.06,.46),(-.29,.38),(-.47,.56),(-.62,.72),(-.78,.55),(-.90,.77)],
}

def outline(family,variant=0):
    return [(x+.018*sin(i*1.1+variant*.7),y+.018*sin(i*1.7-variant*.8))
            for i,(x,y) in enumerate(OUTLINES[family])]


def half(poly,nx,ny,limit):
    result=[]
    for a,b in zip(poly,poly[1:]+poly[:1]):
        fa,fb=a[0]*nx+a[1]*ny-limit,b[0]*nx+b[1]*ny-limit
        if fa<=1e-10: result.append(a)
        if (fa<=0)!=(fb<=0):
            t=fa/(fa-fb)
            result.append((a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])))
    return result


def broad_regions(n):
    outer=[(-2,-2),(2,-2),(2,2),(-2,2)]
    inner=[(-.29,-.22),(.25,-.32),(.32,.26),(-.19,.34)]
    ring=[[outer[i],outer[(i+1)%4],inner[(i+1)%4],inner[i]] for i in range(4)]
    if n==3:
        return [half(outer,1,0,-.24),half(half(outer,-1,0,.24),1,0,.38),half(outer,-1,0,-.38)]
    if n==5: return ring+[inner]
    if n==7:
        # Coastal splits do not all run into a single central junction.
        return [half(ring[0],0,1,-.54),half(ring[0],0,-1,.54),
                half(ring[1],-1,0,-.57),half(ring[1],1,0,.57),ring[2],ring[3],inner]
    if n==10:
        out=[]
        for poly,(nx,ny,limit) in zip(ring,[(0,1,-.54),(-1,0,-.57),(0,-1,-.59),(1,0,-.57)]):
            out.extend([half(poly,nx,ny,limit),half(poly,-nx,-ny,-limit)])
        out.extend([half(inner,1,0,.025),half(inner,-1,0,-.025)])
        return out
    raise ValueError(n)


def axial_regions(family,n):
    bands={3:3,5:3,7:4,10:5}[n]
    cuts={3:[-2,-.36,.34,2],4:[-2,-.55,-.04,.49,2],5:[-2,-.64,-.22,.20,.59,2]}[bands]
    y=lambda x: .28*x+.07*sin(3*x) if family=='cuba' else -.20*x+.045*sin(4*x)
    centre=[(x,y(x)) for x in cuts]
    north=[(x+(0 if abs(x)>1 else .07*sin(i+1)),-2) for i,x in enumerate(cuts)]
    south=[(x+(0 if abs(x)>1 else .11*sin(i+2)),2) for i,x in enumerate(cuts)]
    out=[]
    for i in range(bands):
        up=[north[i],north[i+1],centre[i+1],centre[i]]
        down=[centre[i],centre[i+1],south[i+1],south[i]]
        if n==3 or (n in (5,7) and i==0):
            out.append([north[i],north[i+1],centre[i+1],south[i+1],south[i],centre[i]])
        else: out.extend([up,down])
    return out


def inside(p,poly):
    x,y=p; result=False
    for a,b in zip(poly,poly[1:]+poly[:1]):
        if (a[1]>y)!=(b[1]>y) and x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]: result=not result
    return result


def distance(p,poly):
    distances=[]
    for a,b in zip(poly,poly[1:]+poly[:1]):
        dx,dy=b[0]-a[0],b[1]-a[1]
        denom=dx*dx+dy*dy
        t=max(0,min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/denom)) if denom else 0
        distances.append(hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy))
    return min(distances)


@lru_cache(maxsize=None)
def regions(family,n,variant=0):
    polygons=axial_regions(family,n) if family in ('cuba','new-zealand') else broad_regions(n)
    # Vary the original schematic paths with one smooth deformation field.
    varied=[]
    for poly in polygons:
        points=[]
        for a,b in zip(poly,poly[1:]+poly[:1]):
            steps=max(1,ceil(hypot(b[0]-a[0],b[1]-a[1])/.18))
            for i in range(steps):
                x=a[0]+(b[0]-a[0])*i/steps;y=a[1]+(b[1]-a[1])*i/steps
                points.append((x+.10*sin(2.6*y+variant*.2)+.04*sin(5*y+1.5*x),
                               y+.10*sin(3*x+variant*.2)+.045*sin(6*x-1.8*y)))
        varied.append(points)
    polygons=varied
    assert len(polygons)==n
    coast=outline(family,variant)
    sites=[]
    for poly in polygons:
        candidates=[(x/40,y/40) for x in range(-39,40) for y in range(-39,40)
                    if inside((x/40,y/40),poly) and inside((x/40,y/40),coast)]
        if not candidates: raise ValueError(f'Illustrative cell has no interior: {family}/{n}')
        sites.append(max(candidates,key=lambda p:min(distance(p,poly),distance(p,coast))))
    return polygons,sites
