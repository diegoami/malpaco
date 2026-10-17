"""Two disposable source controls; restore exact saved bytes in finally."""
from pathlib import Path
import hashlib, json, subprocess, tempfile
root=Path(__file__).resolve().parent
repo=root.parents[3]
out=Path(tempfile.mkdtemp(prefix='controls-',dir=root/'evidence'))
sha=lambda b: hashlib.sha256(b).hexdigest()
cases=[('map-click-attacks','src/ui/referenceBattleGame.ts','} else if (from !== null) {\n      this.controller.select(from, id);','} else if (from !== null) {\n      this.controller.select(from, id); this.controller.singleExchange();'),('capture-auto-confirms','src/ui/referenceBattleGame.ts','    this.renderMap();\n    this.panel.render','    if (state.pendingCapture && activePlayer(state)?.kind === "human") { this.controller.confirmCapture(state.pendingCapture.defaultAmount, revision); return; }\n    this.renderMap();\n    this.panel.render')]
records=[]
for name,relative,old,new in cases:
    path=repo/relative
    original=path.read_bytes()
    assert original.decode().count(old)==1
    mutated=original.decode().replace(old,new).encode()
    (out/(name+'-original.txt')).write_bytes(original)
    (out/(name+'-mutated.txt')).write_bytes(mutated)
    try:
        path.write_bytes(mutated)
        result=subprocess.run(['python3',str(root/'run.py')],cwd=repo,capture_output=True)
        (out/(name+'-output.txt')).write_bytes(result.stdout+result.stderr)
        records.append({'name':name,'path':relative,'exit':result.returncode,'originalSha256':sha(original),'mutatedSha256':sha(mutated),'output':name+'-output.txt'})
    finally:
        path.write_bytes(original)
        assert path.read_bytes()==original
        if records: records[-1]['restoredExactly']=True
    (out/'report.json').write_text(json.dumps(records,indent=2)+'\n')
print(out.relative_to(repo));print(json.dumps(records,indent=2))
assert len(records)==2 and all(r['exit']==1 and r['restoredExactly'] for r in records)
