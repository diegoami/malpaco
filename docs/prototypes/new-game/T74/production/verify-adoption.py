#!/usr/bin/env python3
"""Read-only exact T74 adoption proof; evidence is read from committed HEAD in memory."""
from pathlib import Path
import hashlib, io, json, os, subprocess, tarfile
ROOT=Path(__file__).resolve().parents[5]
BASE='docs/prototypes/new-game/T74/'
ENV={**os.environ,'GIT_OPTIONAL_LOCKS':'0'}
def check(ok,what):
    if not ok:raise SystemExit('MISMATCH: '+what)
def digest(data):return hashlib.sha256(data).hexdigest()
def committed(path):
    p=subprocess.run(['git','show','HEAD:'+path],cwd=ROOT,env=ENV,capture_output=True)
    check(p.returncode==0,'committed path '+path);return p.stdout
def exact(path,expected=None,mode=None):
    data=committed(path);check((ROOT/path).read_bytes()==data,'working/committed bytes '+path)
    if expected is not None:check(digest(data)==expected,'hash '+path)
    tree=subprocess.check_output(['git','ls-tree','HEAD','--',path],cwd=ROOT,env=ENV).decode().split()
    check(len(tree)>=3 and tree[1]=='blob','committed blob '+path)
    gm=int(tree[0],8)&0o777;wm=(ROOT/path).stat().st_mode&0o777
    # Git stores the executable bit, not POSIX group-write permission.
    check(bool(gm&0o111)==bool(wm&0o111),'working/committed executable mode '+path)
    if mode is not None:check(wm==int(mode,8),'expected mode '+path)
    return data
self_path=BASE+'production/verify-adoption.py'
exact(self_path)
adoption=json.loads(exact(BASE+'production/adoption.json'))
check(digest(committed(self_path))==adoption['verifierSha256'],'committed verifier identity')
for path,h in adoption['manifestSha256'].items():exact(path,h)
frozen=json.loads(committed(BASE+'acceptance/FROZEN-ACCEPTANCE.json'))
validated=json.loads(committed(BASE+'acceptance/validated-inputs.json'))
check(len(frozen['inputs'])==99,'frozen count99')
# Exact working modes come from original archived copies or validated inputs;
# Git's100644 alone cannot distinguish0644 from0664.
phase_receipt=json.loads(committed(BASE+'archives/phase-a-receipt.json'))
for p,h in frozen['inputs'].items():
    if p.startswith(BASE+'acceptance/measurements/'):
        origin=BASE+'preflight/phase-a-20261018-01/measurements/'+p.rsplit('/',1)[1]
        mode=oct(phase_receipt['members'][origin]['mode'])
    elif p.startswith(BASE+'production-candidate/src/ui/'):
        origin=BASE+'preflight/phase-a-20261018-01/proposal/'+p.rsplit('/',1)[1]
        mode=oct(phase_receipt['members'][origin]['mode'])
    elif p in [BASE+'acceptance/API.md',BASE+'acceptance/frozen-oracles.json']:
        origin=BASE+'preflight/phase-a-20261018-01/proposal/'+p.rsplit('/',1)[1]
        mode=oct(phase_receipt['members'][origin]['mode'])
    else:
        check(p in validated['expectedAfterAdoption'],'frozen mode authority '+p)
        mode=validated['expectedAfterAdoption'][p]['mode']
    exact(p,h,mode)
check(len(validated['expectedAfterAdoption'])==226,'validated count226')
for p,e in validated['expectedAfterAdoption'].items():exact(p,e['sha256'],e['mode'])
check(len(adoption['sources'])==3,'three provider sources')
for p,e in adoption['sources'].items():check(exact(p,e['sha256'],e['mode'])==exact(e['candidate'],e['sha256'],e['mode']),'canonical provider equality '+p)
check(adoption['positiveRun']==validated['positiveRun'],'declared original command results')
check(adoption['prerequisiteChangeAfterPositive']==validated['prerequisiteChangeAfterPositive'],'declared prerequisite exception')
check(validated['prerequisiteChangeAfterPositive']['path']=='tests/e2e/computer-cards.spec.ts','only declared post-positive exception')
phase_root=BASE+'preflight/phase-a-20261018-01/'
parent_root=BASE+'parent-validation-20261018-01/'
needed={phase_root+x for x in ['manifest.json','SHA256SUMS','measurements/summary.json','approved-oracle-comparison.json','overlays/summary.json','overlays-three-digit/summary.json','proposal/controls-final/summary.json','proposal/browser-worker-smoke.json','proposal/tests-final-02.log','proposal/frozen-oracles.json']}
needed|={parent_root+x for x in ['manifest.json','restoration.json','baseline-result.json','npm-test-result.json','build-result.json','npm-test.log','build.log','baseline.log']}
retained={};parts_count=0;member_count=0
for name,count,parts in [('phase-a',330,2),('parent-validation',19,1)]:
    receipt=json.loads(committed(BASE+'archives/'+name+'-receipt.json'))
    check(len(receipt['members'])==count and len(receipt['parts'])==parts,'archive inventory '+name)
    payload=io.BytesIO();hasher=hashlib.sha256();size=0
    for part in receipt['parts']:
        data=exact(part['path'],part['sha256']);check(len(data)==part['bytes'],'part size '+part['path'])
        payload.write(data);hasher.update(data);size+=len(data);parts_count+=1
    check(size==receipt['archiveBytes'] and hasher.hexdigest()==receipt['archiveSha256'],'archive concatenation '+name)
    payload.seek(0);found=set()
    with tarfile.open(fileobj=payload,mode='r:gz') as archive:
        for member in archive:
            check(member.isfile(),'only inventoried regular members '+member.name)
            check(member.name not in found and member.name in receipt['members'],'member inventory '+member.name)
            found.add(member.name);expected=receipt['members'][member.name]
            check(member.size==expected['bytes'] and member.mode&0o777==expected['mode'],'member size/mode '+member.name)
            stream=archive.extractfile(member);check(stream is not None,'member stream '+member.name)
            h=hashlib.sha256();chunks=[]
            while chunk:=stream.read(1024*1024):
                h.update(chunk)
                if member.name in needed:chunks.append(chunk)
            check(h.hexdigest()==expected['sha256'],'member hash '+member.name)
            if member.name in needed:retained[member.name]=b''.join(chunks)
    check(found==set(receipt['members']),'complete archive members '+name);member_count+=len(found)
    original_root=phase_root if name=='phase-a' else parent_root
    manifest=json.loads(retained[original_root+'manifest.json'])
    for row in manifest['files']:
        member=original_root+row['path'];check(member in receipt['members'],'inner manifest member '+member)
        e=receipt['members'][member]
        check(e['sha256']==row['sha256'] and e['bytes']==row['bytes'] and e['mode']==int(row['mode'],8),'inner manifest identity '+member)
    check(len(manifest['files'])==(328 if name=='phase-a' else 18),'inner manifest counts '+name)
