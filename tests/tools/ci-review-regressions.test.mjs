import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
const text=readFileSync(new URL('../../.github/workflows/ci.yml',import.meta.url),'utf8');
const verify=text.match(/^  verify:\n([\s\S]*?)(?=^  ci:)/m)?.[1];
assert.ok(verify,'verify job exists');
const steps=[...verify.matchAll(/^      - [\s\S]*?(?=^      - |$(?![\s\S]))/gm)].map(m=>m[0]);
const command=step=>step.match(/^\s+run: ([^\n]+)$/m)?.[1];
test('review R1: all mandatory validation steps run unconditionally and cannot hide failures',()=>{
 for(const expected of ['npm test','node tools/ci/verify.mjs','npx playwright test --config playwright.release.config.ts --workers=2']){
  const found=steps.filter(step=>command(step)===expected);assert.equal(found.length,1,expected);
  assert.doesNotMatch(found[0],/^\s+if:/m,expected+' must be unconditional');
  assert.doesNotMatch(found[0],/^\s+continue-on-error:/m,expected+' must propagate failures');
 }
});
test('review R2: browser commands equal the complete asserted suites without any extra flags',()=>{
 const commands=steps.map(command).filter(c=>c?.startsWith('npx playwright test'));
 assert.deepEqual(commands,[
  'npx playwright test --config playwright.release.config.ts --workers=2',
  'npx playwright test --workers=2',
 ]);
});
