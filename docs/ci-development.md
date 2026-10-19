# Development CI and adaptation to other projects

Malpaco keeps the required check named `ci`, complete rules/harness checks, and
every browser case and viewport. Routine code changes test the extracted playable
once. A manual full-release run also tests Vite's source preview. Individual task
Done-when commands still apply, including source-preview commands they explicitly
name. This is an owner-approved development policy, not permission to omit tests.

## The three jobs

| Job | Inputs and result |
| --- | --- |
| `plan` | Small real Git sparse checkout, Node 22, offline CI guard tests, pinned merge diff; emits `docs` or `full`. |
| `verify` | Runs unless the successful plan selected `docs`; npm install, all `npm test` checks, verifier/package acceptance, entire extracted Playwright suite. |
| `ci` | Always runs after both jobs. Its CLI checks their actual conclusions; this is the stable required name. |

Only added/modified `README.md`, `RUN-NOTES.md`, `docs/ci-development.md`,
`docs/tasks/*.md`, and `docs/plans/**/*.md` qualify for the lightweight route.
Unknown paths, executable prototypes, fixture data, model/configuration files,
renames, deletions, malformed metadata and uncertain diffs require full
verification. The guards themselves always run; a docs result is not an empty job.

For PRs, `plan.mjs` requires real HEAD to equal the event SHA, and the merge's two
parents to equal the event base/head SHAs. It reads the complete NUL-delimited
first-parent Git diff with rename detection disabled. This avoids filename shell
interpolation, paginated API truncation, and querying a newer PR head by accident.
Missing parents or malformed input select full verification. Every push to main
and every manual event selects full verification. Workflow-level path filters
are deliberately absent, so the required result always exists.

`gate.mjs` accepts successful plan + `docs` + intentionally skipped verification,
or successful plan + `full` + successful verification. Failure, cancellation,
unknown modes and unexpected skips fail. Checkout failures also fail the job.
If branch protection or rulesets require CI, preserve the existing `ci` context.
Main's read-only API check returned “Branch not protected”; this task changes no
repository settings. Repository process still requires independent review and
green CI before merge.

## One package and the complete browser inventory

`npm test` includes the harness Node tests and the core/UI Vitest suites.
`tools/ci/verify.mjs` runs the frozen and additional CI guards, inspects actual
workflow wiring, audits sparse inputs, then calls the existing
`docs/prototypes/playable/acceptance.mjs` once. That command invokes
`package:playable`, whose normal build includes both type checks and Vite.
There is no stale-dist shortcut or separate routine build.

Acceptance extracts into a fresh directory outside the checkout, verifies archive
paths, SHA-256 inventory and HTTP assets, and checks the bundled launcher. The
verifier checks `BUILD.json.sourceCommit` against actual Git HEAD and, in Actions,
the workflow event SHA. PR builds identify the tested merge commit truthfully.
It writes `PLAYABLE_EXTRACTED_DIR` through `GITHUB_ENV` for the browser step.

Source and release `--list --reporter=json` inventories must agree by file,
location, full title and project identity, not only count. Discovery does not run
browser tests. The actual routine browser command is:

```sh
npx playwright test --config playwright.release.config.ts --workers=2
```

Both existing Chromium projects, their viewports, all cases, screenshots,
assertions, goldens, zero retries and two workers remain intact. The pinned
`mcr.microsoft.com/playwright:v1.63.0-noble` environment remains the rendering
baseline. A `workflow_dispatch` with boolean `full_release: true` additionally
runs `npx playwright test --workers=2` against source preview. Selecting a manual
run and release publication remain explicit owner operations; this change does
not publish anything.

For local reproduction at a committed head:

```sh
node --test tests/tools/ci-*.test.mjs
npm test && npm run build
node tools/ci/verify.mjs
```

The verifier prints its fresh extracted directory. Set `PLAYABLE_EXTRACTED_DIR`
to that directory when running the release browser command locally in the pinned
container. Do not update goldens to make a CI failure disappear. Failed source
and extracted runs retain both report/result directory pairs.

## Sparse inputs and evidence

The verify checkout uses non-cone sparse patterns. It keeps all root files,
source, tests including their PNG goldens, tools, data, public assets, agent
configuration, and broad docs text/code/data. Only docs PNG, archives, video,
PDF and explicitly named split archive parts are omitted. Runtime imports from
T34, T63 and T65, dynamic JSON fixtures, transitive T24 modules, prototype HTML/SVG
and dev-watch acceptance scripts remain inputs. There is no per-task-number list.

