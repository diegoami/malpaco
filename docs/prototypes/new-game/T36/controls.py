"""Bounded actual-source omissions, each restored from saved bytes in finally.

No test, fixture, algorithm or numerical threshold is changed. Each command selects
one behavior already passing in the complete suite; no test.skip hooks exist.
"""
from pathlib import Path
from datetime import datetime,timezone
import subprocess,tempfile,hashlib,json,sys,re,signal
root=Path(__file__).resolve().parent;repo=root.parents[3]
out=Path(tempfile.mkdtemp(prefix='omission-controls-',dir=root/'evidence'))
sha=lambda data:hashlib.sha256(data).hexdigest()
controls=[
 {'name':'actual-geography','file':'src/ui/geographicMapView.ts','before':'d:ring(p.polygon)','after':'d:ring(p.polygon.slice(0,3))','browser':'seed 1994 paints actual'},
 {'name':'visible-owner-fill','file':'src/ui/geographicMapView.ts','before':"(n.querySelector('.cell') as SVGElement).style.fill=look.color;",'after':"(n.querySelector('.cell') as SVGElement).style.fill=look.color;(n.querySelector('.cell') as SVGElement).style.opacity='0';",'browser':'seed 1994 paints actual'},
 {'name':'exact-adjacency-paint','file':'src/ui/referenceBattleGame.ts','before':'targets, hover: this.hover, flash: []','after':'targets: this.presentation ? [] : targets, hover: this.hover, flash: []','browser':'painted borders use'},
 {'name':'save-identity','file':'src/ui/referenceBattleGame.ts','before':'() => this.controller.state,presentation?.identity,Boolean(presentation)','after':'() => this.controller.state,undefined,Boolean(presentation)','browser':'geographic replay and reference identity'},
 {'name':'replay-origin','file':'src/ui/gameEventLog.ts','before':'this.previous = initialState ?? deserializeVersionedMatch','after':'this.previous = deserializeVersionedMatch','unit':'geographic file metadata and event history'},
 {'name':'typed-refusal-report','file':'src/ui/geographicGame.ts','before':'else dependencies.report(result);','after':'else void result;','unit':'reports all typed bounded refusal records'},
 {'name':'paused-battle-timer','file':'src/ui/battleController.ts','before':'this.globallyPaused = value;\n    this.cancel();','after':'this.globallyPaused = value;\n    // Omitted cancellation: the already-queued ordinary exchange can run.','browser':'geographic continuous battle pauses/resumes'},
]
initial={str(p.relative_to(repo)):p.read_bytes() for p in (repo/'src').rglob('*') if p.is_file()}
records=[]
def interrupted(signum,_frame):raise SystemExit(128+signum)
signal.signal(signal.SIGTERM,interrupted)
for control in controls:
 folder=out/control['name'];folder.mkdir();source=repo/control['file'];saved=source.read_bytes();text=saved.decode();assert text.count(control['before'])==1,control['name']
 mutated=text.replace(control['before'],control['after']).encode();(folder/'original.ts').write_bytes(saved);(folder/'omitted.ts').write_bytes(mutated)
 if 'browser' in control:
  command=[sys.executable,str(root/'run-browser.py'),'omit-'+control['name'],'--project=1280x800','--grep',control['browser'],'--max-failures=1']
 else:command=[sys.executable,str(root/'run-command.py'),'omit-'+control['name'],'npx','vitest','run','tests/ui/geographic-game.test.ts','-t',control['unit']]
 record={'name':control['name'],'file':control['file'],'beforeSha256':sha(saved),'omittedSha256':sha(mutated),'command':command,'startedUtc':datetime.now(timezone.utc).isoformat()}
 try:
  source.write_bytes(mutated)
  with (folder/'stdout.txt').open('wb') as stdout,(folder/'stderr.txt').open('wb') as stderr:result=subprocess.run(command,cwd=repo,stdout=stdout,stderr=stderr)
  record['exit']=result.returncode
  receipt=json.loads((folder/'stdout.txt').read_text());record['run']=receipt['output'];run=repo/receipt['output']
  observed=(run/'raw/output.txt').read_text(errors='replace') if 'browser' in control else (run/'stdout.txt').read_text(errors='replace')+(run/'stderr.txt').read_text(errors='replace')
  ran_case=bool(re.search(r'Running 1 test',observed)) if 'browser' in control else bool(re.search(r'Tests\s+1 failed',observed))
  record['actualBehaviorAssertionFailed']=result.returncode!=0 and ran_case and bool(re.search(r'\b1 failed\b',observed)) and 'No tests found' not in observed
 finally:
  source.write_bytes(saved);record['restored']=source.read_bytes()==saved;record['afterSha256']=sha(source.read_bytes());record['endedUtc']=datetime.now(timezone.utc).isoformat();(folder/'report.json').write_text(json.dumps(record,indent=2)+'\n');records.append(record)
  print(json.dumps({'name':control['name'],'exit':record.get('exit'),'actualBehaviorAssertionFailed':record.get('actualBehaviorAssertionFailed'),'restored':record['restored']}),flush=True)
 unchanged=all((repo/name).read_bytes()==data for name,data in initial.items());assert unchanged
report={'controls':records,'allSensitive':all(r.get('actualBehaviorAssertionFailed') for r in records),'productionRestored':all((repo/name).read_bytes()==data for name,data in initial.items()),'sourceHashes':{name:sha(data) for name,data in initial.items()}}
(out/'report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'out':str(out.relative_to(repo)),'allSensitive':report['allSensitive'],'productionRestored':report['productionRestored']}),flush=True)
if not report['allSensitive'] or not report['productionRestored']:sys.exit(1)
