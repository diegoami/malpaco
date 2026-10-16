"""Verify portable current artifacts and exact historical archived log bytes."""
import hashlib
import json
from pathlib import Path
import tarfile
ROOT = Path(__file__).resolve().parent
sha = lambda data: hashlib.sha256(data).hexdigest()
index = json.loads((ROOT/'artifacts.v3.sha256.json').read_text())
for name, expected in index['hashes'].items():
    assert sha((ROOT/name).read_bytes()) == expected, name
members = 0
for report_path in (ROOT/'evidence').glob('*/report.json'):
    report = json.loads(report_path.read_text())
    if 'archiveMemberHashes' not in report:
        continue
    archive_path = report_path.parent/'raw-logs.tar.gz'
    assert sha(archive_path.read_bytes()) == report['archiveSha256'], str(archive_path)
    with tarfile.open(archive_path) as archive:
        for name, expected in report['archiveMemberHashes'].items():
            assert sha(archive.extractfile(name).read()) == expected, name
            members += 1
historical = json.loads((ROOT/'artifacts.v2.sha256.json').read_text())['hashes']
with tarfile.open(ROOT/'preflight/raw-logs.tar.gz') as archive:
    for name, expected in historical.items():
        if name.startswith('preflight/') and name.endswith('.txt'):
            assert sha(archive.extractfile(name.removeprefix('preflight/')).read()) == expected, name
            members += 1
print(f"Verified {len(index['hashes'])} tracked file hashes and {members} exact archived members")
