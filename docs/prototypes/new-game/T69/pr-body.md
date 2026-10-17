Closes #155

Claude CLI reviews now use the same review.mjs entry point, family/blocked/stale-head checks, parser, GitHub posting and labels as OpenCode. Select --reviewer claude-sonnet; MiniMax remains the default. The backend excludes checkout-controlled settings, verifies exact startup and response model IDs, retains full local diffs/output/worktrees, and holds incomplete scope or Done-when coverage.

Scope: harness execution/model selection/peek/fixture tests, roster registration, npm test wiring and workflow documentation. Native Claude Bash publishing denials match the OpenCode policy; the existing file credential-path hook remains. The strict legacy Bash guard is unchanged. No game or inherited dirty-file changes. Main session implemented; standing independent MiniMax reviews.

Validation:
```
node --test tools/harness/test/claude.test.mjs
6 groups pass, including actual entry-point posting/labels and no-OpenCode execution
node tools/harness/review.mjs --self-test
35 parser samples and 77 family checks pass
npm test
6 harness groups + 593 existing units pass
npm run build
passes
git diff --check
passes
python3 docs/prototypes/new-game/T69/verify-evidence.py
13 archives verified; current harness runtime/tests match green source-stable checks
```
Twelve real source omission controls fail and restore exact bytes. Real Claude native-permission run: claude-sonnet-5-5/high, exit0/41.542s, no denials, both subject-task checks and copied-prompt negative control ran. Its deliberately partial review is correctly held without label; dry-run made no GitHub writes. Both earlier strict-guard infrastructure failures are preserved and diagnosed. Final response-model validator successfully replays the retained actual stream. No CI dispatched before independent approval.

Docs changed: docs/harness-claude.md, docs/process.md, run-task procedure and RUN-NOTES.md. Adoption and reusable findings go to155. Optional jail-enabled Claude launches explicitly refuse; command permissions are mistakes-only safeguards, not an OS sandbox.

Independent MiniMax M3 approved the implementation and focused follow-up. The first full final was recovered after system/tmp ENOSPC; the focused run exited0/229s. Its DW2 wording caused a formatting-only parser hold, manually accepted after verifying the same command and cases ran under DW1. R1 executable grouping coverage fixed by class; R2 documentation precision fixed. Shared docs/models copy and legacy Bash guard remain unchanged. Parent six-group acceptance and retained-archive verification pass on byte-identical reviewed runtime/tests. This final receipt triggers one CI; merge waits for that exact head to be green.
