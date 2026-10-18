#!/usr/bin/env python3
"""Read-only T73 proof; archive bytes come from Git HEAD, never loose-only helpers."""
from pathlib import Path
import argparse, hashlib, io, json, subprocess, tarfile
ROOT = Path(__file__).resolve().parents[5]
ISSUE = ROOT / 'docs/prototypes/new-game/issue180'
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--committed-only', action='store_true', help='Ignore optional loose archive members.')
args = parser.parse_args()
def check(ok, description):
    if not ok:
        raise SystemExit('MISMATCH: ' + description)
def digest(data):
    return hashlib.sha256(data).hexdigest()
def load(path):
    return json.loads(path.read_bytes())
def committed(path):
    result = subprocess.run(['git', 'show', 'HEAD:' + path], cwd=ROOT, capture_output=True)
    check(result.returncode == 0, 'committed file ' + path)
    return result.stdout
adoption = load(ISSUE / 'production/adoption.json')
for name, expected in adoption['manifestSha256'].items():
    data = (ROOT / name).read_bytes()
    check(digest(data) == expected, 'manifest hash ' + name)
    check(committed(name) == data, 'committed immutable manifest ' + name)
for file, count in [('FROZEN-ACCEPTANCE.json', 18), ('validated-inputs.json', 222)]:
    manifest = load(ISSUE / 'parent-final' / file)
    check(len(manifest) == count, file + ' count')
    for name, expected in manifest.items():
        check(digest((ROOT / name).read_bytes()) == expected, name)
source = adoption['source']
actual = (ROOT / source['path']).read_bytes()
check(digest(actual) == source['sha256'], 'adopted stylesheet hash')
check(actual == (ROOT / source['candidate']).read_bytes(), 'candidate/source equality')
receipt = load(ISSUE / 'archives/parent-preflight-final-receipt.json')
check(len(receipt['parts']) == 28 and len(receipt['members']) == 1689, 'archive inventory counts')
payload, concatenated, size = io.BytesIO(), hashlib.sha256(), 0
for part in receipt['parts']:
    data = committed(part['path'])
    check(len(data) == part['bytes'] and digest(data) == part['sha256'], 'archive part ' + part['path'])
    concatenated.update(data)
    size += len(data)
    payload.write(data)
check(size == receipt['archiveBytes'] and concatenated.hexdigest() == receipt['archiveSha256'], 'concatenated archive')
payload.seek(0)
needed = set(adoption['reusedEvidence']) | {
    'docs/prototypes/new-game/issue180/preflight/frozen-input-sha256.json',
    'docs/prototypes/new-game/issue180/preflight/supplementary-input-sha256.json',
}
found, retained, loose_count = set(), {}, 0
with tarfile.open(fileobj=payload, mode='r:gz') as archive:
    for member in archive:
        if not member.isfile():
            continue
        name = member.name
        check(name not in found and name in receipt['members'], 'archive member inventory ' + name)
        found.add(name)
        expected = receipt['members'][name]
        check(member.size == expected['bytes'], 'archive member size ' + name)
        stream, hasher, chunks = archive.extractfile(member), hashlib.sha256(), []
        while chunk := stream.read(1024 * 1024):
            hasher.update(chunk)
            if name in needed:
                chunks.append(chunk)
        check(hasher.hexdigest() == expected['sha256'], 'archive member hash ' + name)
        if name in needed:
            retained[name] = b''.join(chunks)
        loose = ROOT / name
        if not args.committed_only and loose.is_file():
            check(digest(loose.read_bytes()) == expected['sha256'], 'retained loose evidence ' + name)
            loose_count += 1
check(found == set(receipt['members']), 'complete archive member inventory')
for name, expected in adoption['reusedEvidence'].items():
    check(name in retained and json.loads(retained[name]) == expected, 'reused archived receipt ' + name)
unit_checked = 0
for suffix in ['frozen-input-sha256.json', 'supplementary-input-sha256.json']:
    name = 'docs/prototypes/new-game/issue180/preflight/' + suffix
    for row in json.loads(retained[name]):
        path = row['path']
        if ((path.startswith('src/') and path.endswith('.ts')) or path.startswith('tests/core/')
                or path.startswith('tools/harness/') or path in ['package.json', 'package-lock.json']):
            check(digest((ROOT / path).read_bytes()) == row['sha256'], 'reused unit input ' + path)
            unit_checked += 1
check(unit_checked == 132, 'unit input reuse count')
summary = load(ISSUE / 'parent-final/acceptance-summary.json')
check(summary == adoption['acceptanceSummary'], 'acceptance result distinction')
check(not summary['singleCombinedRunGreen'] and summary['independentRegularSuiteAndFinalGreenCIRequired'], 'remaining acceptance gates')
print(json.dumps({'sourceCandidateEqualities': 1, 'frozenFiles': 18, 'validatedInputs': 222,
                  'committedArchiveParts': 28, 'archiveMembers': len(found), 'looseMembersChecked': loose_count,
                  'unitReuseInputs': unit_checked, 'mismatches': 0, 'combined': '108/110',
                  'originalRetake': '0/2', 'finalUnchangedSelection': '2/2',
                  'singleCombinedRunGreen': False, 'freshHeavyRuns': 0,
                  'remainingGates': adoption['remainingGates']}))
