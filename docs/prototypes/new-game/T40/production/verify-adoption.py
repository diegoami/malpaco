"""Read-only exact-byte proof for the formal eight-path T40 adoption."""
from pathlib import Path
import hashlib
import json

ROOT = Path(__file__).resolve().parents[5]
BASE = ROOT / 'docs/prototypes/new-game/T40'
OUT = BASE / 'production'

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def verify():
    receipt = json.loads((BASE / 'parent-acceptance/dw3-validation-02/receipt.json').read_text())
    frozen_path = BASE / 'parent-acceptance/FROZEN-ACCEPTANCE.json'
    frozen = json.loads(frozen_path.read_text())
    retained = json.loads((OUT / 'retained-originals.json').read_text())
    baseline = json.loads((OUT / 'validated-inputs.json').read_text())
    assert baseline == receipt['inputHashes']
    paths = json.loads((BASE / 'parent-preflight/candidate-paths.json').read_text())['t40ProductionProposal']
    assert set(paths) == set(receipt['candidate'])
    expected = dict(baseline)
    expected.update(receipt['candidate'])
    comparisons = {}
    for label, entries in [('validatedIntegratedInputs', expected), ('frozenAcceptance', frozen), ('retainedOriginals', retained)]:
        mismatches = [name for name, sha in entries.items() if not (ROOT / name).is_file() or digest(ROOT / name) != sha]
        comparisons[label] = {'count': len(entries), 'mismatches': mismatches}
        assert not mismatches, (label, mismatches)
    adopted = []
    for name in paths:
        sha = digest(ROOT / name)
        assert sha == digest(BASE / 'parent-preflight/runtime' / name) == receipt['candidate'][name]
        adopted.append({'path': name, 'sha256': sha, 'bytes': (ROOT / name).stat().st_size})
    return {'adopted': adopted, 'comparisons': comparisons, 'parentFrozenManifestSha256': digest(frozen_path), 'exactEquivalence': True}

if __name__ == '__main__':
    print(json.dumps(verify(), indent=2))
