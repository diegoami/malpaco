"""Original static first-turn teaching proposal; no game code is imported.

The illustrated rolls are one possible branch, never promised outcomes.
Run: python3 docs/plans/finished-game-vision/draw-beginner-walkthrough.py
"""
from pathlib import Path
import runpy

BASE=Path(__file__).parent
api=runpy.run_path(str(BASE/'draw-sketches.py'))
Drawing,geography,card=api['Drawing'],api['geography'],api['card']
SEA,INK,MUTED,PANEL,LINE,GOLD=[api[k] for k in ['SEA','INK','MUTED','PANEL','LINE','GOLD']]
OUT=BASE/'walkthrough'
OUT.mkdir(exist_ok=True)


def hint(d,first,second):
    x,y=card(d,358,78,88)
    d.text(x+16,y+29,first,17,INK,weight=700)
    d.text(x+16,y+56,second,15,MUTED)


def name_bubble(d,value,x=374,y=762):
    # First-use label, screen-space and temporary; not permanent chrome.
    width=142
    d.rect(x-width,y-33,width,31,PANEL,9,LINE)
    d.text(x-width/2,y-12,value,15,INK,'middle',700)


def controls(d,action=None,primary=False,setup=False):
    d.icon(16,16,'menu','Menu: help, replay tips, cards, history and settings')
    d.icon(326,16,'options' if setup else 'pause','Match options' if setup else 'Pause or resume')
    d.icon(16,780,'fit','Fit board or focus selection')
    if action: d.icon(326,780,action,'Start combat' if action=='play' else 'End turn',primary)


STEPS=[
    ('01-start','Start with a useful default','setup',{}),
    ('02-place','Recognise your colour and place an army','ordinary-turn',{0:7}),
    ('03-combat','Finish placement and explicitly start combat','ordinary-turn',{0:8}),
    ('04-attack','Select a source and enemy, then explicitly attack','ordinary-turn',{0:8,1:3}),
    ('05-outcome','Understand one exchange before choosing another','ordinary-turn',{0:8,1:2}),
    ('06-capture','Confirm the total armies moving into captured land','capture',{0:5,1:3}),
    ('07-end','Choose when to end the turn','capture',{0:5,1:3}),
    ('08-reward','Acknowledge the capture reward before computers continue','capture',{}),
]
for key,meaning,scene,counts in STEPS:
    d=Drawing(390,844,f'Malpaco beginner walkthrough · {meaning}',
              meaning+'. Revision 4 original static first-use proposal. Short teaching text appears only for this step. Numbers, battle outcomes, chosen camera focus and progress are illustrative, not a played engine trace. Attack is explicit, capture transfer totals three, and one-army placement is preserved.')
    pair=geography(d,'phone-portrait',scene,counts)
    controls(d, 'play' if key=='03-combat' else ('end' if key in ('04-attack','05-outcome','07-end') else None),key in ('03-combat','07-end'),key=='01-start')
    if key=='01-start':
        x,y=card(d,300,222)
        d.text(195,y+38,'Malpaco',27,INK,'middle',700)
        d.text(195,y+72,'Capture every territory.',16,INK,'middle')
        d.text(195,y+101,'1 human · 3 Normal',15,MUTED,'middle')
        for dx,kind,label in [(34,'load','Load match'),(126,'play','Start game'),(218,'options','Match options')]:
            d.icon(x+dx,y+124,kind,label,kind=='play')
        d.text(195,y+196,'Start game',16,INK,'middle',700)
    elif key=='02-place':
        hint(d,"You're blue. 1 army left.",'Tap blue to place it.')
        sx,sy=pair[0]
        d.path(f'M {sx-26:.1f} {sy:.1f} a 26 26 0 1 0 52 0 a 26 26 0 1 0 -52 0',stroke=GOLD,width=2,extra='stroke-dasharray="4 5"')
    elif key=='03-combat':
        hint(d,'All armies placed.','Tap play to start combat.')
        name_bubble(d,'Start combat')
    elif key=='04-attack':
        hint(d,'Blue 8 → orange 3.','Tap swords for one attack.')
        sx,sy=pair[1]
        d.icon(min(318,max(76,sx+40)),min(712,max(180,sy-23)),'attack','Attack once; armies may be lost',True)
    elif key=='05-outcome':
        hint(d,'Enemy lost 1.','Attack again or end your turn.')
        sx,sy=pair[1]
        d.icon(min(318,max(76,sx+40)),min(712,max(180,sy-23)),'attack','Attack once again; outcome is not guaranteed',True)
    elif key=='06-capture':
        hint(d,'Captured! Choose armies to move.','Keep at least 1 behind.')
        x,y=card(d,296,110,540)
        d.text(x+16,y+28,'Move in · 1–7',16,INK,weight=700)
        d.icon(x+14,y+48,'minus','Move one fewer army')
        d.rect(x+68,y+48,48,48,SEA,14,LINE)
        d.text(x+92,y+79,'3',20,INK,'middle',700)
        d.icon(x+122,y+48,'plus','Move one more army')
        d.icon(x+176,y+48,'check','Confirm total move-in of three',True)
        d.icon(x+230,y+48,'fold','Fold while preserving the amount')
    elif key=='07-end':
        hint(d,'That territory is yours.','Tap the arrow to end your turn.')
        name_bubble(d,'End turn')
    elif key=='08-reward':
        hint(d,'Capture earned you a card.','Tap the check to continue.')
        x,y=card(d,132,162,300)
        d.rect(x+13,y+13,106,136,SEA,12,GOLD)
        d.path(f'M {x+46} {y+78} L {x+66} {y+48} L {x+86} {y+78} L {x+66} {y+108} Z',stroke=GOLD,width=2)
        d.text(195,y+92,'+1',22,INK,'middle',700)
        d.icon(171,488,'check','Acknowledge the reward and continue',True)
    d.save(key+'.svg',OUT)

print(f'Wrote {len(STEPS)} original beginner walkthrough frames to {OUT}')
