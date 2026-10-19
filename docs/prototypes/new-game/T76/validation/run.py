from pathlib import Path
import hashlib,json,os,subprocess,sys,time
w=Path(__file__).resolve().parents[5]
label=sys.argv[1];args=sys.argv[2:];out=w/'docs/prototypes/new-game/T76/validation'/label
out.mkdir()
command=['docker','run','--rm','--pull=never','--name','malpaco-t76-'+label,'--network','none','--shm-size=1g','--user',f'{os.getuid()}:{os.getgid()}','--mount',f'type=bind,src={w},dst={w}','--workdir',str(w)]
for key,value in {'PLAYWRIGHT_JSON_OUTPUT_FILE':str(out/'results.json'),'PLAYWRIGHT_HTML_OUTPUT_DIR':str(out/'html'),'COMPACT_PANEL_EVIDENCE_DIR':str(out/'compact'),'BATTLE_EVIDENCE_DIR':str(out/'battle'),'PLAYBACK_EVIDENCE_DIR':str(out/'playback')}.items():command+=['--env',key+'='+value]
command+=['sha256:eff16c30e6f3f4af0a03fa4b706120d5e9b0891c344a27d64559aff5900a4a27']+args
start=time.monotonic();before={str(p.relative_to(w)):hashlib.sha256(p.read_bytes()).hexdigest() for p in [w/'tests/e2e/hideable-panels.spec.ts',w/'src/ui/referenceBattleGame.ts',w/'src/ui/battleChrome.ts',w/'src/styles.css'] if p.exists()}
(out/'command.json').write_text(json.dumps({'argv':command,'sourceBefore':before},indent=2)+'\n')
with (out/'raw.log').open('w') as log:r=subprocess.run(command,stdin=subprocess.DEVNULL,stdout=log,stderr=subprocess.STDOUT)
(out/'receipt.json').write_text(json.dumps({'exit':r.returncode,'seconds':time.monotonic()-start,'sourceAfter':{name:hashlib.sha256((w/name).read_bytes()).hexdigest() for name in before}},indent=2)+'\n')
print(label,r.returncode,flush=True);sys.exit(r.returncode)
