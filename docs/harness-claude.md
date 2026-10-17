# Claude CLI reviews

T69 implements issue155 following the owner-requested PR153 trials. Claude is selectable through
the same review entry point as OpenCode. The existing MiniMax default remains unchanged.

```bash
HARNESS_SESSION_FAMILY=openai tools/harness/run-unit.sh review-PR /tmp/review-PR.log -- \
  node tools/harness/review.mjs --pr PR --brief /tmp/review-brief.md \
  --reviewer claude-sonnet --issue ISSUE --apply-label
```

Set `HARNESS_SESSION_FAMILY` to the actual implementer/orchestrator family; the example is for
Codex. Do not override it to bypass independence. Existing blocked-list, stale-head, task
Done-when parsing, final-review parsing, posting and status-label rules apply to both backends.
The main session still records the owner selection before dispatch. A Claude session cannot
use Claude as its independent reviewer. Do not change defaults without the owner's choice.

The registered exact model was discovered from the installed CLI's actual init events:
`anthropic/claude-sonnet-5-5`. The `anthropic/` prefix is the harness identity; Claude receives
`claude-sonnet-5-5`. An alias is insufficient for verified review identity. Discover future
models from installed CLI help and an explicit recorded trial; never guess their IDs.
Register an independently verified ID without changing defaults:

```bash
node tools/harness/switch-model.mjs --role reviewer --backend claude \
  --model anthropic/claude-sonnet-5-5 --name claude-sonnet --variant high --register-only
```

This checks CLI availability and provider configuration. It does not bill a discovery probe or
claim model availability: each actual review checks the returned init ID exactly. An unavailable
model fails visibly. `--probe` is refused for this backend; use an explicit retained review.
`--backend claude` may also select the default through switch-model, after owner authorization.

## Configuration and permissions

Install/authenticate Claude CLI with its own supported login or an existing Anthropic key.
`HARNESS_CLAUDE_EXE` selects an executable (a `.mjs` fake is supported for offline tests).
The adapter rejects non-direct Anthropic endpoints, alternate provider flags and conflicting
model-remapping environment variables before a model call. It never prints credentials or edits
global auth/settings. Existing OAuth environment authentication works in the measured trials.

`--setting-sources ''` excludes user, project and local settings; only invocation-generated
settings from the trusted launcher checkout are loaded. This prevents a PR's `.claude` settings
from selecting GLM or changing the reviewer hook. `--model` pins the exact ID, and the init event
must match it and the requested session UUID. The adapter enables only Bash, Read, Grep and Glob,
with the existing trusted reviewer PreToolUse guard. Bash may build, test and mutate files for
negative controls; the guard rejects git commits/pushes and GitHub writes. It has the same
mistakes-only limits documented in lib/guard.mjs: it is not an OS sandbox, and a test script can
execute code. File tools also use the existing credential-path guard. No permission bypass,
subagents, checkout-supplied hooks or global permission edits are used. An optional credential
jail continues through the existing guard when configured; the default is off.

Every permission denial or rejected hook invalidates the run. Read its full retained final,
fix the trusted grant, then decide whether another run is authorized. Never count exit0 alone.
The model can save scratch and mutations in its retained worktree, restoring source from saved
bytes. The canonical checkout and inherited dirty files are not its scratch space.

## Diff, coverage and evidence

The launcher records GitHub's base/head, fetches the PR head, creates an isolated detached tree,
and writes a complete local diff, bounded 240-line chunks [designed for readable tool output],
plus a changed-file inventory. It never needs the GitHub diff API's 20000-line response.
The brief includes these exact paths and Sonnet's tripwire. Worktrees are retained for Claude;
no inherited registrations are pruned. `HARNESS_REVIEW_WORKTREE_ROOT` can choose a writable
worktree directory for this invocation. Evidence lives in the launcher's `.cache/review-evidence/`.

A final must account for every Done-when and each changed path. Use `FILE: exact/path` for
inspected files; `EVIDENCE: docs/prototypes/task/` may group generated evidence, but cannot cover
JS/TS/Python/shell scripts. `SCOPE: complete` is required, and `UNCOVERED:` holds the review.
These are reviewer claims, like DW lines, not proof of honest inspection. The main session must
still read the final and assess coverage. No software parser can prove the model understood a
file. Missing scope is posted with all findings under a note, without approval or a status label.

Retained: full prompt/settings/diff/inventory, stdout events, stderr, final and receipt containing
exact expected/actual model, session, exit/duration, failure and output hashes. Raw CLI failures
and finals are retained as well. Review evidence must be copied into the task's owned tracked
path and pushed before cleanup; `.cache` is durable locally but is not published evidence.
Do not rerun historical trial runners: their paths identify the original measurement.

## Monitoring and exits

Run as one systemd unit with one `watch.sh` monitor. Track the printed stdout.jsonl path and
run log; `tools/harness/peek.sh <stdout.jsonl> -n 20` reads current Claude tool/message progress.
The log prints the UUID and exact model after init. Startup, idle and total timeouts use the
existing reviewer limits; timeout/cancellation kills this run's own process group and retains a
failure receipt. There is no model/provider fallback. OpenCode continues to use its existing
session/export monitoring path.

Shared exits: 0 posted/labelled; 2 usage/stale brief; 3 no valid run (no label or post); 4 full
review posted but held for main-session assessment. `--dry-run` still bills a real review, but
prints the posting plan instead of publishing. Wrong identity, nonzero CLI exit, malformed
stream, missing/duplicate init/final, denied tools or hook rejection cannot approve code.

Validation: `node --test tools/harness/test/claude.test.mjs` includes the real entry point with
fake Claude/GitHub executables, family/blocked gates, scope/DW holds, error streams, retained
failures and startup/idle/total cleanup. `npm test` runs it in CI. Issue155 carries the real
backend trial and adoption findings. Other projects can port the Claude module and entry-point
branch, switch-model support, peek support, roster entry and tests together; preserve their own
guard, labels, family configuration and default reviewer. No agy dependency is needed.
