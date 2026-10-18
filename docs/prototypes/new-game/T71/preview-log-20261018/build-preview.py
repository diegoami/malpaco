from pathlib import Path
import subprocess,shutil,json,time,datetime,os
r=Path.cwd();o=r/'docs/prototypes/new-game/T71/preview-log-20261018';stamp=datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%S%fZ');run=o/stamp;run.mkdir();receipt={'commands':[]}
if (r/'release').exists():shutil.copytree(r/'release',run/'previous-release-preserved')
def command(name,args):
 start=time.monotonic()
 with (run/(name+'.stdout')).open('wb') as out,(run/(name+'.stderr')).open('wb') as err:result=subprocess.run(args,stdout=out,stderr=err)
 receipt['commands'].append({'name':name,'argv':args,'exit':result.returncode,'seconds':time.monotonic()-start});(run/'receipt.json').write_text(json.dumps(receipt,indent=2));assert result.returncode==0,name
command('package',['node','tools/release/package-playable.mjs'])
command('prepare',['python3','/home/diego/projects/malpaco/.cache/t71-dispatch/prepare-log-preview.py',str(r/'release/malpaco-playable.tar.gz'),str(r/'docs/prototypes/new-game/T71/implementation-log-20261018/compact-panels-screenshots'),subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()])
prepared=json.loads((run/'prepare.stdout').read_text());extracted=Path(prepared['bundle']);relative=str(extracted);receipt['prepared']=prepared
command('extracted-history',['docker','run','--rm','--init','--ipc=host','--user',str(os.getuid())+':'+str(os.getgid()),'-v',str(r)+':/work','-v',relative+':/preview','-w','/work','-e','HOME=/tmp','-e','PLAYABLE_EXTRACTED_DIR=/preview','-e','PLAYABLE_EVIDENCE_DIR=/work/'+str(run.relative_to(r)/'extracted-results'),'-e','COMPACT_PANEL_EVIDENCE_DIR='+str(run.relative_to(r)/'extracted-screenshots'),'mcr.microsoft.com/playwright:v1.63.0-noble','npx','playwright','test','tests/e2e/compact-panels.spec.ts','--config','playwright.release.config.ts','-g','complete battle history','--workers=2'])
(run/'receipt.json').write_text(json.dumps(receipt,indent=2));print(json.dumps({'path':str(run.relative_to(r)),**receipt},indent=2))
