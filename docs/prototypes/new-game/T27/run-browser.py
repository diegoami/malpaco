"""Run focused browser checks in the pinned image, retaining every output freshly."""
from pathlib import Path
import subprocess,tempfile,tarfile,hashlib,json,sys
root=Path(__file__).resolve().parent
repo=root.parents[3]
(root/'evidence').mkdir(exist_ok=True)
args=sys.argv[2:]
suites=['tests/e2e/reference-game.spec.ts']
if args and args[0]=='--suites':suites=args[1].split(',');args=args[2:]
out=Path(tempfile.mkdtemp(prefix=sys.argv[1]+'-',dir=root/'preflight' if sys.argv[1].startswith('mock') else root/'evidence'))
raw=out/'raw';raw.mkdir();(raw/'screenshots').mkdir()
relative=out.relative_to(repo)
command=['docker','run','--rm','--user','1000:1000','-v',str(raw/'screenshots')+':/work/screenshots','-v',str(repo)+':/work','-v','/home/diego/projects/malpaco/node_modules:/work/node_modules:ro','--tmpfs','/work/node_modules/.vite-temp:rw,mode=1777','--tmpfs','/work/node_modules/.vite:rw,mode=1777','-e','REFERENCE_EVIDENCE_DIR=/work/'+str(relative/'captures'),'-e','PLAYWRIGHT_HTML_OUTPUT_DIR=/work/'+str(relative/'raw/html-report'),'-w','/work','mcr.microsoft.com/playwright:v1.63.0-noble','npx','playwright','test',*suites,'--workers=2','--output',str(relative/'raw/test-results'),*args]
with (raw/'output.txt').open('wb') as log:r=subprocess.run(command,cwd=repo,stdout=log,stderr=subprocess.STDOUT)
sha=lambda b:hashlib.sha256(b).hexdigest()
paths=sorted(p for p in raw.rglob('*') if p.is_file())
with tarfile.open(out/'raw-outputs.tar.gz','w:gz') as a:
 for p in paths:a.add(p,arcname=str(p.relative_to(raw)))
with tarfile.open(out/'raw-outputs.tar.gz') as a:assert all(a.extractfile(str(p.relative_to(raw))).read()==p.read_bytes() for p in paths)
(out/'.gitignore').write_text('/raw/\n')
sources=suites+[str(p.relative_to(repo)) for p in (repo/'src/core').glob('*.ts')]+[str(p.relative_to(repo)) for p in (repo/'tests/core').glob('capture-choice*.ts')]+['src/main.ts','src/styles.css','src/core/reference-game.ts','src/ui/referenceGame.ts','src/ui/referenceMapView.ts','src/ui/referenceData.ts','tests/core/reference-game.test.ts','tests/e2e/reference-game.spec.ts','playwright.config.ts','package-lock.json']
report={'command':command,'exit':r.returncode,'sourceHashes':{p:sha((repo/p).read_bytes()) for p in sources},'archiveSha256':sha((out/'raw-outputs.tar.gz').read_bytes()),'archiveMemberHashes':{str(p.relative_to(raw)):sha(p.read_bytes()) for p in paths},'outputTail':(raw/'output.txt').read_text()[-7000:]}
(out/'report.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'output':str(relative),'exit':r.returncode,'outputTail':report['outputTail']},indent=2))
sys.exit(r.returncode)
