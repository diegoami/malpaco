from pathlib import Path
import hashlib,json,shutil,subprocess
folder=Path(__file__).parent
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def manifest(root):
 return {str(p.relative_to(root)):{'sha256':sha(p),'executableMode':bool(p.stat().st_mode & 0o111)} for p in sorted(root.rglob('*')) if p.is_file()}
Path('dist').rename(folder/'adopted-dist')
before=manifest(folder/'baseline-dist');after=manifest(folder/'adopted-dist')
assert before==after,'build outputs differ'
(folder/'assets-identity.json').write_text(json.dumps({'exact':True,'fileCount':len(before),'baseline':before,'adopted':after},indent=2)+'\n')
if (folder/'preexisting-dist').exists():
 shutil.copytree(folder/'preexisting-dist','dist')
 assert manifest(Path('dist'))==manifest(folder/'preexisting-dist')
 (folder/'dist-restoration.json').write_text(json.dumps({'preexistingRestored':True,'files':manifest(Path('dist'))},indent=2)+'\n')
protected=json.loads((folder/'protected-before.json').read_text())
current={p:{'sha256':sha(Path(p)),'executableMode':bool(Path(p).stat().st_mode & 0o111)} for p in protected}
assert protected==current
subprocess.run(['git','diff','--exit-code','HEAD','--','src','tests','data','package.json','package-lock.json'],check=True)
frozen=json.loads(Path('docs/prototypes/dev-watch/issue187/acceptance/FROZEN.json').read_text())
checks=dict(frozen['parentOwnedGuardInputs']);checks[frozen['configCandidate']['path']]=frozen['configCandidate']['sha256']
for p,want in checks.items():assert sha(Path(p))==want,p
assert sha(Path('vite.config.ts'))==frozen['configCandidate']['sha256']
parent=Path('docs/prototypes/dev-watch/issue187/acceptance/parent-preflight-v2')
assert sha(parent/'results.json')==frozen['preflightResultsSha256']
assert sha(parent/'restoration.json')==frozen['restorationSha256']
results=json.loads((parent/'results.json').read_text())
assert [(r['name'],r['exit']) for r in results]==[('before',1),('proposed',0),('ancestor-glob',1),('test-watch-removed',1)]
(folder/'protected-after.json').write_text(json.dumps(current,indent=2)+'\n')
(folder/'verification.json').write_text(json.dumps({'protectedCount':len(protected),'protectedExact':True,'guardAndCandidateHashesVerified':checks,'productionEqualsFrozenCandidate':True,'parentPreflightHashesVerified':True,'parentFailurePassOutcomes':[(r['name'],r['exit']) for r in results],'assetsExact':True,'distFiles':len(before),'preexistingDistRestored':(folder/'preexisting-dist').exists()},indent=2)+'\n')
start=(folder/'baseline-build.receipt.json').stat().st_mtime
end=(folder/'adopted-build.receipt.json').stat().st_mtime
runs=sorted([p for p in Path('.cache').glob('dev-watch-check-*') if start<=p.stat().st_ctime<=end],key=lambda p:p.stat().st_ctime)
assert len(runs)==2,[str(p) for p in runs]
mapping=[]
for name,source in zip(['focused-guard-evidence','harness-guard-evidence'],runs):
 target=folder/name;shutil.copytree(source,target)
 assert manifest(source)==manifest(target)
 mapping.append({'original':str(source),'preservedCopy':str(target),'files':manifest(target)})
(folder/'guard-evidence-copies.json').write_text(json.dumps(mapping,indent=2)+'\n')
print(json.dumps({'protectedExact':len(protected),'assetFilesExact':len(before),'frozenHashesVerified':True,'guardEvidenceCopied':len(runs),'preexistingDistRestored':True}))
