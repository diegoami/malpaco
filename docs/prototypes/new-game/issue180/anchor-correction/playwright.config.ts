import base from '../../../../../playwright.config';
import {defineConfig} from '@playwright/test';
export default defineConfig({...base,testDir:process.cwd()+'/tests/e2e',testMatch:['battle-panel-fit.spec.ts','cards.spec.ts','cards-result-layout.spec.ts','computer-cards.spec.ts','compact-panels.spec.ts','battle-controls.spec.ts','battle-accessibility.spec.ts','direct-attack.spec.ts'],workers:2,reporter:[['list']],outputDir:process.cwd()+'/docs/prototypes/new-game/issue180/anchor-correction/'+process.env.ANCHOR_OUTPUT,webServer:{...base.webServer as object,cwd:process.cwd()}});
