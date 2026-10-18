import base from './affected.config';
import {defineConfig} from '@playwright/test';
export default defineConfig({...base,testMatch:['computer-cards.spec.ts'],outputDir:process.cwd()+'/docs/prototypes/new-game/issue180/preflight/targeted-results'});
