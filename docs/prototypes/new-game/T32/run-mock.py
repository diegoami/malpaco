from pathlib import Path
import tempfile,subprocess,sys,json,tarfile,io,hashlib
root=Path(__file__).resolve().parent;repo=root.parents[3]
paths=['src/core/computer.ts','src/ui/battleController.ts','src/ui/referenceBattleGame.ts','src/ui/referenceGame.ts','src/ui/computerTurnLoop.ts']
before={p:(repo/p).read_bytes() if (repo/p).exists() else None for p in paths}
(root/'preflight').mkdir(exist_ok=True);out=Path(tempfile.mkdtemp(prefix='mock-',dir=root/'preflight'))
code=1
try:
 subprocess.run([sys.executable,str(root/'mock-runtime.py')],cwd=repo,check=True)
 with tarfile.open(out/'mock-sources.tar.gz','w:gz') as a:
  for p in paths:
   b=(repo/p).read_bytes();t=tarfile.TarInfo(p);t.size=len(b);a.addfile(t,io.BytesIO(b))
 code=subprocess.run(sys.argv[1:],cwd=repo).returncode
finally:
 for p,b in before.items():
  if b is None:(repo/p).unlink(missing_ok=True)
  else:(repo/p).write_bytes(b)
 restored={p:((repo/p).read_bytes()==b if b is not None else not (repo/p).exists()) for p,b in before.items()}
 (out/'restoration.json').write_text(json.dumps({'command':sys.argv[1:],'exit':code,'originalHashes':{p:hashlib.sha256(b).hexdigest() if b is not None else None for p,b in before.items()},'exactRestoration':restored},indent=2)+'\n')
 assert all(restored.values());print('Restored exactly:',out)
sys.exit(code)
