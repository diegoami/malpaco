from pathlib import Path
import subprocess,tempfile,json,hashlib
root=Path(__file__).resolve().parent;repo=root.parents[3]
paths=["src/ui/mapView.ts","src/ui/referenceMapView.ts","src/ui/referenceBattleGame.ts","src/ui/battleView.ts"]
saved={name:(repo/name).read_bytes() for name in paths}
out=Path(tempfile.mkdtemp(prefix="keyboard-baseline-",dir=root/"evidence"))
for name,b in saved.items():(out/(Path(name).name+".saved.txt")).write_bytes(b)
try:
 for name in paths:(repo/name).write_bytes(subprocess.check_output(["git","show","b4e61d1:"+name],cwd=repo))
 result=subprocess.run(["python3",str(root/"run.py"),"--grep","keyboard attacks agree"],cwd=repo,capture_output=True)
 (out/"output.txt").write_bytes(result.stdout+result.stderr)
finally:
 for name,b in saved.items():(repo/name).write_bytes(b);assert (repo/name).read_bytes()==b
(out/"report.json").write_text(json.dumps({"baseline":"b4e61d1","exit":result.returncode,"restoredExactly":True,"restoredHashes":{name:hashlib.sha256(b).hexdigest() for name,b in saved.items()}},indent=2)+"\n")
print(out.relative_to(repo));print(result.stdout.decode()[-5000:])
assert result.returncode==1
