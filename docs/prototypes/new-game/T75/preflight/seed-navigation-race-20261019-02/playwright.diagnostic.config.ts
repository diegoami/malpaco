import {fileURLToPath} from 'node:url';
import {dirname} from 'node:path';
const __dirname=dirname(fileURLToPath(import.meta.url));
import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:__dirname,testMatch:'navigation.spec.ts',timeout:30000,retries:0,workers:1,outputDir:__dirname+'/test-results',reporter:[['list'],['json',{outputFile:__dirname+'/browser-report.json'}]],use:{baseURL:'http://127.0.0.1:4319',viewport:{width:1920,height:1080}}});
