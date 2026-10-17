# Optional agy review pilot

The owner requested a Sonnet trial through the installed Antigravity CLI (T68, #152).
This is an optional supplemental review route. The canonical OpenCode merge-review runner
continues to enforce its existing gate. OpenCode 2 migration is tracked separately in #143.

Discover the installed CLI with `agy --help` and **live** `agy models`; choose the exact listed
model and record the owner choice before dispatch. The measured pilot selects
`claude-sonnet-5-5-high` with `--effort high`. Never infer an available ID from this document.

Create a fresh worktree at the exact reviewed SHA, preserve existing registrations, and give
it existing dependencies without installation. Prepare a prompt with the full task contract,
process §5, one-pass/blocking requirements and Sonnet's tripwire from docs/models.md. Explicitly
state the base SHA, PR, protected behaviors and coverage limits. The pilot is read-only, with
no publishing, CI dispatch or installation. Plan mode is an instruction mode, not a filesystem
security boundary: do not describe it as an enforced read-only sandbox.

The retained runner in `docs/prototypes/new-game/T68/attempt-3/run.py` shows the actual invocation:

```text
agy --model claude-sonnet-5-5-high --effort high --mode plan \
  --output-format stream-json --print-timeout 12m --log-file <owned-run>/cli.log \
  --print <prompt-text>
```

Use subprocess argument arrays for prompt text; never interpolate it into shell commands.
Run through `tools/harness/run-unit.sh` with stdin closed, a memory cap and an outer timeout;
use one `watch.sh` monitor tracking output. Read the `init` event for conversation ID and relay
it to the owner. Stream tool progress in plain language. Preserve prompt, model discovery,
all output events, diagnostics, receipt and exact reviewed SHA before any cleanup.

## Headless permissions

The default requests terminal approval. In headless mode, a denied command can still produce
`status: SUCCESS` and process exit **0**. Check `denied_actions`, actual tool output, final
coverage and verdict as well as the process exit. The first pilot stopped after introductory
text; it is not an approval. The checkout-local PreToolUse hook loaded during attempt 2 but
still did not authorize the command. Its exact config/output is retained as a failed approach.

The approach that successfully authorized the five commands uses `permissions.allow` in agy's documented settings with anchored
regular expressions for five exact commands: HEAD, status, source diff, diff stat, and the
focused geography test. File writes are denied. These grants are applied only for the trial,
with a byte-level restore guard that refuses to overwrite concurrent settings changes. In the
pilot, agy rewrote the settings serialization, so this guard refused restoration. The parent
then removed only the exact temporary permission object and preserved every other setting;
`attempt-3/settings-cleanup.json` records this semantic restoration. Original byte formatting
was not recovered. A `finally`/error path must restore them on failures. The trial does not use
`--dangerously-skip-permissions`. Do not copy this measurement runner as a general concurrent
settings manager; coordinate other agy processes before temporarily changing global settings.

## Assessment and reuse

A supplemental reviewer may report Done-when checks not run; it cannot approve the whole task
on partial coverage. Read its full final response, verify findings against source, relay every
finding, retain a parent assessment, and post the model, role, task, exit, duration, round and
caught/missed defects in model-trials #3, cross-linked to isle-wars-archaeology#9. Do not replace
an existing independent merge review or run CI just for this pilot.

Run `python3 docs/prototypes/new-game/T68/verify.py` to check retained receipts. The checker
rejects missing or changed prompt/output evidence and does not mistake exit 0 for approval.
No general-purpose agy merge-gate adapter has been validated by this bounded pilot.

Sources checked 2026-10-17: [headless mode](https://antigravity.google/docs/cli/headless/),
[CLI permissions](https://antigravity.google/docs/permissions/#cli-fine-grained-permissions),
installed `agy --help`, and installed lifecycle-hook reference. Local measurements, including
the unsuccessful hook grant, take precedence over assumptions about these interfaces.
