from pathlib import Path
import hashlib,json,shutil,subprocess
w=Path(__file__).resolve().parents[5];root=Path(__file__).resolve().parent
results=json.loads((root/'full-results.json').read_text());assert len(results)==7 and all(r['exit']==0 and r['unchanged'] for r in results)
for entry in results:assert entry['sourceAfter']==results[0]['sourceAfter'],entry['label']
for label,count in [('final-layout',8),('final-regression',120),('final-geography',30)]:
 stats=next(r['stats'] for r in results if r['label']==label);assert stats['expected']==count and not any(stats[k] for k in ['unexpected','skipped','flaky']),(label,stats)
assert 'Total: 384 tests in 38 files' in (root/'final-list/raw.log').read_text()
original=json.loads((root/'diagnose/command.json').read_text())['sourceBefore'];final=results[0]['sourceAfter']
assert [p for p in original if p.startswith('src/') and original[p]!=final[p]]==['src/styles.css']
for p in ['tests/e2e/hideable-panels.spec.ts','tests/e2e/geographic-board.spec.ts','package.json','package-lock.json','playwright.config.ts']:assert original[p]==final[p],p
before=json.loads((root/'default-output-inventory-before.json').read_text());after={}
for base in before:
 after[base]=[{'path':str(p.relative_to(w)),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'mode':p.stat().st_mode} for p in sorted((w/base).rglob('*')) if p.is_file()]
assert before==after
(root/'default-output-inventory-after.json').write_text(json.dumps(after,indent=2)+'\n')
snapshot=w/'.cache/T76-preview-ci-correction';assert not snapshot.exists();shutil.copytree(w/'dist',snapshot)
manifest=[{'path':str(p.relative_to(snapshot)),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in sorted(snapshot.rglob('*')) if p.is_file()];assert len(manifest)==6
(root/'dist-files.json').write_text(json.dumps(manifest,indent=2)+'\n')
identity={'snapshot':str(snapshot),'runtimeChangeOnly':'src/styles.css','sourceInventory':384,'sourceFiles':38,'inputs':final,'canonicalAndFrozenTestsUnchanged':True,'defaultOutputsUnchangedSinceRoutingInventory':True,'priorIgnoredGeographicScreenshotExistenceAndIdentity':'unproven before geography-positive; current 12 files retained'}
(root/'final-identity.json').write_text(json.dumps(identity,indent=2)+'\n')
for name,sources in [('controls',['geography-positive','toolbar-positive','geography-reverted','toolbar-reverted','toolbar-choice-negative','diagnose-corrected','proof-unit.log','choice-negative-unit.log','restoration.json','corrected-styles.saved','runner-before-geographic-routing.py']),('full-validation',['final-layout','final-regression','final-geography','final-unit','final-build','final-list','full-unit.log'])]:
 subprocess.run(['python3',str(root/'retain.py'),name]+sources,cwd=w,check=True)
print('Final proof, source identity, default-output preservation and immutable dist verified',flush=True)
