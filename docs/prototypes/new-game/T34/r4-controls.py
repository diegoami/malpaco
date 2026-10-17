"""Isolate all three upper degree clauses with exact source omissions/restoration."""
from pathlib import Path
import datetime
import gzip
import hashlib
import json
import subprocess
import tempfile

D = Path(__file__).resolve().parent
R = D.parents[3]
core = R / 'src/core/island-geography.ts'
original = core.read_bytes()
sha = lambda data: hashlib.sha256(data).hexdigest()
assert sha(original) == 'ddf63b0aaee80d85ec2422c8048d2c49ee5d164a07483c21600ff5a839f7e369'
out = Path(tempfile.mkdtemp(prefix='r4-controls-', dir=D / 'evidence'))
(out / 'original-core.ts.gz').write_bytes(gzip.compress(original, mtime=0))
start = datetime.datetime.now(datetime.timezone.utc)
results = []


def run(label, command, expected):
    process = subprocess.run(
        ['python3', str(D / 'run-command.py'), label, *command],
        cwd=R, capture_output=True,
    )
    receipt = {
        'command': command, 'exit': process.returncode, 'expected': expected,
        'stdout': process.stdout.decode(), 'stderr': process.stderr.decode(),
    }
    (out / (label + '.json')).write_text(json.dumps(receipt, indent=2) + '\n')
    results.append({'label': label, 'exit': process.returncode, 'expected': expected})
    print(json.dumps(results[-1]), flush=True)
    assert process.returncode == expected


cases = [
    ('land-upper', b'||p.borders.length>4', 'refuses more than four land neighbours'),
    ('combined-upper', b'||p.borders.length+lanes>5', 'refuses four land neighbours plus two lanes'),
    ('lanes-upper', b'||lanes>2', 'refuses more than two reserved lanes'),
]
for label, clause, test in cases:
    assert original.count(clause) == 1
    modified = original.replace(clause, b'')
    try:
        core.write_bytes(modified)
        run('r4-omit-' + label, [
            'npx', 'vitest', 'run', 'tests/core/island-geography.test.ts', '-t', test,
        ], 1)
    finally:
        core.write_bytes(original)
    assert core.read_bytes() == original
    results[-1].update({
        'omittedClause': clause.decode(), 'modifiedCoreSha256': sha(modified),
        'restoredCoreSha256': sha(core.read_bytes()),
    })

for label, command in [
    ('r4-focused', ['npx', 'vitest', 'run', 'tests/core/island-geography.test.ts']),
    ('r4-units', ['npm', 'test']),
    ('r4-build', ['npm', 'run', 'build']),
]:
    run(label, command, 0)

end = datetime.datetime.now(datetime.timezone.utc)
(out / 'report.json').write_text(json.dumps({
    'startUtc': start.isoformat(), 'endUtc': end.isoformat(),
    'durationSeconds': (end - start).total_seconds(), 'results': results,
    'coreRestored': core.read_bytes() == original, 'coreSha256': sha(original),
    'originalArchiveSha256': sha((out / 'original-core.ts.gz').read_bytes()),
    'coreArchiveRestoresExact': gzip.decompress((out / 'original-core.ts.gz').read_bytes()) == original,
    'scope': 'Three isolated degree tests; no runtime change. Prior independent sweep and browsers apply to identical runtime.',
}, indent=2) + '\n')
print(str(out), flush=True)
