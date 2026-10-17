from pathlib import Path
import json,tempfile,hashlib,shutil,tarfile,datetime,html
r=Path('/home/diego/projects/malpaco/.cache/t33-work');root=r/'docs/prototypes/new-game/T33'
reports=[]
for p in (root/'evidence').glob('release-*/report.json'):
 d=json.loads(p.read_text())
 if d['exit']==0 and d.get('sourceHashes',{}).get('tests/e2e/reference-complete-game.spec.ts')==hashlib.sha256((r/'tests/e2e/reference-complete-game.spec.ts').read_bytes()).hexdigest():reports.append((p,d))
assert len(reports)==1,reports
report,info=reports[0];head=info['buildIdentity'].get('commit',info['buildIdentity'].get('sourceCommit'));print(info['buildIdentity'])
assert head
stamp=datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%d-%H%M%S');name=f'T33-geographical-{head[:7]}-{stamp}'
out=Path(tempfile.mkdtemp(prefix='windows-preview-',dir=root/'evidence'));bundle=out/name;bundle.mkdir()
source=Path(info['extractedHostPath'])/'malpaco-playable';shutil.copytree(source,bundle/'malpaco-playable');shutil.copy2(report.parent/'malpaco-playable.tar.gz',bundle/'malpaco-playable.tar.gz')
shots=bundle/'screenshots';shots.mkdir()
states=['opening','battle','friendly-move','computer-turn','pending-capture','save-resume','elimination','winner']
for viewport in ['1280x800','1920x1080']:
 folders=list((report.parent/'captures').glob(f'reference-complete-{viewport}-*'));assert len(folders)==1
 for state in states:shutil.copy2(folders[0]/(state+'.png'),shots/f'{state}-{viewport}.png')
for task in ['T64','T65']:
 shutil.copytree(r/f'docs/prototypes/new-game/{task}/previews',bundle/task)
shutil.copy2(r/'docs/prototypes/map-1994/preview.html',bundle/'approved-T22-G.html')
(bundle/'START-MALPACO.cmd').write_bytes(b'@echo off\r\ncd /d "%~dp0malpaco-playable"\r\nnode serve.mjs\r\npause\r\n')
(bundle/'READ-ME.txt').write_text('Malpaco appearance/pacing review candidate\n\nDouble-click START-MALPACO.cmd in Windows Explorer (Node.js 22+), then open http://127.0.0.1:4175/. Open OPEN-REVIEW.html for screenshots and matched map comparisons.\n\nIncludes readability #137, direct/repeat attack #138, geographical/coast #111 and shared borders #117. Current gameplay connections and canonical saves are preserved. Fixed Nine Isles reference board; generated boards remain separate work. Appearance/pacing approval remains yours.\n\nPackage source commit: '+head+'\nArchive SHA256: '+info['packageSha256']+'\n')
style='body{font:16px system-ui;background:#101d28;color:#e6eef5;margin:24px;max-width:1920px}a{color:#ffd45c}h1,h2{color:#ffd45c}figure{margin:12px 0 28px}img{max-width:100%;height:auto;border:1px solid #496275}figcaption{color:#afc8d8}nav a{display:inline-block;margin:5px 16px 5px 0}section{margin-top:44px}'
page='<!doctype html><html lang="en"><meta charset="utf-8"><title>Malpaco geographical preview</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+style+'</style><h1>Malpaco geographical preview</h1><p>Quieter labels and army badges · direct and repeated attacks · geographical islands and coastlines · shared region borders.</p><p>Double-click <strong>START-MALPACO.cmd</strong> in this directory, then open <a href="http://127.0.0.1:4175/">the standalone game</a>. See <a href="READ-ME.txt">launch instructions</a>.</p><p>Fixed Nine Isles reference board. These views support your appearance/pacing decision; T33 is awaiting your approval.</p><nav>'
for state in states+['map-comparison']:page+=f'<a href="#{state}">{state.replace("-"," ").title()}</a>'
page+='</nav>'
def figure(path,title):return f'<figure><a href="{path}"><img loading="lazy" src="{path}" alt="{html.escape(title)}"></a><figcaption>{html.escape(title)} — click for full size</figcaption></figure>'
for state in states:
 page+=f'<section id="{state}"><h2>{state.replace("-"," ").title()}</h2>'
 for viewport in ['1280x800','1920x1080']:page+=figure(f'screenshots/{state}-{viewport}.png',viewport)
 page+='</section>'
page+='<section id="map-comparison"><h2>Map comparison</h2><p><a href="approved-T22-G.html">Open the approved #66 / T22 G reference</a>. Gameplay graph and saves remain current; visual geometry follows its geographical direction.</p>'
for path,title in [('T64/standalone-1280x800-approved-T22-reference.png','Approved T22 G reference'),('T64/standalone-1280x800-before-T63.png','Prior drawing'),('T64/standalone-1280x800-after-opening.png','Geographical layout and coasts'),('T65/standalone-1280x800-after-opening.png','Shared region borders'),('T65/playable-after-cliff-1280x800.png','Cliff Isle border close-up'),('T65/playable-after-great-1280x800.png','Great Isle border close-up')]:page+=figure(path,title)
page+='</section></html>';(bundle/'OPEN-REVIEW.html').write_text(page)
manifest={str(p.relative_to(bundle)):hashlib.sha256(p.read_bytes()).hexdigest()for p in bundle.rglob('*')if p.is_file()};(bundle/'COPY-MANIFEST.json').write_text(json.dumps(manifest,indent=2)+'\n')
(out/'preparation.json').write_text(json.dumps({'bundle':str(bundle),'name':name,'packageHead':head,'archiveSHA256':info['packageSha256'],'releaseReport':str(report.relative_to(r)),'copiedFiles':len(manifest)},indent=2)+'\n');print(out)
