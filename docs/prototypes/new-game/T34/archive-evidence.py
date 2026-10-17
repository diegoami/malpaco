"""Archive large completed seed/source sets losslessly; retain loose originals."""
from pathlib import Path
import json,tarfile,hashlib
root=Path(__file__).resolve().parent
sha=lambda b:hashlib.sha256(b).hexdigest();count=0
for out in (root/'evidence').iterdir():
 if not out.is_dir()or not(out/'report.json').is_file()or(out/'measured-inputs-and-seeds.tar.gz').exists():continue
 files=sorted([*out.glob('seed-*.json'),*out.glob('candidate-*.json'),*([p for p in (out/'sources').rglob('*')if p.is_file()]if(out/'sources').is_dir()else[])])
 if not files:continue
 hashes={str(p.relative_to(out)):sha(p.read_bytes())for p in files}
 with tarfile.open(out/'measured-inputs-and-seeds.tar.gz','w:gz')as tar:
  for p in files:tar.add(p,arcname=str(p.relative_to(out)))
 with tarfile.open(out/'measured-inputs-and-seeds.tar.gz')as tar:actual={m.name:sha(tar.extractfile(m).read())for m in tar if m.isfile()}
 assert actual==hashes
 (out/'archive-manifest.json').write_text(json.dumps({'sha256':sha((out/'measured-inputs-and-seeds.tar.gz').read_bytes()),'members':hashes,'originalLooseFilesPreserved':True},indent=2)+'\n')
 (out/'.gitignore').write_text('seed-*.json\ncandidate-*.json\nsources/\n');count+=1
print('Completed archives:',count)
