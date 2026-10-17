# Historical invocation snapshots

`retention-runner.mjs` and `reviewer150.md` are inert archival copies of the original T34 review invocation and agent definition. They are evidence, not the canonical workflow, current agent permissions or instructions to execute. Their original bytes are preserved here; no imports, cleanup commands or permissions in these snapshots are to be run or applied.

The runner deliberately has no adjacent `lib/` tree and cannot run from this directory. Its historical `git worktree remove --force` and `fs.rmSync` calls describe that old invocation, not authorization for cleanup. Current reviews are coordinated by the main session through `tools/harness/review.mjs` and its current configuration.

Historical scripts under `evidence/breadth-*` and `evidence/clock-fix-*`, including the hardcoded paths in `breadth-joint-r8ghb3fn/gallery-metrics.py`, are likewise preserved measurements of old runs. Read them as evidence; use `family-gallery.py` for the current portable gallery procedure. Frozen source copies under `evidence/feasibility-*/sources` are original inputs, not additional runnable workflows.
