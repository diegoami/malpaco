from pathlib import Path
import hashlib,json,subprocess
w=Path(__file__).resolve().parents[5];p=w/'src/ui/referenceBattleGame.ts';saved=p.read_bytes()
try:
 p.write_bytes(subprocess.check_output(['git','show','27413ce3:src/ui/referenceBattleGame.ts'],cwd=w))
 r=subprocess.run(['python3',str(w/'docs/prototypes/new-game/T76/validation/run.py'),'icons-baseline','node_modules/.bin/playwright','test','tests/e2e/icon-actions.spec.ts','--workers=2','--timeout=5000','--reporter=list,json','--output=docs/prototypes/new-game/T76/validation/icons-baseline/browser'],cwd=w,stdin=subprocess.DEVNULL)
finally:
 p.write_bytes(saved)
 (w/'docs/prototypes/new-game/T76/validation/icons-baseline/restoration.json').write_text(json.dumps({'restoredExact':p.read_bytes()==saved,'sha256':hashlib.sha256(saved).hexdigest()},indent=2)+'\n')
print('baseline finished',r.returncode)
