"""Verify append-only R1 tests/evidence and unchanged production source."""
from pathlib import Path
import hashlib
import json
import subprocess

root = Path(__file__).resolve().parent
base = 'e010d533bc138a38a62ab7de698c139e3d94778c'
receipt = root / 'preservation-01.json'
assert not receipt.exists(), 'Refusing to overwrite retained audit'
def git(*args):
    return subprocess.check_output(['git', *args])
def before(path):
    return git('show', base + ':' + path)
source_path = 'src/ui/workspaceState.ts'
source = Path(source_path).read_bytes()
assert source == before(source_path)
assert hashlib.sha256(source).hexdigest() == '01e4f8829c05b761f5aa313764a4c19ccc5014d2f3930c7efca5ebd568c5db34'
test_path = 'tests/ui/workspace-state.test.ts'
tests = Path(test_path).read_bytes()
assert tests.startswith(before(test_path))
frozen = git('show', '19f2565c:' + test_path)
assert tests.startswith(frozen)
assert hashlib.sha256(frozen).hexdigest() == 'e868afd90e7e4cd2347866983081e18b320a7b1a8d61adcf8a28d9d2eaadeeba'
assert Path('RUN-NOTES.md').read_bytes().startswith(before('RUN-NOTES.md'))
protected = git('ls-tree', '-r', '--name-only', base, 'docs/prototypes/new-game/T78', 'docs/tasks/T78.md').decode().splitlines()
identities = []
for path in protected:
    original = before(path)
    assert Path(path).read_bytes() == original, path
    identities.append({'path': path, 'sha256': hashlib.sha256(original).hexdigest()})
for path in git('diff', '--name-only', base).decode().splitlines():
    assert path in [test_path, 'RUN-NOTES.md'] or path.startswith('docs/prototypes/new-game/T78/implementation/rework-r1-20261019/'), path
assert not git('diff', '--name-only', base, '--', 'src').strip()
outputs = []
for path in sorted(root.glob('*.json')):
    data = json.loads(path.read_text())
    if 'output' not in data:
        continue
    assert hashlib.sha256((root / data['output']).read_bytes()).hexdigest() == data['output_sha256']
    outputs.append({'record': path.name, 'native_exit': data['native_exit'], 'output_sha256': data['output_sha256']})
assert len(outputs) == 3
with receipt.open('x') as out:
    json.dump({'base': base, 'source_unchanged_sha256': hashlib.sha256(source).hexdigest(), 'existing_19_tests_exact_prefix_bytes': len(before(test_path)), 'frozen_17_tests_exact_prefix_bytes': len(frozen), 'notes_prefix_exact': True, 'protected': identities, 'new_outputs': outputs}, out, indent=2)
    out.write('\n')
print(f'Preservation PASS: source unchanged; 19-test and frozen17-test prefixes; {len(identities)} original files; 3 output hashes.')
