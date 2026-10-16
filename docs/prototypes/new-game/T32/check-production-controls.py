"""Delete one production behaviour at a time; retain real failures and restore exact bytes."""
from pathlib import Path
import subprocess,tempfile,tarfile,io,hashlib,json,sys
root=Path(__file__).resolve().parent;repo=root.parents[3]
out=Path(tempfile.mkdtemp(prefix='deletion-controls-',dir=root/'evidence'))
unit=[sys.executable,str(root/'run-command.py')]
browser=[sys.executable,str(root/'run-browser.py')]
cases=[
 ('capture','src/core/computer.ts','  if (state.phase === "capture") return { kind: "captureMove" };\n','',unit+['delete-capture','npx','vitest','run','tests/core/computer-turn-flow.test.ts','-t','computer pending']),
 ('loss','src/core/computer.ts',' || state.phase === "human-loss"','',unit+['delete-loss','npx','vitest','run','tests/core/computer-turn-flow.test.ts','-t','computer pending']),
 ('movement','src/core/computer.ts','return moves[0] ?? { kind: "endTurn" };','return { kind: "endTurn" };',unit+['delete-movement','npx','vitest','run','tests/core/computer-turn-flow.test.ts','-t','useful adjacent']),
 ('budget-reset','src/core/computer.ts',' || action.kind === "friendlyMove"','',unit+['delete-budget-reset','npx','vitest','run','tests/core/computer-turn-flow.test.ts','-t','policy attack budget']),
 ('input-guard','src/ui/battleController.ts','(!humanInput || this.allowInput(this.state))','true',unit+['delete-input-guard','npx','vitest','run','tests/ui/computer-input.test.ts']),
 ('driver','src/ui/computerTurnLoop.ts','    if (this.disposed) return;','    return;',browser+['delete-driver','--grep','loaded computer capture']),
 ('timer-cancel','src/ui/referenceBattleGame.ts','    this.computer?.dispose();\n','',browser+['delete-timer-cancel','--grep','loaded computer capture']),
 ('defaults','src/ui/referenceGame.ts','if(!manual){seats="4";controllers=["human","computer","computer","computer"];}','if(!manual){seats="2";controllers=["human","human","human","human"];} ',browser+['delete-defaults','--grep','untouched setup']),
]
records=[]
for name,path,old,new,command in cases:
 p=repo/path;before=p.read_bytes();text=before.decode();assert text.count(old)==1,(name,text.count(old))
 mutant=text.replace(old,new).encode()
 with tarfile.open(out/(name+'-sources.tar.gz'),'w:gz') as a:
  for label,b in [('original',before),('mutated',mutant)]:
   entry=tarfile.TarInfo(label+'/'+path);entry.size=len(b);a.addfile(entry,io.BytesIO(b))
 code=None
 try:
  p.write_bytes(mutant);code=subprocess.run(command,cwd=repo).returncode
 finally:
  p.write_bytes(before)
  records.append({'case':name,'source':path,'beforeSha256':hashlib.sha256(before).hexdigest(),'mutantSha256':hashlib.sha256(mutant).hexdigest(),'command':command,'exit':code,'restoredExactly':p.read_bytes()==before})
  (out/'report.json').write_text(json.dumps({'cases':records},indent=2)+'\n')
 assert code not in [None,0],name+' did not fail'
 assert records[-1]['restoredExactly']
print('All deletion controls failed and sources restored:',out)
