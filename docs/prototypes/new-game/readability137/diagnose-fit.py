from pathlib import Path
import subprocess,os
root=Path(__file__).resolve().parent;repo=root.parents[3]
p=repo/"tests/e2e/reference-game.spec.ts";original=p.read_bytes()
needle=" for(let i=0;i<text.length;i++)"
diagnostic=' console.log("OVERLAP",JSON.stringify(text.flatMap((a,i)=>text.slice(i+1).flatMap((b,j)=>a.right<=b.x||b.right<=a.x||a.bottom<=b.y||b.bottom<=a.y?[]:[{i,j:i+j+1,a,b}]))));\n'
try:
 assert original.decode().count(needle)==1
 p.write_text(original.decode().replace(needle,diagnostic+needle))
 result=subprocess.run(["python3",str(root/"run.py"),"--grep","reference setup"],cwd=repo,env={**os.environ,"READABILITY_COMPATIBILITY":"1"})
finally:p.write_bytes(original);assert p.read_bytes()==original
raise SystemExit(result.returncode)
