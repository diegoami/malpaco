"""Original static review drawings for #215; no game code or assets are imported.

Run from this directory: python3 draw-sketches.py
Coordinates, colours, geography and sample values are [designed] illustrations.
"""
from pathlib import Path
from html import escape

ROOT = Path(__file__).parent / "sketches"
ROOT.mkdir(exist_ok=True)
BG, PANEL, LINE = "#0c202b", "#142e3a", "#42606b"
INK, MUTED, ACCENT = "#eef3ee", "#b6cbc9", "#f0cb7d"
COLOURS = ["#557c8c", "#8a665f", "#6e7959", "#786586"]


class Drawing:
    def __init__(self, w, h, title, description):
        self.w, self.h = w, h
        self.p = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" role="img" aria-labelledby="title desc">',
                  f'<title id="title">{escape(title)}</title>', f'<desc id="desc">{escape(description)}</desc>',
                  '<style>text{font-family:Arial,sans-serif} .btn{font-weight:700}</style>']
        self.rect(0, 0, w, h, BG)

    def rect(self, x, y, w, h, fill=PANEL, stroke=None, radius=0):
        self.p.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{radius}" fill="{fill}"' + (f' stroke="{stroke}"' if stroke else '') + '/>')

    def text(self, x, y, s, size=16, colour=INK, weight=400):
        self.p.append(f'<text x="{x}" y="{y}" fill="{colour}" font-size="{size}" font-weight="{weight}">{escape(s)}</text>')

    def lines(self, x, y, lines, size=16, step=24, colour=INK):
        for i, s in enumerate(lines):
            self.text(x, y + i * step, s, size, colour)

    def button(self, x, y, w, s, primary=False, disabled=False, h=44):
        self.rect(x, y, w, h, ACCENT if primary else BG, LINE, 6)
        self.text(x+10, y+27, s, 15, BG if primary else (MUTED if disabled else INK), 700)

    def path(self, path, fill="none", stroke=LINE, width=2, dash=False):
        self.p.append(f'<path d="{path}" fill="{fill}" stroke="{stroke}" stroke-width="{width}"' + (' stroke-dasharray="6 5"' if dash else '') + '/>')

    def save(self, name):
        (ROOT / name).write_text('\n'.join(self.p + ['</svg>']) + '\n')


def map_view(d, x, y, w, h, late=False, captured=False, finished=False):
    """A symbolic nine-island overview, deliberately not a legal generated board."""
    d.rect(x, y, w, h, "#102b38", LINE)
    d.text(x+14, y+24, "ARCHIPELAGO · illustrative geography", 13, MUTED)
    # Use an aspect-preserving map: a phone focuses on a subset instead of tiny labels.
    focus = w < 500
    mw, mh = (440, 480) if focus else (800, 430)
    scale = min((w-24)/mw, (h-110)/mh)
    ox, oy = x+(w-mw*scale)/2, y+52+(h-110-mh*scale)/2
    def pt(a, b):
        return f'{ox+a*scale:.1f} {oy+b*scale:.1f}'
    if focus:
        locations = [(70,60),(265,180),(100,330)]
        d.text(x+14,y+h-15,"Focused islands · Fit board available",13,MUTED)
    else:
        locations = [(60,65),(285,50),(540,40),(160,195),(420,190),(665,190),(50,340),(300,340),(570,340)]
        d.text(x+14,y+h-15,"Overview · inspect dense areas with Focus",13,MUTED)
    links=[(0,1),(1,2)] if focus else [(0,1),(1,2),(3,4),(4,5),(6,7),(7,8),(0,3),(3,6)]
    for start,end in links:
        a,b=locations[start],locations[end]
        d.path(f'M {pt(a[0]+65,a[1]+30)} L {pt(b[0],b[1]+30)}',stroke="#91b3bd",dash=True)
    for i,(a,b) in enumerate(locations):
        points=[(a-12,b+12),(a+18,b-12),(a+65,b-5),(a+90,b+20),(a+74,b+63),(a+30,b+72),(a-8,b+45)]
        owner=0 if finished or (captured and i==1) or (late and i%3) else i%4
        d.path('M '+' L '.join(pt(*p) for p in points)+' Z',COLOURS[owner],"#c5d5ce",1.5)
        d.path(f'M {pt(a+30,b-10)} L {pt(a+35,b+38)} L {pt(a-8,b+45)}',stroke="#d6e0d7",width=1)
        armies=1 if captured and i==1 else [8,3,6,4][i%4]
        label=f'{chr(65+i)} {["▱", "◇", "○", "⬡"][owner]} {armies}'
        # Screen-space labels stay readable at every scale.
        d.text(ox+(a-2)*scale,oy+(b+100)*scale,label,15,INK,700)
        if i==0:
            d.rect(ox+(a+51)*scale,oy+(b+23)*scale,9,9,ACCENT)
    d.text(x+14, y+45, "▱ You   ◇ Seat 2   ○ Seat 3   ⬡ Seat 4", 13, MUTED)


