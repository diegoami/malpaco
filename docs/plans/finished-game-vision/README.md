# Malpaco: the finished-game experience

Owner review package for [#215](https://github.com/diegoami/malpaco/issues/215).
Prepared against source revision `e8e3f908fbea8ed74e5cb26c03690a71e4c1f25d`
on 2026-10-19. The owner has approved **V1–V5**, requiring nice organic maps,
deferring flavour naming, and replacing the first sketches' text-heavy layout
with a full-screen map, icon actions and temporary contextual information.
[Exact decision and amendments](DECISIONS.md).

Start with the [revised sketches](SKETCHES.md) and
[illustrated beginner walkthrough](BEGINNER-WALKTHROUGH.md). The journey below incorporates
that direction. Revision 7 applies the interaction changes in the drawings and
expanded walkthrough. The [authority crosswalk](AUTHORITY.md) identifies the existing
contracts to reconcile. The owner accepted the revision-7 sketch direction and
authorized consolidation and merge on 2026-10-20. Backlog approval and product
implementation remain separate gates under #215; GitHub labels carry task state.

## The promise

**Malpaco is an approachable island-conquest strategy game with room for careful
play. Understand the archipelago, choose where to concentrate your armies, and
finish a satisfying match against computers or people sharing your device.**

The board provides the character: distinct islands, useful sea connections and
fronts that change as territories change hands. The interface makes the current
decision easy to find. Depth comes from geography, opponents and supported
options; learning the interface should not be the challenge.

**Nice, organic maps are required for the finished game.** Geography occupies
the full viewport on every device. Islands and territorial subdivisions should
feel like believable real-world geography, with broad structural variety within
each match and across generated maps. Named real islands are illustrative
references, not a fixed catalogue of forms to repeat. The only standing controls
are small action icons. Every territory retains its army number in an
owner-shaped badge, including at rest. Prose appears when an interaction or
requested information needs it, then clears. There is no permanent title bar, action dock, sidebar or log.

The revised original illustrations use vivid ownership colours, more irregular
coasts and varied territorial shapes informed by
[real island/province character](GEOGRAPHY-REFERENCES.md). They do not prove production generation, topology, fairness or visual
quality across seeds. Flavour names are deferred; extra prose is not the source
of the game's identity.

## One complete player journey

### 1. Open the game and choose a match

The opening screen offers a clear **Start game**: one human and three Normal
computers, with a generated archipelago. A returning player can load a match.
The seed is reproducible and available in requested match options. Those options explain what seats,
difficulty and rules change; advanced controls do not obscure the default.

The intended complete setup supports the approved two-to-four-seat mixtures,
including all-human play and watching computers, rather than silently limiting
the finished game to the current default. Difficulty names must correspond to
real policies. An unfinished policy must never be advertised as functional.

Starting, regenerating or loading communicates progress and any recoverable
error. Invalid setup or load does not discard the usable match. First-turn help
introduces the immediate decision, with complete help available throughout.
The first-use proposal teaches source selection and legal targets before Attack,
shows both an enemy loss and a human loss, then optional Fight on/Stop. It names
an unfamiliar action when encountered and clears the hint after that interaction.
Icons alone do not establish that a beginner understands the next step.

### 2. Read the place and find the first useful move

The map shows geography, land neighbours, sea crossings, ownership and production
centres. Every country shows its army count in an owner-shaped badge, including
at rest, following the owner's explicit clarification. Fit exposes all 46 counts;
zoomed views show counts for countries in view. Compact badges remain at least
14px in these concepts; short leader lines associate displaced labels with their
country. Reading armies does not require entering an inspection mode. Requested
inspection adds identity, income and island detail without placing an army.
Owner-shaped badges distinguish all four seats as well as colour. Selecting a country
reveals its full identity and legal choices. Focus, zoom and a country list make
dense areas usable. Portrait fits the same board with a 90° turn when that uses
space better; counts/icons stay upright. Swipe to pan when zoomed and pinch to
zoom, with Fit always returning to the whole archipelago in either orientation.
Focus is a separate requested action; tap-accessible zoom controls are available.
The focused world location and pending choice survive device rotation. A tiny overview cannot make every country a
large precise target; focus/list access remains available.

An island is understandable as both a place and a strategic unit. Income and
island benefits explain why a front matters. Players should be able to answer
“what do I own, what can I reach, and what happens next?” without opening a log.
Complete totals and histories open on request and close back to the unobstructed map.

### 3. Make a deliberate turn

Placement shows the available reinforcement pool and why it exists. The existing
one-army placement interaction remains. The remaining pool stays visible as an
icon and number until placement ends, independently of first-use hints. The player then selects an owned source
and an adjacent enemy; selection stages the pair. **Attack** explicitly commits
one existing exchange. Selecting the source marks legal enemy neighbours and
exposes their stacks together; selecting the target also shows the approved
capture odds, explicitly for fighting to capture, not the next exchange. Short
local dice/count feedback distinguishes a human casualty, an enemy casualty and
a capture. **Fight on** becomes available only after that pair's first
explicit Attack; changing the pair clears that confirmation.

After capture, the game presents the required move-in amount, the legal bounds
and resulting armies as a pending preview. The amount supports direct entry,
minus/plus and range adjustment; only confirmation commits it. Folding leaves a
distinct return icon and preserves the draft. The player confirms the choice.
Friendly movement and End turn remain reachable. Cards, mandatory rewards/discards/targets and events
follow the approved phase and information rules; they are not a second action
system invented by this vision. Options that disable a system remove its prompts
coherently while keeping help accurate.

The player can inspect, read history, pause, move the camera or rotate the device
without committing a battle or losing a pending choice. Required choices always
have a discoverable return icon with an accessible name and explanation on request; End turn cannot bypass them. Pause and speed explain
what is running. Computer turns identify the active seat/phase, show local
changes and offer Pause/fast-forward. A recoverable changes view connects those
turns to the next human placement. Feedback can be paced or reduced without
changing outcomes.

### 4. Meet opposition worth thinking about

Computers use legal information and legal actions, complete all supported phases
and continue reliably after interruptions. Normal should present coherent
territorial pressure; Easy and Hard should offer meaningfully different choices
and challenge. These are desired player experiences, not claims about the current
baseline or a promise of an invented win rate.

The owner should judge actual early-, middle- and late-match play alongside
measured strength and length. Feedback explains public consequences without
disclosing private cards or implying that an opponent sees forbidden information.
An AI personality, new rule advantage or tuning target requires an explicit
decision; it does not follow from calling a level “Hard”.

### 5. Leave and return safely; share the device when wanted

The complete lifecycle retains explicit file export/import and adds the already
contracted local save slot, end-turn autosave and preferences. The interface tells
players what can be resumed. Recovery respects validated versions and game
identity; a failed write/load leaves a usable match and explains the problem.
End-turn autosave is not a promise to recover every uncommitted UI draft after
a browser crash. Closing a panel or rotating during the live match must preserve
that draft; crash recovery has a different contract.

In shared-device play, handover protects private choices before the next viewer
acknowledges them. The public board can remain visible. Hidden card kinds must
also be absent from focus, accessible text and histories, not merely covered
visually. The current game's multi-human/card restriction remains until an
explicit approved change; the finished-game private-handover contract does not
silently enable cards in a currently unsupported combination.

### 6. Play the late match with a clear purpose

The selected victory condition and progress are available through the information icon
and appear when requested, then clear when the player returns to the map. Remaining opposition, ownership,
army totals and history make progress understandable as the board simplifies.
Under conquest the player can see the territories still to win. Under an enabled
domination or round-limit rule the game explains that selected condition and the
approved scoring/tie rules. No new threshold is chosen here. A capture still
resolves movement and required end-turn effects before the approved victory check.

The experience goal is a late game with meaningful decisions and readable
progress. Whether the existing rules and stronger late-game computers achieve
that must be established by full matches. This proposal recommends testing those
first. It does not add auto-conquest, opponent surrender or a faster victory rule.
If cleanup remains tedious, the owner chooses a bounded rules/AI/pacing amendment
after seeing evidence; clarity alone is not claimed to solve it.

### 7. Understand the result and want another match

A finished match freezes combat input and explains **who won and why**, with
final standings, seed/options/opponent context and complete history available
on request. The initial result is concise, and remains recoverable after dismissal. **New game**
returns to setup, where the seed and options can be deliberately retained or
changed. Files and history remain reachable; there is no forced jump that hides
the last exchange or required result context.

Loss is a real outcome, not an abandoned interface. If the human is eliminated,
explain the loss and offer the contracted **Watch computers** or **Stop game**.
Watching must not later charge a second human loss. Resignation and replacing an
unfinished game use the existing confirmations, takeover/saved-first exceptions
and exactly-once local records. Watch-only matches do not invent a human result.

The Isle Wars Pro bias is toward direct map decisions, large vivid regions,
readable fronts and quick local consequences. Original shoreline detail and
restrained inland contours support that character without obscuring ownership.
Keep optional Fight on/Stop and computer fast-forward discoverable so repeated
exchanges and waiting do not become unnecessary interface work.

Replay value comes from another archipelago, a better tactical decision, different
supported opponents/options or local competition. Campaign progression, online
ranking and unlock systems are not assumed.

## What belongs in the first finished edition

Owner-approved baseline: retain the complete-game contracts as the
capability baseline, integrate the selected cross-device interaction direction,
and make the experience coherent before expanding modes. This is not a new
task sequence or a finding that those contracts are already satisfied.

| Approved completion bar | Existing authority / review implication |
| --- | --- |
| Generated, readable archipelagos with approved topology, fairness and rule behaviour | T23–T36, T60–T65 and relevant #181 work; nice organic appearance is required, while technique and measurable acceptance still need reconciliation |
| Complete ordinary turns, victory variants, cards/events and coherent disabled options | T26–T43; do not substitute the current partial default for the complete rules |
| Complete supported setup, saves, recovery, resignation and local records | T44–T46 plus versioned replay T31; no silent lifecycle cuts |
| Meaningfully different supported computer levels, including late game | T47–T50; measured play and owner judgment precede strength claims |
| Phone portrait/landscape, tablet and desktop; keyboard/touch, ownership cues and choice continuity | Selected D1–D3 and T51–T54/T78–T88; preserve all residual contracts |
| Controllable feedback, original sound and complete settings/help | T54–T56; sound is already in a contract, so deferral requires an explicit amendment |
| A full match and result in the exact accepted, independently extracted artifact | T57–T58 and relevant delivery gates; owner play acceptance and normal review/CI remain separate |

Approved exclusions from the initial edition: online accounts and
network multiplayer, campaigns, map editor, native-platform ports and
monetization. The V1–V5 approval confirms these boundaries. No new engine or framework is proposed.

Flavour naming #170 is deferred by owner decision. Organic geography is required,
with #173/T64–T65 and #181 to be reconciled against the actual appearance bar.
No specific generator rewrite is selected. Curved-label work #174 must serve
requested essential information rather than add permanent flavour labels;
optional terrain #119 remains a separate candidate.

## How the owner can judge “finished”

The owner has explicitly included usability in their review. Sketch approval
asks whether this is the right product and visual direction; actual first-use
clarity, gesture safety and map interaction belong in playable D4 acceptance.
It establishes no touch, accessibility, generation, AI or fun result. D4 requires
actual playable appearance and interaction. The recommended later acceptance
session is:

1. Start an ordinary generated match without a development URL. Play opening,
   middle, late game and result; inspect income, a battle, capture, friendly move,
   cards/events where enabled, and complete public history.
2. Play a loss/elimination and resignation, including watch/stop and mixed-human
   takeover where relevant; verify records and a second match are understandable.
3. Leave/reload a saved match; import a valid file and reject an invalid or
   unsupported one without losing the usable game. Inspect a required choice
   across pause, rotation and layout changes.
4. Repeat representative interactions on phone portrait/landscape, tablet and
   desktop, with touch, keyboard and enlarged text. Review icon discoverability, contextual text clearing, unobstructed map recovery,
   short-height/list fallback, private handover, reduced motion and audio control.
   At phone Fit in both orientations, use realistic two-/three-digit and compact
   stack values and ask the player to attribute counts for ten randomly selected
   countries. Record errors/assistance. Require each badge centre on its own
   country or in open sea with a leader, never on another country; leaders cannot
   cross other badges or leaders. Verify count/land association beside temporary
   capture/movement cards and retain the visible Stop game label until resolved.
5. Inspect representative retained seeds, computer levels and victory/options
   cases. Use a declared coverage matrix and disclose omissions; one attractive
   seed or scripted win does not prove variety, strength or pacing.
6. Accept the exact reviewed build/artifact with its source revision, hash,
   supported save versions and remaining limitations. Publication remains a
   separate authorized action.

Automated tests establish rule, replay, lifecycle, accessibility-flow and artifact
correctness. They do not establish appearance or fun. Normal session length,
desired player-facing AI challenge, acceptable late-game effort and the
representative match/device sample await owner decisions. T50's pinned measurement
protocol and existing numerical targets remain binding; no release date is proposed.

The [independent revision-7 recheck](reviews/claude-cloud-2026-10-20/recheck/REVIEW.md)
approves the concepts at `82ae510` with [nonblocking follow-ups](reviews/claude-cloud-2026-10-20/recheck/FOLLOWUPS.md).
It confirms all nine revision-6 findings resolved. Current examples still contain
known badge-attribution and single-digit fixture limitations; drawing approval
does not establish generated-map readability or playable acceptance.

## Accepted sketches, then backlog reconciliation

V1–V5 and the revision-7 static sketch direction are approved with the
[recorded amendments and merge authorization](DECISIONS.md). The first text-heavy
sketches are superseded. Next reconcile existing issues as
**retain / revise / defer / drop / already satisfied**, with reasons, evidence and
explicit amendments for conflicting dock/panel/label assumptions. Carry organic
geography as required and flavour naming as deferred. Reuse existing issues and
the release map. Present the resulting release slices/backlog for owner approval
before feature dispatch resumes. Vision approval alone authorizes neither
implementation nor publication.
