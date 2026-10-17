"""Actual-source omissions; all originals restored byte-exact in finally blocks."""
from pathlib import Path
import subprocess,tempfile,json,hashlib
D=Path(__file__).resolve().parent;R=D.parents[3];core=R/'src/core/island-geography.ts';sweep=D/'sweep.mjs';original=core.read_bytes();sweep_original=sweep.read_bytes();out=Path(tempfile.mkdtemp(prefix='r2-controls-',dir=D/'evidence'));results=[]
def run(label,cmd,expected):
 p=subprocess.run(['python3',str(D/'run-command.py'),label,*cmd],cwd=R,capture_output=True)
 (out/(label+'.json')).write_text(json.dumps({'exit':p.returncode,'output':p.stdout.decode(),'stderr':p.stderr.decode()},indent=2)+'\n');results.append({'label':label,'exit':p.returncode,'expected':expected});print(json.dumps(results[-1]),flush=True);assert (p.returncode==0)==(expected==0)
try:
 # A single invalid exported success used to pass the99% gate. Exhaustion alone may consume1%.
 marker=b'if(constraints.length===0)return'
 bad=original.replace(marker,b'if(constraints.length===0&&seed===98)geography.entranceReservations.push({...geography.entranceReservations[0]!});'+marker)
 assert bad!=original;core.write_bytes(bad)
 guard=b'(!r.exported||r.errors.length===0)&&';assert guard in sweep_original
 sweep.write_bytes(sweep_original.replace(guard,b''));run('invalid-export-before',['node',str(sweep)],0)
 sweep.write_bytes(sweep_original);run('invalid-export-after',['node',str(sweep)],1)
finally:core.write_bytes(original);sweep.write_bytes(sweep_original)
mutations=[
 ('omit-layout-plans',b'placeLayout(geography,rng.nextInt(0,2));',b'placeLayout(geography,0);','middle vertical third'),
 ('omit-shape-warp',b'rng.nextInt(0,48*Q)',b'0','silhouette aspect ratio'),
 ('omit-single-count',b'if(singles>3)',b'if(false)','concentrate entrances'),
 ('omit-large-single',b'if(island.provinces.length>=7)',b'if(false)','concentrate entrances'),
 ('omit-concentration',b'if(singleBonus*4>totalBonus)',b'if(false)','concentrate entrances'),
 ('omit-failure-history',b'failures.push({attempt,constraints,candidate:geography});',b'/* omitted */','records every rejected'),
 ('omit-attempt-clamp',b'Math.min(MAX_ATTEMPTS,Math.floor(raw))',b'Math.floor(raw)','records every rejected'),
 ('return-after-first-rejection',b'failures.push({attempt,constraints,candidate:geography});',b'failures.push({attempt,constraints,candidate:geography});return {ok:false,attempts:attempt,failures,rng:rng.snapshot()};','records every rejected')]
for label,before,after,test in mutations:
 try:
  assert before in original;core.write_bytes(original.replace(before,after));run(label,['npx','vitest','run','tests/core/island-geography.test.ts','-t',test],1)
 finally:core.write_bytes(original)
 assert core.read_bytes()==original
(out/'report.json').write_text(json.dumps({'results':results,'coreRestored':core.read_bytes()==original,'sweepRestored':sweep.read_bytes()==sweep_original,'coreSha256':hashlib.sha256(original).hexdigest(),'sweepSha256':hashlib.sha256(sweep_original).hexdigest()},indent=2)+'\n');print(str(out),flush=True)
