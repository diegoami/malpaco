from pathlib import Path
import json, hashlib, io, gzip, tarfile, stat

r=Path('/home/diego/projects/malpaco'); o=r/'.cache/release-010/v3-container'
pub=json.loads((o/'publication.json').read_text()); preview=json.loads((o/'published-preview.json').read_text())
assert json.loads((o/'published-assets-verified.json').read_text())['verified']
head=pub['head']; run=pub['ciRun']; audit=o/('CI-'+run+'-'+head[:8])
key=r/'.cache/t75-work/docs/prototypes/new-game/T75'/('final-key-v2-ci-'+run)
k=json.loads((key/'receipt.json').read_text())
assert k['error'] is None and k['sourceUnchanged'] and k['outputsRestored'] and k['headUnchanged']
dest=r/'docs/prototypes/new-game/T75'/('release-0.1.0-'+pub['tagCommit'][:8]); dest.mkdir()
files={}
for f in key.rglob('*'):
    if f.is_file() and not f.is_symlink(): files['artifact-keys/'+str(f.relative_to(key))]=f
for n in ['receipt.json','ci-run.json','ci-api.json','pr.json','owned-extraction.json','actual-counts.json','artifact-inventory.json','screenshot-inventory.json','full-ci.log','malpaco-playable.tar.gz.sha256']:
    f=audit/n; assert f.is_file(); files['ci-audit/'+n]=f
for n in ['publication.json','published-preview.json','published-assets-verified.json','tracking-completed.json','final-seed-head.json','final-seed-review-receipt.json','root-update-preflight.json','root-ignored-overlap-preflight.json','audit-ci-artifact.py','final-playable-key.py','merge-publish.py','publish-preview.py','verify-published-assets.py','finish-release-tracking.py']:
    f=o/n; assert f.is_file(); files['parent/'+n]=f
payload=io.BytesIO(); members=[]; sha=lambda b:hashlib.sha256(b).hexdigest()
with gzip.GzipFile(fileobj=payload,mode='wb',mtime=0) as gz:
    with tarfile.open(fileobj=gz,mode='w') as tar:
        for name,f in sorted(files.items()):
            b=f.read_bytes(); info=tar.gettarinfo(str(f),arcname=name); tar.addfile(info,io.BytesIO(b))
            members.append(dict(path=name,sha256=sha(b),bytes=len(b),mode=stat.S_IMODE(f.stat().st_mode)))
b=payload.getvalue(); parts=[]
for i,s in enumerate(range(0,len(b),16*1024*1024)):
    f=dest/('release-evidence.tar.gz.part-%03d'%i); chunk=b[s:s+16*1024*1024]; f.write_bytes(chunk)
    parts.append(dict(path=f.name,sha256=sha(chunk),bytes=len(chunk)))
with tarfile.open(fileobj=io.BytesIO(b),mode='r:gz') as tar:
    got=tar.getmembers(); assert len(got)==len(members)
    for entry,want in zip(got,members):
        assert entry.isfile() and entry.name==want['path'] and entry.mode==want['mode'] and entry.size==want['bytes'] and sha(tar.extractfile(entry).read())==want['sha256']
receipt=dict(version='0.1.0',releaseUrl=pub['release']['url'],tagCommit=pub['tagCommit'],ciRun=run,head=head,sourceTree=pub['sourceTree'],artifactSha256=pub['archiveSha256'],archiveSha256=sha(b),archiveBytes=len(b),parts=parts,members=members,allOriginalsRetained=True)
(dest/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n')
text=(
    'Malpaco0.1.0 published: '+pub['release']['url']+'\n\n'
    'Exact reviewed head '+head+' passed first-attempt corrected CI '+run+'; 818Vitest/9harness,344sourcebrowser,standalone10file/9checksum/4HTTP acceptance and344extractedbrowser. Original failed CI39229251394 and all older failures remain historical. '
    'Audited CIarchive SHA256 '+pub['archiveSha256']+' and truthful BUILDsource/tree; fresh6extracted realWorker/physicalbattlelayout keys passed at both sizes, source/output restoration verified. '
    'Squash/tagcommit '+pub['tagCommit']+' has exactly the tested source tree. Published upload SHA verified. Owner appearance acceptance and independent Kimi review/disposition remain linked in PR188. No duplicate main-push CI; squash subject skips CI.\n\n'
    'Preview '+preview['url']+' serves all10files with exact bytes; Windows copy '+preview['windowsPath']+' memberverified and previousgallery backedup. Seven inherited dirtyentries retain exactbytes/fullmodes, all worktrees/evidence retained, unrelatedjobs untouched. '
    'Release182/T75/184 and foldedwatch187 completed, companion190 closed without separateCI/merge. Model-neutral181 remains after0.1.x;143migration is queuednext, notstarted. Prior review/staticCLI/ignored-output/log preservation limitations remain expressly recorded.\n\n'
    'This archive retains full CIlog/audit/provenance/helpers, fresh artifact-key outputs/source/outputbefore-after identities/rawlogs/HTML/JSON/screenshots and publication/previewreceipts; every member byte/type/POSIXpermission verified, originals remain local. Published gamearchive is the exact CIasset, not rebuilt here; its hash/download URL are retained.\n'
)
(dest/'REPORT.md').write_text(text)
with (r/'RUN-NOTES.md').open('a') as f: f.write('\n0.1.0 publication END (2026-10-19): '+text.replace('\n',' ')+'\n')
(o/'durable-publication-record.json').write_text(json.dumps(dict(path=str(dest),receipt=str(dest/'receipt.json'),archiveSha256=sha(b),archiveBytes=len(b)),indent=2)+'\n')
print(json.dumps(dict(path=str(dest),archiveBytes=len(b),members=len(members),parts=len(parts))))
