#!/usr/bin/env python3
"""Exact T75 adoption proof. Reads committed evidence in memory; no loose phases required."""
from pathlib import Path, PurePosixPath
import difflib, hashlib, io, json, os, stat, subprocess, tarfile

ROOT=Path(__file__).resolve().parents[5]
BASE='docs/prototypes/new-game/T75/'
ENV={**os.environ,'GIT_OPTIONAL_LOCKS':'0'}
def check(ok,message):
    if not ok:raise SystemExit('MISMATCH: '+message)
def digest(data):return hashlib.sha256(data).hexdigest()
def git(*args):
    result=subprocess.run(['git',*args],cwd=ROOT,env=ENV,capture_output=True)
    check(result.returncode==0,'Git read '+repr(args));return result.stdout
modes={}
for row in git('ls-tree','-rz','HEAD').split(b'\0'):
    if row:
        info,path=row.split(b'\t',1);modes[path.decode()]=info.split()[0].decode()
cache={}
def committed(path,revision='HEAD'):
    key=(revision,path)
    if key not in cache:cache[key]=git('show',revision+':'+path)
    return cache[key]
def exact(path,expected=None):
    data=committed(path);file=ROOT/path
    check(path in modes and modes[path] in ('100644','100755'),'tracked regular blob '+path)
    check(file.is_file() and not file.is_symlink() and file.read_bytes()==data,'working/committed bytes '+path)
    # Git preserves executable semantics; original full POSIX modes are checked in tar receipts.
    check(bool(file.stat().st_mode&0o111)==(modes[path]=='100755'),'Git executable semantics '+path)
    if expected is not None:check(digest(data)==expected,'SHA-256 '+path)
    return data
self_path=BASE+'production/verify-adoption.py'
adoption=json.loads(exact(BASE+'production/adoption.json'))
exact(self_path,adoption['verifierSha256'])
for path,sha in adoption['manifestHashes'].items():exact(path,sha)
frozen=json.loads(committed(BASE+'acceptance/FROZEN-ACCEPTANCE.json'))
validated=json.loads(committed(BASE+'acceptance/validated-inputs.json'))
authority=json.loads(committed(BASE+'acceptance/HISTORICAL-GIT-AUTHORITY.json'))
check(len(validated)==207 and len(frozen['candidateHashes'])==15 and len(frozen['fixtureHashes'])==26,'fixed frozen counts')
check(authority['validatedManifestUnchanged'] is True and authority['currentRepositoryInputs']==204,'explicit metadata authority')
historical=authority['historicalGitMetadataInputs']
expected_history={'/home/diego/projects/malpaco/.git/refs/heads/task/T75-playable-border-release','/home/diego/projects/malpaco/.git/worktrees/t75-work/HEAD','/home/diego/projects/malpaco/.git/worktrees/t75-work/index'}
check(set(historical)==expected_history,'exactly three named historical paths')
check({p:h for p,h in validated.items() if PurePosixPath(p).is_absolute()}==historical,'all historical hashes exact')
current={p:h for p,h in validated.items() if p not in historical}
check(len(current)==204 and all(not PurePosixPath(p).is_absolute() and '..' not in PurePosixPath(p).parts for p in current),'204 safe current repository inputs')
# Explicit correction authority: original manifests stay historical and immutable.
correction_base=BASE+'corrections/20261019/'
correction=json.loads(exact(correction_base+'FROZEN.json','aab9d8472aefc646662af0f51f8e636b210470d45d8e4863b5095699c26b8f03'))
replacements=correction['replacements']
check(set(replacements)=={'src/ui/generatedGeographyPresentation.ts','vite.config.ts','README.md'},'exact three correction paths')
check(len(set(replacements)&set(current))==2 and len(set(replacements)&set(frozen['candidateHashes']))==2,'exact two current and two canonical corrections')
for path,row in replacements.items():
    original_sha=current[path] if path in current else frozen['candidateHashes'][path]
    check(row['before']==original_sha,'authenticated original replacement '+path)
    check(exact(path,row['after'])==exact(row['canonical'],row['after']),'exact frozen correction '+path)
