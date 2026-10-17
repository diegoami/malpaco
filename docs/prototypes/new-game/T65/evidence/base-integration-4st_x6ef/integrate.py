from pathlib import Path
import subprocess,json,hashlib,tempfile
r=Path('/home/diego/projects/malpaco/.cache/t65-work');root=r/'docs/prototypes/new-game/T65';o=Path(tempfile.mkdtemp(prefix='base-integration-',dir=root/'evidence'))
protected=['src/ui/referenceMapView.ts','tests/e2e/coast-postprocess.spec.ts','tests/e2e/reference-game.spec.ts','tests/e2e/reference-game.spec.ts-snapshots/reference-game-1280x800-linux.png','tests/e2e/reference-game.spec.ts-snapshots/reference-game-1920x1080-linux.png']
saved={n:(r/n).read_bytes()for n in protected+['RUN-NOTES.md']}
for n,b in saved.items():p=o/n;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(b)
head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=r,text=True).strip();incoming=subprocess.check_output(['git','rev-parse','origin/main'],cwd=r,text=True).strip();assert incoming=='439856baa36781d21a3afe2f2bb8023645c5894a'
result=subprocess.run(['git','merge','--quiet','--no-commit','--no-ff','origin/main'],cwd=r,capture_output=True);(o/'merge-output.txt').write_bytes(result.stdout+result.stderr)
unmerged=subprocess.check_output(['git','diff','--name-only','--diff-filter=U'],cwd=r,text=True).splitlines();allowed=set(saved)|{'docs/prototypes/new-game/T64/artifacts.json'};assert set(unmerged)<=allowed,unmerged
for n in unmerged:
 if n=='RUN-NOTES.md':
  main=subprocess.check_output(['git','show','origin/main:RUN-NOTES.md'],cwd=r);ours=saved[n];tail=ours[ours.index(b'# T65 shared-border presentation pass'):];(r/n).write_bytes(main+b'\n\n'+tail)
 elif n in saved:(r/n).write_bytes(saved[n])
 else:(r/n).write_bytes(subprocess.check_output(['git','show','origin/main:'+n],cwd=r))
for n in protected:assert (r/n).read_bytes()==saved[n],n
subprocess.run(['git','add','--',*unmerged],cwd=r,check=True)
p=root/'inheritance.py';p.write_text(p.read_text().replace('base="26daa2b"','base="439856b"'))
report={'oldHead':head,'incoming':incoming,'conflictsResolved':unmerged,'protectedUnchanged':{n:hashlib.sha256(b).hexdigest()for n,b in saved.items()if n in protected},'mainNotesPreservedAsExactPrefix':(r/'RUN-NOTES.md').read_bytes().startswith(subprocess.check_output(['git','show','origin/main:RUN-NOTES.md'],cwd=r))};(o/'report.json').write_text(json.dumps(report,indent=2)+'\n');print(o,unmerged)
