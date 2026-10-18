from pathlib import Path
import datetime,hashlib,html,json,shutil,sys,tarfile
archive=Path(sys.argv[1]).resolve();shots=Path(sys.argv[2]).resolve();expected=sys.argv[3]
root=Path('/home/diego/projects/malpaco/.cache/t71-dispatch')
stamp=datetime.datetime.now(datetime.UTC).strftime('%Y%m%d-%H%M%S');name=f'T71-compact-panels-{expected[:7]}-{stamp}'
out=root/('preview-'+stamp);out.mkdir();bundle=out/name;bundle.mkdir()
with tarfile.open(archive) as tar:tar.extractall(bundle,filter='data')
identity=json.loads((bundle/'malpaco-playable/BUILD.json').read_text());assert identity['sourceCommit']==expected,identity
for row in (bundle/'malpaco-playable/SHA256SUMS').read_text().splitlines():
 checksum,filename=row.split('  ',1);p=bundle/'malpaco-playable'/filename;assert hashlib.sha256(p.read_bytes()).hexdigest()==checksum,filename
shutil.copy2(archive,bundle/'malpaco-playable.tar.gz')
shotout=bundle/'screenshots';shotout.mkdir();images=[]
for shot in sorted(shots.rglob('*.png')):
 if 'geographic' in shot.name and any(x in shot.name for x in ['-reinforcement','-exchange','-human-capture','-human-move']):
  target=shotout/shot.name
  if target.exists():assert target.read_bytes()==shot.read_bytes();continue
  shutil.copy2(shot,target);images.append(target)
assert images,'Need measured current UI screenshots'
(bundle/'START-MALPACO.cmd').write_bytes(b'@echo off\r\ncd /d "%~dp0malpaco-playable"\r\nnode serve.mjs --port 4177\r\npause\r\n')
(bundle/'READ-ME.txt').write_text('Malpaco preview\n\nClose any older preview server window, then double-click START-MALPACO.cmd and open http://127.0.0.1:4177/. Requires Node.js 22 or later.\n\nChanging the seed varies island placement, coastlines, starting armies and dice. Try 1994, 6 and 513. The default is one human against three Normal computers. Compact/Detailed changes presentation only. This is the panel review preview, pending independent review and CI. Pause, game speed, total armies and the full game event log remain available. Geographic and reference v2 saves load here; old v1 saves use /?view=generated-game.\n\nBuild source: '+expected+'\nPackage SHA256: '+hashlib.sha256(archive.read_bytes()).hexdigest()+'\n')
page='<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Malpaco preview</title><style>body{font:16px system-ui;background:#101d28;color:#e6eef5;margin:24px}a,h1,h2{color:#ffd45c}img{max-width:100%;height:auto}figure{margin:24px 0}</style><h1>Malpaco preview</h1><p>Panel review preview: Compact is the default; use Panel detail to switch to Detailed. Compare the fixed status, action and log areas during computer turns. Army totals, pause, speed, event log and required human choices stay available. This preview awaits appearance and information-density approval.</p><p>Double-click <strong>START-MALPACO.cmd</strong>, then <a href="http://127.0.0.1:4177/">open the game</a>. <a href="READ-ME.txt">Launch instructions</a>.</p>'
for p in images:
 label=p.stem.replace('-',' ');page+=f'<figure><figcaption>{html.escape(label)}</figcaption><a href="screenshots/{html.escape(p.name)}"><img loading="lazy" src="screenshots/{html.escape(p.name)}" alt="{html.escape(label)}"></a></figure>'
(bundle/'OPEN-REVIEW.html').write_text(page+'</html>\n')
manifest={str(p.relative_to(bundle)):hashlib.sha256(p.read_bytes()).hexdigest() for p in bundle.rglob('*') if p.is_file()}
(bundle/'COPY-MANIFEST.json').write_text(json.dumps(manifest,indent=2)+'\n')
report={'bundle':str(bundle),'name':name,'sourceCommit':expected,'archiveSha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'verifiedPackage':True,'files':len(manifest),'screenshots':len(images)}
(out/'prepared.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