Do not add an explicit checkout `filter` alongside sparse inputs: checkout's
[documented inputs](https://github.com/actions/checkout/tree/v4) give the filter
precedence. Sparse checkout already uses partial fetching. Retain real Git
metadata; a source ZIP with fabricated HEAD breaks provenance.

The verifier records every retained file's expected Git blob ID and size, reads
its actual bytes and recomputes that blob ID. Missing or altered inputs fail.
The receipt enumerates omitted historical evidence separately. It follows local
asset references in prototype HTML/SVG referenced by source/tests, rejecting an
excluded or missing asset. Existing unit/build checks and complete browser
execution remain the behavioral closure check. New binary fixtures must be
retained by amending both sparse patterns and their audited policy; do not rename
or remove a test to fit an exclusion. This lightweight scanner is not a general
JavaScript dependency parser; computed runtime paths rely on broad input
retention and execution of the unchanged suites.

Omission from a disposable runner is not deletion from Git. Historical evidence,
archives, screenshots and worktrees remain unchanged. The verifier writes fresh,
exclusive `docs/prototypes/ci/T91/runs/verify-*` directories, including command
results, input inventories, package provenance and any failure. Local proof is
committed with its hashes. Actions uploads the receipt without shortening the
repository's default retention. Main retains final Actions proof durably under
an owned tracked evidence path before using it as merge evidence; an expiring
Actions artifact alone is not a permanent record.

Future temporary screenshot and failure-report uploads use a designed 14-day
retention period. The playable archive keeps the existing default retention;
Actions archives still expire and are not a release publication. Published
release assets and committed proof are durable destinations and are not pruned
by this workflow. Before shortening other artifact retention, identify which
files are sole release/review evidence and preserve those durably first. No
existing artifact deletion or history rewrite is part of this change.

Concurrency groups include workflow identity and PR number; non-PR events use
unique run IDs. Only superseded runs of the same PR are cancellable. Main,
manual and other PR runs do not share those groups. This applies prospectively;
it does not authorize cancelling a run already being used as evidence.

## Measurements and limits

[Baseline run 39270431182](https://github.com/diegoami/malpaco/actions/runs/39270431182)
took approximately 48 minutes: checkout 9m25s, source browsers 17m34s and extracted
browsers 17m33s. Removing one equivalent pass removes approximately 17.5 minutes
of that baseline's work; it is an estimate, not a measured final workflow time.
The local production audit at `9407b827` retained 9,558 files / 548,318,531 bytes
and omitted 7,904 historical evidence files / 10,844,804,137 bytes (95.19% of
tracked bytes), with zero excluded files physically present. It verified five
referenced self-contained HTML/SVG prototypes and 384 identical case/project
identities across both browser configurations. See the
[receipt](prototypes/ci/T91/runs/verify-euS0zA/receipt.json). These are local input
and discovery measurements, not hosted transfer or browser execution timings. Git object compression, runner image start, queueing, network and
artifact upload costs prevent converting byte savings directly into minutes.
The final ordinary Actions run is the measurement of actual hosted behavior;
local discovery and package checks do not claim a hosted or browser pass.

Malpaco is public. Standard GitHub-hosted public runner minutes are free;
private-repository allowances and larger runners differ. Artifact storage and
cache storage have separate retention/allowance rules, so fewer minutes do not
imply a particular dollar saving. See current
[GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions)
before making a cost claim. No account bill or private plan was inspected.

## Reuse: preserve Goal2's existing local/manual policy

Read-only discovery on 2026-10-19 found Goal2 already has a lean, manual-only
`.github/workflows/ci.yml`, designed by its owner in #127. Its optional
`workflow_dispatch` job has a five-minute limit, Python 3.12 and Node 22. It
installs locked harness guard dependencies and runs its existing exact-head gate:

```sh
npm ci --prefix tools/harness/opencode-guard --ignore-scripts --no-audit --no-fund
python3 tools/check_premerge.py --expected-head "$GITHUB_SHA"
```

Goal2's local gate requires a full exact SHA and a clean tracked checkout,
verifies harness.lock, rejects original/session assets, runs its existing
link/harness/permission/workflow/local-validation tests, and repeats checkout,
lock and asset checks afterwards. Task-specific checks and independent review
remain separate. It is a Python research project, not this Vite game. Copying
Malpaco's automatic PR/browser jobs would increase its CI and change its owner
policy; this guide does not recommend or authorize that.

Portable adoption steps for Goal2, or another project:

1. Read that repository's rules, task contracts, workflow triggers, exact-head
   validator, dependency lock and evidence policy. Preserve Goal2's local/manual
   model and its two existing setup/validation commands above. Record a baseline
   from an already authorized run; do not create timing experiments by default.
2. Map existing required checks by their actual names. A manual/local gate may
   have no hosted required check to replace. Do not add a Malpaco-named `ci`
   requirement or automatic triggers without an explicit owner design decision.
3. Identify executable docs and machine inputs before defining a prose allowlist.
   For example `docs/plans/run.py`, findings JSON, harness.lock, fixture data and
   validator configuration are protected even if their neighboring prose is
   cheap. Malpaco's Markdown allowlist is repository-specific. If all work is
   already local/manual, a classifier may offer no useful saving at all.
4. Trace test fixtures, scripts, originals boundaries and runtime data through
   actual commands. If checkout is slow, propose sparse exclusions only for
   archived evidence that those commands never consume. Verify every retained
   input byte and run the unchanged local exact-head gate from that input set.
   Malpaco's docs image/archive patterns are examples, not Goal2-safe patterns.
5. Reuse one validated artifact only where a project actually builds one. A
   browser/package graph is Malpaco-specific. Goal2 should retain its existing
   normal local gate and optional manual fresh-runner command; introduce no
   source/release browser pair or invented release command.
6. If future automatic PR work is authorized, first freeze negative tests for
   incomplete/renamed/unknown changes and failed/cancelled/skipped gates. Pin
   immutable Git inputs, preserve the required-name mapping, and scope any
   concurrency to the same PR. Keep manual/research evidence runs independent.
7. Separate disposable diagnostic uploads from sole proof, release assets and
   committed findings. Bound only future temporary artifacts; retain hashes,
   commands, full failures and review receipts durably. Check public/private
   runner and storage billing independently.
8. Roll out in one isolated reviewed change. Compare retained-input and command
   coverage, run the existing exact-head gate, then use one ordinary authorized
   hosted checkpoint if the project's process requires it. Record actual time
   and limitations. Revert that change to roll back; preserve evidence and the
   existing local gate rather than weakening it when an assumption fails.

For Malpaco rollback, revert the implementation change through normal review;
the former unconditional single-job dual-browser workflow remains in history.
Do not delete proof or disable the stable required check to make a rollback green.
This guide changed no Goal2 file, workflow, repository setting or task contract.
