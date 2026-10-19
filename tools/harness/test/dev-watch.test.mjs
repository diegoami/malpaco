import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import path from 'node:path';

test('Vite ignores only its own retained cache and preserves application and test watching', { timeout: 45_000 }, () => {
  const root=process.cwd();
  mkdirSync(path.join(root,'.cache'),{recursive:true});
  const evidence=mkdtempSync(path.join(root,'.cache','dev-watch-check-'));
  for (const name of ['probe.mjs','vitest-probe.mjs']) {
    const command=['docs/prototypes/dev-watch/issue187/acceptance/'+name];
    const result=spawnSync(process.execPath,command,{cwd:root,encoding:'utf8',timeout:20_000,
      env:{...process.env,MALPACO_DEV_WATCH_EVIDENCE:evidence}});
    writeFileSync(path.join(evidence,name+'.stdout'),result.stdout||'');
    writeFileSync(path.join(evidence,name+'.stderr'),result.stderr||'');
    writeFileSync(path.join(evidence,name+'.receipt.json'),JSON.stringify({command:[process.execPath,...command],status:result.status,signal:result.signal,error:result.error?.message},null,2)+'\n');
    assert.equal(result.status,0,name+' failed; complete evidence: '+evidence+'\n'+(result.stdout||'')+'\n'+(result.stderr||''));
  }
});