def totals(d,x,y,w,late=False,finished=False):
    d.text(x,y,"SEATS · land / armies / cards",13,MUTED,700)
    vals=["▱ You          32 / 74 / 2","◇ Seat 2      9 / 18 / 1","○ Seat 3      5 / 11 / 0","⬡ Seat 4      Eliminated"] if late else ["▱ You          12 / 29 / 2","◇ Seat 2      11 / 24 / 1","○ Seat 3      10 / 22 / 0","⬡ Seat 4      13 / 31 / 2"]
    if finished:
        vals=["▱ You          46 / 85 / 2","◇ Seat 2      Eliminated","○ Seat 3      Eliminated","⬡ Seat 4      Eliminated"]
    d.lines(x,y+26,vals,15,24)


def panel(d,x,y,w,h,scene,compact=False):
    d.rect(x,y,w,h,PANEL,LINE)
    px,py,bw=x+16,y+23,w-32
    if scene=="setup":
        d.text(px,py,"Your next campaign",19,INK,700)
        d.lines(px,py+33,["You + 3 Normal computers","Generated archipelago","Seed: 1994 · change seed"],16,25)
        d.button(px,py+108,bw,"Start game",True)
        d.button(px,py+164,bw,"Match options")
        d.button(px,py+220,bw,"Load game")
        d.text(px,py+293,"Learn as you play · Help",15,MUTED)
        if h>440:
            d.lines(px,py+336,["Advanced options explain effects.","Seats, difficulty and rules remain", "available without crowding Start."],15,24, MUTED)
    elif scene=="result":
        d.text(px,py,"You won",28,INK,700)
        d.lines(px,py+32,["Conquest · end-of-turn result","Seed 1994 · Normal opponents"],15,24)
        totals(d,px,py+112,bw,True,True)
        d.button(px,py+240,bw,"New game",True)
        d.button(px,py+294,bw,"View match history")
        d.button(px,py+348,bw,"Files / save match")
    elif scene=="capture":
        d.text(px,py,"Required · move into B",19,INK,700)
        d.lines(px,py+32,["A → B · captured territory","Choose armies to move in.","Legal range supplied by rules"],15,24)
        d.button(px,py+112,52,"Min")
        d.button(px+60,py+112,44,"−")
        d.button(px+112,py+112,44,"3")
        d.button(px+164,py+112,44,"+")
        d.button(px,py+166,bw,"Maximum")
        d.text(px,py+207,"After: A 5 / B 4 · sample",14,MUTED)
        d.button(px,py+220,bw,"Confirm move-in",True)
        d.lines(px,py+296,["Inspect map or fold this choice.","Your amount stays selected.","End turn waits for confirmation."],14,23,MUTED)
    else:
        late=scene=="late-game"
        # Compact landscape uses scrollable action body; this drawing shows its top.
        if not compact:
            totals(d,px,py,bw,late)
            py+=138
        d.text(px,py,"Late game · Conquest" if late else "Your turn · Attack",19,INK,700)
        d.lines(px,py+30,["14 enemy territories remain" if late else "A 8 → B 3 · adjacent enemy","A 8 → D 4 · press Attack" if late else "Ready · press Attack"],15,24)
        gap=8
        b=(bw-gap)/2
        d.button(px,py+72,b,"Attack",True)
        d.button(px+b+gap,py+72,b,"Fight on",disabled=True)
        d.button(px,py+124,b,"Stop",disabled=True)
        d.button(px+b+gap,py+124,b,"Inspect")
        d.button(px,py+176,bw,"Move armies")
        d.button(px,py+228,bw,"End turn")
        if h>650:
            d.lines(px,py+306,["LAST EXCHANGE", "A lost 1 · B held", "Full history ↕"],15,24,MUTED)


