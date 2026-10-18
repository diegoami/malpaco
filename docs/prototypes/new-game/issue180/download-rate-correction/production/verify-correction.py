#!/usr/bin/env python3
"""Strict read-only proof for the two explicitly authorized T73 replacements."""
from pathlib import Path
import hashlib,json,subprocess
ROOT=Path(__file__).resolve().parents[6]
ISSUE=ROOT/'docs/prototypes/new-game/issue180'
HERE=ISSUE/'download-rate-correction/production'
def check(ok,description):
    if not ok:raise SystemExit('MISMATCH: '+description)
def digest(data):return hashlib.sha256(data).hexdigest()
def load(path):return json.loads(path.read_bytes())
cache={}
def committed(path):
    if path not in cache:
        result=subprocess.run(['git','show','HEAD:'+path],cwd=ROOT,capture_output=True)
        check(result.returncode==0,'committed file '+path);cache[path]=result.stdout
    return cache[path]
result=subprocess.run(['git','ls-tree','-r','--full-tree','HEAD'],cwd=ROOT,capture_output=True,text=True,check=True)
modes={line.split('\t',1)[1]:line.split(' ',1)[0] for line in result.stdout.splitlines()}
def exact(path,expected,mode=None):
    data=(ROOT/path).read_bytes();head=committed(path)
    check(digest(data)==expected and digest(head)==expected,'HEAD/working bytes '+path)
    if mode is not None:
        check(oct((ROOT/path).stat().st_mode&0o7777)==mode,'working mode '+path)
        check(modes.get(path)==('100755' if mode=='0o755' else '100644'),'HEAD mode '+path)
    return data
metadata=load(HERE/'adoption.json')
metadata_path=str((HERE/'adoption.json').relative_to(ROOT))
check(committed(metadata_path)==(HERE/'adoption.json').read_bytes(),'committed adoption metadata')
self_path=str(Path(__file__).resolve().relative_to(ROOT))
check(committed(self_path)==Path(__file__).read_bytes(),'committed verifier')
manifest_bytes=exact(metadata['manifest'],metadata['manifestSha256'])
manifest=json.loads(manifest_bytes)
check(len(manifest['expectedAfterAdoption'])==226 and len(manifest['frozenEvidence'])==28,'frozen counts')
allowed={'docs/tasks/T73.md','tests/e2e/computer-cards.spec.ts'}
check(set(manifest['allowedChanges'])==allowed and set(metadata['explicitReplacements'])==allowed,'explicit replacement set')
for path,item in manifest['expectedAfterAdoption'].items():exact(path,item['sha256'],item['mode'])
for path,expected in manifest['frozenEvidence'].items():exact(path,expected,metadata['evidenceModes'][path])
for path,expected in metadata['historicalUnchanged'].items():exact(path,expected)
old_checks=0;replaced=set()
for name,count in [('FROZEN-ACCEPTANCE.json',18),('validated-inputs.json',222)]:
    previous=load(ISSUE/'parent-final'/name);check(len(previous)==count,'historical count '+name)
    for path,previous_hash in previous.items():
        if path in allowed:
            pair=metadata['explicitReplacements'][path]
            check(previous_hash==pair['beforeSha256'],'named old hash '+path)
            check(pair['afterSha256']==manifest['expectedAfterAdoption'][path]['sha256'],'named expected replacement '+path)
            exact(path,pair['afterSha256']);replaced.add(path)
        else:exact(path,previous_hash)
        old_checks+=1
check(replaced==allowed,'both explicit historical replacements visited')
source=metadata['source'];actual=exact(source['path'],source['sha256'])
proposal=(ROOT/source['proposal']).read_bytes();original=(ROOT/source['original']).read_bytes()
check(actual==proposal and digest(proposal)==manifest['proposalSha256'],'exact helper proposal adoption')
proof=load(ISSUE/'download-rate-correction/proposal-proof.json')
check(digest(original)==proof['original_sha256'] and digest(proposal)==proof['proposal_sha256'],'retained original/proposal proof')
old_text=original.decode();new_text=proposal.decode()
imports="\nimport {performance} from 'node:perf_hooks';\nimport {setTimeout as waitForRealTime} from 'node:timers/promises';"
check(new_text.count(imports)==1,'exact two Node imports');normalized=new_text.replace(imports,'')
start=normalized.index('// [designed] 120ms real-time margin prevents Chromium')
end=normalized.index('\nasync function saved',start)
old_start=old_text.index('async function nativeSave');old_end=old_text.index('\nasync function saved',old_start)
check(normalized[:start]+old_text[old_start:old_end]+normalized[end:]==old_text,'only native-save helper/import delta; all other assertions/clock/deadlines exact')
exact('src/styles.css',metadata['runtimeCssSha256'])
check(metadata['runtimeCssSha256']=='9be45373a26450ff17ebac7990ab11e841eb877cea903eaceeb3936bd323ae64','unchanged approved runtime CSS')
receipt=load(ISSUE/'download-rate-correction/receipt.json');summary=load(ISSUE/'download-rate-correction/test-summary.json')
check(receipt==metadata['reusedPreflightReceipt'] and summary==metadata['reusedTestSummary'],'exact positive receipts')
check(receipt['exit']==0 and summary['passed']==4 and summary['total']==4,'four targeted positives')
print(json.dumps({'expectedInputsHEADAndWorking':226,'frozenEvidenceHEADAndWorking':28,'historicalInputsChecked':old_checks,
                  'explicitReplacements':sorted(replaced),'proposalExact':True,'onlyNativeSaveDelta':True,
                  'runtimeCssUnchanged':True,'oldProofHistoricalAndUnchanged':True,'reusedTargetedCases':'4/4',
                  'freshHeavyRuns':0,'mismatches':0,'remainingGates':metadata['remainingGates']}))
