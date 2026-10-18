# T71 parent preflight proposal

This is a design/acceptance proposal, not adopted runtime code, frozen acceptance,
browser proof, task completion, or owner appearance approval. Only this directory
was written. No existing tests, source, task files, RUN-NOTES, T37 paths, commits,
network, CI, or paid model calls were used.

## Observed source seams

- `ReferenceBattleGame` hosts reference and geographic presentation. Its topbar
  already owns totals, pause/speed, event-log access and files; keep these outside
  the changing battle body. Both routes preserve a `BattlePreferences` object
  across host replacement, suitable for a session presentation preference.
- `Panel.render` changes `.pick` from reinforcement income rows to a selection
  list, changes phase-labelled padding, and appends variable battle-log text.
- `BattleView.render` replaces the battle section every revision. Optional dice
  have one row per reroll, while capture adds a quantity form. Natural height varies.
- `FriendlyMoveView.render` hides/replaces its section; the host switches battle,
  friendly movement and victory sections. `.phaseActions` is replaced per phase.
- CSS gives `.panel` natural flex children with scrolling, gives status order -1
  and phase actions order 2, hides reinforcement content on battle phases, and
  changes panel/card spacing for reinforcement. The sidebar width is 350 CSS px
  at 1280x800 and 440 at 1920x1080. Width alone cannot stabilize card bounds.
- `dispatchComputer` sets `mode: battle` even for friendlyMove. AI has no separate
  source-selection action: attack publishes source/target with the exchange.
  Therefore tests must not invent a selection timer or computer movement form.
- Computer totals/tally currently mean the latest exchange, not accumulated
  battle history (`dispatchComputer` resets wins/ties each action). T71 must not
  change that meaning silently.
- Existing browser suites exercise fake clocks, ordinary versioned loads/downloads,
  actual controller callbacks and pinned histories. Unit tests run without a DOM
  package; the mounted setup unit test supplies a minimal DOM adapter. Mounted
  T71 tests need a capable adapter or real browser checks for layout/focus; do not
  claim a source-string assertion proves accessibility.

## Proposed presentation contract

Use one native select labelled `Panel detail`, options `Compact` / `Detailed`,
default `compact`. Put it in persistent topbar playback controls with the existing
pause, speed and log controls. The visible option states the current mode; keyboard
selection reverses it. A two-option select avoids ambiguous pressed/expanded state
and adds no second toggle. Proposed session type `PanelDetail = 'compact' |
'detailed'`, optional `detail` field on `BattlePreferences`, normalized to compact
when absent. Set root `data-panel-detail` on mount/change; mode changes only
presentation and must never dispatch, replace state, alter revisions/RNG/history,
or reschedule the queued computer callback. Persist within setup/load/new-match
session through the existing preference object; full storage persistence is T56.

Keep the turn/status card, action card and recent-log card in fixed grid tracks
within the available sidebar height for each viewport/mode. Allocate a small
turn/status track, flexible active-content track and bounded recent-log track.
Do not size every phase to the maximum hypothetical dice/capture content. The
active-content track is useful content space: stable summary/context, essential
actions and mandatory choice area, with a bounded Detailed detail viewport.
Use the same stable summary slots for reinforcement pool, source/target and latest
outcome, showing phase-appropriate text rather than collapsing surrounding rows.
Stable outer card bounds must not depend on dice count, log length or AI phase.

Compact hides optional dice, duplicate explanatory help/settings for automated
seats, and redundant repeated phase context. Keep round/phase, active seat,
source/target when selected, outcome/progress, army totals, pause/speed/log and
all enabled essential human actions. Human capture quantity, min/max controls
and Confirm; friendly quantity, Confirm/Cancel/Skip; and loss Watch/Stop are
always visible in both modes. Fight-on threshold and battle controls that govern
human decisions remain available. Detailed may expose dice/settings/help in its
bounded detail area, with scrolling for lengthy reroll traces; essential actions
must stay reachable without scrolling the page or the detail area. Test both
real supported hosts rather than adding route-specific mode implementations.

No numeric row heights or empty-area thresholds are frozen here. The parent
must measure a disposable candidate and inspect the small viewport before
freezing those limits. A maximum-height empty dummy card is not acceptable proof.

## Real fixture probe

`discover-fixtures.mjs` loads existing core with Vite SSR only, without listening
on a port or changing source. Seed 1994 with one human / three Normal computers,
domination disabled and no round limit supplies every required action category
on both boards. The human performs legal full reinforcement, endReinforcement
and endTurn, with no attacks; computers use unchanged `computerAction`/`apply`.
This is reproducible fixture construction, not a proposed player policy.