for name,sha in correction['priorProofHashes'].items():exact(correction_base+'prior-proof/'+name,sha)
for path,sha in correction['watchGuardHashes'].items():exact(path,sha)
check(replacements['vite.config.ts']['after']=='4cae5bff592c0ddf81b0ab12ec4d0778ec153d90bb34a07d8d7cfbfb95a7d6c5','reviewed watch candidate')
for path,sha in current.items():exact(path,replacements[path]['after'] if path in replacements else sha)
for path,sha in frozen['candidateHashes'].items():
    candidate=exact(BASE+'production-candidate/'+path,sha)
    if path!='docs/spike-addition.md':
        if path in replacements:check(replacements[path]['before']==sha,'original canonical correction '+path)
        else:check(exact(path,sha)==candidate,'canonical equality '+path)
for path,sha in frozen['fixtureHashes'].items():exact(BASE+'preflight/phase-b-20261018-01/'+path,sha)
spike=exact('docs/spike.md');prefix=spike[:adoption['spikePrefixBytes']]
check(adoption['freezeCommit']=='dd704cef4c5325e98a3f245d213c891b226787d0','fixed parent prefix authority')
check(digest(prefix)==adoption['spikePrefixSha256'],'original prerequisite documentation prefix')
check(exact('docs/spike.md')==prefix+exact(BASE+'production-candidate/docs/spike-addition.md'),'append preserves exact T74 prefix')

# The entire parent-frozen archive is authenticated, retaining only needed small receipts in memory.
receipt=json.loads(committed(BASE+'archives/preflight-receipt.json'))
check(digest(committed(BASE+'acceptance/validated-inputs.json'))==frozen['validatedInputsSha256'],'frozen validated manifest')
check(digest(committed(BASE+'archives/preflight-receipt.json'))==frozen['archiveReceiptSha256'],'frozen archive receipt')
check(len(receipt['parts'])==8 and len(receipt['members'])==875 and receipt['archiveBytes']==127017730,'archive fixed inventory')
check(receipt['archiveSha256']=='8e283ff34c8fc864b8501ed6a9603008029ef3429c3a5f6e3455c1cd6c824c34','archive fixed identity')
phase=lambda letter:BASE+'preflight/phase-'+letter+'-20261018-01/'
needed={phase('b')+name for name in ['logs/unit03-positive-unit.txt','logs/unit03-negative-baseline.txt','logs/unit03-control-noawait.txt','unit03-results.json','controls01-results.json','canonical-failures.json','accept01-results.json','existing-board-byte-proof.json','originals/tests/e2e/geographic-board.spec.ts','finally-restore-manifest.json']}
needed|={phase('c')+name for name in ['command-result.json','individual-results.json','finally-restore-manifest.json']}
needed|={phase('d')+name for name in ['command-results.json','failure.json','finally-restore-manifest.json']}
needed|={phase('e')+name for name in ['before-manifest.json','all-integrated-input-hashes.json','finally-restore-manifest.json','final-integrity.json','command-results.json','corrected-test-reversal.json','artifact-evidence.json','archive-members.json','package-file-hashes.json','generated-outputs/release/malpaco-playable.tar.gz','logs/integrated-npm-test.txt','logs/static-package-acceptance.txt']}
needed|={phase('f')+name for name in ['command-results.json','individual-results.json','worker-http-evidence.json','finally-restore-manifest.json','final-integrity.json','executed-test-hashes.json','effective-input-hashes.json','authentication.json']}
check(set(authority['historicalReceiptHashes'])=={phase('e')+name for name in ['before-manifest.json','all-integrated-input-hashes.json','finally-restore-manifest.json','final-integrity.json']},'four exact historical receipt authorities')
payload=io.BytesIO();archive_hash=hashlib.sha256()
for part in receipt['parts']:
    data=exact(part['path'],part['sha256']);check(len(data)==part['size'],'archive part size');payload.write(data);archive_hash.update(data)
