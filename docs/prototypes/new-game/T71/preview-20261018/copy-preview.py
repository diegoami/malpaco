from pathlib import Path
import datetime,hashlib,json,shutil,sys
bundle=Path(sys.argv[1]).resolve();base=Path('/mnt/c/Users/diego/malpaco-preview');dest=base/bundle.name
assert base.is_dir() and not dest.exists()
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
manifest=json.loads((bundle/'COPY-MANIFEST.json').read_text())
for name,expected in manifest.items():assert sha(bundle/name)==expected,name
shutil.copytree(bundle,dest)
for name,expected in manifest.items():assert sha(dest/name)==expected,name
assert sha(dest/'COPY-MANIFEST.json')==sha(bundle/'COPY-MANIFEST.json')
stamp=datetime.datetime.now(datetime.UTC).strftime('%Y%m%d-%H%M%S');pointer=base/'OPEN-REVIEW.html';backup=base/f'OPEN-REVIEW-before-T71-{stamp}.html'
old=pointer.read_bytes();backup.write_bytes(old);assert backup.read_bytes()==old
page=f'<!doctype html><html lang="en"><meta charset="utf-8"><meta http-equiv="refresh" content="0;url={bundle.name}/OPEN-REVIEW.html"><title>Malpaco preview</title><a href="{bundle.name}/OPEN-REVIEW.html">Open current Malpaco preview</a></html>\n'
pointer.write_text(page);assert pointer.read_text()==page
report={'destination':str(dest),'windowsPath':'C:/Users/diego/malpaco-preview/'+bundle.name,'filesVerified':len(manifest)+1,'previousPointerBackup':str(backup),'previousPointerSha256':hashlib.sha256(old).hexdigest(),'pointerSha256':sha(pointer),'oldBundlesPreserved':True}
(bundle.parent/'windows-copy.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
