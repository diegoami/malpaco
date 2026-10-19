from pathlib import Path
import json,subprocess,sys
w=Path(__file__).resolve().parents[5];root=Path(__file__).resolve().parent;runner=root/'run.py'
suites=[
 ('diagnose-corrected',['node',str(root/'diagnose.mjs')]),
 ('final-layout',['npx','playwright','test','tests/e2e/hideable-panels.spec.ts','--workers=2','--reporter=list,json','--output='+str(root/'final-layout/browser')]),
 ('final-regression',['npx','playwright','test',*[f'tests/e2e/{name}.spec.ts' for name in ['icon-actions','compact-panels','battle-panel-fit','cards','cards-result-layout','battle-controls','battle-accessibility','playback-controls','game-event-log']],'--workers=2','--reporter=list,json','--output='+str(root/'final-regression/browser')]),
 ('final-geography',['npx','playwright','test','tests/e2e/geographic-board.spec.ts','--workers=2','--reporter=list,json','--output='+str(root/'final-geography/browser')]),
 ('final-unit',['npm','test']),('final-build',['npm','run','build']),('final-list',['npx','playwright','test','--list'])]
results=[]
for label,args in suites:
 result=subprocess.run(['python3',str(runner),label]+args,cwd=w,stdin=subprocess.DEVNULL)
 receipt=json.loads((root/label/'receipt.json').read_text());assert receipt['unchanged'],label
 entry={'label':label,**receipt};stats=root/label/'results.json'
 if stats.exists():entry['stats']=json.loads(stats.read_text())['stats']
 results.append(entry);(root/'full-results.json').write_text(json.dumps(results,indent=2)+'\n')
 if result.returncode:sys.exit(result.returncode)
 if label=='diagnose-corrected':
  before=json.loads((root/'diagnose/hit-metrics.json').read_text());after=json.loads((root/label/'hit-metrics.json').read_text())
  assert len(before)==len(after)==12
  for b,a in zip(before,after):
   assert a['seed']==b['seed'] and a['viewport']==b['viewport'] and not a['bad']
   for key in ['board','map','stage','sidebar','topbar']:assert a[key]==b[key],(a['seed'],a['viewport'],key,a[key],b[key])
  (root/'geometry-comparison.json').write_text(json.dumps({'scenes':12,'all46CountryHitSquaresPass':True,'exactUnchangedRects':['board','map','stage','sidebar','topbar'],'before':'diagnose/hit-metrics.json','after':label+'/hit-metrics.json'},indent=2)+'\n')
