from pathlib import Path
import hashlib,json,subprocess
w=Path(__file__).resolve().parents[5];root=Path(__file__).resolve().parent;runner=root/'run.py'
def run(label,file,pattern,project=None):
 args=['python3',str(runner),label,'npx','playwright','test','tests/e2e/'+file,'--grep',pattern,'--workers=2','--reporter=list,json','--output='+str(root/label/'browser')]
 if project:args+=['--project='+project]
 result=subprocess.run(args,cwd=w,stdin=subprocess.DEVNULL);return result.returncode,json.loads((root/label/'results.json').read_text())['stats']
for label,file,pattern,count in [('geography-positive','geographic-board.spec.ts','paints actual geography',12),('toolbar-positive','icon-actions.spec.ts','visible sidebar toolbar',4)]:
 code,stats=run(label,file,pattern);assert code==0 and stats['expected']==count and stats['unexpected']==0 and stats['skipped']==0,(label,code,stats)
path=w/'src/styles.css';saved=path.read_bytes();original=subprocess.check_output(['git','show','566aadcb:src/styles.css'],cwd=w)
(root/'corrected-styles.saved').write_bytes(saved);record={'file':'src/styles.css','correctedSha256':hashlib.sha256(saved).hexdigest(),'originalSha256':hashlib.sha256(original).hexdigest()}
try:
 path.write_bytes(original)
 for label,file,pattern,count,project in [('geography-reverted','geographic-board.spec.ts','paints actual geography',6,'1280x800'),('toolbar-reverted','icon-actions.spec.ts','visible sidebar toolbar',4,None)]:
  code,stats=run(label,file,pattern,project);record[label]={'exit':code,'stats':stats};assert code!=0 and stats['unexpected']==count and stats['expected']==0 and stats['skipped']==0,(label,code,stats)
finally:
 path.write_bytes(saved);record['restoredExact']=path.read_bytes()==saved;record['restoredSha256']=hashlib.sha256(path.read_bytes()).hexdigest();(root/'restoration.json').write_text(json.dumps(record,indent=2)+'\n')
assert record['restoredExact'];print('both negative controls restored exact',flush=True)
