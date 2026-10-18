from pathlib import Path
import hashlib,json,os,subprocess,time
root=Path('docs/prototypes/new-game/issue180/download-rate-correction');source=Path('tests/e2e/computer-cards.spec.ts');original=source.read_bytes();mode=source.stat().st_mode&0o7777;saved=root/'source/computer-cards.saved.bin'
proof=json.loads((root/'proposal-proof.json').read_bytes());assert hashlib.sha256(original).hexdigest()==proof['original_sha256'];assert hashlib.sha256(Path('src/styles.css').read_bytes()).hexdigest()=='9be45373a26450ff17ebac7990ab11e841eb877cea903eaceeb3936bd323ae64'
saved.write_bytes(original);record={'original_sha256':hashlib.sha256(original).hexdigest(),'original_mode':oct(mode),'proposal_sha256':proof['proposal_sha256']}
command=['docker','run','--pull=never','--rm','--init','--ipc=host','--user','1000:1000','-v',str(Path.cwd())+':/work','-w','/work','-e','HOME=/tmp','-e','PLAYWRIGHT_JSON_OUTPUT_NAME=/work/'+str(root/'results.json'),'-e','PLAYWRIGHT_HTML_OUTPUT_DIR=/work/'+str(root/'html-report'),'mcr.microsoft.com/playwright:v1.63.0-noble','node_modules/.bin/playwright','test','tests/e2e/computer-cards.spec.ts','-c','playwright.config.ts','--grep','three consecutive computers','--workers','2','--output',str(root/'test-results'),'--reporter','list,json,html']
try:
 source.write_bytes((root/'source/computer-cards.proposed.ts').read_bytes());os.chmod(source,mode);start=time.monotonic()
 with (root/'stdout.log').open('w') as out,(root/'stderr.log').open('w') as err:result=subprocess.run(command,stdout=out,stderr=err)
 record.update(argv=command,exit=result.returncode,seconds=time.monotonic()-start)
finally:
 source.write_bytes(saved.read_bytes());os.chmod(source,mode);saved.unlink();record.update(restored_sha256=hashlib.sha256(source.read_bytes()).hexdigest(),restored_mode=oct(source.stat().st_mode&0o7777),exact_restoration=source.read_bytes()==original and source.stat().st_mode&0o7777==mode)
 record['protected_input_mismatches']=[row['path'] for row in json.loads((root/'protected-inputs.json').read_bytes()) if not Path(row['path']).exists() or hashlib.sha256(Path(row['path']).read_bytes()).hexdigest()!=row['sha256'] or oct(Path(row['path']).stat().st_mode&0o7777)!=row['mode']]
 record['runtime_css_sha256']=hashlib.sha256(Path('src/styles.css').read_bytes()).hexdigest();(root/'receipt.json').write_text(json.dumps(record,indent=2)+'\n');print(json.dumps(record))
