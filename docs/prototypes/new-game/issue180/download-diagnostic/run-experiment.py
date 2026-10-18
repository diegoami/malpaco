from pathlib import Path
import hashlib,json,os,subprocess,time,sys
root=Path('docs/prototypes/new-game/issue180/download-diagnostic');label=sys.argv[1];source=Path('src/styles.css');original=source.read_bytes();mode=source.stat().st_mode&0o7777;saved=root/(label+'-source.saved.bin');saved.write_bytes(original)
paths={'css5':'docs/prototypes/new-game/issue180/anchor-correction/source/styles.proposed.css','css4':'docs/prototypes/new-game/issue180/preflight/source/styles.proposed.css','original':'src/styles.css'};candidate=Path(paths[label.split('-')[0]]).read_bytes();record={'source_before_sha256':hashlib.sha256(original).hexdigest(),'source_mode_before':oct(mode),'applied_sha256':hashlib.sha256(candidate).hexdigest()}
try:
 source.write_bytes(candidate);os.chmod(source,mode);start=time.monotonic();command=['bash',str(root/'run-selection.sh')] if label=='css5-selection' else ['bash',str(root/'run-browser.sh'),label];result=subprocess.run(command);record['command']={'argv':command,'exit':result.returncode,'seconds':time.monotonic()-start}
finally:
 source.write_bytes(saved.read_bytes());os.chmod(source,mode);saved.unlink();record.update(source_after_sha256=hashlib.sha256(source.read_bytes()).hexdigest(),source_mode_after=oct(source.stat().st_mode&0o7777),exact_restoration=source.read_bytes()==original and source.stat().st_mode&0o7777==mode)
 record['other_input_mismatches']=[row['path'] for row in json.loads((root/'inputs-before.json').read_text()) if not Path(row['path']).exists() or hashlib.sha256(Path(row['path']).read_bytes()).hexdigest()!=row['sha256'] or oct(Path(row['path']).stat().st_mode&0o7777)!=row['mode']];(root/(label+'-receipt.json')).write_text(json.dumps(record,indent=2)+'\n')
