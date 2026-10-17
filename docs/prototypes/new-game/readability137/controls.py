"""Four disposable source controls; restore exact saved bytes in finally."""
from pathlib import Path
import hashlib, json, subprocess, tempfile
root=Path(__file__).resolve().parent
repo=root.parents[3]
out=Path(tempfile.mkdtemp(prefix='controls-',dir=root/'evidence'))
sha=lambda b: hashlib.sha256(b).hexdigest()
cases=[('ownership-shapes', 'src/ui/referenceMapView.ts', 'badge.setAttribute("d",seatLook(seat).badge);', 'badge.setAttribute("d",seatLook(0).badge);'), ('quiet-names', 'src/styles.css', '#reference-map .name { font-size:9px; font-weight:400; stroke:none; }', '#reference-map .name { font-size:12px; font-weight:600; stroke:none; }'), ('interactive-names', 'src/styles.css', '  font-size:12px; font-weight:600; stroke:#f8f2e2; stroke-width:1.5;', '  font-size:9px; font-weight:400; stroke:none;'), ('accessible-ownership', 'src/ui/referenceMapView.ts', 'n.setAttribute("aria-label",description);', 'n.setAttribute("aria-label",id);')]
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
assert len(records)==4 and all(r['exit']==1 and r['restoredExactly'] for r in records)
