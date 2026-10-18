from pathlib import Path
import json,hashlib,tarfile,subprocess,datetime
b=Path('docs/prototypes/new-game/T38/implementation')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
validation=next(p for p in sorted(b.glob('validation-*')) if p.is_dir())
r=json.loads((validation/'receipt.json').read_text());assert r['allPassed'] and r['frozenAcceptanceMatchesAfter']
assert all(sha(Path(p))==h for p,h in r['inputs'].items())
frozen=Path('docs/prototypes/new-game/T38/parent-acceptance/FROZEN-ACCEPTANCE.json')
assert all(sha(Path(p))==h for p,h in json.loads(frozen.read_text()).items())
archives={}
for archive in sorted(b.rglob('*.tar.gz')):
 entries=[]
 with tarfile.open(archive) as a:
  for m in a:
   if m.isfile():entries.append({'path':m.name,'bytes':m.size,'sha256':hashlib.sha256(a.extractfile(m).read()).hexdigest()})
 archives[str(archive)]={'sha256':sha(archive),'bytes':archive.stat().st_size,'members':entries}
(b/'archive-member-verification.json').write_text(json.dumps(archives,indent=2)+'\n')
summary={'sourceCommit':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'validationPath':str(validation),'allPassed':True,'allMeasuredInputsUnchanged':True,'frozenAcceptanceFiles':len(json.loads(frozen.read_text())),'frozenAcceptanceManifestSha256':sha(frozen),'commands':r['commands'],'startedUtc':r['startedUtc'],'finishedUtc':r['finishedUtc'],'checkedSourceInputs':len(r['inputs']),'archivesVerified':len(archives),'archiveMembersVerified':sum(len(a['members']) for a in archives.values()),'runtimeEquivalenceReceiptSha256':sha(b/'mock-runtime-equivalence.json'),'negativeControls':'Reused exact parent-executed baseline and Anchor/Wild controls, permitted by eight-file token equivalence; no new mutations.','limitations':['Independent review, CI and merge remain parent-owned.','Native aggregate token telemetry unavailable.']}
(b/'implementation.json').write_text(json.dumps(summary,indent=2)+'\n')
manifest=[{'path':str(p.relative_to(b)),'bytes':p.stat().st_size,'sha256':sha(p)} for p in sorted(b.rglob('*')) if p.is_file() and p.name not in ['final-member-manifest.json','finalization.stdout','finalization.stderr']]
(b/'final-member-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps(summary,indent=2))
