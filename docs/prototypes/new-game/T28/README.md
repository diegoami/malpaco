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
