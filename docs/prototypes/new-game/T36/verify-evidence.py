"""Verify one lossless archive receipt without regenerating games or tests."""
from pathlib import Path
import hashlib,json,tarfile,tempfile,sys
root=Path(__file__).resolve().parent
receipt=Path(sys.argv[1]).resolve();data=json.loads(receipt.read_text());directory=receipt.parent
sha=lambda stream:hashlib.file_digest(stream,'sha256').hexdigest()
joined=hashlib.sha256()
for part in data['archiveParts']:
 p=directory/part['name'];assert p.stat().st_size==part['bytes']<=24*1024*1024
 with p.open('rb') as stream:assert sha(stream)==part['sha256']
 with p.open('rb') as stream:
  while block:=stream.read(1024*1024):joined.update(block)
assert joined.hexdigest()==data['archiveSha256']
archive=directory/'originals.tar.gz';temporary=None
if not archive.is_file():
 temporary=tempfile.TemporaryFile(dir=root/'evidence')
 for part in data['archiveParts']:
  with (directory/part['name']).open('rb') as stream:
   while block:=stream.read(1024*1024):temporary.write(block)
 temporary.seek(0);stream=temporary
else:stream=archive.open('rb')
try:
 assert sha(stream)==data['archiveSha256'];stream.seek(0);members={}
 with tarfile.open(fileobj=stream,mode='r|gz') as source:
  for item in source:
   if item.isfile():members[item.name]=sha(source.extractfile(item))
 assert members==data['members']
finally:stream.close()
print(json.dumps({'receipt':str(receipt),'members':len(members),'parts':len(data['archiveParts']),'archiveSha256':data['archiveSha256'],'verified':True}))
