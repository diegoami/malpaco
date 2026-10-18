from pathlib import Path
import hashlib,json,subprocess,tempfile,time,datetime
R=Path('/home/diego/projects/malpaco/.cache/t36-work');O=Path(tempfile.mkdtemp(prefix='parent-helper-omission-',dir=R/'docs/prototypes/new-game/T36/evidence'));p=R/'tools/harness/review.mjs';saved=p.read_bytes();sha=lambda b:hashlib.sha256(b).hexdigest()
old=b'''reviewDependencies = materializeReviewDependencies({
          source: path.join(top, 'node_modules'),
          destination: path.join(worktree, 'node_modules'),
          ownedRoot: worktree,
        });'''
assert saved.count(old)==1
mutant=saved.replace(old,b'reviewDependencies = null; // parent omission: do not prepare dependencies')
(O/'review.original.mjs').write_bytes(saved);(O/'review.omitted.mjs').write_bytes(mutant)
for name in ['tools/harness/lib/review-dependencies.mjs','tools/harness/test/claude.test.mjs']:
 dest=O/('snapshot-'+Path(name).name);dest.write_bytes((R/name).read_bytes())
cmd=['node','--test','--test-name-pattern','real review entry selects Claude','tools/harness/test/claude.test.mjs'];rows=[]
try:
 p.write_bytes(mutant);start=time.monotonic();a=subprocess.run(cmd,cwd=R,capture_output=True);duration=time.monotonic()-start
 (O/'omitted.stdout.txt').write_bytes(a.stdout);(O/'omitted.stderr.txt').write_bytes(a.stderr)
 assert a.returncode!=0 and b'AssertionError' in a.stdout and b'real review entry selects Claude' in a.stdout,a.stdout[-2000:]
 rows.append({'phase':'omitted automatic materialization','exit':a.returncode,'seconds':duration,'intendedAssertionFailure':True})
finally:
 p.write_bytes(saved);assert p.read_bytes()==saved
start=time.monotonic();a=subprocess.run(cmd,cwd=R,capture_output=True);duration=time.monotonic()-start
(O/'restored.stdout.txt').write_bytes(a.stdout);(O/'restored.stderr.txt').write_bytes(a.stderr);assert a.returncode==0,a.stdout[-2000:]
rows.append({'phase':'exactly restored integration','exit':a.returncode,'seconds':duration})
assert p.read_bytes()==saved
report={'command':cmd,'source':str(p.relative_to(R)),'sourceSha256':sha(saved),'mutantSha256':sha(mutant),'exactSourceRestored':True,'runs':rows,'fakeCliOnly':True,'actualModelsCalled':False}
(O/'report.json').write_text(json.dumps(report,indent=2)+'\n');(O/'runner.py').write_bytes(Path(__file__).read_bytes());print(json.dumps({'output':str(O),'report':report}))
