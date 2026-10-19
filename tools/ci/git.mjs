import {spawnSync} from 'node:child_process';

// Trust only this checkout for this invocation, including container ownership mismatches.
export function scopedGit(root,args,options={}) {
  return spawnSync('git',['-c',`safe.directory=${root}`,...args],{...options,cwd:root});
}
