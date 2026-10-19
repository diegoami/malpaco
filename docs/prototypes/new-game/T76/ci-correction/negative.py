from pathlib import Path
import json,subprocess
w=Path(__file__).resolve().parents[5];root=Path(__file__).resolve().parent;runner=root/'run.py'
for label,file,pattern,project,failures in [('geography-negative','geographic-board.spec.ts','paints actual geography','1280x800',6),('toolbar-negative','icon-actions.spec.ts','visible sidebar toolbar',None,4)]:
 args=['python3',str(runner),label,'npx','playwright','test','tests/e2e/'+file,'--grep',pattern,'--workers=2','--reporter=list,json','--output='+str(root/label/'browser')]
 if project:args+=['--project='+project]
 result=subprocess.run(args,cwd=w,stdin=subprocess.DEVNULL);stats=json.loads((root/label/'results.json').read_text())['stats']
 assert result.returncode!=0 and stats['unexpected']==failures and stats['skipped']==0,(label,result.returncode,stats)
