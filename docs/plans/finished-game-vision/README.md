# Malpaco: the finished-game experience

Owner review package for [#215](https://github.com/diegoami/malpaco/issues/215).
Prepared against source revision `e8e3f908fbea8ed74e5cb26c03690a71e4c1f25d`
on 2026-10-19. The owner has approved **V1–V5**, requiring nice organic maps,
deferring flavour naming, and replacing the first sketches' text-heavy layout
with a full-screen map, icon actions and temporary contextual information.
[Exact decision and amendments](DECISIONS.md).

Start with the [revised sketches](SKETCHES.md). The journey below incorporates
that direction. The [authority crosswalk](AUTHORITY.md) identifies the existing
contracts to reconcile. Revised sketch acceptance, backlog approval and product
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
feel like a coherent place. The only standing controls are small action icons;
text appears over the map when an interaction or requested information needs it,
then clears. There is no permanent title bar, action dock, sidebar or log.

The revised original illustrations explore organic coasts and varied territorial
shapes. They do not prove production generation, topology, fairness or visual
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

### 2. Read the place and find the first useful move

The map shows geography, land neighbours, sea crossings, ownership and production
centres. Relevant army counts appear when inspecting or selecting countries; a
requested information view can expose more detail without making it permanent. Ownership has a symbol as well as colour. Selecting a country
reveals its full identity and legal choices. Focus, zoom and a country list make
dense areas usable; a tiny phone overview cannot promise every label is legible.

An island is understandable as both a place and a strategic unit. Income and
island benefits explain why a front matters. Players should be able to answer
“what do I own, what can I reach, and what happens next?” without opening a log.
Complete totals and histories open on request and close back to the unobstructed map.

### 3. Make a deliberate turn

Placement shows the available reinforcement pool and why it exists. The existing
one-army placement interaction remains. The player then selects an owned source
and an adjacent enemy; selection stages the pair. **Attack** explicitly commits
one existing exchange. Its outcome distinguishes a casualty, a held territory
and a capture. **Fight on** becomes available only after that pair's first
explicit Attack; changing the pair clears that confirmation.

After capture, the game presents the required move-in amount, the legal bounds
and resulting armies. The player confirms the choice. Friendly movement and
End turn remain reachable. Cards, mandatory rewards/discards/targets and events
follow the approved phase and information rules; they are not a second action
system invented by this vision. Options that disable a system remove its prompts
coherently while keeping help accurate.

The player can inspect, read history, pause, move the camera or rotate the device
without committing a battle or losing a pending choice. Required choices always
have a discoverable return icon with an accessible name and explanation on request; End turn cannot bypass them. Pause and speed explain
what is running. Feedback can be paced or reduced without changing outcomes.

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

Sketch approval asks whether this is the right product and visual direction.
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

## Revised sketches, then backlog reconciliation

V1–V5 are approved with the [recorded amendments](DECISIONS.md). Review the
revised quiet map and five interaction scenes; the first text-heavy sketches
are superseded. Only after that review reconcile existing issues as
**retain / revise / defer / drop / already satisfied**, with reasons, evidence and
explicit amendments for conflicting dock/panel/label assumptions. Carry organic
geography as required and flavour naming as deferred. Reuse existing issues and
the release map. Present the resulting release slices/backlog for owner approval
before feature dispatch resumes. Vision approval alone authorizes neither
implementation nor publication.
