# T28 battle controls acceptance

The main session prepared acceptance before native Sol High implementation.
The default reference route adopts explicit capture-choice rules. Its prior
behavior remains a development compatibility variant `battle=legacy`; only
that existing test navigation changes and all its assertions/goldens remain.

Pinned design: isle-wars-archaeology design/ui.md at
ae298e37c2f5177039e55767607f9345b6cb0e7a, Attacks, Move-in after a capture,
Combat feedback/UI5 and Pacing/UI6. Threshold defaults2 and remains remembered;
the effective value is clamped at battle start and held fixed through losses.
Current supported speeds Slow/Normal/Fast use600/400/200ms exchange holds.
The Normal5000ms watch budget pauses before a thirteenth exchange; continuing
watching permits the next exchange, Stop cancels it. These are approved
presentation proposals, not measured original-game rule values. Instant and
full settings persistence remain T56. UI outcomes come from ordinary apply;
tie presentation replays exported resolve on cloned state/RNG and consumes
no extra game-stream draw.

The agreed pure BattleController API and snapshot shape are in the parent
`tests/ui/battle-fixtures.ts` interface; the injected scheduler exposes
schedule/cancel, and tests fire even cancelled callbacks to check generations.
Obsolete revisions, disposed handlers and pending unrelated input refuse
without history/RNG/view changes. Source/target/result context survives Stop
and capture confirmation.

Browser fixtures use accepted A and ordinary legal setup, income and attacks;
no ownership/army/RNG injection. The runtime map adapter validates schema
with snake-case external keys before creating the typed GameMap. All visible
ownership/counts are compared against independent core replay. Tied rolls,
manual/threshold stops, quantity1/all-but-one, typed invalid quantity, counters
and stale controls are checked at both1280x800 and1920x1080. Screenshots are
review artifacts for the owner; passing checks do not prove the desired look.

A disposable controller and temporary wrapper around the old App prove the
acceptance pipeline feasible; they are mock evidence, never the implementation.
Original attempts/failures remain in owned paths. The baseline controller
adapter delegates inherited single-exchange apply behavior rather than
raising a missing-module loader error. Initial callback-access failures were
replaced with stronger queue-size assertions before dereferencing callbacks.
Early mock browser failures exposed selection synchronization, a multiple-tie
locator, external-schema field names and a lost old End turn element; fixes
to the disposable mock/parent harness are preserved with source-input archives.
The final tie check asserts every actual tied row is visible.

`run-command.py` retains exact command stdout/stderr archives and hashes.
`run-browser.py` uses pinned Playwright1.63.0-noble, archives exact runtime/test
inputs before execution, checks source stability and retains captures plus
raw logs/HTML/legacy screenshots. `preflight-mutations.py` proves Stop and
pending-selection bypasses fail from a green9-case mock baseline and restores
mock bytes in finally. It applies only to historical mock source, which will
be removed before actual implementation.

Final preflight:9 controller and10 new browser cases fail without the feature.
The disposable mock passes9/10 plus465 full unit tests/build; the legacy
reference variant retains4 passing cases and541-action conquest per viewport.
Stop deletion fails2 controller cases; combined pending-selection guard
deletion fails1. Source bytes restore exactly after those controls. All
temporary runtime files were archived (including the mock build), then removed;
referenceGame.ts restores byte-for-byte to its original. Parent acceptance
therefore lands before the actual implementation. Legacy test navigation
is the sole prior assertion-file change, and no goldens changed.

Portable parent index is artifacts.sha256.json plus its small shards.
Verify with verify-evidence.py. This pins acceptance before implementation;
later implementation evidence needs a new immutable index.

## Actual implementation and retained checks

Native GPT-6.1 Sol High implemented the production controller, reference host
and battle view independently of the disposable mock. The pure controller
uses one ordinary apply per chosen exchange and a copied seeded resolver trace.
The view keeps every tied roll of the latest exchange visible, captures input
revisions, and preserves keyboard Stop focus through redraws. Phase controls
also capture revisions. Public seat totals and New game move into the header
on this route so all capture controls fit beside visible country context.

The initial actual browser run, `implement-battle-a8rwo1b4`, has six passing and
four failed cases: aria-disabled countries prevented the intended real click
that must reach pending-selection refusal. Production was corrected without
test edits. Inspection of `implement-battle-click-refusal-t9ew6afy` then found
the shared panel's old phase label and a below-viewport confirmation. The
reference host/layout correct both, with new viewport/keyboard checks that
fail when those protections are removed. Every draft/failure remains retained.

Final production validation:

