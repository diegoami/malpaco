"""Original revision-7 teaching scenes; no product imports or forced outcomes.

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

STEPS=[
 ('01-start','Start a match','setup',{},None),
 ('02-place','Place one army','ordinary-turn',{0:7},None),
 ('03-combat','Start combat','ordinary-turn',{0:8},None),
 ('04-source','Choose a source','ordinary-turn',None,'source'),
 ('05-target','Compare legal enemies','ordinary-turn',None,'target'),
 ('06-attack','Read odds and attack','ordinary-turn',None,'pair'),
 ('07-outcome','See an enemy loss','ordinary-turn',{0:8,1:2,2:6,3:2,4:4},'feedback'),
 ('08-loss','See your own loss','ordinary-turn',{0:7,1:2,2:6,3:2,4:4},'feedback'),
 ('09-fight-on','Fight on with Stop available','ordinary-turn',{0:7,1:2},'running'),
 ('10-capture','Preview capture movement','capture',{0:4,1:3},None),
 ('11-fold','Fold without losing the choice','folded-choice',{0:4,1:3},None),
 ('12-resume','Return and confirm','capture',{0:4,1:3},None),
 ('13-end','Choose when to end','capture',{0:4,1:3},None),
 ('14-reward','Acknowledge a card','capture',{},None),
 ('15-computer','Follow an opponent','computer-turn',{0:4,1:3,3:5},None),
 ('16-return','Find what changed','return-to-turn',{0:4,1:3,3:5},None),
 ('17-inspect','Inspect without spending armies','inspection',None,None),
 ('18-fit','Return to the whole map','quiet-map',{},None),
 ('19-help','Request icon names','quiet-map',{},None),
 ('20-result','Start another match deliberately','result',{},None),
 ('21-friendly-choice','Choose movement to a friendly neighbour','friendly-choice',None,'friendly'),
 ('22-friendly-move','Commit movement and end the turn','friendly-move',{0:5,4:7},'friendly'),
 ('23-elimination','Understand elimination and choose what follows','elimination',{},None),
]


def hint(d,first,second):
    api['turn_notice'](d,first,second)


def named_phase(d,kind,label):
    d.icon(326,780,kind,label,True)
    width=148
    d.rect(226,737,width,30,PANEL,8,LINE)
    d.text(300,758,label,14,INK,'middle',700)


def dice(d,blue,orange):
    for x,value,owner in [(134,blue,0),(208,orange,1)]:
        d.p.append(f'<g data-dice="{value}" aria-label="{["Blue","Orange"][owner]} rolled {value}">')
        d.rect(x,536,48,48,SEA,9,api['OWNERS'][owner])
        pips={1:[(0,0)],2:[(-10,-10),(10,10)],5:[(-10,-10),(10,-10),(0,0),(-10,10),(10,10)],6:[(-10,-10),(10,-10),(-10,0),(10,0),(-10,10),(10,10)]}[value]
        for dx,dy in pips: d.rect(x+22+dx,558+dy,4,4,INK,2)
        d.p.append('</g>')


for key,meaning,scene,counts,stage in STEPS:
    d=Drawing(390,844,f'Malpaco · {meaning}',
              meaning+'. Revision 7 original static teaching concept, not a played trace or implemented tutorial. Contextual names and information clear after use. Possible exchanges include an enemy loss and a human loss. Capture illustrates seven surviving source armies, an edited total of three moving and a four/three preview. No guaranteed wins or generator evidence.')
    pair=geography(d,'phone-portrait',scene,counts,stage)
    api['base_controls'](d,'capture' if key in ('02-place','03-combat','04-source','05-target','10-capture','11-fold','12-resume','13-end','14-reward','15-computer','16-return') else scene)
    if key=='01-start':
        x,y=card(d,300,222)
        d.text(195,y+38,'Malpaco',27,INK,'middle',700)
        d.text(195,y+72,'Hold 35 of 46 territories.',16,INK,'middle')
        d.text(195,y+101,'1 human · 3 Normal',15,MUTED,'middle')
        for j,(kind,label) in enumerate([('load','Load'),('start','Start game'),('options','Options')]):
            api['named_action'](d,x+24+j*90,y+124,kind,label,kind=='start')
    elif key=='02-place':
        api['placement_pool'](d,1)
        hint(d,"You're blue. 1 army left.",'Tap a blue square to place it.')
        sx,sy=pair[0]
        d.path(f'M {sx-28} {sy}a 28 28 0 1 0 56 0a 28 28 0 1 0 -56 0',stroke=GOLD,width=2,extra='stroke-dasharray="4 5"')
    elif key=='03-combat':
        api['placement_pool'](d,0)
        hint(d,'All armies placed.','Start combat when you are ready.')
        named_phase(d,'combat','Start combat')
    elif key=='04-source':
        hint(d,'Choose your attacking army.','Tap an outlined blue country.')
    elif key=='05-target':
        hint(d,'Choose a neighbouring enemy.','Outlined targets are legal. Tap one.')
    elif key=='06-attack':
        hint(d,'Source and target are selected.','Attack rolls once; Cancel changes the pair.')
        api['battle_controls'](d)
    elif key=='07-outcome':
        hint(d,'Orange lost 1. 3 → 2.','Blue rolled 5; orange rolled 2.')
        dice(d,5,2)
        api['battle_controls'](d,'feedback',96)
    elif key=='08-loss':
        hint(d,'You lost 1. 8 → 7.','Blue rolled 1; orange rolled 6.')
        dice(d,1,6)
        api['battle_controls'](d,'feedback',94)
    elif key=='09-fight-on':
        hint(d,'Fight on is optional.','Stop before the next exchange at any time.')
        api['battle_controls'](d,'running')
    elif key in ('10-capture','12-resume'):
        hint(d,'Choose armies to move.' if key=='10-capture' else 'Your pending choice is back.',
             'Preview only until you confirm.' if key=='10-capture' else 'Check confirms; it does not attack.')
        api['capture_controls'](d)
    elif key=='11-fold':
        hint(d,'Choice folded, not completed.','Tap the gold return icon to resume.')
        x,y=card(d,264,84,api['context_y'](d,84))
        d.text(x+14,y+26,'Move-in pending · preview 4 / 3',15,weight=700)
        d.icon(x+106,y+33,'unfold','Return to move-in without confirming it',True)
    elif key=='13-end':
        hint(d,'The move-in is confirmed.','Keep attacking, or choose End turn.')
        named_phase(d,'end','End turn')
    elif key=='14-reward':
        d.scene='reward'
        hint(d,'Capture earned you a card.','Tap the check to continue.')
        x,y=card(d,132,162,300)
        d.rect(x+13,y+13,106,136,SEA,12,GOLD)
        d.path(f'M {x+46} {y+78}L {x+66} {y+48}L {x+86} {y+78}L {x+66} {y+108}Z',stroke=GOLD,width=2)
        d.text(195,y+92,'+1',22,INK,'middle',700)
        d.icon(171,488,'check','Acknowledge the private reward',True)
    elif key=='15-computer':
        hint(d,'Purple · placing armies','Pause to inspect, or fast-forward.')
        sx,sy=pair[3]
        d.text(sx+31,sy-27,'+3',19,GOLD,'middle',700)
        x,y=card(d,192,88,api['context_y'](d,88))
        api['named_action'](d,x+72,y+8,'fast','Fast-forward',True)
    elif key=='16-return':
        api['placement_pool'](d,4)
        hint(d,'Your turn · place armies','Purple reinforced nearby. Tap to inspect.')
        sx,sy=pair[3]
        d.path(f'M {sx-29} {sy}a 29 29 0 1 0 58 0a 29 29 0 1 0 -58 0',stroke=GOLD,width=2,extra='stroke-dasharray="4 5"')
        x,y=card(d,192,88,api['context_y'](d,88))
        api['named_action'](d,x+72,y+8,'history','Changes',True)
    elif key=='17-inspect':
        hint(d,'Counts are always visible.','Inspect income or an island bonus.')
        x,y=card(d,286,88,api['context_y'](d,88))
        for j,name in enumerate(['Blue','Orange','Lime','Purple']):
            api['owner_mark'](d,x+20+j*70,y+24,j,6)
            d.text(x+20+j*70,y+49,name,13,INK,'middle')
        d.text(x+143,y+73,'Ownership shapes also work without colour',13,MUTED,'middle')
        d.icon(326,780,'close','Close inspection to return to placement',True)
    elif key=='18-fit':
        hint(d,'Fit shows all nine islands.','Zoom with + / −; swipe when zoomed.')
        d.icon(78,780,'minus','Zoom out')
        d.icon(140,780,'plus','Zoom in')
        d.text(40,765,'Fit',14,INK,'middle',700)
        d.icon(326,780,'focus','Focus the selected country on request')
    elif key=='19-help':
        d.scene='help'
        hint(d,'Menu → Help & icon names','Tap an icon here to read what it does.')
        x,y=card(d,286,204,310)
        for row,(kind,label) in enumerate([('help','Help & icon names'),('info','Inspect armies'),('unfold','Current choice')]):
            d.icon(x+16,y+14+row*62,kind,label)
            d.text(x+78,y+44+row*62,label,16,INK)
        d.text(40,87,'Menu',14,INK,'middle')
        d.text(350,87,'Pause',14,INK,'middle')
        d.text(40,765,'Fit map',14,INK,'middle')
        d.text(334,765,'End turn',14,INK,'middle')
    elif key=='21-friendly-choice':
        hint(d,'That neighbour is yours.','Choose Move, or Cancel to keep attacking.')
        api['friendly_controls'](d,True)
    elif key=='22-friendly-move':
        hint(d,'Move armies to your neighbour.','Check moves the armies and ends the turn.')
        api['friendly_controls'](d)
    elif key=='23-elimination':
        api['elimination_controls'](d)
    elif key=='20-result':
        x,y=card(d,300,198)
        d.text(195,y+40,'You won',28,INK,'middle',700)
        d.text(195,y+68,'Domination · 35 of 46',16,MUTED,'middle')
        for j,(kind,label) in enumerate([('new','New game'),('details','Standings'),('history','History'),('load','Files')]):
            d.icon(x+24+j*68,y+96,kind,label,j==0)
        d.text(x+48,y+167,'New game',14,INK,'middle',700)
    d.save(key+'.svg',OUT)

# Retire the replaced revision-5 scene names; their exact originals remain in Git.
for name in ['04-attack','05-outcome','06-capture','07-end','08-reward']:
    (OUT/(name+'.svg')).unlink(missing_ok=True)
print(f'Wrote {len(STEPS)} revision-7 teaching scenes')
