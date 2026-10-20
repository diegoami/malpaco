# First experience review: usability, enjoyment and Isle Wars Pro character

Main-session design assessment, 2026-10-20, against PR #216 at
`82680bdd7b07aed96df2243f21890e6f25ea9842`. This is a requested first pass before
independent review, not an independent approval or a finding that the game is fun.

The full-screen, vivid island map is a promising direction. The current concepts
still leave important decisions hard to discover or compare. Keep the clear
resting map; make information and feedback sufficient during the interaction.
The recommendations below are review proposals, not new owner decisions, task
contract amendments or implementation authorization.

## Evidence and boundaries

Read the vision, owner decisions, geography brief, gallery and beginner tour;
inspected current native PNGs for all eight teaching frames and representative
quiet/setup/turn/capture/late/result views across portrait, landscape, tablet and
desktop, alongside their SVG drawing sources. In particular, inspected all four
quiet-map devices, both phone capture orientations and desktop capture, both phone
and desktop ordinary turns, and portrait/desktop results. All 37 SVG hashes match
the retained revision-5 manifest. No new rendering, live play or input study ran.

Compared behavioural/design conclusions with the
[pinned approved UI design](https://github.com/diegoami/isle-wars-archaeology/blob/ae298e37c2f5177039e55767607f9345b6cb0e7a/design/ui.md),
especially its board, attacks, feedback, computer turns, pacing, input and
question-by-question comparison sections, and existing T27/T52/T54/T82–T85
contracts. No predecessor artwork, screenshots, assets, source or help text was
imported. This is not a fresh visual comparison with the original executable.
Newer owner decisions supersede permanent panels/counts and the older interaction
layout; that does not remove the underlying need for readable tactical state.

## Findings, in priority order

### U1 · High · The first attack skips the decision the beginner needs to learn

Evidence: [Start combat](walkthrough/03-combat.svg) transitions directly to
[the selected pair](walkthrough/04-attack.svg). The latter says to tap swords;
it does not demonstrate choosing a source and then an enemy. Ordinary-turn
pictures show counts but no distinct source/target boundary emphasis or set of
legal alternatives. The prose describes the missing interaction.

A new player may know how to press Attack without knowing how to set up the next
battle or recover from a wrong selection. Show separate source and target
selection moments. Mark eligible sources, then legal neighbours, with different
selected-source and target outlines; explain a refused choice briefly in place.
Include one changed/cancelled selection. Preserve the explicit Attack commit.
This needs more complete teaching evidence, not a permanent instruction panel.

### U2 · High · Tactical comparison requires too much hidden-information retrieval

Evidence: [desktop turn](sketches/ordinary-turn-desktop.svg) and phone equivalents
show only the selected pair's stacks. They omit the selected battle's capture
odds, which T54 and the approved design already require. The quiet map is useful
as a resting view but cannot alone answer where reinforcements are most valuable
or which front is vulnerable.

Propose a temporary tactical inspection view: selecting a source exposes its
legal neighbours and relevant stacks together; selecting an enemy exposes the
approved odds and their meaning. The odds describe fighting to capture, not the
probability of winning the next single exchange. Offer a requested wider
army/income/island-bonus view for comparing fronts, closing back to the quiet map.
During placement, provide a safe explicit inspection route so learning a stack
never accidentally spends an army; preserve existing Place 1 semantics.
Do not reintroduce permanent totals or silently change tap-to-place behaviour.

### U3 · High · The landscape overview is cropped despite being called an overview

Evidence: [quiet phone landscape](sketches/quiet-map-phone-landscape.svg) and
[landscape setup](sketches/setup-phone-landscape.svg) clip upper and lower islands.
The drawing helper uses a fixed landscape scale. A full-canvas sea background
is not proof that the whole archipelago fits. The retained render check detects
fitted portrait coast overflow, not this landscape issue.

Use actual geography bounds and available safe space to illustrate a fitted
first-open/Fit view in both orientations. Keep zoomed turn/capture scenes clearly
distinct from overview scenes. Fit must reliably return to the whole board;
selection focus must not make the same control's result unpredictable. Preserve
world-space selection/drafts on rotation and show a tap-accessible zoom/focus
route. Validate short landscape heights and safe areas in the eventual build.

### U4 · High · Turn ownership and the return from computer play are not illustrated

Evidence: the gallery and tour stop at [the card acknowledgment](walkthrough/08-reward.svg).
The standing Pause icon and end-turn arrow do not show whose turn it is, the
current phase, why input might be unavailable or what changed between human
turns. The absence of computer-turn scenes is an evidence gap, not proof of a
runtime bug.

Add an opponent-turn/return sequence: brief seat/phase identity, local placement
and battle changes, usable Pause/fast-forward, then a recoverable summary of
relevant changes when control returns. A nontext active-seat/phase cue can remain
while relevant, with details on request; avoid a permanent header or log.
Show folded required-choice recovery and a privacy handover separately. Otherwise
players may mistake waiting or an unresolved choice for a broken interface.

### U5 · Medium · The battle loop does not yet demonstrate satisfying feedback or pace

Evidence: [the outcome frame](walkthrough/05-outcome.svg) changes 3 to 2 and says
an enemy lost an army. It does not depict dice/causality or the player's losing
branch. The eight-frame tour never demonstrates Fight on/Stop, though the prose
retains them. Requiring many isolated swords presses could make a large battle
feel like repetitive work.

Show one loss as well as a success; use short local dice/count/capture feedback,
with visual equivalents for sound and reduced motion. After the first explicit
Attack on the unchanged pair, make optional Fight on and its stopping condition
discoverable, with responsive Stop. Pair changes must clear that confirmation.
Use existing battle/watch budgets and optional speed controls; no invented timing
constant or automatic attack is justified by this review. Evaluate the battle
rhythm in play, including the moment of capture before the amount choice.

### U6 · Medium · The second ownership cue is too small in the phone overview

Evidence: [quiet portrait](sketches/quiet-map-phone-portrait.svg) uses tiny owner
marks. The helper's 4–6 world-unit marks become roughly 2–3 CSS pixels across at
this overview scale. Blue is a small square and purple a slightly skewed square;
selected counts use the same circular badge for both owners. Existence of a shape
in the SVG does not establish that a person can distinguish it.

Use clearly distinct, screen-readable owner cues in focused/inspection views and
selected badges; provide a readable requested ownership overview/list at fit
scale. Check greyscale, colour-vision simulations and the actual vivid palette
under T52. Preserve visible borders and ownership when adding any texture.
Runtime contrast, touch and assistive-technology acceptance remain untested.

### U7 · Medium · Capture previews and large transfers need clearer affordances

Evidence: [ordinary capture](sketches/capture-phone-portrait.svg) shows 5/3 before
confirmation, with only “Move in” and minus/plus/check/fold controls. The beginner
version explains bounds, but neither drawing shows the editable-number or quick
range controls needed for a large army. The folded required-choice state is not
pictured.

Keep a short contextual preview/bounds cue until confirmation, clearly distinguishing
pending allocation from committed counts. Retain controller-selected defaults
(the pictured 3 is an illustrative edited choice, not a new default), direct
number entry and efficient valid-range adjustment. Show the pending return icon
after folding and resuming the same draft. Test an invalid amount, a large stack
and rotation with the keyboard open. Required choices must not timeout or vanish.

### U8 · Medium · Several icons still require unexplained semantic guesses

Evidence: gallery setup and result use a play triangle for Start game and New
game; the load-shaped icon represents files at the result. The tour names Start
and End turn but does not demonstrate opening Help, inspecting an unfamiliar icon
or using Fit. “Fit/focus” combines different navigation goals behind one symbol.

Name unfamiliar primary actions contextually when the screen/phase is first
encountered, including New game and required recovery. Show how to request icon
names through an explicit tap-accessible help action; retain hold/focus names as
additional routes, never hover alone. Distinguish returning to setup from
resuming play, and define deterministic Fit versus focus behaviour. Keep names
brief and temporary; verify recovery after tips are skipped.

## Fun and the predecessor's look and feel

The strongest elements to retain are the large colourful land regions, visible
coasts and sea crossings, direct map interaction and conquest changing the map.
These support the requested Isle Wars Pro bias. A bright original sea chart
remains consistent with the previously selected art direction. Flat fills and
rounded controls are an adaptation, not evidence of visual parity with Pro.

The meaningful bias is toward seeing a front, choosing a commitment, reading a
quick consequence and wanting the next move. U1/U2/U4/U5 threaten that loop more
than decorative detail does. Do not let hidden state or repeated menus turn map
strategy into interface work. Restrained shoreline/land texture could be explored
for more physical character, subject to owner visual review; it must not drown
ownership, borders or counts. No replica panels, assets or wording are proposed.

Geographic variety is promising but unproven: the static board repeats four
hand-authored forms in a regular arrangement. The broad real-island requirement
already extends beyond these examples. Review actual seeds for believable shape,
regional organization, distinctive approaches and meaningful fronts, alongside
existing fairness/legal constraints. More coastline noise alone does not prove
variety or interesting strategy.

The requested late-game notice says how much remains; it cannot establish that
finishing is enjoyable. Follow complete wins and losses, including a clear lead,
a contested endgame and an unexpectedly reversed advantage. Record stretches
spent making decisions versus repeating cleanup, and ask what made the next turn
worth taking. Do not add surrender, automatic conquest, new victory rules or
extra rewards without an explicit owner decision.

## Playable checks to resolve the remaining uncertainty

Use the exact identified build and retained seeds/options. Include new players
and a player familiar with Isle Wars Pro; record device, assistance and omissions.
These are proposed observation tasks, not invented acceptance thresholds.

1. Start with no coaching. Identify ownership, goal and current action; inspect a
   front safely, allocate armies, choose and change a source/target, then Attack.
2. Explain a loss and a capture in the player's own words. Adjust and fold/resume
   move-in; find Help and recover after skipping the first-use hints.
3. Compare two fronts, attack across a legal sea link, use Fight on/Stop, watch or
   skip computer turns and explain what changed when the human turn returns.
4. Rotate while zoomed and during a pending choice. Find the whole archipelago,
   reach an edge region, and repeat with touch, keyboard and enlarged text at
   supported short heights. Confirm gestures never become game actions.
5. Complete opening, middle, late game, win/loss and a second match. Observe
   hesitation, wrong inputs, hidden-information hunting, repetitive taps, waiting
   and voluntary continued play; ask about challenge, agency and memorable turns.
6. Review diverse actual generated maps in greyscale and normal colour; compare
   the original game's documented strengths with the owner's hands-on judgment
   of this game's clarity and feel. Preserve all existing correctness gates.

Static inspection supports the direction and identifies the issues above. It does
not establish beginner success, real touch safety, AI challenge, enjoyable pacing
or parity with the predecessor. Resolve the visible design/evidence gaps and
perform playable D4 acceptance before claiming those outcomes.