check(payload.tell()==receipt['archiveBytes'] and archive_hash.hexdigest()==receipt['archiveSha256'],'complete archive concatenation')
expected={row['path']:row for row in receipt['members']};check(len(expected)==875,'unique archive inventory')
retained={};seen=set();payload.seek(0)
with tarfile.open(fileobj=payload,mode='r:gz') as archive:
    for member in archive:
        check(member.isfile() and not PurePosixPath(member.name).is_absolute() and '..' not in PurePosixPath(member.name).parts,'safe regular archive member')
        check(member.name in expected and member.name not in seen,'exact unique archive member '+member.name);seen.add(member.name);row=expected[member.name]
        # tar stores permission bits. originalSourceStatMode also includes the regular-file type.
        check(stat.S_ISREG(row['originalSourceStatMode']) and stat.S_IMODE(row['originalSourceStatMode'])==row['mode']==member.mode,'exact original POSIX permissions '+member.name)
        check(member.size==row['size'],'archive member size '+member.name)
        stream=archive.extractfile(member);hasher=hashlib.sha256();chunks=[]
        while chunk:=stream.read(1024*1024):
            hasher.update(chunk)
            if member.name in needed:chunks.append(chunk)
        check(hasher.hexdigest()==row['sha256'],'archive member bytes '+member.name)
        if member.name in needed:retained[member.name]=b''.join(chunks)
check(seen==set(expected) and needed<=set(retained),'complete archive and required receipts')
def read(letter,name):return retained[phase(letter)+name]
def record(letter,name):return json.loads(read(letter,name))
for path,row in authority['historicalReceiptHashes'].items():check(digest(retained[path])==row['sha256'],'historical receipt hash '+path)
check(read('e','all-integrated-input-hashes.json')==committed(BASE+'acceptance/validated-inputs.json'),'all207 archived effective input bytes')
before=record('e','before-manifest.json')
for path,sha in historical.items():check(before[path]['sha256']==sha and record('e','all-integrated-input-hashes.json')[path]==sha,'strict historical metadata identity '+path)
restore=record('e','finally-restore-manifest.json');integrity=record('e','final-integrity.json')
check(restore['headIndexAndCommitRefIncluded'] and restore['originalsChecked']==205 and not restore['originalHashModeMismatches'] and restore['outputTreesExact'] and restore['phaseABCDCompleteExact'] and restore['providersPreexistingStillPresentExact'],'historical original transaction restoration')
check(integrity['completePhaseABCDFileSetsVerifiedAgain'] and integrity['extractedDurableEqualsOwnedTmp'] and integrity['server4175Closed'],'historical final-integrity authority')

# Audit the only parent-owned old assertion adaptation, including exact byte reversal.
original=exact(BASE+'acceptance/originals/tests/e2e/geographic-board.spec.ts')
check(original==read('b','originals/tests/e2e/geographic-board.spec.ts'),'preserved original board acceptance')
proposed=exact('tests/e2e/geographic-board.spec.ts');old=original.splitlines(keepends=True);new=proposed.splitlines(keepends=True)
opcodes=difflib.SequenceMatcher(None,old,new).get_opcodes();reversed_lines=list(new)
for tag,a,z,c,d in reversed(opcodes):
    if tag!='equal':
        check(84<=a+1<=z<=89,'only obsolete coordinate rows84–89 differ');reversed_lines[c:d]=old[a:z]
check(b''.join(reversed_lines)==original,'exact original assertion byte reversal')
audit=record('b','existing-board-byte-proof.json');check(audit['reverseExactBytes'] and audit['otherAssertionLinesUnchanged'] and audit['originalSha256']==digest(original) and audit['candidateSha256']==digest(proposed),'original parent reversal receipt')

