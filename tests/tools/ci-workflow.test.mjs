import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
const workflow=readFileSync(new URL('../../.github/workflows/ci.yml',import.meta.url),'utf8');
const job=id=>{const match=workflow.match(new RegExp('^  '+id+':\\s*\\n([\\s\\S]*?)(?=^  [a-zA-Z_][a-zA-Z_0-9-]*:|$(?![\\s\\S]))','m'));assert.ok(match,'workflow job '+id);return match[1];};

test('workflow: stable ci gate always accounts for both classification and verification',()=>{
 const gate=job('ci'); assert.match(gate,/needs:\s*\[plan,\s*verify\]/);assert.match(gate,/if:.*always\(\)/);assert.match(gate,/node tools\/ci\/gate\.mjs/);
 assert.match(gate,/needs\.plan\.result/);assert.match(gate,/needs\.plan\.outputs\.mode/);assert.match(gate,/needs\.verify\.result/);
 assert.doesNotMatch(workflow,/continue-on-error:\s*true/);
});
test('workflow: routine retains all package browser tests and manual release adds source tests',()=>{
 const verify=job('verify');assert.match(verify,/needs:\s*plan/);assert.match(verify,/if:.*needs\.plan\.outputs\.mode\s*!=\s*'docs'/);
 assert.match(verify,/run: npm test\s*$/m);assert.match(verify,/node tools\/ci\/verify\.mjs/);
 const commands=verify.split('\n').filter(s=>/^\s*run:.*playwright test/.test(s));
 assert.equal(commands.length,2);assert.equal(commands.filter(s=>s.includes('--config playwright.release.config.ts')).length,1);
 for(const cmd of commands){assert.match(cmd,/--workers=2/);assert.doesNotMatch(cmd,/--grep|--project|--shard|--last-failed|--only-changed|tests\/e2e/);}
 const source=verify.indexOf('run: npx playwright test --workers=2');assert.ok(source>=0);assert.match(verify.slice(0,source).split('- name:').at(-1),/if:.*github\.event_name\s*==\s*'workflow_dispatch'.*inputs\.full_release/);
 assert.match(workflow,/workflow_dispatch:/);assert.match(workflow,/full_release:/);
 assert.match(verify,/playwright-report-release\//);assert.match(verify,/test-results-release\//);
});
test('workflow: only superseded heads of same PR share cancellable concurrency',()=>{
 assert.match(workflow,/group:.*github\.workflow.*github\.event\.pull_request\.number.*github\.run_id/);
 assert.match(workflow,/cancel-in-progress:.*github\.event_name\s*==\s*'pull_request'/);
 assert.match(workflow,/pull_request:/);assert.match(workflow,/branches:\s*\[main\]/);
 const beforeJobs=workflow.split(/^jobs:/m)[0];assert.doesNotMatch(beforeJobs,/paths-ignore:|paths:/);
});
test('workflow: bounded temporary artifact retention and sparse real Git checkout',()=>{
 const verify=job('verify');assert.match(verify,/sparse-checkout:/);assert.match(verify,/sparse-checkout-cone-mode:\s*false/);
 assert.doesNotMatch(verify,/^\s*filter:/m);assert.doesNotMatch(verify,/fetch-depth:\s*0/);
 assert.match(job('plan'),/fetch-depth:\s*2/);assert.match(job('plan'),/node tools\/ci\/plan\.mjs/);
 assert.match(verify,/retention-days:\s*(?:[1-9]|[12][0-9]|30)\s*$/m);
 assert.match(verify,/release\/malpaco-playable\.tar\.gz/);
});
