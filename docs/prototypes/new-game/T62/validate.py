"""Run the unchanged acceptance commands; retain exact logs in a fresh archive."""
import hashlib
import io
import json
from pathlib import Path
import subprocess
import tarfile
import tempfile

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[3]
out = Path(tempfile.mkdtemp(prefix='acceptance-', dir=ROOT/'evidence'))
sha = lambda b: hashlib.sha256(b).hexdigest()
prefix = 'docs/prototypes/new-game/T62/'
commands = [['node', prefix+'probe.mjs']]
commands += [['node','--test','--test-name-pattern='+group,prefix+'contract.test.mjs'] for group in ['attachment','water','traceability','preserved']]
commands += [['git','diff','--check'], ['git','diff','--check','origin/main...HEAD'],
             ['node','--test','--test-reporter=tap',prefix+'contract.test.mjs',prefix+'guards.test.mjs','docs/prototypes/new-game/T24/contract.test.mjs','docs/prototypes/new-game/T61/residual.test.mjs'],
             ['git','diff','862bcf4','--','docs/prototypes/new-game/T62/contract.test.mjs','docs/prototypes/new-game/T62/preflight','docs/prototypes/new-game/T24','docs/prototypes/new-game/T60','docs/prototypes/new-game/T61']]
members = {}
records = []
for number, command in enumerate(commands, 1):
    result = subprocess.run(command, cwd=REPO, capture_output=True)
    for stream in ['stdout','stderr']:
        members[f'{number:02d}.{stream}.txt'] = getattr(result, stream)
    records.append({'command': command, 'exit': result.returncode, 'stdoutTail': result.stdout.decode().splitlines()[-12:], 'stderrTail': result.stderr.decode().splitlines()[-12:]})
    print(json.dumps({'command': command, 'exit': result.returncode}), flush=True)
probe_output = json.loads(members['01.stdout.txt'])['output']
with tarfile.open(out/'raw-logs.tar.gz', 'w:gz') as archive:
    for name, data in members.items():
        entry = tarfile.TarInfo(name)
        entry.size = len(data)
        entry.mtime = 0
        archive.addfile(entry, io.BytesIO(data))
with tarfile.open(out/'raw-logs.tar.gz') as archive:
    assert all(archive.extractfile(name).read() == data for name, data in members.items())
paths = [p for p in ROOT.glob('*') if p.suffix in ['.mjs','.py','.md']]
report = {'probeOutput': probe_output, 'commands': records,
          'sourceHashes': {str(p.relative_to(REPO)): sha(p.read_bytes()) for p in paths},
          'archiveSha256': sha((out/'raw-logs.tar.gz').read_bytes()), 'archiveMemberHashes': {name: sha(data) for name,data in members.items()},
          'immutableParentAndLegacyDiffEmpty': members[f'{len(commands):02d}.stdout.txt'] == b''}
(out/'report.json').write_text(json.dumps(report, indent=2)+'\n')
print(json.dumps({'output': str(out.relative_to(REPO)), 'probeOutput': probe_output, 'allCommandsPass': all(r['exit'] == 0 for r in records), 'immutableParentAndLegacyDiffEmpty': report['immutableParentAndLegacyDiffEmpty']}, indent=2))
assert all(r['exit'] == 0 for r in records)
assert report['immutableParentAndLegacyDiffEmpty']
