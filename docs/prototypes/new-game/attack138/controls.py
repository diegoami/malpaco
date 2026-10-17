"""Six disposable source controls; restore exact saved bytes in finally."""
from pathlib import Path
import hashlib, json, subprocess, tempfile, sys
root=Path(__file__).resolve().parent
repo=root.parents[3]
out=Path(tempfile.mkdtemp(prefix='controls-',dir=root/'evidence'))
sha=lambda b: hashlib.sha256(b).hexdigest()
cases=[('direct-activation', 'src/ui/referenceBattleGame.ts', 'if (!inspect) this.controller.singleExchange();', 'if (!inspect) { /* missing direct exchange */ }', 'mouse enemy activation'), ('repeat-context', 'src/ui/referenceBattleGame.ts', 'if (!inspect) this.controller.singleExchange();', 'if (!inspect) { this.controller.singleExchange(); this.controller.select(null, null); }', 'mouse enemy activation'), ('shift-selection', 'src/ui/referenceBattleGame.ts', 'if (!inspect) this.controller.singleExchange();', 'this.controller.singleExchange();', 'keyboard attacks agree|Shift-click retains'), ('held-key-repeat', 'src/ui/referenceBattleGame.ts', 'if (!activation?.repeat) this.clickProvince(id, activation?.inspect ?? false);', 'this.clickProvince(id, activation?.inspect ?? false);', 'keyboard attacks agree'), ('refusal-feedback', 'src/ui/referenceBattleGame.ts', 'this.battle.el.querySelector("#battle-status")!.textContent = whyNot(state, from, id);', 'this.battle.el.querySelector("#battle-status")!.textContent = "";', 'friendly, distant'), ('capture-auto-confirm', 'src/ui/referenceBattleGame.ts', '    if (this.computerActive() || running || paused || state.pendingCapture', '    if (state.pendingCapture) { this.controller.confirmCapture(state.pendingCapture.defaultAmount); return; }\n    if (this.computerActive() || running || paused || state.pendingCapture', 'direct capture minimum')]
if len(sys.argv)>1: cases=[case for case in cases if case[0]==sys.argv[1]]
records=[]
for name,relative,old,new,pattern in cases:
    path=repo/relative
    original=path.read_bytes()
    assert original.decode().count(old)==1
    mutated=original.decode().replace(old,new).encode()
    (out/(name+'-original.txt')).write_bytes(original)
    (out/(name+'-mutated.txt')).write_bytes(mutated)
    try:
        path.write_bytes(mutated)
        result=subprocess.run(['python3',str(root/'run.py'),'--grep',pattern],cwd=repo,capture_output=True)
        (out/(name+'-output.txt')).write_bytes(result.stdout+result.stderr)
        records.append({'name':name,'path':relative,'exit':result.returncode,'originalSha256':sha(original),'mutatedSha256':sha(mutated),'output':name+'-output.txt'})
    finally:
        path.write_bytes(original)
        assert path.read_bytes()==original
        if records: records[-1]['restoredExactly']=True
    (out/'report.json').write_text(json.dumps(records,indent=2)+'\n')
print(out.relative_to(repo));print(json.dumps(records,indent=2))
assert len(records)==len(cases)>0 and all(r['exit']==1 and r['restoredExactly'] for r in records)
