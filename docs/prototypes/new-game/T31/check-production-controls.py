"""Eight bounded actual-source controls; retain mutant bytes and restore originals in finally."""
from pathlib import Path
import hashlib, io, json, subprocess, tarfile, tempfile

root = Path(__file__).resolve().parent; repo = root.parents[3]
out = Path(tempfile.mkdtemp(prefix='actual-controls-', dir=root/'evidence'))
unit = ['python3', str(root/'run-command.py')]
browser = ['python3', str(root/'run-browser.py')]
core = ['npx', 'vitest', 'run', 'tests/core/versioned-match.test.ts']
checks = [
 ('generator-version', 'src/core/match-save.ts', 'part.version !== expected.version', 'false', unit+['control-generator-version']+core),
 ('rules-identity', 'src/core/match-save.ts', 'for (const field of ["boardGenerator", "rules"] as const)', 'for (const field of ["boardGenerator"] as const)', unit+['control-rules-identity']+core),
 ('snapshot-refusal', 'src/core/match-save.ts', 'Object.keys(value).length !== keys.length || keys.some(key => !Object.hasOwn(value, key)) || !Array.isArray(value.actions)', '!Array.isArray(value.actions)', unit+['control-snapshot-refusal']+core),
 ('action-replay', 'src/core/match-save.ts', '    state = result.state;\n  }\n  return { formatVersion: 2', '    // deleted replay continuation\n  }\n  return { formatVersion: 2', unit+['control-action-replay']+core),
 ('map-refusal', 'src/ui/referenceMatchFiles.ts', 'loaded.formatVersion !== 2 || loaded.identity.boardGenerator.id !== "fixed-reference"', 'false', browser+['control-map-refusal','--project=1280x800','--grep','bad loads','--timeout=7000']),
 ('failed-load-atomicity', 'src/ui/referenceMatchFiles.ts', '      } catch (error) {\n        if (!this.disposed', '      } catch (error) {\n        this.dispose();\n        if (!this.disposed', browser+['control-failed-load-atomicity','--project=1280x800','--grep','bad loads','--timeout=7000']),
 ('reader-lifecycle', 'src/ui/referenceBattleGame.ts', '    this.files.dispose();', '    // deleted file-reader disposal', browser+['control-reader-lifecycle','--project=1280x800','--grep','new game and a successful','--timeout=7000']),
 ('pending-context', 'src/ui/battleController.ts', 'from: initial.pendingCapture?.from ?? null, to: initial.pendingCapture?.to ?? null', 'from: null, to: null', unit+['control-pending-context','npx','vitest','run','tests/ui/versioned-match-context.test.ts']),
]
originals = {path: (repo/path).read_bytes() for _,path,*_ in checks}
sha = lambda value: hashlib.sha256(value).hexdigest()
def archive(name, payload):
 with tarfile.open(out/name, 'x:gz') as target:
  for path,data in payload.items():
   member=tarfile.TarInfo(path);member.size=len(data);target.addfile(member,io.BytesIO(data))
archive('original-sources.tar.gz', originals)
records=[]
try:
 for name,path,old,new,command in checks:
  original=originals[path];source=original.decode();assert source.count(old)==1,(name,source.count(old))
  mutant=source.replace(old,new).encode()
  try:
   (repo/path).write_bytes(mutant)
   result=subprocess.run(command,cwd=repo,capture_output=True)
   archive(name+'.tar.gz',{path:mutant,'stdout.txt':result.stdout,'stderr.txt':result.stderr})
   report=json.loads(result.stdout)
   nested=json.loads((repo/report['output']/'report.json').read_text())
   record={'name':name,'path':path,'beforeSha256':sha(original),'mutantSha256':sha(mutant),'command':command,'exit':result.returncode,'evidence':report['output'],'killed':result.returncode==1,'sourcesStable':nested['sourcesUnchangedDuringRun']}
   records.append(record)
   print(json.dumps(record),flush=True)
  finally:
   (repo/path).write_bytes(original)
  assert all((repo/p).read_bytes()==b for p,b in originals.items()),'Restoration failed'
  assert record['killed'] and record['sourcesStable'],name+' did not fail cleanly against stable source'
finally:
 for path,data in originals.items():(repo/path).write_bytes(data)
 restored={path:sha((repo/path).read_bytes())==sha(data) for path,data in originals.items()}
 (out/'report.json').write_text(json.dumps({'checks':records,'exactRestoration':restored},indent=2)+'\n')
 assert all(restored.values())
 print(json.dumps({'output':str(out.relative_to(repo)),'killed':sum(r['killed'] for r in records),'attempted':len(records),'restored':restored}),flush=True)
