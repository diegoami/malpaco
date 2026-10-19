from pathlib import Path
import subprocess,sys
w=Path(__file__).resolve().parents[5];runner=w/'docs/prototypes/new-game/T76/validation/run.py'
suites=[('rework-layout',['npx','playwright','test','tests/e2e/hideable-panels.spec.ts','--workers=2','--reporter=list,json','--output=docs/prototypes/new-game/T76/validation/rework-layout/browser']),('rework-regression',['npx','playwright','test','tests/e2e/icon-actions.spec.ts','tests/e2e/compact-panels.spec.ts','tests/e2e/battle-panel-fit.spec.ts','tests/e2e/cards.spec.ts','tests/e2e/cards-result-layout.spec.ts','tests/e2e/battle-controls.spec.ts','tests/e2e/battle-accessibility.spec.ts','tests/e2e/playback-controls.spec.ts','tests/e2e/game-event-log.spec.ts','--workers=2','--reporter=list,json','--output=docs/prototypes/new-game/T76/validation/rework-regression/browser']),('rework-unit',['npm','test']),('rework-build',['npm','run','build'])]
for label,args in suites:
 result=subprocess.run(['python3',str(runner),label]+args,cwd=w,stdin=subprocess.DEVNULL)
 if result.returncode:sys.exit(result.returncode)
