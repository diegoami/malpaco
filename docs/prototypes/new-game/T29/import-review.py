"""Import and verify the exact independent review outputs after harness cleanup."""
from pathlib import Path
import hashlib,io,json,shutil,subprocess,tarfile
root=Path(__file__).resolve().parent;repo=root.parents[3]
source=Path('/tmp/opencode/t29-review-evidence-P02cV2/evidence');dest=root/'evidence/reviewer';dest.mkdir(exist_ok=False)
sha=lambda b:hashlib.sha256(b).hexdigest()
expected={'review-full-browser-rpfqp512.tar.gz':'fa5e92d09d433b135a129cc96da9b366a54251729188ef59b7cb73e42e978228','review-friendly-hn8sykhq.tar.gz':'643b913f665b574a142b7150423820590173c74008419a2aaa3ef08f2e9ae327'}
records=[]
for name,h in expected.items():
 data=(source/name).read_bytes();assert sha(data)==h;(dest/name).write_bytes(data)
 with tarfile.open(dest/name) as a:
  for m in a.getmembers():
   if not m.isfile():continue
   b=a.extractfile(m).read();records.append([name,m.name,sha(b)])
   if m.name.endswith('/report.json') and len(Path(m.name).parts)==2:
    report=json.loads(b);assert report['exit']==0 and report['sourcesUnchangedDuringRun']
    for f,v in report['sourceHashes'].items():
     original=subprocess.check_output(['git','show','9c612b37aa0ee5fa6323183b0fcb52ecd9406140:'+f],cwd=repo);assert sha(original)==v,f
    (dest/(Path(m.name).parts[0]+'.report.json')).write_bytes(b)
shutil.copyfile(source/'MANIFEST',dest/'original-MANIFEST')
export=Path('/tmp/t29-review-export.json').read_bytes()
with tarfile.open(dest/'session-export.tar.gz','w:gz') as a:
 m=tarfile.TarInfo('session-export.json');m.size=len(export);a.addfile(m,io.BytesIO(export))
records.append(['session-export.tar.gz','session-export.json',sha(export)])
session=json.loads(export)
(dest/'verification.json').write_text(json.dumps({'session':session['info']['id'],'durationSeconds':(session['info']['time']['updated']-session['info']['time']['created'])/1000,'reviewHead':'9c612b37aa0ee5fa6323183b0fcb52ecd9406140','sourceHashesMatchReviewedHead':True,'archives':expected,'members':records,'limitations':'Reviewer did not run extracted package check. Parent reruns official package at committed HEAD. Exploratory mutation command output survives in exact session export; no separate mutation artifact is claimed.'},indent=2)+'\n')
print('Imported review archives and exact session; verified',len(records),'members and both source sets')