The report retains every ordinary action and first relevant pre-action versioned
save. `capture-pending` is a prefix BEFORE the attack that captures; run that
attack to see capture state. `capture-movement` is the prefix actually in capture.
The reference trace covers all categories by 48 actions; geographic by 63.
`selection-ready` is before endReinforcement; its next state is attack with no
selected source. `exchange` / `repeated-pair` provide real selected exchanges.
`friendly-movement` is a pre-action prefix; its next state hands to another seat.

The first probe completed successfully but Vite attempted broad file watching
and produced ENOSPC watcher diagnostics. A second attempt using `watch:null`
also emitted those diagnostics; the directory named `clean-probe/` is that
unsuccessful watcher-suppression attempt, not a clean run. Both raw
output/report/input sets remain untouched. `final-probe/` is the corrected run
using configFile:false and an ignore-all watcher; it exits 0 with zero stderr
bytes. All three fixture reports have identical SHA256
`e765d2a309ea4fada9242068bfc55d7cb9a25cdf8f9537797dd67ccfb0a3a320`.
Never interpret watcher noise as a UI negative. The seeded initial mover is
computer on both boards; the probe's ordinary human actions are only used if
a trace later reaches a human turn.

## Parent-owned acceptance before implementation

Browser matrix: 2 viewports x 2 hosts x 2 modes. Begin at the earliest computer
reinforcement prefix, then advance actual fake-clock computer callbacks one action
at a time. Read ordinary downloaded save/history to independently label each
state/action, instead of trusting a production data-phase label. Assert exact
next actions against the retained trace; cover reinforcement, attack-ready,
selected attack, two attacks of the same pair, pending capture, captureMove and
friendlyMove. A direct loaded prefix supplements coverage if a later natural
human-loss stops the trace. Do not silently skip a category if the policy changes.

At each labelled state record rectangles for board, topbar, panel, turn card,
action card, log card and persistent playback controls. Compare x/y/width/height
to the first state in that mode/viewport/host, with <=1 CSS px rounding tolerance.
Compare real rectangles of elements; checking only outer sidebar width misses
the reported bug. Record currently visible sections as diagnostics. Check
essential controls fully inside viewport, document no horizontal overflow, no
outer sidebar scroll that hides actions, minimum readable existing typography,
and required choices visible/operable. Reflow after an explicit mode change is
allowed; take a fresh per-mode anchor. Toggle repeatedly during a pending timer,
pause, slow speed and open log, then continue and check exact save equality /
next history action. Retain phase-labelled JSON, screenshots and video, including
small-viewport Detailed and mandatory human capture/movement states.

Use real human pinned pending-capture/move-ready/loss fixtures on both modes to
exercise Confirm, Cancel/Skip and Watch/Stop. Host identity must be appropriate:
do not load a reference fixture into geographic and claim geographic coverage
merely because the outer route URL remains geographic.

Unit acceptance should mount the actual host/mode control through DOM callbacks,
with fake scheduler and independently supplied real state/controller snapshots.
Assert missing preference defaults compact; native label and two values; repeated
mode changes preserve frozen state/history/RNG/revision and pending callback;
replacement retains preference; pause/speed/log state survives mode changes;
optional dice visibility changes; mandatory human controls remain enabled and
confirm the ordinary exact expected action. CSS geometry belongs in browser
acceptance, not a fake DOM or regular-expression test. Freeze acceptance files
and fixture hashes before any formal source dispatch.

## Negative and disposable-positive procedure

1. Save exact source/config/test inputs and hashes in a new owned run directory.
   Run frozen proposed tests against inherited source. Require executed behavior
   failures (missing accessible mode and real card-bound drift), keeping loader,
   browser startup and infrastructure failures separately. Run geometry cases
   independently from the missing-mode assertion so a missing toggle does not
   mask the baseline instability measurement.
2. Parent constructs/mirrors disposable runtime candidate inside its owned
   evidence path. Point a disposable build root at copied source and unchanged
   acceptance; do not modify/adopt production to obtain positive proof.
3. Run the identical tests and matrix against it. Preserve full stdout/stderr,
   exit/timing, reports, screenshots/video, fixture bytes and source snapshots.
   Owner still judges density/appearance; a passing box assertion is insufficient.
4. Independently omit compact hiding, omit stability styles, omit host mode wiring,
   hide human capture/move actions, and dispatch a state action on mode change.
   Each expected assertion must execute and fail for its own reason. Restore each
   mutation using saved bytes in finally, verify hashes and clean rebuild before
   any later claim. At minimum mode/stability deletion satisfies task mutation
   requirements; the other targeted controls cover predicted bypass classes.
5. Retain all original failures and superseded candidates with SHA256 manifest.
   No production adoption, task assertion relaxation or owner approval is implied.
