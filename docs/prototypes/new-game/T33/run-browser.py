"""Run focused browser checks in the pinned image, retaining every output freshly."""
from pathlib import Path
import subprocess,tempfile,tarfile,hashlib,json,sys
root=Path(__file__).resolve().parent
repo=root.parents[3]
(root/'evidence').mkdir(exist_ok=True)
(root/'preflight').mkdir(exist_ok=True)
args=sys.argv[2:]
suites=['tests/e2e/reference-complete-game.spec.ts']
if args and args[0]=='--suites':suites=args[1].split(',');args=args[2:]
out=Path(tempfile.mkdtemp(prefix=sys.argv[1]+'-',dir=root/'preflight' if sys.argv[1].startswith('mock') else root/'evidence'))
(out/'.gitignore').write_text('/raw/\n')
raw=out/'raw';raw.mkdir();(raw/'screenshots').mkdir();(out/'captures').mkdir()
relative=out.relative_to(repo)
command=['docker','run','--rm','--user','1000:1000','-v',str(raw/'screenshots')+':/work/screenshots','-v',str(repo)+':/work','-v','/home/diego/projects/malpaco/node_modules:/work/node_modules:ro','--tmpfs','/work/node_modules/.vite-temp:rw,mode=1777','--tmpfs','/work/node_modules/.vite:rw,mode=1777','-e','REFERENCE_COMPLETE_EVIDENCE_DIR=/work/'+str(relative/'captures'),'-e','RETRY_VALIDATION_EVIDENCE_DIR=/work/'+str(relative),*sum((["-e",name+"=/work/"+str(relative/'captures')] for name in ['COMPLETE_EVIDENCE_DIR','MATCH_SAVE_EVIDENCE_DIR','COMPUTER_EVIDENCE_DIR','SETUP_EVIDENCE_DIR','HELP_EVIDENCE_DIR','DEFAULT_ENTRY_EVIDENCE_DIR','FINISHED_COPY_EVIDENCE_DIR','GENERATED_EVIDENCE_DIR']),[]),'-e','COMPUTER_FLOW_EVIDENCE_DIR=/work/'+str(relative/'captures'),'-e','VERSIONED_MATCH_EVIDENCE_DIR=/work/'+str(relative/'captures'),'-e','VICTORY_EVIDENCE_DIR=/work/'+str(relative/'captures'),'-e','FRIENDLY_EVIDENCE_DIR=/work/'+str(relative/'captures'),'-e','BATTLE_EVIDENCE_DIR=/work/'+str(relative/'captures'),'-e','REFERENCE_EVIDENCE_DIR=/work/'+str(relative/'captures'),'-e','PLAYWRIGHT_HTML_OUTPUT_DIR=/work/'+str(relative/'raw/html-report'),'-w','/work','mcr.microsoft.com/playwright:v1.63.0-noble','npx','playwright','test',*suites,'--workers=2','--output',str(relative/'raw/test-results'),*args]
sources=sorted(set(suites+[str(p.relative_to(repo)) for p in (repo/'src/core').glob('*.ts')]+[str(p.relative_to(repo)) for p in (repo/'src/ui').rglob('*.ts')]+[str(p.relative_to(repo)) for p in (repo/'tests/ui').glob('battle*.ts')]+[str(p.relative_to(repo)) for p in (repo/'tests/e2e').glob('*friendly*.ts')]+[str(p.relative_to(repo)) for p in (repo/'tests').rglob('*.ts')]+['src/main.ts','src/styles.css','playwright.config.ts','package-lock.json','package.json',str(root.relative_to(repo)/'run-browser.py'),'docs/prototypes/new-game/T63/board.json','docs/prototypes/new-game/T63/map.svg','data/maps/small_sea.json']))
sources+= [str(p.relative_to(repo)) for p in (repo/'docs/prototypes/new-game/T31/fixtures').glob('*.json')]
sources += [str(p.relative_to(repo)) for folder in ['T64','T65'] for p in (repo/'docs/prototypes/new-game'/folder).glob('*') if p.is_file()]
sources += [str(p.relative_to(repo)) for folder in ['src','tests','data',str(root.relative_to(repo)/'fixtures')] for p in (repo/folder).rglob('*') if p.is_file()]
sources += ['docs/prototypes/new-game/T64/acceptance/board.json','docs/prototypes/new-game/T65/acceptance/board.json','docs/prototypes/map-1994/preview.html']
sources=sorted(set(sources))
inputs={p:(repo/p).read_bytes() for p in sources}
with tarfile.open(out/'source-inputs.tar.gz','w:gz') as a:
 for p in sources:a.add(repo/p,arcname=p)
with (raw/'output.txt').open('wb') as log:r=subprocess.run(command,cwd=repo,stdout=log,stderr=subprocess.STDOUT)
sha=lambda b:hashlib.sha256(b).hexdigest()
paths=sorted(p for p in raw.rglob('*') if p.is_file())
with tarfile.open(out/'raw-outputs.tar.gz','w:gz') as a:
 for p in paths:a.add(p,arcname=str(p.relative_to(raw)))
with tarfile.open(out/'raw-outputs.tar.gz') as a:assert all(a.extractfile(str(p.relative_to(raw))).read()==p.read_bytes() for p in paths)
(out/'.gitignore').write_text('/raw/\n')
report={'command':command,'exit':r.returncode,'sourceHashes':{p:sha(b) for p,b in inputs.items()},'sourcesUnchangedDuringRun':all((repo/p).read_bytes()==b for p,b in inputs.items()),'archiveSha256':sha((out/'raw-outputs.tar.gz').read_bytes()),'archiveMemberHashes':{str(p.relative_to(raw)):sha(p.read_bytes()) for p in paths},'outputTail':(raw/'output.txt').read_text()[-7000:]}
(out/'report.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'output':str(relative),'exit':r.returncode,'outputTail':report['outputTail']},indent=2))
sys.exit(r.returncode)
