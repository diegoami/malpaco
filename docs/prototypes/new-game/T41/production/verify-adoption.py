#!/usr/bin/env python3
"""Read-only proof. Run from any cwd; reads committed archive parts in memory."""
from pathlib import Path
import hashlib, io, json, tarfile
ROOT = Path(__file__).resolve().parents[5]
T41 = ROOT / 'docs/prototypes/new-game/T41'
def digest(data):
    return hashlib.sha256(data).hexdigest()
def check(ok, description):
    if not ok:
        raise SystemExit('MISMATCH: ' + description)
def load(path):
    return json.loads(path.read_bytes())
adoption = load(T41 / 'production/adoption.json')
receipt = load(T41 / 'archives/parent-preflight-receipt.json')
parts = []
for part in receipt['parts']:
    data = (T41 / 'archives' / part['file']).read_bytes()
    check(len(data) == part['bytes'] and digest(data) == part['sha256'], part['file'])
    parts.append(data)
archive = b''.join(parts)
check(len(archive) == receipt['archiveBytes'] and digest(archive) == receipt['archiveSha256'], 'archive')
with tarfile.open(fileobj=io.BytesIO(archive), mode='r:gz') as tar:
    members = {member.name: tar.extractfile(member).read() for member in tar if member.isfile()}
check(set(members) == set(receipt['members']), 'archive member inventory')
for name, expected in receipt['members'].items():
    check(digest(members[name]) == expected, 'archive member ' + name)
    loose = T41 / name
    if loose.is_file():
        check(digest(loose.read_bytes()) == expected, 'retained loose ' + name)
for manifest, count in [('FROZEN-ACCEPTANCE.json', 68), ('validated-inputs.json', 217)]:
    path = T41 / 'parent-acceptance' / manifest
    check(digest(path.read_bytes()) == adoption['manifestSha256'][manifest], manifest + ' hash')
    hashes = load(path)
    check(len(hashes) == count, manifest + ' count')
    for name, expected in hashes.items():
        check(digest((ROOT / name).read_bytes()) == expected, name)
check(len(adoption['sources']) == 5, 'source count')
for name, item in adoption['sources'].items():
    check(digest((ROOT / name).read_bytes()) == item['sha256'], name)
    check((ROOT / name).read_bytes() == (T41 / 'production-candidate' / name).read_bytes(), 'candidate equality ' + name)
print(json.dumps({'exactSources': 5, 'frozenFiles': 68, 'validatedInputs': 217,
                  'verifiedArchiveMembers': len(members), 'mismatches': 0,
                  'heavyChecks': 'reused independent parent evidence; no new test run'}))
