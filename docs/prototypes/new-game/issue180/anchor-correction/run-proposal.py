from pathlib import Path
import hashlib,json,os,subprocess,time,sys
root=Path('docs/prototypes/new-game/issue180/anchor-correction');label=sys.argv[1];source=Path('src/styles.css');original=source.read_bytes();mode=source.stat().st_mode&0o7777
saved=root/(label+'-styles.saved.bin');saved.write_bytes(original)
record={'before_sha256':hashlib.sha256(original).hexdigest(),'before_mode':oct(mode),'commands':[]}
try:
 source.write_bytes((root/'source/styles.proposed.css').read_bytes());os.chmod(source,mode)
 command=['bash',str(root/'run-browser.sh'),label]
 if label=='short':command+=['--grep','Squall loss and decisive reward']
 start=time.monotonic();result=subprocess.run(command);record['commands'].append({'argv':command,'exit':result.returncode,'seconds':time.monotonic()-start})
 if label=='combined' and result.returncode==0:
  command=['npm','run','build'];start=time.monotonic()
  with (root/'build.log').open('w') as log:result=subprocess.run(command,stdout=log,stderr=subprocess.STDOUT)
  record['commands'].append({'argv':command,'exit':result.returncode,'seconds':time.monotonic()-start})
finally:
 source.write_bytes(saved.read_bytes());os.chmod(source,mode);saved.unlink()
 record.update(after_sha256=hashlib.sha256(source.read_bytes()).hexdigest(),after_mode=oct(source.stat().st_mode&0o7777),exact_restoration=source.read_bytes()==original and source.stat().st_mode&0o7777==mode)
 mismatches=[]
 for row in json.loads((root/'inputs-before.json').read_text()):
  p=Path(row['path'])
  if not p.exists() or hashlib.sha256(p.read_bytes()).hexdigest()!=row['sha256'] or oct(p.stat().st_mode&0o7777)!=row['mode']:mismatches.append(str(p))
 record['other_input_mismatches']=mismatches;(root/(label+'-receipt.json')).write_text(json.dumps(record,indent=2)+'\n')
