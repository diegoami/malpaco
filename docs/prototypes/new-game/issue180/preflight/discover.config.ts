import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'.',testMatch:'discover.spec.ts',reporter:[['list']],workers:1,outputDir:'discovery-results'});
