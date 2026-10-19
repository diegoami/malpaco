from pathlib import Path
import subprocess,sys
w=Path(__file__).resolve().parents[5];driver=w/'docs/prototypes/new-game/T76/validation/run.py'
suites=[('layout-final',['npx','playwright','test','tests/e2e/hideable-panels.spec.ts','--workers=2','--reporter=list,json','--output=docs/prototypes/new-game/T76/validation/layout-final/browser']),('regression-final',['npx','playwright','test','tests/e2e/icon-actions.spec.ts','tests/e2e/compact-panels.spec.ts','tests/e2e/battle-panel-fit.spec.ts','tests/e2e/cards.spec.ts','tests/e2e/cards-result-layout.spec.ts','tests/e2e/battle-controls.spec.ts','tests/e2e/battle-accessibility.spec.ts','tests/e2e/playback-controls.spec.ts','tests/e2e/game-event-log.spec.ts','--workers=2','--reporter=list,json','--output=docs/prototypes/new-game/T76/validation/regression-final/browser']),('unit-final',['npm','test']),('build-final',['npm','run','build'])]
for label,args in suites:
 r=subprocess.run(['python3',str(driver),label]+args,cwd=w,stdin=subprocess.DEVNULL)
 if r.returncode:sys.exit(r.returncode)
