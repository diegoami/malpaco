import re,json,hashlib,subprocess
from pathlib import Path
W=Path(__file__).resolve().parents[4]
D=W/'docs/plans/new-game'
import sys
S=Path(sys.argv[1]) if len(sys.argv)>1 else Path('/home/diego/projects/isle-wars-archaeology')
REV='ae298e37c2f5177039e55767607f9345b6cb0e7a'
def sha(b):return hashlib.sha256(b).hexdigest()
def slug(t):return re.sub(r'[^\w\- ]','',t.lower()).replace(' ','-')
manifest={'revision':REV,'sources':[]}
blocks={}
for doc in ['core-rules','variety','computer','ui']:
 raw=subprocess.check_output(['git','-C',str(S),'show',f'{REV}:design/{doc}.md'])
 lines=raw.decode().splitlines(); headings=[]
 for i,l in enumerate(lines):
  m=re.match(r'^(#{1,3}) (.+)',l)
  if m:headings.append((i,m[2],slug(m[2])))
 source={'document':doc,'sha256':sha(raw),'requirements':[],'exclusions':[]}
 blocks[doc]=[]
 for j,(start,title,anchor) in enumerate(headings):
  end=headings[j+1][0] if j+1<len(headings) else len(lines)
  include= ((doc=='core-rules' and start<next(x[0] for x in headings if x[1]=='Fun and balance, argued')) or
    (doc=='variety' and start<next(x[0] for x in headings if x[1]=='Surprise and balance, argued')) or
    (doc=='computer' and (start<next(x[0] for x in headings if x[1]=='Making it fun, argued') or title in ['Quick turns','Measuring strength','The baseline','Matchups','Targets','Game length','Behaviour tests'])) or
    (doc=='ui' and (start<next(x[0] for x in headings if x[1]=='The palette check') or title=='Reconciled with T50, T51 and T53')))
  if start==0 or not include:
   source['exclusions'].append({'lines':[start+1,end],'reason':'Introduction, supporting models/arguments or historical choices; canonical requirements enumerated from the decided rule sections.'})
   continue
  current=[];first=0
  def flush():
   global current,first
   if not current:return
   text=' '.join(x.strip() for x in current).strip()
   if text and not re.fullmatch(r'[| :\-]+',text) and not re.fullmatch(r'\*?\(?[A-Z0-9*, .;()]+\)?\*?\.?',text):
    rid=f'{doc}-{len(source["requirements"])+1:03d}'
    source['requirements'].append({'id':rid,'anchor':anchor,'lines':[first+1,first+len(current)]})
    blocks[doc].append((rid,title,text))
   current=[]
  for n in range(start+1,end):
   line=lines[n]
   if not line.strip():flush();continue
   if line.startswith('    ') and not current:
    source['exclusions'].append({'lines':[n+1,n+1],'reason':'Indented illustrative model code/output, not an engine requirement.'});continue
   if re.match(r'^(?:- |\d+\. |\|)',line):flush()
   if not current:first=n
   current.append(line)
  flush()
 manifest['sources'].append(source)
expected=json.loads((D/'source-manifest.json').read_text())
if manifest!=expected:raise SystemExit('Source enumeration differs from committed manifest')
print(json.dumps({'revision':REV,'counts':{s['document']:len(s['requirements']) for s in manifest['sources']},'sourceHashes':{s['document']:s['sha256'] for s in manifest['sources']},'unexplained_omissions':0},indent=2))