check(needed<=set(retained),'all required archived evidence present')
check(digest(retained[phase_root+'manifest.json'])==frozen['sourceManifestSha256'],'immutable PhaseA manifest lineage')
check(digest(retained[parent_root+'manifest.json'])==validated['positiveRun']['manifestSha256'],'immutable parent validation manifest lineage')
summary=json.loads(retained[phase_root+'measurements/summary.json'])
accepted=[r for r in summary if r['ok']];refused=[r for r in summary if not r['ok']]
check(len(accepted)==12 and len(refused)==1 and refused[0]['seed']==398 and refused[0]['attempts']==50 and refused[0]['refusals']==50,'complete13seed corpus')
check(all(r['accepted'] and r['hit40']==46 and r['connectedCells']==46 and r['sharedDisagreements']==0 and not any(r['checks'].values()) for r in accepted),'552 validated cells/hits/network')
check(json.loads(exact(BASE+'acceptance/frozen-oracles.json'))==json.loads(retained[phase_root+'proposal/frozen-oracles.json']),'current oracle/archived validated ledger')
check(len(json.loads(retained[phase_root+'approved-oracle-comparison.json']))==5 and all(r['exact'] for r in json.loads(retained[phase_root+'approved-oracle-comparison.json'])),'five approved exact oracles')
for folder,cases,views in [('overlays',35328,48),('overlays-three-digit',1472,4)]:
    rows=json.loads(retained[phase_root+folder+'/summary.json'])
    check(len(rows)==views and sum(r['cases'] for r in rows)==cases and all(not r['failures'] and not r['visibilityFailures'] and not r['errors'] for r in rows),'actual overlay evidence '+folder)
controls=json.loads(retained[phase_root+'proposal/controls-final/summary.json'])
check(len(controls['records'])==5 and all(r['exit']==1 and r['assertionFailure'] for r in controls['records']) and controls['restored'] and controls['sourceBefore']==controls['sourceAfter'] and controls['modeBefore']==controls['modeAfter'],'five controls/exact restoration')
smoke=json.loads(retained[phase_root+'proposal/browser-worker-smoke.json'])
check(all(smoke[k] for k in ['responsiveBeforeCompletion','sameResult','cacheSame','deepFrozen','inputExact','oracleExact']) and not smoke['pageErrors'],'real browser worker smoke')
check('22 passed (22)' in retained[phase_root+'proposal/tests-final-02.log'].decode(),'original22test positive')
restoration=json.loads(retained[parent_root+'restoration.json'])
check(restoration['restored'] and not restoration['changedPreexistingFiles'] and restoration['providersRemoved'] and restoration['frozenAcceptanceExact'],'parent exact transaction restoration')
for file,key in [('baseline','baseline'),('npm-test','npmTest'),('build','build')]:
    result=json.loads(retained[parent_root+file+'-result.json'])
    check(result==validated['positiveRun'][key],'archived original command '+file)
check('806 passed (806)' in retained[parent_root+'npm-test.log'].decode() and '59 passed (59)' in retained[parent_root+'npm-test.log'].decode() and 'pass 8' in retained[parent_root+'npm-test.log'].decode(),'actual full-suite counts')
check('Cannot find module' in retained[parent_root+'baseline.log'].decode(),'honest import-level baseline')
print(json.dumps({'sourceCandidateEqualities':3,'frozenInputs':99,'validatedInputs':226,'committedArchiveParts':parts_count,'archiveMembers':member_count,'acceptedMaps':12,'connectedCountries':552,'full40Hits':552,'explicitRefusal':398,'primaryOverlayCases':35328,'supplementOverlayCases':1472,'originalProposalTests':22,'negativeControls':5,'actualVitestTests':806,'actualVitestFiles':59,'harnessTests':8,'buildExit':0,'freshHeavyRuns':0,'looseEvidenceRequired':False,'mismatches':0},sort_keys=True))
