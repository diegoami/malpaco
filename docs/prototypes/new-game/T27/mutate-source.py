"""Exercise actual-source capture-choice mutants and restore saved bytes in finally."""
from pathlib import Path
import subprocess,tempfile,hashlib,json,tarfile,io
root=Path(__file__).resolve().parent;repo=root.parents[3]
out=Path(tempfile.mkdtemp(prefix="source-mutations-",dir=root/"evidence"))
sha=lambda b:hashlib.sha256(b).hexdigest()
files=["src/core/rules.ts","src/core/combat.ts","src/core/state.ts","src/core/reference-game.ts"]
saved={p:(repo/p).read_bytes() for p in files}
suite=["npx","vitest","run","tests/core/capture-choice.test.ts","tests/core/capture-choice-replay.test.ts","tests/core/capture-choice-compatibility.test.ts"]
mutants=[
 ("quantity","src/core/rules.ts",[("if (!Number.isSafeInteger(amount) || amount < choice.min || amount > choice.max)","if (false)")]),
 ("conservation","src/core/rules.ts",[("state.armies[choice.from]! - additional","state.armies[choice.from]!")]),
 ("clone","src/core/state.ts",[("pendingCapture: { ...state.pendingCapture }","pendingCapture: state.pendingCapture")]),
 ("reference-opt-in","src/core/reference-game.ts",[("() => ({ ok: true, map }), rules)","() => ({ ok: true, map }), undefined)")]),
 ("premature-victory","src/core/rules.ts",[("state.rules.combat.capture !== \"choice\" && checkVictory(state)","checkVictory(state)")]),
 ("premature-all","src/core/combat.ts",[("if (rules.capture === \"all\") wanted = available;","if (rules.capture === \"all\" || rules.capture === \"choice\") wanted = available;")]),
 ("default-minimum","src/core/rules.ts",[("requested === undefined ? choice.defaultAmount : requested","requested === undefined ? choice.min : requested")]),
 ("pending-attack-gates","src/core/rules.ts",[("if ((state.pendingCapture || state.phase === \"capture\") && action.kind !== \"captureMove\")","if (false)"),("if (state.phase !== \"attack\") return { ok: false, error: \"attacks happen in the attack phase\" };","")]),
]
records=[]
try:
 baseline=subprocess.run(["python3",str(root/"run-command.py"),"mutations-green-baseline",*suite],cwd=repo)
 assert baseline.returncode==0,"mutations require green baseline"
 for name,path,replacements in mutants:
  text=saved[path].decode()
  for old,new in replacements:
   assert text.count(old)==1,(name,old)
   text=text.replace(old,new)
  data=text.encode()
  # Exact source bytes live in an archive, including deliberate raw whitespace.
  with tarfile.open(out/(name+".tar.gz"),"w:gz") as archive:
   entry=tarfile.TarInfo(path);entry.size=len(data);entry.mtime=0;archive.addfile(entry,io.BytesIO(data))
  try:
   (repo/path).write_bytes(data)
   run=subprocess.run(["python3",str(root/"run-command.py"),"source-mutant-"+name,*suite],cwd=repo)
   records.append({"name":name,"path":path,"mutantSha256":sha(data),"exit":run.returncode})
   assert run.returncode!=0,"surviving mutant: "+name
  finally:
   (repo/path).write_bytes(saved[path])
   assert (repo/path).read_bytes()==saved[path]
finally:
 for path,data in saved.items():(repo/path).write_bytes(data)
 restoration={p:{"savedSha256":sha(data),"restoredSha256":sha((repo/p).read_bytes()),"exact":data==(repo/p).read_bytes()} for p,data in saved.items()}
 with tarfile.open(out/"baseline-sources.tar.gz","w:gz") as archive:
  for path,data in saved.items():
   entry=tarfile.TarInfo(path);entry.size=len(data);entry.mtime=0;archive.addfile(entry,io.BytesIO(data))
 (out/"report.json").write_text(json.dumps({"mutants":records,"restoration":restoration},indent=2)+"\n")
print(out.relative_to(repo))
