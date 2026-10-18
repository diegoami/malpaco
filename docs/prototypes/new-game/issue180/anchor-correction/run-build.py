from pathlib import Path
import hashlib,json,os,subprocess,time
root=Path('docs/prototypes/new-game/issue180/anchor-correction');source=Path('src/styles.css');original=source.read_bytes();mode=source.stat().st_mode&0o7777;saved=root/'build-styles.saved.bin';saved.write_bytes(original)
record={'before_sha256':hashlib.sha256(original).hexdigest(),'before_mode':oct(mode)}
try:
 source.write_bytes((root/'source/styles.proposed.css').read_bytes());os.chmod(source,mode);start=time.monotonic()
 with (root/'build.log').open('w') as log: result=subprocess.run(['npm','run','build'],stdout=log,stderr=subprocess.STDOUT)
 record['commands']=[{'argv':['npm','run','build'],'exit':result.returncode,'seconds':time.monotonic()-start}]
finally:
 source.write_bytes(saved.read_bytes());os.chmod(source,mode);saved.unlink();record.update(after_sha256=hashlib.sha256(source.read_bytes()).hexdigest(),after_mode=oct(source.stat().st_mode&0o7777),exact_restoration=source.read_bytes()==original and source.stat().st_mode&0o7777==mode)
 record['other_input_mismatches']=[row['path'] for row in json.loads((root/'inputs-before.json').read_text()) if not Path(row['path']).exists() or hashlib.sha256(Path(row['path']).read_bytes()).hexdigest()!=row['sha256'] or oct(Path(row['path']).stat().st_mode&0o7777)!=row['mode']]
 (root/'build-receipt.json').write_text(json.dumps(record,indent=2)+'\n')
