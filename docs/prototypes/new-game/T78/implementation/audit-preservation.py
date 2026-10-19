"""Check the frozen test prefix, preflight bytes, notes prefix and owned diff."""
import hashlib
import json
from pathlib import Path
import subprocess

base = '19f2565c'
root = Path(__file__).resolve().parent
receipt = root / 'preservation-01.json'
if receipt.exists():
    raise SystemExit('Refusing to overwrite preservation receipt')
def git(*args):
    return subprocess.check_output(['git', *args])
def baseline(path):
    return git('show', base + ':' + path)
frozen = json.loads(Path('docs/prototypes/new-game/T78/preflight/frozen-tests-01.json').read_text())
tests = Path(frozen['path']).read_bytes()
original = baseline(frozen['path'])
assert hashlib.sha256(original).hexdigest() == frozen['sha256']
assert tests.startswith(original)
assert Path('RUN-NOTES.md').read_bytes().startswith(baseline('RUN-NOTES.md'))
paths = git('ls-tree', '-r', '--name-only', base, 'docs/prototypes/new-game/T78/preflight', 'docs/prototypes/new-game/T78/BOUNDARY.md', 'docs/tasks/T78.md').decode().splitlines()
protected = []
for path in paths:
    expected = baseline(path)
    assert Path(path).read_bytes() == expected, path
    protected.append({'path': path, 'sha256': hashlib.sha256(expected).hexdigest()})
changed = git('diff', '--name-only', base).decode().splitlines()
for path in changed:
    assert path in ['RUN-NOTES.md', 'src/ui/workspaceState.ts', frozen['path']] or path.startswith('docs/prototypes/new-game/T78/implementation/'), path
assert [path for path in changed if path.startswith('src/')] == ['src/ui/workspaceState.ts']
outputs = []
for path in sorted(root.glob('*.json')):
    data = json.loads(path.read_text())
    if 'output' not in data:
        continue
    assert hashlib.sha256((root / data['output']).read_bytes()).hexdigest() == data['output_sha256'], path
    outputs.append({'record': path.name, 'output_sha256': data['output_sha256']})
with receipt.open('x') as output:
    json.dump({'base': base, 'frozen_test_prefix_sha256': frozen['sha256'], 'frozen_test_prefix_bytes': len(original), 'test_prefix_exact': True, 'notes_prefix_exact': True, 'runtime_diff': ['src/ui/workspaceState.ts'], 'protected': protected, 'verified_outputs': outputs}, output, indent=2)
    output.write('\n')
print(f'Preservation PASS: {len(protected)} protected files, frozen tests/notes prefixes, runtime scope and {len(outputs)} output hashes.')