def phone_dock(d,scene,y):
    d.rect(0,y,390,844-y,PANEL,LINE)
    if scene=="capture":
        d.text(16,y+27,"Required: move A → B",18,INK,700)
        d.text(16,y+52,"After: A 5 / B 4 · range from rules",15,MUTED)
        for i,(label,width) in enumerate([("Min",66),("−",44),("3",50),("+",44),("Max",72)]):
            xx=[16,90,142,200,252][i]
            d.button(xx,y+68,width,label)
        d.button(16,y+124,358,"Confirm move-in",True)
        d.button(16,y+178,358,"Fold · keep 3 selected")
        nav=y+244
    else:
        d.text(16,y+23,"14 enemy territories remain" if scene=="late-game" else "A 8 → B 3 · Ready: press Attack",16,INK,700)
        if scene=="late-game":
            d.text(16,y+44,"A 8 → D 4 · Conquest · press Attack",14,MUTED)
        for i,label in enumerate(["Attack","Fight on","Stop","Inspect","Move armies","End turn"]):
            d.button(16+(i%3)*122,y+56+(i//3)*52,114,label,i==0,i in [1,2])
        nav=y+168
    d.rect(0,nav,390,48,BG,LINE)
    for i,s in enumerate(["Cards","Totals","History","Menu"]):
        d.text(16+i*97,nav+29,s,15,INK,700)


scenes={
    "setup":"Setup: a useful default with explained match options",
    "ordinary-turn":"Ordinary turn: a staged pair and explicit Attack",
    "capture":"Mandatory choice: capture move-in with preserved draft",
    "late-game":"Late game: remaining opposition, objective and deliberate turns",
    "result":"Result: reason, standings, match history and another game",
}
devices={"phone-portrait":(390,844),"phone-landscape":(844,390),"tablet":(768,1024),"desktop":(1280,800)}
for scene,meaning in scenes.items():
    for device,(w,h) in devices.items():
        desc=meaning+". Static original concept for owner review, not an implemented screen. Sample geography, counts and outcomes are illustrative. Scroll hints show content outside a short viewport. No safe-area insets are depicted."
        d=Drawing(w,h,f'Malpaco · {meaning} · {device}',desc)
        head=48 if device=="phone-landscape" else 56
        d.rect(0,0,w,head,PANEL,LINE)
        d.text(16,31,"MALPACO",18,INK,700)
        subtitle="Finished-game concept" if scene=="setup" else ("Match finished" if scene=="result" else "Your turn")
        if w>500:
            d.text(165,31,subtitle,16,MUTED)
            d.text(w-192,31,"Help" if scene in ["setup","result"] else "Pause · Speed",15)
        else:
            d.text(275,31,"Help" if scene in ["setup","result"] else "Pause",16)
        if device=="phone-portrait":
            if scene in ["setup","result"]:
                map_view(d,0,head,w,270,finished=scene=="result")
                panel(d,0,326,w,h-326,scene)
            else:
                dock=550 if scene=="capture" else 628
                d.text(16,head+28,"+    −    Fit    Focus    Countries",16)
                map_view(d,0,head+44,w,dock-head-44,scene=="late-game",scene=="capture")
                phone_dock(d,scene,dock)
        else:
            pw=256 if device=="phone-landscape" else (320 if device=="tablet" else 360)
            stage=w-pw-8
            d.text(16,head+28,"+    −    Fit board    Focus    Countries",15)
            map_view(d,0,head+44,stage,h-head-44,scene=="late-game",scene=="capture",scene=="result")
            # Short landscape is a clipped view of a vertically scrollable panel,
            # with a fixed footer; never compress 44px controls to fit everything.
            if device=="phone-landscape":
                d.p.append(f'<defs><clipPath id="body"><rect x="{stage+8}" y="{head}" width="{pw}" height="{h-head-56}"/></clipPath></defs><g clip-path="url(#body)">')
                panel(d,stage+8,head,pw,600,scene,True)
                d.p.append('</g>')
                d.rect(stage+8,h-56,pw,56,BG,LINE)
                d.text(stage+20,h-33,"Action body scrolls ↕",13,MUTED)
                d.text(stage+20,h-12,"Cards · Totals · History · Menu",13)
            else:
                panel(d,stage+8,head,pw,h-head-56,scene)
                d.rect(stage+8,h-56,pw,56,BG,LINE)
                d.text(stage+24,h-23,"Cards · Totals · History · Menu",15)
        # Every screen is visibly a proposal without resembling a game notice.
        d.rect(0,h-3,w,3,ACCENT)
        d.save(f'{scene}-{device}.svg')

print(f'Wrote {len(scenes)*len(devices)} original SVG concepts to {ROOT}')
