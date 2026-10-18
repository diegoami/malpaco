"""Bounded original-directory and fresh committed Git-export checks; no extraction of evidence archives."""
from pathlib import Path
import hashlib,io,json,os,subprocess,tarfile,time
ROOT=Path(__file__).resolve().parents[6]
OUT=Path(__file__).resolve().parent
BASE='docs/prototypes/new-game/T74/'
ENV={**os.environ,'GIT_OPTIONAL_LOCKS':'0'}
sha=lambda b:hashlib.sha256(b).hexdigest()
def git(*args):return subprocess.check_output(['git',*args],cwd=ROOT,env=ENV)
head=git('rev-parse','HEAD').decode().strip();git_dir=git('rev-parse','--absolute-git-dir').decode().strip()
proof=BASE+'production/verify-adoption.py'
def run(label,work,env):
 command=['python3',str(work/proof)];start=time.monotonic();p=subprocess.run(command,cwd=work,env=env,text=True,capture_output=True)
 record={'verifiedCommittedHead':head,'command':command,'cwd':str(work),'exit':p.returncode,'elapsedSeconds':time.monotonic()-start,'stdout':p.stdout,'stderr':p.stderr}
 (OUT/(label+'.stdout.log')).write_text(p.stdout);(OUT/(label+'.stderr.log')).write_text(p.stderr);(OUT/(label+'.json')).write_text(json.dumps(record,indent=2)+'\n');print(json.dumps(record),flush=True)
 if p.returncode:raise SystemExit(p.returncode)
 return record
original=run('original-committed-proof',ROOT,ENV)
frozen=json.loads(git('show','HEAD:'+BASE+'acceptance/FROZEN-ACCEPTANCE.json'));validated=json.loads(git('show','HEAD:'+BASE+'acceptance/validated-inputs.json'));adoption=json.loads(git('show','HEAD:'+BASE+'production/adoption.json'))
paths=set(frozen['inputs'])|set(validated['expectedAfterAdoption'])|set(adoption['manifestSha256'])|{proof,BASE+'production/adoption.json'}
for name in ['phase-a','parent-validation']:
 receipt=json.loads(git('show','HEAD:'+BASE+'archives/'+name+'-receipt.json'));paths.update(p['path'] for p in receipt['parts'])
export=Path('/home/diego/projects/malpaco/.cache/t74-proof-portable-20261018-01');export.mkdir(exist_ok=False)
payload=git('archive','--format=tar','HEAD','--',*sorted(paths))
with tarfile.open(fileobj=io.BytesIO(payload),mode='r:') as archive:archive.extractall(export,filter='data')
rows={p:{'sha256':sha((export/p).read_bytes()),'mode':oct((export/p).stat().st_mode&0o777),'committedSha256':sha(git('show','HEAD:'+p))} for p in sorted(paths)}
assert all(v['sha256']==v['committedSha256'] for v in rows.values())
(OUT/'fresh-export-manifest.json').write_text(json.dumps({'head':head,'directory':str(export),'gitArchiveSha256':sha(payload),'paths':rows},indent=2)+'\n')
fresh_env={**ENV,'GIT_DIR':git_dir,'GIT_WORK_TREE':str(export)}
fresh=run('fresh-export-committed-proof',export,fresh_env)
assert original['stdout']==fresh['stdout'],'Portable proofs differ'
before=json.loads((OUT/'immutable-inputs-before.json').read_text());after={p:{'sha256':sha((ROOT/p).read_bytes()),'mode':oct((ROOT/p).stat().st_mode&0o777)} for p in before['files']}
assert before['files']==after,'Original frozen/validated/archive bytes or POSIX modes changed'
(OUT/'preservation-after.json').write_text(json.dumps({'inputFiles':len(after),'unchangedBytesAndPosixModes':True,'files':after},indent=2)+'\n')
