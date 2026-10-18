Closes #187.

Vite recursively watched retained worktrees and evidence beneath `.cache`, consuming the shared filesystem-watch budget. Exclude only the current checkout's absolute config-relative cache directory while preserving source HMR, data/public serving and Vitest test reruns.

Scope: `vite.config.ts` adopts the exact frozen candidate; `README.md` explains development watching; `docs/prototypes/dev-watch/issue187/production/**` retains validation and build identities; `RUN-NOTES.md` appends the implementation record. Parent-owned acceptance guards are unchanged.

```
node --test tools/harness/test/dev-watch.test.mjs
# 1 passed, 0 failed, 0 skipped
node --test tools/harness/test/*.test.mjs
# 9 passed, 0 failed, 0 skipped
npm run build
# TypeScript checks and Vite build passed
# Baseline/adopted build: all 6 files byte/mode-identical
# Protected inputs: all 195 exact; frozen guard/candidate hashes verified
```

Docs changed: README development-watch explanation; full report and receipts under `docs/prototypes/dev-watch/issue187/production/`.

Producer validation is Linux/WSL only. Independent review, published v0.1.0, actual-main integration, final green CI and fresh pre-merge guard remain required.
