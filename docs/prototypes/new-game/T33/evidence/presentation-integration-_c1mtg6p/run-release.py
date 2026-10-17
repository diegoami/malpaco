"""Package once, verify outside the checkout, and drive the extracted reference game."""
from pathlib import Path
import hashlib,json,subprocess,tarfile,tempfile,shutil
root=Path(__file__).resolve().parent;repo=root.parents[3]
out=Path(tempfile.mkdtemp(prefix='release-',dir=root/'evidence'))
raw=out/'raw';raw.mkdir();(raw/'screenshots').mkdir();(out/'captures').mkdir()
(out/'.gitignore').write_text('/raw/\n')
extracted=Path(tempfile.mkdtemp(prefix='malpaco-t33-extracted-'))
relative=out.relative_to(repo)
paths=sorted(set(p for folder in ['src','tests','tools/release','docs/prototypes/new-game/T63',str(root.relative_to(repo)/'fixtures')] for p in (repo/folder).rglob('*') if p.is_file())|set(p for p in root.glob('*') if p.is_file())|{repo/n for n in ['package.json','package-lock.json','index.html','tsconfig.json','playwright.config.ts','playwright.release.config.ts','vite.config.ts','docs/play.md','docs/spike.md','docs/prototypes/playable/acceptance.mjs']})
inputs={str(p.relative_to(repo)):p.read_bytes() for p in paths};sha=lambda b:hashlib.sha256(b).hexdigest()
with tarfile.open(out/'source-inputs.tar.gz','w:gz') as a:
 for p in paths:a.add(p,arcname=str(p.relative_to(repo)))
command=['docker','run','--rm','--user','1000:1000','-v',str(repo)+':/work','-v','/home/diego/projects/malpaco/.git:/home/diego/projects/malpaco/.git:ro','-v','/home/diego/projects/malpaco/node_modules:/work/node_modules:ro','--tmpfs','/work/node_modules/.vite-temp:rw,mode=1777','--tmpfs','/work/node_modules/.vite:rw,mode=1777','-v',str(extracted)+':/extracted','-v',str(raw/'screenshots')+':/work/screenshots','-e','PLAYABLE_EXTRACTED_DIR=/extracted','-e','PLAYABLE_EVIDENCE_DIR=/work/'+str(relative/'raw'),'-e','REFERENCE_COMPLETE_EVIDENCE_DIR=/work/'+str(relative/'captures'),'-e','DEFAULT_ENTRY_EVIDENCE_DIR=/work/'+str(relative/'captures'),'-w','/work','mcr.microsoft.com/playwright:v1.63.0-noble','bash','-c','node docs/prototypes/playable/acceptance.mjs /extracted && npx playwright test --config playwright.release.config.ts tests/e2e/reference-complete-game.spec.ts tests/e2e/entry.spec.ts --workers=2']
with (raw/'output.txt').open('wb') as log:r=subprocess.run(command,cwd=repo,stdout=log,stderr=subprocess.STDOUT)
archive=repo/'release/malpaco-playable.tar.gz'
if archive.exists():shutil.copyfile(archive,out/'malpaco-playable.tar.gz')
files=sorted(p for p in raw.rglob('*') if p.is_file())
with tarfile.open(out/'raw-outputs.tar.gz','w:gz') as a:
 for p in files:a.add(p,arcname=str(p.relative_to(raw)))
with tarfile.open(out/'raw-outputs.tar.gz') as a:assert all(a.extractfile(str(p.relative_to(raw))).read()==p.read_bytes() for p in files)
build=extracted/'malpaco-playable/BUILD.json'
report={'command':command,'exit':r.returncode,'extractedHostPath':str(extracted),'buildIdentity':json.loads(build.read_text()) if build.exists() else None,'sourceHashes':{n:sha(b) for n,b in inputs.items()},'sourcesUnchangedDuringRun':all((repo/n).read_bytes()==b for n,b in inputs.items()),'packageSha256':sha(archive.read_bytes()) if archive.exists() else None,'archiveSha256':sha((out/'raw-outputs.tar.gz').read_bytes()),'archiveMemberHashes':{str(p.relative_to(raw)):sha(p.read_bytes()) for p in files},'outputTail':(raw/'output.txt').read_text()[-7000:]}
(out/'report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'output':str(relative),'exit':r.returncode,'tail':report['outputTail']},indent=2));raise SystemExit(r.returncode)
