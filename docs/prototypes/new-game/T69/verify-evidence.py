"""Verify retained archives without extracting them or rerunning historical model trials."""
from pathlib import Path
import hashlib, json, tarfile
E = Path(__file__).resolve().parent
verified = 0
current_positive = False
for manifest in sorted(E.glob('*-manifest.json')):
    name = manifest.name.removesuffix('-manifest.json')
    archive = E / (name + '.tar.gz')
    with tarfile.open(archive) as tar:
        for path, expected in json.loads(manifest.read_text()).items():
            if hashlib.sha256(tar.extractfile(name + '/' + path).read()).hexdigest() != expected:
                raise SystemExit(f'Altered archive member: {archive} {path}')
        members = {m.name for m in tar.getmembers()}
        if name + '/inputs.json' in members and name + '/stability.json' in members:
            inputs = json.load(tar.extractfile(name + '/inputs.json'))
            reports = json.load(tar.extractfile(name + '/report.json'))
            stable = json.load(tar.extractfile(name + '/stability.json'))['source_stable']
            runtime = [p for p in inputs if p.startswith('tools/harness/') or p in ['package.json', 'harness.json']]
            if stable and all(r['exit'] == 0 for r in reports) and all(hashlib.sha256(Path(p).read_bytes()).hexdigest() == inputs[p] for p in runtime):
                current_positive = True
    verified += 1
for folder in sorted(E.glob('live-attempt-*')):
    with tarfile.open(folder / 'raw.tar.gz') as tar:
        for path, expected in json.loads((folder / 'raw-manifest.json').read_text()).items():
            if hashlib.sha256(tar.extractfile(path).read()).hexdigest() != expected:
                raise SystemExit(f'Altered live evidence: {folder} {path}')
    verified += 1
if not current_positive:
    raise SystemExit('No green source-stable validation matches the current harness runtime and tests')
print(f'{verified} retained archives verified; current harness runtime/tests match green source-stable checks')
