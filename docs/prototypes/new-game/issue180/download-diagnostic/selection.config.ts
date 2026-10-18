import base from '../anchor-correction/playwright.config';
import {defineConfig} from '@playwright/test';
export default defineConfig({...base,outputDir:process.cwd()+'/docs/prototypes/new-game/issue180/download-diagnostic/css5-selection-results'});