# Reuse original observed behavior only under the strict source/test/artifact equalities above.
units={r['name']:r for r in record('b','unit03-results.json')}
check([units[k]['exit'] for k in ['positive-unit','build','negative-baseline','control-noawait','restored-unit']]==[0,0,1,1,0],'original positive/baseline/no-await controls')
check('15 passed (15)' in read('b','logs/unit03-positive-unit.txt').decode() and '12 failed (12)' in read('b','logs/unit03-negative-baseline.txt').decode() and '5 failed | 7 passed (12)' in read('b','logs/unit03-control-noawait.txt').decode(),'actual mounted positive and behavioral negative counts')
controls=record('b','controls01-results.json');check([r['name'] for r in controls]==['rawpaint','stalehits','endpoint','workerbypass'] and all(r['exit']==1 for r in controls),'four original browser controls')
failures=record('b','canonical-failures.json');check(len(failures)==5 and all(r['expected'] is False and r['actual'] is True for r in failures),'original four-worker failures preserved')
check(record('c','command-result.json')['exit']==0 and len(record('c','individual-results.json'))==46 and all(r['status']=='passed' and r['retry']==0 for r in record('c','individual-results.json')),'single two-worker46 positive')
check(record('d','command-results.json')[0]['exit']==1 and record('d','failure.json')['reportedDurationMs']==5170 and record('d','failure.json')['error']=='Test timed out in 5000ms.','original integrated817/818 failure')
check(record('e','corrected-test-reversal.json')['singleExplicitBudgetArgumentReversalEqualsOriginal'],'parent refusal-budget correction reversal')
e_commands=record('e','command-results.json');check([r['exit'] for r in e_commands]==[0,0] and [r['name'] for r in e_commands]==['integrated-npm-test','static-package-acceptance'],'corrected818/static package positive')
log=read('e','logs/integrated-npm-test.txt').decode();check('818 passed (818)' in log and '60 passed (60)' in log and 'pass 8' in log,'original818+8 actual log counts')
check('10 files; 9 SHA-256 entries; checked 4 HTTP paths' in read('e','logs/static-package-acceptance.txt').decode(),'original static acceptance counts')
f_commands=record('f','command-results.json');check(f_commands[-1]['exit']==0 and f_commands[-1]['casesExpected']==166 and f_commands[-1]['files']==13,'extracted166 command')
f_rows=record('f','individual-results.json');check(len(f_rows)==166 and all(r['status']=='passed' and r['retry']==0 for r in f_rows) and {r['project'] for r in f_rows}=={'1280x800','1920x1080'},'all166 original extracted statuses')
for path,sha in record('f','executed-test-hashes.json').items():exact(path,sha)
check(len(record('f','executed-test-hashes.json'))==13,'thirteen extracted spec identities')
f_effective=record('f','effective-input-hashes.json')
for path,sha in f_effective.items():
    if path.startswith(('src/core/','tests/')) or path in ('playwright.config.ts','playwright.release.config.ts','tsconfig.json','vite.config.ts'):check(current[path]==sha,'exact extracted Node oracle/test/config input '+path)
check(record('f','authentication.json')['existingReleaseConfigSha256']==current['playwright.release.config.ts'],'unchanged extracted release config')
check(not record('b','finally-restore-manifest.json')['byteOrModeMismatches'] and not record('c','finally-restore-manifest.json')['originalHashModeMismatches'],'original scratch restoration B/C')
for letter in ['d','e','f']:check(not record(letter,'finally-restore-manifest.json')['originalHashModeMismatches'] and record(letter,'finally-restore-manifest.json')['outputTreesExact'],'original complete source/output restoration '+letter)
artifact=record('e','artifact-evidence.json');inner_bytes=read('e','generated-outputs/release/malpaco-playable.tar.gz')
check(digest(inner_bytes)==artifact['archiveSha256']=='2fd6dad3abdc2896725288d0b82bd11d1177cd2fbae8f37cd07fe3fb6ecd1ef3','exact temporary-source package archive')
inner_expected={r['path']:r for r in record('e','archive-members.json')};inner_files={};inner_seen=set()
with tarfile.open(fileobj=io.BytesIO(inner_bytes),mode='r:gz') as package:
    for member in package:
        check(member.name in inner_expected and member.name not in inner_seen,'exact inner inventory');inner_seen.add(member.name);row=inner_expected[member.name]
        check(member.mode==row['mode'] and member.size==row['size'],'inner archive permission/size')
        if member.isfile():
            data=package.extractfile(member).read();check(digest(data)==row['sha256'],'inner package member digest');inner_files[member.name.removeprefix('malpaco-playable/')]=data
