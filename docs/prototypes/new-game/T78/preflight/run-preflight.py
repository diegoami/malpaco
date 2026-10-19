from pathlib import Path
import json,subprocess
root=Path.cwd();out=root/'docs/prototypes/new-game/T78/preflight';source=root/'src/ui/workspaceState.ts'
assert not source.exists(), 'Never overwrite a preexisting implementation'
mock=(out/'mock-boundary.txt').read_text();results=[]
def run(label):
 p=subprocess.run(['npx','vitest','run','tests/ui/workspace-state.test.ts'],stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True)
 (out/f'{label}.txt').write_text(p.stdout);results.append({'label':label,'exit':p.returncode});print(label,p.returncode,flush=True);return p.returncode
try:
 assert run('red-02')!=0
 source.write_text(mock);assert run('mock-01')==0
 source.write_text(mock.replace('const confirmed=context.matchGeneration','const confirmed=true || context.matchGeneration'));assert run('negative-confirmation-01')!=0
 source.write_text(mock.replace('const v=battle.view;','const v=battle.view; battle.state.armies[battle.state.map.provinces[0].id]++;'));assert run('negative-core-mutation-01')!=0
 source.write_text(mock.replace('hand:[...c.hand]','hand:c.hand').replace('indices:[...set.indices]','indices:set.indices'));assert run('negative-aliasing-01')!=0
 source.write_text(mock);assert run('mock-restored-01')==0
finally:
 if source.exists():source.unlink()
 (out/'results-01.json').write_text(json.dumps(results,indent=2)+'\n')
