import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {registerHooks,stripTypeScriptTypes} from 'node:module';import {createHash} from 'node:crypto';
import {inspectGeography} from './acceptance.mjs';import {parameters as P} from '../T24/parameters.mjs';
const root=path.dirname(fileURLToPath(import.meta.url)),repo=path.resolve(root,'../../../..');
registerHooks({resolve(s,c,n){return n(s.startsWith('.')&&c.parentURL?.endsWith('.ts')&&!path.extname(s)?s+'.ts':s,c);},load(u,c,n){if(u.endsWith('.ts'))return {format:'module',source:stripTypeScriptTypes(fs.readFileSync(new URL(u),'utf8')),shortCircuit:true};return n(u,c);}});
const{generateIslandGeography}=await import(new URL('../../../../src/core/island-geography.ts',import.meta.url));
for(const seed of [0,1,2,7,42,1994]){const result=generateIslandGeography(seed);const errors=result.ok?inspectGeography(result.geography):['exhausted'];console.log(JSON.stringify({seed,ok:result.ok,attempts:result.attempts,errors}));if(errors.length)process.exitCode=1;}
