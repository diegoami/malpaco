"""Verify retained source/raw snapshots and lossless multipart receipts."""
from pathlib import Path
import hashlib, io, json, sys, tarfile
repo = Path(__file__).resolve().parents[4]
sha = lambda b: hashlib.sha256(b).hexdigest()
records = []
for name in sys.argv[1:]:
    directory = repo / name
    report = directory / 'report.json'
    receipt = directory / 'receipt.json'
    if receipt.is_file():
        data = json.loads(receipt.read_text())
        parts = [(directory / p['name']).read_bytes() for p in data['archiveParts']]
        assert all(sha(b) == p['sha256'] and len(b) == p['bytes'] for b, p in zip(parts, data['archiveParts']))
        joined = b''.join(parts)
        assert sha(joined) == data['archiveSha256']
        with tarfile.open(fileobj=io.BytesIO(joined)) as archive:
            actual = {p.name: sha(archive.extractfile(p).read()) for p in archive.getmembers() if p.isfile()}
        assert actual == data['members']
        records.append({'path': name, 'receiptSha256': sha(receipt.read_bytes()), 'members': len(actual)})
        continue
    data = json.loads(report.read_text())
    sources = data.get('sourceHashes', {})
    source_archive = directory / 'source-inputs.tar.gz'
    if source_archive.is_file():
        with tarfile.open(source_archive) as archive:
            actual = {p.name: sha(archive.extractfile(p).read()) for p in archive.getmembers() if p.isfile()}
        assert actual == sources
    elif (directory / 'sources').is_dir():
        assert all(sha((directory / 'sources' / p).read_bytes()) == h for p, h in sources.items())
    else:
        raise AssertionError('Missing source snapshot: ' + name)
    if 'archiveMemberHashes' in data:
        archive_path = directory / ('raw-logs.tar.gz' if (directory / 'raw-logs.tar.gz').is_file() else 'raw-outputs.tar.gz')
        assert sha(archive_path.read_bytes()) == data['archiveSha256']
        with tarfile.open(archive_path) as archive:
            actual = {p.name: sha(archive.extractfile(p).read()) for p in archive.getmembers() if p.isfile()}
        assert actual == data['archiveMemberHashes']
    records.append({'path': name, 'reportSha256': sha(report.read_bytes()), 'sources': len(sources),
                    'inputsStable': data.get('sourcesUnchangedDuringRun', data.get('sourcesUnchanged'))})
print(json.dumps({'verified': True, 'records': records}, indent=2))
