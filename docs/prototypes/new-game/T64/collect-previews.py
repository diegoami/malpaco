from pathlib import Path
import hashlib,json,shutil
root=Path(__file__).resolve().parent
current=root/"evidence/run-238x6nzl/raw"
baseline=root/"evidence/run-1h09_ob_/raw"
dest=root/"previews";dest.mkdir()
rows={}
def copy(source,name):
 assert source.is_file(),source
 target=dest/name;assert not target.exists();shutil.copy2(source,target)
 digest=hashlib.sha256(source.read_bytes()).hexdigest()
 assert hashlib.sha256(target.read_bytes()).hexdigest()==digest
 rows[name]={"source":str(source.relative_to(root)),"sha256":digest}
def one(folder,pattern):
 matches=list(folder.glob(pattern));assert len(matches)==1,(folder,pattern,matches);return matches[0]
for width,height in [(800,540),(1280,800),(1920,1080)]:
 source=one(current,f"standalone-{width}-1280x800-*")
 for stem in ["before-T63","approved-T22-reference","after-opening","selected","before-coast-cliff","after-coast-cliff","before-coast-great","after-coast-great"]:
  copy(source/(stem+".png"),f"standalone-{width}x{height}-{stem}.png")
for viewport in ["1280x800","1920x1080"]:
 for label,folder in [("before",baseline),("after",current)]:
  source=one(folder,f"playable-{viewport}-*")
  copy(source/"opening.png",f"playable-{label}-{viewport}.png")
  for island in ["cliff","great"]:copy(source/f"coast-{island}.png",f"playable-{label}-{island}-{viewport}.png")
 source=one(current,f"playable-{viewport}-*");copy(source/"direct-attack.png",f"playable-direct-attack-{viewport}.png")
(dest/"provenance.json").write_text(json.dumps(rows,indent=2)+"\n")
print(f"Copied {len(rows)} matched views and coast close-ups without changing PNG bytes")
