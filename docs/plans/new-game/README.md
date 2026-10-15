# New-game implementation sequence

Owner-requested roadmap, 2026-10-15. This is the sequence and dependency rationale;
[task contracts](../../tasks/README.md#new-game-implementation) define scope and
Done-when. GitHub labels alone carry task status. Creating these contracts does
not dispatch implementation, approve a topology change, or merge T22.

## Design baseline

Use the approved malpaco designs at archaeology revision
[`ae298e37`](https://github.com/diegoami/isle-wars-archaeology/tree/ae298e37c2f5177039e55767607f9345b6cb0e7a/design):
[core rules](https://github.com/diegoami/isle-wars-archaeology/blob/ae298e37c2f5177039e55767607f9345b6cb0e7a/design/core-rules.md),
[variety](https://github.com/diegoami/isle-wars-archaeology/blob/ae298e37c2f5177039e55767607f9345b6cb0e7a/design/variety.md),
[computer](https://github.com/diegoami/isle-wars-archaeology/blob/ae298e37c2f5177039e55767607f9345b6cb0e7a/design/computer.md),
and [UI](https://github.com/diegoami/isle-wars-archaeology/blob/ae298e37c2f5177039e55767607f9345b6cb0e7a/design/ui.md).
T23 inventories their individual requirements, source confidence, owner decisions,
implementation coverage and unresolved contradictions. A new finding changes a
contract through the main session with its reason, never silently in implementation.

The target remains generated games: 46 countries; nine islands of sizes
3, 3, 3, 3, 5, 5, 7, 7, 10; symmetric connected adjacency; degree 2–5;
14–18 inter-island links; all five fairness checks. Malpaco's existing exactly-16
generator is an implementation, not a reason to substitute that value for the
approved range. Preserve existing rule constants where they agree with the design.

Construct geography and topology together. Shared land borders must agree with
legal adjacency, and sea routes must meet the middle of the intended countries'
facing exposed coastlines. T24 makes the exact construction and tolerances
reviewable. Geometry may constrain board construction, but combat and movement
read declared adjacency, never coordinates. The G prototype is visual evidence;
its degree-six countries cannot silently become the degree-2–5 production graph.

Reuse proven pure rules, tests, action interfaces and release tooling where they
fit. This roadmap does not prescribe a new repository, engine, framework or
wholesale rewrite. Use original code/assets; no predecessor evidence enters here.

## Capability milestones

| Tasks | Deliverable | Boundary |
| --- | --- | --- |
| T23–T25 | Rules inventory, feasible geometry contract, approved seed-1994 reference | T22 remains separately reviewed; exact topology and visual approval precede integration. |
| T26–T33 | Reference-board playable milestone | Thin playable screen first, then capture choice, movement, victory, replay and baseline computers. The reference board is a temporary development fixture. |
| T34–T36 | General generated geography | Island subdivisions, crossings/fairness, then wide-seed and browser acceptance. No changes to agreed limits to improve success rates. |
| T37–T41 | Cards end to end | Deck/draw first, then sets, targeted effects, human UI and computer continuation. |
| T42–T43 | Events end to end | Pure mechanics/replay precede event presentation. |
| T44–T46 | Complete setup and lifecycle | Options, local autosave, resignation and exactly-once records. |
| T47–T50 | Strategic opponents | Public view/evaluation, Normal, level differences, then measured strength and length. |
| T51–T56 | Full presentation | Minimum-size layout, accessible controls, hot-seat privacy, feedback/pacing, original sound and complete help. |
| T57–T58 | Complete-game acceptance and delivery | Full rules matrix, independently extracted artifact, owner judgment and release gates. |

Task numbers provide a default sequential order; each contract's Merge-after
names the actual prerequisites. No automatic parallel dispatch is implied.
Difficulty estimates describe uncertainty and complexity, not elapsed-time promises
or model assignments. Preserve quantitative progress in each measured task's
owned evidence directory. If a work package would outlast one implementer run,
split it further on main before dispatch, using an independently mergeable result
and a measurable boundary (process §2).

## Checkpoints and dispatch

1. Start with T23's inventory and source coverage. Resolve contradictions before
   implementing dependent rules. This planning pass does not claim to have done
   the inventory itself.
2. T24 must expose any feasibility conflict and recommend numerical tolerances,
   label constraints, success rate and bounded attempt budget. Record the owner's
   decision on its issue/PR and commit the resulting contract before T25/T34.
   No success-rate target is invented by this roadmap.
3. T25 requires owner judgment of the reference map and explicit approval of its
   exact topology before T26. T22 completion is not automatic topology approval.
4. T33 requires owner assessment of actual play and appearance before expanding
   the implementation. General generation remains required for T36 and release.
5. T58 requires final owner acceptance, independent approving review and green CI
   before publishing a release or capability tag.

Before **each dispatch**, the main session runs every Done-when command against
the current base and a disposable mock implementation, retaining the results.
A missing future test file is not meaningful negative evidence. Guard tasks
(including T23's coverage checker, T24's constraint checker and T47's information boundary) also need
parent-authored failing tests, one per predicted bypass class, pushed before
dispatch (process §2). Amend unresolved commands/ownership on main with reasons
before marking the issue `status:ready`; dependencies alone do not establish
readiness. Existing regression suites should stay green; show the feature's
specific failing assertion, not a deliberately broken regression baseline.

Follow rules 6–8 and process §§3–5: owner model choices, decisions recorded before
dispatch, isolated worktree, full task and implementer contract in the brief,
append-only run notes, independent OpenCode review, full findings relayed,
green CI and normal merge. These task files neither override prior owner model
choices nor authorize a new model run. Read live model IDs only when dispatching.

Keep measured originals and failures, screenshots, SVGs, logs and hashes under
tracked task-owned paths and push per batch. Prefer persistent GitHub artifact
links over temporary paths or clipboard delivery. Owner judges appearance and fun;
automated geometry checks do not certify parity with Isle Wars Pro.

## CI budget

Run focused checks locally while iterating. Documentation-only planning pushes
use `[skip ci]` as requested by the owner; no workflow or required check is disabled.
Implementation PRs need the normal green CI before merging. Batch draft evidence
pushes rather than triggering a full browser/release matrix for every experiment.
This roadmap does not create a CI-infrastructure task or spend benchmark CI minutes.
