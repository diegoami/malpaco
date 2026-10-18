import {defineConfig} from '@playwright/test';
import base from '../../../../../playwright.config';
export default defineConfig({...base,testDir:'../../../../../tests/e2e',outputDir:'./browser-results',reporter:[['list']],use:{...base.use,baseURL:'http://localhost:4181'},webServer:{cwd:process.cwd(),command:'npx vite build && npx vite preview --port 4181 --strictPort',url:'http://localhost:4181',reuseExistingServer:false,timeout:120000}});
