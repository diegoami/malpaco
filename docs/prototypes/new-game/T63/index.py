"""Create a fresh immutable tracked-file/archive-member index."""
from pathlib import Path
import hashlib,json,subprocess,tarfile,sys
root=Path(__file__).resolve().parent
repo=root.parents[3]
out=root/(sys.argv[1] if len(sys.argv)>1 else 'artifacts.sha256.json')
assert not out.exists(),'Use a fresh index name; never overwrite measured indexes'
sha=lambda b:hashlib.sha256(b).hexdigest()
paths=subprocess.check_output(['git','ls-files','--cached','--others','--exclude-standard',str(root.relative_to(repo))],cwd=repo,text=True).splitlines()
paths=sorted(repo/p for p in paths if repo/p!=out)
archives={}
for p in paths:
 if p.name.endswith('.tar.gz'):
  with tarfile.open(p) as a:archives[str(p.relative_to(root))]={m.name:sha(a.extractfile(m).read()) for m in a.getmembers() if m.isfile()}
out.write_text(json.dumps({'algorithm':'sha256','pathsRelativeTo':str(root.relative_to(repo)),'excludes':[out.name+' (self)','ignored loose archive inputs'],'hashes':{str(p.relative_to(root)):sha(p.read_bytes()) for p in paths},'archiveMembers':archives},indent=2)+'\n')
print(out)
