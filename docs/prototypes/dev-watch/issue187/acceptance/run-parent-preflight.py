from pathlib import Path
import subprocess,json,hashlib,time,shutil,stat
r=Path.cwd();base=r/'docs/prototypes/dev-watch/issue187';acc=base/'acceptance';out=acc/'parent-preflight-v2';out.mkdir();original=(acc/'vite.config.original.ts').read_bytes();candidate=(base/'production-candidate/vite.config.ts').read_bytes();cfg=r/'vite.config.ts';mode=stat.S_IMODE(cfg.stat().st_mode);h=lambda b:hashlib.sha256(b).hexdigest()
paths=subprocess.check_output(['git','ls-files','src','tests','data','package.json','package-lock.json','README.md','tools/harness'],text=True).splitlines()+['tools/harness/test/dev-watch.test.mjs',str((acc/'probe.mjs').relative_to(r)),str((acc/'vitest-probe.mjs').relative_to(r))]
protected={n:{'sha256':h((r/n).read_bytes()),'mode':stat.S_IMODE((r/n).stat().st_mode)} for n in paths};(out/'protected-before.json').write_text(json.dumps(protected,indent=2)+'\n');results=[]
needle=b'fileURLToPath(new URL("./.cache", import.meta.url))';assert candidate.count(needle)==1
try:
 for name,data,expected in [('before',original,1),('proposed',candidate,0),('ancestor-glob',candidate.replace(needle,b'"**/.cache/**"'),1),('test-watch-removed',candidate.replace(needle,needle+b', fileURLToPath(new URL("./tests", import.meta.url))'),1)]:
  cfg.write_bytes(data);cfg.chmod(mode);old=set((r/'.cache').glob('dev-watch-check-*'));t=time.monotonic();args=['node','--test','tools/harness/test/dev-watch.test.mjs']
  with (out/(name+'.stdout')).open('wb') as a,(out/(name+'.stderr')).open('wb') as b:p=subprocess.run(args,cwd=r,stdout=a,stderr=b)
  row=dict(name=name,argv=args,exit=p.returncode,seconds=time.monotonic()-t,configSha256=h(data));results.append(row);(out/'results.json').write_text(json.dumps(results,indent=2)+'\n')
  for folder in set((r/'.cache').glob('dev-watch-check-*'))-old:shutil.copytree(folder,out/(name+'-evidence'))
  assert p.returncode==expected,row
finally:
 cfg.write_bytes(original);cfg.chmod(mode)
 mismatches=[n for n,v in protected.items() if h((r/n).read_bytes())!=v['sha256'] or stat.S_IMODE((r/n).stat().st_mode)!=v['mode']]
 (out/'restoration.json').write_text(json.dumps(dict(protectedFiles=len(protected),mismatches=mismatches,baselineConfigRestored=h(cfg.read_bytes())==h(original),proposedConfigSaved=h(candidate),head=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()),indent=2)+'\n');assert not mismatches
print(json.dumps(results))
