from pathlib import Path
import subprocess,time,json
root=Path('docs/prototypes/new-game/T36');out=root/'evidence/rework-native1'
subprocess.run(['python3',str(out/'controls.py')],check=True)
for name,cmd in [('rework1-units',['npm','test']),('rework1-build',['npm','run','build'])]:
 print(json.dumps({'phase':name}),flush=True)
 child=subprocess.Popen(['python3',str(root/'run-command.py'),name,*cmd])
 while child.poll() is None:
  paths=list((root/'evidence').glob(name+'-*/stdout.txt'))
  if paths:
   link=out/'current-actual-output.txt'
   if link.is_symlink():link.unlink()
   link.symlink_to(paths[0].resolve());break
  time.sleep(.1)
 assert child.wait()==0,name
print('all controls, units and clean build completed',flush=True)
