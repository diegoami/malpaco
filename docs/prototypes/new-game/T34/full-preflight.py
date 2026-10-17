from pathlib import Path
import subprocess,tempfile,json,hashlib
root=Path(__file__).resolve().parent;repo=root.parents[3];out=Path(tempfile.mkdtemp(prefix='full-preflight-',dir=root/'evidence'));target=repo/'src/core/island-geography.ts';original=target.read_bytes();candidate=(root/'candidate.ts').read_bytes();sha=lambda b:hashlib.sha256(b).hexdigest();(out/'stub-source.txt').write_bytes(original);(out/'candidate-source.txt').write_bytes(candidate);records=[]
def run(label,args):
 result=subprocess.run(args,cwd=repo,capture_output=True);(out/(label+'-output.txt')).write_bytes(result.stdout+result.stderr);records.append({'label':label,'command':args,'exit':result.returncode});print(label,result.returncode,flush=True);return result.returncode
baseline=run('absent-all-units',['python3',str(root/'run-command.py'),'absent-all-units','npm','test']);assert baseline==1
try:
 target.write_bytes(candidate)
 assert run('mock-all-units',['python3',str(root/'run-command.py'),'mock-all-units','npm','test'])==0
 assert run('mock-build',['python3',str(root/'run-command.py'),'mock-full-build','npm','run','build'])==0
 assert run('mock-browser',['python3',str(root/'run-browser.py'),'mock-browser','--suites','tests/e2e/reference-complete-game.spec.ts,tests/e2e/reference-game.spec.ts,tests/e2e/versioned-match.spec.ts,tests/e2e/entry.spec.ts'])==0
finally:
 target.write_bytes(original);assert target.read_bytes()==original
 (out/'report.json').write_text(json.dumps({'originalSha256':sha(original),'candidateSha256':sha(candidate),'restoredExactly':True,'commands':records},indent=2)+'\n')
print(out.relative_to(repo))
