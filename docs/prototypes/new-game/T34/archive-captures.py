"""Losslessly archive a completed run's large JSON captures; keep originals and readable PNGs."""
from pathlib import Path
import sys,json,tarfile,hashlib
sha=lambda b:hashlib.sha256(b).hexdigest()
for name in sys.argv[1:]:
 out=Path(name);assert(out/'report.json').is_file();archive=out/'measured-inputs-and-seeds.tar.gz';assert not archive.exists()
 files=sorted((out/'captures').rglob('*.json'));assert files
 hashes={str(p.relative_to(out)):sha(p.read_bytes())for p in files}
 with tarfile.open(archive,'w:gz')as t:
  for p in files:t.add(p,arcname=str(p.relative_to(out)))
 with tarfile.open(archive)as t:assert {m.name:sha(t.extractfile(m).read())for m in t if m.isfile()}==hashes
 (out/'archive-manifest.json').write_text(json.dumps({'sha256':sha(archive.read_bytes()),'members':hashes,'originalLooseFilesPreserved':True},indent=2)+'\n')
 with (out/'.gitignore').open('a')as f:f.write('captures/**/*.json\n')
 print(out)
