from pathlib import Path
import json,hashlib,subprocess,tempfile
root=Path('/home/diego/projects/malpaco/.cache/t33-work/docs/prototypes/new-game/T33');main=Path('/home/diego/projects/malpaco');win=Path('/mnt/c/Users/diego/malpaco-preview');name='T33-geographical-6f0d0b8-20261017-103043';sha=lambda b:hashlib.sha256(b).hexdigest()
ci=json.loads(subprocess.check_output(['gh','run','view','39025065818','--json','status,conclusion,headSha'],text=True));assert ci=={'conclusion':'success','headSha':'14ff957c55fbf41d710b25815db0901447485239','status':'completed'},ci
pr=json.loads(subprocess.check_output(['gh','pr','view','148','--json','state,mergeCommit'],text=True));assert pr['state']=='MERGED';head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=main,text=True).strip();assert head==pr['mergeCommit']['oid']
release=json.loads((root/'evidence/release-in9xedra/report.json').read_text());checked={}
for n,h in release['sourceHashes'].items():
 if n.startswith('src/')or(n.startswith(('docs/prototypes/new-game/T64/','docs/prototypes/new-game/T65/'))and(Path(n).suffix=='.mjs'or Path(n).name in ['board.json','map.svg','preview.html'])):
  assert sha((main/n).read_bytes())==h,n;checked[n]=h
manifest=json.loads((win/name/'COPY-MANIFEST.json').read_text())
for n,h in manifest.items():assert sha((win/name/n).read_bytes())==h,n
out=Path(tempfile.mkdtemp(prefix='windows-promotion-',dir=root/'evidence'));old=(win/'OPEN-REVIEW.html').read_bytes();(out/'previous-pointer.html').write_bytes(old);new=f'<!doctype html><meta charset="utf-8"><title>Malpaco geographical preview</title><meta http-equiv="refresh" content="0;url={name}/OPEN-REVIEW.html"><a href="{name}/OPEN-REVIEW.html">Open the new geographical preview</a>\n';(out/'new-pointer.html').write_text(new);report={'newDirectory':str(win/name),'backupFilename':'OPEN-REVIEW-before-geographical-'+out.name+'.html','oldPointerSHA256':sha(old),'newPointerSHA256':sha(new.encode()),'ci':ci,'mergedHead':head,'runtimeAndDrawingHashesMatchTestedPackage':checked,'windowsFilesVerified':len(manifest)};(out/'prepared.json').write_text(json.dumps(report,indent=2)+'\n');print(out)
