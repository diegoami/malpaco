from pathlib import Path
import hashlib,json,os,stat,subprocess,time,traceback
root=Path.cwd();base=Path(__file__).resolve().parent
package=Path('/home/diego/projects/malpaco/.cache/runtime/tmp/malpaco-t75-label-gap-bmsp3ozd')
def inventory(paths):
 out={}
 for p in sorted(set(paths)):
  if p.is_symlink():out[str(p)]={'symlink':os.readlink(p),'mode':stat.S_IMODE(p.lstat().st_mode)}
  elif p.is_file():out[str(p)]={'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'mode':stat.S_IMODE(p.stat().st_mode)}
  elif p.is_dir():out[str(p)]={'directory':True,'mode':stat.S_IMODE(p.stat().st_mode)}
 return out
def write(n,x):(base/n).write_text(json.dumps(x,indent=2)+'\n')
# Read-only inventory includes tracked inputs, all prior docs/evidence and every preexisting output/package member.
paths=[root/p for p in subprocess.check_output(['git','ls-files','-z']).decode().split('\0') if p]
paths+=list((root/'docs').rglob('*'))+list(package.rglob('*'))
for rel in ['screenshots','dist','release','test-results','test-results-release','playwright-report','playwright-report-release']:
 p=root/rel
 if p.exists():paths+=[p]+list(p.rglob('*'))
paths=[p for p in paths if not p.is_relative_to(base) and p!=root/'RUN-NOTES.md'];before=inventory(paths);write('before.json',before)
name='malpaco-t75-seed-readiness-20261019-02';image='sha256:eff16c30e6f3f4af0a03fa4b706120d5e9b0891c344a27d64559aff5900a4a27'
args=['docker','run','--rm','--pull=never','--name',name,'--network','none','--shm-size=1g','--user',str(os.getuid())+':'+str(os.getgid()),'--mount','type=bind,src='+str(root)+',dst=/work,readonly','--mount','type=bind,src='+str(base)+',dst=/work/'+str(base.relative_to(root)),'--mount','type=bind,src='+str(package)+',dst=/artifact,readonly','--workdir','/work',image,'node','/work/'+str(base.relative_to(root))+'/container-run.mjs']
write('command.json',{'argv':args,'oneInvocation':True});start=time.monotonic();code=1
try:
 with (base/'raw.log').open('w') as f:code=subprocess.run(args,stdin=subprocess.DEVNULL,stdout=f,stderr=subprocess.STDOUT).returncode
finally:
 alive=subprocess.run(['docker','inspect',name],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL).returncode==0
 if alive:subprocess.run(['docker','rm','-f',name],check=True,stdout=subprocess.DEVNULL)
 after=inventory(paths);write('after.json',after);changed=[p for p in before if before[p]!=after.get(p)];write('result.json',{'exit':code,'seconds':time.monotonic()-start,'protectedEntries':len(before),'changed':changed,'containerAbsent':subprocess.run(['docker','inspect',name],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL).returncode!=0,'cleanupRequired':alive});assert not changed
raise SystemExit(code)