check(inner_seen==set(inner_expected) and {p:digest(data) for p,data in inner_files.items()}==record('e','package-file-hashes.json'),'ten exact inner package files')
check(json.loads(inner_files['BUILD.json'])==artifact['build'] and artifact['build']['sourceCommit']=='75c8e5eba9ca48ab24ce82c264cd51a4f0f082b7','honest prerequisite BUILD provenance')
manifest={line.split('  ',1)[1]:line.split('  ',1)[0] for line in inner_files['SHA256SUMS'].decode().splitlines()}
check(len(manifest)==9 and manifest=={p:digest(data) for p,data in inner_files.items() if p!='SHA256SUMS'},'nine package checksum entries')
http=record('f','worker-http-evidence.json');check(len(http)==1 and http[0]['status']==200 and http[0]['matchesExtractedWorker'],'actual bundled worker HTTP observation')
worker=http[0]['url'].split(':4175/',1)[1];check(digest(inner_files[worker])==http[0]['sha256']=='31ec2b83bc75618f758d3357e156faceff73c27446d2d4b82b453fb884deb7a2','exact served worker bytes')
check(not adoption['temporaryPackageOfficial'] and adoption['freshHeavyRuns']==0,'explicit evidence/release limitation')
attempt=json.loads(exact(BASE+'acceptance/freeze-attempt-01.json'));check('file-type bits' in attempt['result'] and attempt['archiveBytes']==receipt['archiveBytes'],'original parent receipt-mode failure retained')
print(json.dumps({'candidateEqualities':15,'currentValidatedInputs':204,'historicalMetadataInputs':3,'totalValidatedInputs':207,'fixtures':26,'committedArchiveParts':8,'archiveMembers':875,'exactOriginalTarPermissions':875,'originalMountedPositive':15,'browserNegativeControls':4,'fourWorkerOriginalFailures':5,'sourceTwoWorkerPassed':46,'integratedVitestPassed':818,'harnessPassed':8,'staticPackageFiles':10,'checksumEntries':9,'extractedBrowserPassed':166,'extractedSpecs':13,'workerHttpStatus':200,'freshHeavyRuns':0,'looseEvidenceRequired':False,'temporaryPackageOfficial':False,'mismatches':0},sort_keys=True))

# Parent-frozen failed-CI, diagnosis and exact candidate archive. No loose phases required.
correction_receipt=json.loads(exact(correction_base+'archive-receipt.json',correction['archiveReceiptSha256']))
check(len(correction_receipt['parts'])==9 and len(correction_receipt['members'])==834 and correction_receipt['archiveBytes']==135078149,'correction archive fixed inventory')
check(correction_receipt['archiveSha256']=='92ba40c574a26f329ab402021b1e5e51f67c7936c2368be5f6a89972eacaef48','correction archive fixed identity')
correction_needed={'performance/candidate.ts','performance/original.ts','performance/commands.json','performance/restoration.json','performance/comparison.json','performance/logs/unit.txt','performance/REPORT.md','diagnosis/trace-normal-unprofiled.json'}
for name in ['normal-unprofiled','mock-clock-polls','throttle2']:
    correction_needed|={'performance/result-'+name+'.json','performance/trace-'+name+'.json'}
payload=io.BytesIO();hasher=hashlib.sha256()
for part in correction_receipt['parts']:
    data=exact(part['path'],part['sha256']);check(len(data)==part['size'],'correction part size');payload.write(data);hasher.update(data)
