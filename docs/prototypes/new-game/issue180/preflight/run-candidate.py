from pathlib import Path
import hashlib,json,os,subprocess,time
import sys
label=sys.argv[1]
root=Path('docs/prototypes/new-game/issue180/preflight');source=Path('src/styles.css')
original=source.read_bytes();mode=source.stat().st_mode & 0o7777
saved=root/'source/styles.saved.bin';saved.write_bytes(original)
record={'before_sha256':hashlib.sha256(original).hexdigest(),'mode_before':oct(mode)}
try:
 source.write_bytes((root/'source/styles.proposed.css').read_bytes());os.chmod(source,mode)
 begin=time.monotonic();result=subprocess.run(['bash',str(root/'run-browser.sh'),label]);record['browser']={'exit':result.returncode,'seconds':time.monotonic()-begin}
 if result.returncode==0:
  checks=[('affected',['bash',str(root/'run-affected.sh')]),('npm-test',['npm','test']),('npm-build',['npm','run','build'])]
  if label=='candidate-4': checks=[('targeted',['bash',str(root/'run-targeted.sh')])]
  for name,command in checks:
   begin=time.monotonic()
   with (root/(label+'-'+name+'.log')).open('w') as log:
    outcome=subprocess.run(command,stdout=log,stderr=subprocess.STDOUT)
   record[name]={'command':command,'exit':outcome.returncode,'seconds':time.monotonic()-begin}

finally:
 source.write_bytes(saved.read_bytes());os.chmod(source,mode)
 record.update(after_sha256=hashlib.sha256(source.read_bytes()).hexdigest(),mode_after=oct(source.stat().st_mode & 0o7777),exact_restoration=source.read_bytes()==original and (source.stat().st_mode & 0o7777)==mode)
 (root/(label+'-restoration.json')).write_text(json.dumps(record,indent=2)+'\n');saved.unlink()
