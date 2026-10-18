"""Losslessly archive selected owned runs; preserve originals and verify every byte.

Usage: python3 .../archive-evidence.py LABEL DIRECTORY [...]
The receipt lists archive parts in concatenation order; each is at most 24 MiB.
"""
from pathlib import Path
import hashlib, io, json, sys, tarfile, tempfile
root = Path(__file__).resolve().parent
repo = root.parents[3]
out = Path(tempfile.mkdtemp(prefix=sys.argv[1] + '-', dir=root / 'evidence'))
sha = lambda b: hashlib.sha256(b).hexdigest()
paths = []
for name in sys.argv[2:]:
    directory = (repo / name).resolve()
    assert directory.is_relative_to(root / 'evidence')
    paths.extend(p for p in directory.rglob('*') if p.is_file())
paths = sorted(set(paths))
archive = out / 'originals.tar.gz'
originals = {str(p.relative_to(repo)): sha(p.read_bytes()) for p in paths}
with tarfile.open(archive, 'w:gz') as target:
    for p in paths:
        target.add(p, arcname=str(p.relative_to(repo)), recursive=False)
with tarfile.open(archive) as source:
    verified = {p.name: sha(source.extractfile(p).read()) for p in source.getmembers() if p.isfile()}
assert verified == originals
parts = []
with archive.open('rb') as source:
    while block := source.read(24 * 1024 * 1024):
        part = out / ('originals.tar.gz.part%02d' % (len(parts) + 1))
        part.write_bytes(block)
        parts.append({'name': part.name, 'bytes': len(block), 'sha256': sha(block)})
joined = hashlib.sha256()
for part in parts:
    joined.update((out / part['name']).read_bytes())
assert joined.hexdigest() == sha(archive.read_bytes())
receipt = {'scope': 'Inert historical source snapshots and complete measured originals. Loose originals preserved locally.',
           'archiveSha256': joined.hexdigest(), 'archiveParts': parts, 'members': originals}
(out / 'receipt.json').write_text(json.dumps(receipt, indent=2) + '\n')
(out / '.gitignore').write_text('/originals.tar.gz\n')
print(json.dumps({'output': str(out.relative_to(repo)), 'members': len(originals), 'archiveSha256': joined.hexdigest(), 'parts': len(parts)}))
