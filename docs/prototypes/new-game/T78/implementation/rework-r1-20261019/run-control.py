"""Kill the independent review's survived mutant; always restore saved bytes."""
from pathlib import Path
import hashlib
import json
import subprocess
import sys
import tempfile

root = Path(__file__).resolve().parent
source = Path('src/ui/workspaceState.ts')
original = source.read_bytes()
original_hash = hashlib.sha256(original).hexdigest()
assert original_hash == '01e4f8829c05b761f5aa313764a4c19ccc5014d2f3930c7efca5ebd568c5db34'
receipt = root / 'mutation-restoration-01.json'
assert not receipt.exists(), 'Refusing to overwrite retained evidence'
needle = b' && state.attack.confirmed;'
assert original.count(needle) == 1
with tempfile.TemporaryDirectory(prefix='t78-r1-', dir='/tmp') as scratch:
    saved = Path(scratch) / 'workspaceState.ts.saved'
    saved.write_bytes(original)
    try:
        source.write_bytes(original.replace(needle, b';'))
        run = subprocess.run([sys.executable, str(root.parent / 'run-check.py'), root.name + '/negative-drop-confirmed-01', 'npx', 'vitest', 'run', 'tests/ui/workspace-state.test.ts'], check=False)
        record = json.loads((root / 'negative-drop-confirmed-01.json').read_text())
        output = (root / record['output']).read_text()
        assert run.returncode == record['native_exit'] == 1
        assert '1 failed | 19 passed (20)' in output
        assert 'keeps an unchanged complete staged pair unconfirmed' in output
        assert 'AssertionError:' in output
    finally:
        source.write_bytes(saved.read_bytes())
        assert source.read_bytes() == original
with receipt.open('x') as out:
    json.dump({'mutation': 'drop only && state.attack.confirmed from reconciliation', 'source_before_sha256': original_hash, 'source_restored_sha256': hashlib.sha256(source.read_bytes()).hexdigest(), 'restored_exact_bytes': source.read_bytes() == original, 'mutation_native_exit': run.returncode, 'failed_tests': 1, 'passed_tests': 19, 'mutant_receipt': 'negative-drop-confirmed-01.json'}, out, indent=2)
    out.write('\n')
print('Review R1 mutant killed; production source restored byte-exact.')
