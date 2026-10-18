from pathlib import Path
import subprocess,json,hashlib,time
root=Path.cwd();out=root/'docs/prototypes/new-game/T39/parent-preflight';runtime=out/'runtime';receipt=[]
cases=[('pending-gate','src/core/rules.ts',"if (state.cards?.pendingRaid && action.kind !== 'raidTarget')", "if (false)",'synthetic remote choice'),('friendly-target','src/core/rules.ts',"if(defender===p||!state.players.some", "if(!state.players.some",'synthetic remote choice'),('wrong-shield-card','src/core/rules.ts',"hand.splice(shield,1)", "hand.splice(0,1)",'synthetic Shield'),('large-stack-cap','src/core/raid.ts',"Math.max(1,Math.floor(armies/2))", "Math.min(20,Math.max(1,Math.floor(armies/2)))",'scripted bounds')]
for name,path,old,new,filter in cases:
 target=runtime/path;before=target.read_bytes();assert before.count(old.encode())==1
 folder=out/'mutations'/name;folder.mkdir(parents=True);(folder/'before.ts').write_bytes(before);modified=before.replace(old.encode(),new.encode());(folder/'mutant.ts').write_bytes(modified)
 started=time.monotonic()
 try:
  target.write_bytes(modified)
  args=['node_modules/.bin/vitest','run','--config',str((out/'vitest.config.ts').relative_to(root)),'-t',filter]
  with (folder/'stdout.txt').open('wb') as stdout,(folder/'stderr.txt').open('wb') as stderr:r=subprocess.run(args,stdout=stdout,stderr=stderr)
 finally:target.write_bytes(before)
 row={'name':name,'path':path,'argv':args,'exitCode':r.returncode,'durationSeconds':time.monotonic()-started,'restoredExactly':target.read_bytes()==before,'beforeSha256':hashlib.sha256(before).hexdigest(),'mutantSha256':hashlib.sha256(modified).hexdigest()};receipt.append(row)
 (out/'mutation-receipt.json').write_text(json.dumps(receipt,indent=2)+'\n')
 assert r.returncode!=0 and row['restoredExactly'],name
print(json.dumps(receipt,indent=2))