| Command/check | Result | Evidence directory under `evidence/` |
| --- | --- | --- |
| `npx playwright test tests/e2e/battle-controls.spec.ts` | 10 passed, both desktops, pinned image | `final-dw1-foyhn9p3` |
| `npx vitest run tests/ui/battle-controller.test.ts` | 9 passed | `final-dw2-mjb54l1p` |
| `npm test` | 471 passed | `final-unit-15xlmgzk` |
| `npm run build` | pass, core/full TypeScript and Vite | `final-build-5mux8zbp` |
| 10 pinned browser suites | 98 passed, all original assertions/goldens retained | `final-affected-fh2b4muy` |
| Actual-source mutations | 14/14 caught, green baselines/restoration | `actual-mutations-31vze09v` |
| Parent acceptance/core/existing tests/goldens | 82 files byte-exact; old CSS exact prefix | `protected-inputs-8ybgd111` |
| Full branch whitespace | pass | `whitespace-full-pyu9ian8` |

The 98-case run includes battle controls, battle accessibility, explicit legacy
reference, generated gameplay/setup, match saves, computers, complete conquest,
reinforcement and the original authored slice. Its source-stability check is
true; it retains the complete raw screenshot tree and HTML/output archives.
Legacy reference conquest remains exactly 541 actions (163 attacks, 20 handoffs,
337 placements) at each desktop size. No prior golden changed.

`mutate-implementation.py` saves actual source bytes before any edit and restores
them in `finally`. It requires green 15-case controller and focused browser
baselines, then rejects disabled Stop, combined pending-selection bypass, missing
revision/generation checks, threshold drift, missing tied dice, wrong speed
scaling, skipped watch pause, disposed commands, paused threshold edits, wrong
phase text, lost keyboard focus, capture overflow and stale phase commands.
The restored baselines pass. `source-snapshots.tar.gz` losslessly retains every
baseline/mutant byte; `raw-logs.tar.gz` retains exact command output. Each browser
mutation has its own source-input and raw-output archives beside the report.

Latest integrated owner-review captures are in
`evidence/final-affected-fh2b4muy/captures/`:

- `accessibility-Oo9DnR/capture-controls-fit-1280x800.png`
- `accessibility-KhNWsy/capture-controls-fit-1920x1080.png`
- `battle-9TLuqK/single-tie-1280x800.png`
- `battle-V7QT4d/single-tie-1920x1080.png`
- `battle-gsbyk5/manual-stop-1280x800.png`
- `battle-qmkC35/manual-stop-1920x1080.png`
- `battle-wAVzAY/capture-maximum-pending-1280x800.png`
- `battle-jFp15I/capture-maximum-pending-1920x1080.png`

These establish operation and viewport fit; readability and pacing await the
owner's assessment. The setup is explicitly developmental and all-human.
Reference save/load (T31), intended one-human/three-computer setup/policy (T32),
and Instant/full presentation persistence (T56) remain separate tasks.

The current portable index is `artifacts.implementation.v1.sha256.json` and its
shards. Run `python3 docs/prototypes/new-game/T28/verify-evidence.py
artifacts.implementation.v1.sha256.json` to verify current source, every tracked
evidence file and every archived member. Historical `artifacts.sha256.json`
continues to pin the parent acceptance at commit `c3d2645`; verify that historical
index in that revision, rather than against the implemented runtime. Neither
historical index nor any raw measured output is overwritten.

## Independent review and parent recheck

MiniMax M3 approved reviewed commit `e7133a0`, session
`ses_eba3d89d7ffeAZ7emsNGkUroB6`, exit0, 2411.307seconds (40m11s).
It independently reran 471 units/build, 15 controller cases, 10 focused browser
cases and all98 affected pinned browser cases. Its fresh browser reports match
all51/43 recorded source inputs against that exact reviewed commit and confirm
unchanged sources during execution. `evidence/reviewer/` retains its exact session
export, final review, unique external archive/manifest and import verification.
The archive SHA256 is
`ad4fd239ae82216b09a804392ff08f5febc129482f46c6778281f07e52ac86e1`.

The reviewer first ran host-browser and ad hoc container experiments, encountering
paused-clock click timeouts and screenshot-directory permissions; the supplied
pinned runner subsequently passed. Raw exploratory output is available only to
the extent retained in its exact session export and fresh evidence archive;
not every temporary script/debug artifact survived. The review's aggregate claim
that every mutation failed overstates its exploratory results: surviving guard
deletions are acknowledged by its own detailed findings. Authoritative author
mutation proof remains the exact14-case archive above. Do not treat the review's
aggregate mutation sentence as an additional all-killed proof.

The full three nonblocking findings are retained in `reviewer/review.txt` and
GitHub follow-up #129: direct running-selection refusal coverage, invalid threshold
value coverage, and stale Start combat revision coverage despite engine-phase
redundancy. No production guard was removed and no current production bypass was
reported. The owner accepted the battle captures at implementation commit
`91d4e73` and authorized continuing; approval is recorded on PR128.

Parent pre-merge rerun `parent-premerge-yw91b42l` passes all14 focused pinned
browser cases with stable inputs. `parent-premerge-controller-9xlp2i57` passes all15
controller cases. Production and original parent assertions remain byte-identical
to the approved review head. Default one-human/three-Normal-computer setup remains
the explicit T32 milestone requirement.

`artifacts.parent.v2.sha256.json` pins source and retained evidence through this
parent batch; its final verification receipt is a separately committed self-check.
