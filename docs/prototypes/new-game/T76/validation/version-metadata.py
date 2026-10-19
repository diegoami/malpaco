from pathlib import Path
import hashlib,json,re,subprocess
w=Path(__file__).resolve().parents[5];out=w/'docs/prototypes/new-game/T76/validation/version-metadata';out.mkdir()
tracked=subprocess.check_output(['git','ls-files','-z','src','tests','tools','.github'],cwd=w).decode().split('\0')
paths={w/p for p in tracked if p};paths.update(w.glob('*.json'));paths.update(w.glob('*.ts'))
paths={p for p in paths if p.is_file() and p.name not in ['package.json','package-lock.json']}
def identity():return {str(p.relative_to(w)):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(paths)}
before=identity();package=w/'package.json';lock=w/'package-lock.json';pkg_before=package.read_bytes();lock_before=lock.read_bytes()
(out/'package.before.json').write_bytes(pkg_before);(out/'package-lock.before.json').write_bytes(lock_before)
pkg=json.loads(pkg_before);locked=json.loads(lock_before);assert pkg['version']==locked['version']==locked['packages']['']['version']=='0.1.0'
package.write_bytes(re.sub(rb'("version":\s*")0\.1\.0(")',rb'\g<1>0.1.1\2',pkg_before,count=1))
lock.write_bytes(re.sub(rb'("version":\s*")0\.1\.0(")',rb'\g<1>0.1.1\2',lock_before,count=2))
pkg['version']='0.1.1';locked['version']='0.1.1';locked['packages']['']['version']='0.1.1'
assert json.loads(package.read_bytes())==pkg and json.loads(lock.read_bytes())==locked
assert identity()==before
assert package.read_bytes().replace(b'"version": "0.1.1"',b'"version": "0.1.0"',1)==pkg_before
assert lock.read_bytes().replace(b'"version": "0.1.1"',b'"version": "0.1.0"',2)==lock_before
(out/'receipt.json').write_text(json.dumps({'version':'0.1.1','runtimeTestsToolsWorkflowConfigFiles':before,'allOtherInputsExact':True,'allDependencyEntriesExact':True,'onlyThreeVersionValuesChanged':True,'beforeSha256':{'package.json':hashlib.sha256(pkg_before).hexdigest(),'package-lock.json':hashlib.sha256(lock_before).hexdigest()},'afterSha256':{'package.json':hashlib.sha256(package.read_bytes()).hexdigest(),'package-lock.json':hashlib.sha256(lock.read_bytes()).hexdigest()}},indent=2)+'\n')
print(len(before),'other inputs exact; three version values changed')
