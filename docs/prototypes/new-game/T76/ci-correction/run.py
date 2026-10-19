from pathlib import Path
import hashlib,json,os,subprocess,sys,time
w=Path(__file__).resolve().parents[5];out=Path(__file__).resolve().parent/sys.argv[1];out.mkdir()
args=sys.argv[2:]
command=['docker','run','--rm','--pull=never','--name','malpaco-t76-ci-'+out.name,'--network','none','--shm-size=1g','--user',f'{os.getuid()}:{os.getgid()}','--mount',f'type=bind,src={w},dst={w}','--workdir',str(w)]
for key,value in {'PLAYWRIGHT_JSON_OUTPUT_FILE':str(out/'results.json'),'PLAYWRIGHT_HTML_OUTPUT_DIR':str(out/'html'),'COMPACT_PANEL_EVIDENCE_DIR':str(out/'compact'),'BATTLE_EVIDENCE_DIR':str(out/'battle'),'PLAYBACK_EVIDENCE_DIR':str(out/'playback'),'T76_DIAGNOSTIC_DIR':str(out)}.items():command+=['--env',key+'='+value]
command+=['sha256:eff16c30e6f3f4af0a03fa4b706120d5e9b0891c344a27d64559aff5900a4a27']+args
inputs=[*w.joinpath('src').rglob('*.ts'),w/'src/styles.css',*w.joinpath('tests/e2e').glob('*.spec.ts'),w/'package.json',w/'package-lock.json',w/'playwright.config.ts']
identity=lambda:{str(p.relative_to(w)):hashlib.sha256(p.read_bytes()).hexdigest() for p in inputs}
before=identity();(out/'command.json').write_text(json.dumps({'argv':command,'sourceBefore':before},indent=2)+'\n');start=time.monotonic()
with (out/'raw.log').open('w') as log:r=subprocess.run(command,stdin=subprocess.DEVNULL,stdout=log,stderr=subprocess.STDOUT)
(out/'receipt.json').write_text(json.dumps({'exit':r.returncode,'seconds':time.monotonic()-start,'sourceAfter':identity(),'unchanged':before==identity()},indent=2)+'\n')
print(out.name,r.returncode,flush=True);sys.exit(r.returncode)
