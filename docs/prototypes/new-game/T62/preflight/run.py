from pathlib import Path
import subprocess,json,hashlib,tarfile
root=Path('docs/prototypes/new-game/T62')
commands=[['node',str(root/'probe.mjs')]]+[['node','--test','--test-name-pattern='+g,str(root/'contract.test.mjs')] for g in ['attachment','water','traceability','preserved']]
records=[]
assert not (root/'contract.mjs').exists() and not (root/'probe.mjs').exists()
try:
 for phase in ['baseline','mock','bypass']:
  if phase=='mock':
   (root/'contract.mjs').write_text("import fs from 'node:fs';const original=JSON.parse(fs.readFileSync(new URL('../T60/evidence/build-LrdPTV/coast-first.json',import.meta.url)));export const checkConstraint=(group,board)=>JSON.stringify(board)===JSON.stringify(original)?[]:['mock refusal'];\n")
   (root/'probe.mjs').write_text("console.log('PARENT MOCK ONLY: output-path/command feasibility, no measured proposal or approval');\n")
  if phase=='bypass':(root/'contract.mjs').write_text("export const checkConstraint=()=>[];\n")
  for i,cmd in enumerate(commands):
   r=subprocess.run(cmd,capture_output=True,text=True);path=root/'preflight'/f'{phase}-dw{i+1}.txt';path.write_text(r.stdout+r.stderr);records.append({'phase':phase,'command':cmd,'exit':r.returncode})
   assert (r.returncode==0)==(phase=='mock' or (phase=='bypass' and i==0))
finally:
 for n in ['contract.mjs','probe.mjs']:
  if (root/n).exists():(root/n).unlink()
(root/'preflight'/'records.json').write_text(json.dumps({'runs':records,'mockFilesRemoved':not(root/'contract.mjs').exists() and not(root/'probe.mjs').exists()},indent=2)+'\n')
# Preserve exact terminal output; the archive avoids changing its whitespace.
with tarfile.open(root/'preflight'/'raw-logs.tar.gz','w:gz') as a:
 for p in sorted((root/'preflight').glob('*.txt')):a.add(p,arcname=p.name)
(root/'preflight'/'.gitignore').write_text('/*.txt\n')
paths=[p for p in root.rglob('*') if p.is_file() and p.suffix!='.txt' and p.name!='hashes.json']
(root/'preflight'/'hashes.json').write_text(json.dumps({str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(paths)},indent=2)+'\n')
print('5 commands: baseline red, mock green; four bypass groups reject the empty guard. Mock source removed.')