check(payload.tell()==135078149 and hasher.hexdigest()==correction_receipt['archiveSha256'],'complete correction concatenation')
expected={row['path']:row for row in correction_receipt['members']};check(len(expected)==834,'unique correction inventory');seen=set();retained_correction={};payload.seek(0)
with tarfile.open(fileobj=payload,mode='r:gz') as archive:
    for member in archive:
        check(member.isfile() and not PurePosixPath(member.name).is_absolute() and '..' not in PurePosixPath(member.name).parts,'safe regular correction member')
        check(member.name in expected and member.name not in seen,'exact unique correction member');seen.add(member.name);row=expected[member.name]
        check(member.mode==row['mode'] and member.size==row['size'],'correction POSIX permissions/size')
        stream=archive.extractfile(member);h=hashlib.sha256();chunks=[]
        while chunk:=stream.read(1024*1024):
            h.update(chunk)
            if member.name in correction_needed:chunks.append(chunk)
        check(h.hexdigest()==row['sha256'],'correction member bytes '+member.name)
        if member.name in correction_needed:retained_correction[member.name]=b''.join(chunks)
check(seen==set(expected) and correction_needed<=set(retained_correction),'complete correction archive')
check(retained_correction['performance/candidate.ts']==exact('src/ui/generatedGeographyPresentation.ts'),'adopted exact archived candidate')
check(digest(retained_correction['performance/original.ts'])==replacements['src/ui/generatedGeographyPresentation.ts']['before'],'archived original provider')
def correction_record(path):return json.loads(retained_correction[path])
commands=correction_record('performance/commands.json')
check([r['name'] for r in commands]==['unit','typecheck-core','typecheck','build','browser'] and all(r['exit']==0 for r in commands),'bounded candidate command exits')
check(commands[0]['seconds']==77.1 and b'console output' in retained_correction['performance/REPORT.md'],'honest unit-log collision duration/report')
check(b'passed (' not in retained_correction['performance/logs/unit.txt'],'missing unit stdout remains missing')
restore=correction_record('performance/restoration.json')
check(not restore['changedProtectedInputs'] and restore['head']=='9653f42851a7c27e561d115e02155361e71d5fb6' and restore['server4311Closed'] and restore['error'] is None,'original candidate transaction restored')
original_trace=correction_record('diagnosis/trace-normal-unprofiled.json')
for name,clock,rate in [('normal-unprofiled',False,1),('mock-clock-polls',True,1),('throttle2',False,2)]:
    result=correction_record('performance/result-'+name+'.json');trace=correction_record('performance/trace-'+name+'.json')
    check(result['clock'] is clock and result['rate']==rate and not result['profile'] and not result.get('error'),'actual native/paused/throttled case '+name)
    check([r['kind'] for r in result['operations']]==['cold-file','warm-file','new-game-same-seed'],'all candidate actions '+name)
    check(all(len(r['readiness'])==2 and all(c['status']=='fulfilled' for c in r['readiness']) for r in result['operations'][:2]),'original5000ms cold/warm checks '+name)
    check(trace['input']==original_trace['input'] and trace['output']==original_trace['output'],'complete Worker input/output equality '+name)
    check(trace['keyCount']==1 and trace['allKeysEqual'] and [e['kind'] for e in trace['events'] if e['event']=='worker-post']==['derive'] and [e['kind'] for e in trace['events'] if e['event']=='worker-reply']==['success'],'real Worker success/cache identity '+name)
print(json.dumps({'explicitCorrectionPaths':3,'changedCurrentInputs':2,'changedCanonicalRuntimeEqualities':2,'correctionArchiveParts':9,'correctionArchiveMembers':834,'candidateOriginal5000msCases':3,'completeWorkerInputOutputEqualities':3,'candidateUnitExit':0,'candidateUnitSeconds':77.1,'candidateUnitConsoleRetained':False,'historicalFreshHeavyRuns':0,'currentValidationSeparate':True,'mismatches':0},sort_keys=True))
