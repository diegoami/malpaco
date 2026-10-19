"""Production negative controls, restoring saved source bytes even after failure."""
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile

source = Path('src/ui/workspaceState.ts')
root = Path(__file__).resolve().parent
summary = root / 'mutation-results-01.json'
if summary.exists():
    raise SystemExit('Refusing to overwrite retained mutation results')
original = source.read_bytes()
text = original.decode()
mutations = {
    'confirmation': (
        'const confirmed = sameMatch && context.from !== null && context.to !== null\n    && state.attack.from === context.from && state.attack.to === context.to && state.attack.confirmed;',
        'const confirmed = state.attack.confirmed;'),
    'match-reset': ('sameMatch ? state : createWorkspaceState()', 'state'),
    'ui-aliasing': (
        'histories: {\n      battle: {scrollTop: next.histories.battle.scrollTop, followLatest: next.histories.battle.followLatest},\n      events: {scrollTop: next.histories.events.scrollTop, followLatest: next.histories.events.followLatest},\n    },',
        'histories: next.histories,'),
    'card-aliasing': ('handCounts: {...cardsView.handCounts}', 'handCounts: cardsView.handCounts'),
    'nested-set-allowlist': ('indices: [set.indices[0], set.indices[1], set.indices[2]],', '...set, indices: [set.indices[0], set.indices[1], set.indices[2]],'),
    'core-mutation': ('const view = battle.view;', 'const view = battle.view;\n  view.state.history.length = 0;'),
    'private-read': ('const view = battle.view;', 'const view = battle.view;\n  void JSON.stringify(view.state.cards);'),
    'numeric-drafts': ('capture: next.drafts.capture', 'capture: String(Number(next.drafts.capture))'),
}
results = []
with tempfile.TemporaryDirectory(prefix='t78-mutations-', dir='/tmp') as scratch:
    saved = Path(scratch) / 'workspaceState.ts.saved'
    saved.write_bytes(original)
    try:
        for label, (old, new) in mutations.items():
            assert text.count(old) == 1, label
            try:
                source.write_text(text.replace(old, new))
                run = subprocess.run([sys.executable, str(root / 'run-check.py'), 'negative-' + label + '-01', 'npx', 'vitest', 'run', 'tests/ui/workspace-state.test.ts'], check=False, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
                record = json.loads((root / ('negative-' + label + '-01.json')).read_text())
                assert run.returncode == record['native_exit'] == 1, run.stdout
                assert ' Test Files  1 failed' in (root / record['output']).read_text(), run.stdout
                results.append({'mutation': label, 'native_exit': run.returncode, 'record': 'negative-' + label + '-01.json'})
                print(label + ': native exit 1, behavioral failures retained', flush=True)
            finally:
                source.write_bytes(saved.read_bytes())
                assert source.read_bytes() == original
    finally:
        source.write_bytes(saved.read_bytes())
        assert source.read_bytes() == original
with summary.open('x') as output:
    json.dump({'baseline_source_sha256': hashlib.sha256(original).hexdigest(), 'restored_exact_bytes': source.read_bytes() == original, 'results': results}, output, indent=2)
    output.write('\n')
