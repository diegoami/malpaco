import base from '../../../../../playwright.config';
import {defineConfig} from '@playwright/test';
export default defineConfig({...base,testDir:process.cwd()+'/tests/e2e',testMatch:['cards.spec.ts','cards-result-layout.spec.ts','computer-cards.spec.ts','compact-panels.spec.ts','battle-controls.spec.ts','battle-accessibility.spec.ts','direct-attack.spec.ts'],workers:2,reporter:[['list']],outputDir:process.cwd()+'/docs/prototypes/new-game/issue180/preflight/affected-results',webServer:{...base.webServer as object,cwd:process.cwd()}});
