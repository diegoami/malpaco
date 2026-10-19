from pathlib import Path
import hashlib,json,subprocess,sys
w=Path(__file__).resolve().parents[5];out=Path(__file__).resolve().parent;runner=w/'docs/prototypes/new-game/T76/validation/run.py'
def run(label,pattern):
 args=['python3',str(runner),label,'npx','playwright','test','tests/e2e/icon-actions.spec.ts','--grep',pattern,'--workers=2','--reporter=list,json','--output=docs/prototypes/new-game/T76/validation/'+label+'/browser']
 result=subprocess.run(args,cwd=w,stdin=subprocess.DEVNULL)
 stats=json.loads((w/'docs/prototypes/new-game/T76/validation'/label/'results.json').read_text())['stats']
 return result.returncode,stats
code,stats=run('rework-positive02','visible sidebar|non-default|capture retains');assert code==0 and stats['expected']==12 and stats['unexpected']==0 and stats['skipped']==0,(code,stats)
mutations=[
 ('history','src/ui/battleChrome.ts','  open(surface: Surface, opener: HTMLElement): void {\n    this.rememberHistory();','  open(surface: Surface, opener: HTMLElement): void {','visible sidebar'),
 ('capture','src/ui/battleView.ts','value: captureDraft ?? String(pending.defaultAmount)','value: String(pending.defaultAmount)','capture retains'),
 ('friendly-draft','src/ui/friendlyMoveView.ts','value:draft ?? String(maximum)','value:String(maximum)','non-default draft'),
 ('friendly-focus','src/ui/friendlyMoveView.ts','    if (focused) this.el.querySelector<HTMLElement>(`#${focused}`)?.focus({preventScroll:true});','    // Focus restoration removed by this deletion test.','non-default draft'),
]
records=[]
originals=out/'mutation-originals';originals.mkdir()
for name,file,needle,replacement,pattern in mutations:
 path=w/file;saved=path.read_bytes();originals.joinpath(name+'.source').write_bytes(saved)
 assert saved.decode().count(needle)==1,(name,needle)
 record={'name':name,'file':file,'beforeSha256':hashlib.sha256(saved).hexdigest()}
 try:
  path.write_text(saved.decode().replace(needle,replacement,1));record['mutantSha256']=hashlib.sha256(path.read_bytes()).hexdigest()
  code,stats=run('rework-mutant-'+name,pattern);record.update(exit=code,stats=stats)
 finally:
  path.write_bytes(saved);record['restoredExact']=path.read_bytes()==saved;record['afterSha256']=hashlib.sha256(path.read_bytes()).hexdigest();records.append(record);(out/'mutation-results.json').write_text(json.dumps(records,indent=2)+'\n')
 assert record['restoredExact'] and code!=0 and stats['unexpected']==4 and stats['expected']==0 and stats['skipped']==0,record
 print(name,'4 executed failures; restored exact',flush=True)
