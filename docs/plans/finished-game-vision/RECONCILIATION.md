# Backlog reconciliation and proposed release slices

Proposal for owner approval under [#215](https://github.com/diegoami/malpaco/issues/215),
prepared on 2026-10-20 against `main` at `d756f18` (PR #216 merged). It applies the
approved [vision](README.md), [decisions](DECISIONS.md), [authority crosswalk](AUTHORITY.md)
and [recheck follow-ups A–E](reviews/claude-cloud-2026-10-20/recheck/FOLLOWUPS.md) to every
open issue (70 on 2026-10-20). Each disposition is a proposal until the owner approves.
Nothing here changes a label, closes an issue, amends a task file or dispatches work.
After approval, the main session does that on `main`, with the reason in each commit
(CLAUDE.md rules 3 and 5).

## Where #215 stands

| #215 Done-when | State | Evidence |
| --- | --- | --- |
| Owner reviewed and revised the vision | Met | [DECISIONS](DECISIONS.md): V1–V5, U1–U5, count decision; PR #216 merged |
| Required capabilities and exclusions explicit | Met | [README](README.md) "What belongs in the first finished edition" |
| Owner approves representative sketches | Met | Revision 7 accepted on 2026-10-20 ("Great, consolidate and merge") |
| Authority reconciled; changed contracts explicitly amended | **This proposal** | [Contract amendments](#contract-amendments-to-apply-after-approval) below |
| Backlog reconciled (retain/revise/defer/drop/already satisfied) | **This proposal** | [Dispositions](#dispositions-one-per-open-issue) below |
| Owner approves release slices before dispatch | **Pending** | [Decisions requested](#decisions-requested-from-the-owner) |

## Decisions requested from the owner

Each decision has a recommendation. Approval of this document approves the
recommendations unless the owner says otherwise.

| # | Decision | Recommendation | Why |
| --- | --- | --- | --- |
| R1 | Release slices and order | Approve the S0–S7 slices below | Several chains in the existing backlog are serial with no real dependency between their steps (T47 waits for T46 records, T51 for T50 AI measurements, T55 for T54). The slices keep each real dependency and let independent tracks run in parallel. |
| R2 | 0.2.0 shape | Keep 0.2.0 as one all-device release; fold T86 into T79 and T88 (twelve tasks) | U3 gives every device the same full-viewport composition, so a separate tablet/desktop composition task has no subject left. |
| R3 | Where organic geography (U1) lives | #181 becomes U1's owner: priority high, no longer `post-playable`/blocked. It runs as its own slice S2, in parallel with 0.2.0. A bounded spike comes first, then a versioned integration task. | U1 is required for "finished", and no issue owns it. #173 (coasts) shipped in 0.1.0 and cannot fix macro shape or region structure. |
| R4 | Legacy routes (`generated-game`, `authored-game`, `game-setup`, `generated-prototype`) | Retire them from the published build in 0.2.0 (T89 removes them, or keeps them only behind a development flag that is not shipped) | They mount the old App with capture-all (#139), a duplicate seed form (#51 R1), a prototype flash (#40) and a mismatched Help (#61). No 0.2.0 task covers them. |
| R5 | Who shows the capture odds at staging | T82 (0.2.0) | The accepted sketches (walkthrough 06–08) show the odds at staging. They are an exact rational value from the existing combat rules (single die, ties rerolled) with no rule change. T54 keeps watch budgets and Instant speed. |
| R6 | Who owns "Help & icon names" | T85 (0.2.0); T56 later keeps complete rules content and persistence | The default geographic game currently mounts no Help at all. U4 makes icon names a precondition for icon-only actions. |
| R7 | PR #196 (responsive-ui DECISIONS/ACCEPTANCE, unmerged) | Supersede it. Write the 0.2.0 acceptance on `main` (`docs/plans/release-0.2.0.md`) and close #196 unmerged, with a pointer. | T79–T89 cite a design authority that exists only on an unmerged branch, and it still carries the fixed-chrome A11 row and the "48px header + 64px strip" row. |

## Proposed release slices

Labels stay authoritative. Each task still needs parent preflight, and the rule-6
implementer and reviewer questions, before `status:ready`.

**S0 · Before feature dispatch (process).** Merge T91 / PR #212 (approved, CI green),
which closes #108 and #118. Settle the implementer/reviewer defaults through
`/switch-model`: `harness.json`, CLAUDE.md rule 6.2 and recent issue comments currently
disagree. If the next reviews run through OpenCode v2, land #143 and then #125 (taking in
#189's bullets) first. A short #214 worktree sweep runs when each slice closes.

**S1 · 0.2.0, full-viewport UI on every device.** Sequence:
**T80 + T79** (camera Fit and rotation first, then the overlay shell, which absorbs T86) →
T81 → T82 → T83 → T84 → T85 → T87 → T88 → T89 → T90.

| Issue | Folded into this task |
| --- | --- |
| #129 | T82 |
| #213 R2 | T82 |
| #175 | T84 |
| #132 | T85 |
| #61 | T85 |
| #51 R2 | T85 |
| #136 (b) | T85 |
| #195 | T79 / T85 / T88 |

Placement of follow-ups A–E:

| Item | Lands in |
| --- | --- |
| A | geometry rule in T87; ten-country attribution test in T88; declared limit on current geometry in T89 |
| B | T87 |
| C | T79/T84 (ui-077) and T85 (ui-054) |
| D | T85, checked in T88 |
| E | T80/T82/T83, checked in T88 |

The release accepts A on current geography as a declared limit. S2 re-runs it.

**S2 · Organic geography (U1).** Preconditions: #122 (T62 `[designed]` wording),
#157 (degree-2 witness) and #134 part 1 (replay fixture uses logical islands). Then:
1. #181 spike, judged against the [GEOGRAPHY-REFERENCES](GEOGRAPHY-REFERENCES.md) bar:
   real-island character, variety within a match and across seeds, and "rotation,
   recolouring or perturbation alone fails".
2. A new versioned integration task, which bumps the generator version, keeps old saves
   loadable and keeps 46/9, degree 2–5, 14–18 links, the five fairness checks, T62 routes,
   minimum region thickness, badge room and focus hit areas.
3. #174, revised to on-request identity on the new geometry.
4. A re-run on retained seeds.

S2 owns `src/core` generation and the presentation provider. S1 owns `src/ui` shell and
overlays. They can run in parallel only where Owns do not overlap; T87 and the S2
integration serialize on map annotation code.

**S3 · Complete rules (events).** T42 (pure core, can start now; it needs only T41,
merged) → T43 (after T42 and S1's T87/T88).

**S4 · Lifecycle.** T44 (after T85) → T45 (its real prerequisite is T31, merged) → T46.

**S5 · Opponents.** T47 (after T41 only; extends T41's `computer-view.ts`) → T48 →
T49 (its UI part also needs T44/T85) → T50. Pure core until T49's setup choice.

**S6 · Finish presentation.** T52 residual, T53 (after T40 and T83), T54 residual,
T55 (after T45/T85), T56 residual (after T45, T85, T55).

**S7 · Complete-game acceptance.** T57 (after S2–S6) → T58 (owner D4 on the actual
build, including U1, reusing the T89/T90 artifact tooling).

**Deferred to after the first finished edition:** #170 flavour naming (U2), #119 optional
terrain, and the low-priority test and documentation follow-ups marked post-1.0 below.

## Dispositions (one per open issue)

Format of each row: *disposition · target or amendment · slice*. Every "revise" lists
its exact clause change under [contract amendments](#contract-amendments-to-apply-after-approval).
"Closes into X" means the issue closes when X merges with the folded obligation in X's
Done-when; nothing closes before that.

### 0.2.0 UI slice (S1)

| Issue | Title | Disposition |
| --- | --- | --- |
| #194 | 0.2.0 parent | **revise** · selected design text → full-viewport map, icon actions, temporary prose, permanent count badges; acceptance includes A–E; mark #197 done (T78 merged, PR #210); strike the stale "Sol Max / Opus High" line · S1 |
| #198 | T79 shell and phone dock | **revise** · dock/header shell → full-viewport map shell with overlay icon controls; absorbs T86; re-preflight (the frozen `82d5e47c` preflight is stale) · S1 |
| #199 | T80 camera and zoom | **revise** · add 0°/90° fit, rotation continuity, gesture safety, E reframing; Owns gains `workspaceState.ts` · S1 |
| #200 | T81 picker and inspection | **revise** (minor) · lists and Inspect become requested overlays; counts readable without Inspect · S1 |
| #201 | T82 explicit Attack and commitments | **revise** · overlay Attack; capture preview with entry, ±, slider, fold/return; staging odds (R5); #129 and #213 R2 folded in · S1 |
| #202 | T83 cards, Raid, rewards | **revise** (minor) · overlay cards; E · S1 |
| #203 | T84 totals, histories, playback | **revise** · requested overlays instead of labelled destinations; opponent-turn notice with Pause and Fast-forward; Changes recovery; #175 folded in · S1 |
| #204 | T85 setup, files, help, result | **revise** · ui-054 concise result; D; Help & icon names (R6); #132, #61, #51 R2 and #136 (b) folded in · S1 |
| #205 | T86 tablet and desktop composition | **revise → fold** · sizes, seams, the "do not stretch" rule and the density judgement move to T79/T88; close into T79 · S1 |
| #206 | T87 annotation hierarchy | **revise** · names on request only; counts at Fit; A geometry rule; B fixtures; the Hazard that contradicts the count decision is replaced · S1 |
| #207 | T88 keyboard, touch, zoom acceptance | **revise** · overlay icon groups replace the toolbar; gesture safety; DEVICE-REPORT adds A (ten countries), D and E · S1 |
| #208 | T89 release candidate | **revise** (minor) · acceptance on `main` (R7) with A11 rewritten for overlays; A limit recorded; legacy routes per R4 · S1 |
| #209 | T90 publish 0.2.0 | **retain** · S1 |
| #213 | T78 follow-up (patch ownership) | **retain** · R2 → T82 Hazard; R3 deferred until untyped callers exist · S1 |
| #195 | T76 follow-up (toolbar, keys, load focus) | **revise (remap)** · R4 → T85; overlap → "overlays never cover required controls or each other" in T79/T88; arrow keys → T88; R5 and the drawer item drop unless reproduced; closes into T88 · S1 |
| #175 | T71 follow-up (newest-entry emphasis) | **retain → fold** · T84 Done-when (still unfixed: `src/styles.css:547`); closes into T84 · S1 |
| #139 | Capture moves armies automatically | **revise** · the supported route already offers the choice (PR #141, #142, #146; `src/core/geographic-game.ts`); the remainder is the legacy capture-all route → R4; retitle; priority low · S1 |
| #132 | T30 follow-up (round-limit, human loss) | **revise → fold** · deciding tie-break named; neutral badge on human loss; closes into T85 · S1 |
| #61 | T20 follow-up (Help name) | **revise → fold** · one name for Help & icon names; closes into T85 · S1 |
| #51 | T17 follow-up (seed form, file input) | **revise (split)** · R2 (180 px file input clips, live in the supported game) → T85; R1 legacy → R4; closes after both · S1 |
| #136 | T32 follow-up (browser evidence, threshold) | **revise (split)** · (b) threshold and speed retained when a load opens on a computer turn → T85; (a) and (c) stay harness · S1 / harness |
| #129 | T28 follow-up (running select, threshold guards) | **revise → fold** · T82 Done-when 2 mutation checks; closes into T82 · S1 |
| #40 | T13 follow-up (prototype mask flash) | **defer** · goes with the legacy-route decision R4; drop if the route is retired · R4 |

### Organic geography (S2)

| Issue | Title | Disposition |
| --- | --- | --- |
| #181 | Varied island and region generation | **revise** · becomes U1's owner (R3): retitle "U1: believable, varied island and region generation"; spike, then versioned integration task; co-constraints listed in S2; labels: remove `post-playable` and `status:blocked`, set `priority:high`, keep `needs:preflight` · S2 |
| #173 | T72 natural coastlines and borders | **already satisfied** · prototype delivered on `task/T72-natural-generated-geography` at `94dda2b7` and approved 2026-10-18; integrated through T74 (PR #186) and T75 (PR #188), released in 0.1.0 (`c3c3ae1`). Close with that evidence, preserving the branch (or tagging it). Macro shape stays with #181. · S2 |
| #174 | Curved region and island labels | **revise** · permanent curved names → on-request identity attached to its land on the new geometry; remove the #170 dependency; after #181 integration · S2 |
| #157 | T34 follow-up (refusal boundary) | **retain** · exactly-one-neighbour witness, also required in #181 integration acceptance · S2 precondition |
| #122 | T62 follow-up (`[designed]` self-trace) | **retain** · wording fix before #181 cites T62 · S2 precondition |
| #134 | T31 follow-up (fixture projection) | **retain** · part 1 is an S2 precondition; part 2 (host click timeouts) is harness · S2 / harness |
| #161 | T35 follow-up (exhaustion diagnostics) | **retain** (unaffected) · #181 re-measures refusal and exhaustion · S2, low |
| #119 | Optional terrain | **defer** · after #181 integration; stays separate from U1 · post-1.0 |
| #170 | Regional flavour naming | **defer** (U2) · replace `triage:needed` with `priority:low`; #174 no longer waits for it · post-1.0 |
| #106 | T22 follow-up (prototype replay wording) | **drop** · archive cosmetics of the superseded G prototype; close won't-fix, keeping the finding on the issue · none |

### Complete-game contracts (S3–S7)

| Issue | Task | Disposition |
| --- | --- | --- |
| #87 | T42 events | **retain** · pure core, no UI; not satisfied (no Storm/Revolt/Harvest on main) · S3 |
| #88 | T43 readable events | **revise** · log context on request; event result overlay needs acknowledgment; marks beside badges; device matrix · S3 |
| #89 | T44 setup options | **revise** · device matrix inside T85's setup view; merge after T85 (T42 for the event-Off option) · S4 |
| #90 | T45 settings and autosave | **revise** · device matrix; the storage notice persists until dismissed (U5); real prerequisite is T31 · S4 |
| #91 | T46 resignation and records | **revise** · record reachable from the concise result's details (ui-054); D in Hazards · S4 |
| #92 | T47 computer view | **retain** · extend T41's `computer-view.ts`, do not fork it; merge after T41 instead of T46 · S5 |
| #93 | T48 Normal opponent | **retain** · S5 |
| #94 | T49 Easy and Hard | **revise** · device matrix through T85's setup view · S5 |
| #95 | T50 measurements | **retain** · no UI task depends on it · S5 |
| #96 | T51 responsive map, compact panels | **drop (superseded after transfer)** · panels contradict U3 and phones are now supported; its full-rules size coverage moves to the device-matrix lines of T43/T44/T49/T57 and A to T87/T88; close when T88 merges · S1 → S7 |
| #97 | T52 accessible ownership | **revise** · residual after T87/T88: high-contrast palette, compact >999 counts (B), three colour-vision simulations, centre symbols, keyboard/touch for event, hot-seat and resign flows; merge after T88/T43 · S6 |
| #98 | T53 private handover | **revise** · cover private hand overlays (T83); merge after T40/T83 · S6 |
| #99 | T54 odds, phase feedback, pacing | **revise** · phase bar and always-visible standings → amended ui-077 (C); log filter on T84's history; staging odds move to T82 (R5) · S6 |
| #100 | T55 sound | **retain** · controls follow U4; real prerequisites T45/T85 · S6 |
| #101 | T56 help, persistence, Off absence | **revise** · content and persistence; layout in T85; first-use hints clear (U5); drop the #170 coupling (U2) · S6 |
| #102 | T57 complete-rules acceptance | **revise** · device matrix in both orientations; organic generated boards meeting U1; merge after S2 · S7 |
| #103 | T58 release and owner acceptance | **revise** · owner D4 of the actual build, including U1 on phone, tablet and desktop; reuse T89/T90 tooling · S7 |
| #172 | T38 follow-up | **retain** (unaffected) · `triage:needed` → `priority:low` · post-1.0 |
| #169 | T37 follow-up | **retain** (unaffected) · `triage:needed` → `priority:low` · post-1.0 |
| #179 | T41 follow-up (`discardTop` provenance) | **retain** (unaffected) · remove `triage:needed` · S5, low |
| #127 | T27 follow-up (map adapter validation) | **retain** (unaffected) · post-1.0 |

### Harness, CI and records (outside the game vision)

| Issue | Title | Disposition |
| --- | --- | --- |
| #211 | T91 simplify CI | **retain** · merge PR #212 first (S0) |
| #108 | T66 cancel superseded CI | **already satisfied by PR #212 once merged** · close into #211 |
| #118 | T67 planning-only CI gate | **already satisfied by PR #212 once merged** · close into #211 |
| #143 | OpenCode 2 adapter | **retain** · S0 if the next reviews use OpenCode v2 |
| #125 | Review cleanup deletes evidence | **retain** · after #143; absorbs #189's evidence bullets |
| #189 | T75 follow-up | **revise → fold** · async-load diagnosis satisfied by 0.1.0 (exact-head CI 39237888108); evidence bullets move to #125; clear `triage:needed` |
| #35 | Raw reviewer IDs in filenames | **retain** · with #143; aliases avoid it meanwhile |
| #65 | Bounded extracted-artifact reviews | **retain** · after #143 |
| #214 | Worktree lifecycle | **retain** · attended sweep at each slice close |
| #3 | Model trials | **retain** · standing log (rule 21) |
| #165 | T36 follow-up | **retain** · harness; re-check its CSS item after T79 |
| #149 | T33 follow-up | **retain** · harness |
| #178 | T40 follow-up | **retain** · harness; remove `triage:needed` |
| #37 | T12 follow-up (stale test counts) | **retain** · docs, low |
| #29 | T07 follow-up (run-notes count) | **drop** · its own triage forbids rewriting the historical record; close won't-fix, both counts preserved on the issue |
| #215 | This review gate | **retain** until the owner approves; then close with links to the applied amendments |

## Contract amendments to apply after approval

Each change is made directly on `main` in the task file, with the reason
"#215 reconciliation, owner-approved <date>". Each later preflight re-checks that every
Done-when line fails on `main` and passes on a mock fix (process §2). No assertion is
weakened: obligations move or change form, and a dropped presentation requirement is
replaced by the approved equivalent.

| Task | Clause (current) → amended |
| --- | --- |
| **T79** | **Title** → "Full-viewport map shell and overlay icon controls". |
| | **Scope:** persistent header, phone dock, short-landscape strip and reserved toolbar space → "map fills the viewport on every device; icon controls with accessible names overlay it; placement pool icon and number always visible; legal phase-action icon; contextual active-seat/phase notices replace the ui-077 bar; no header, dock, sidebar or reserved text region". |
| | **Done-when 1:** measured map reclamation → "map rect equals the viewport minus safe insets; overlays intercept no hits outside their own rects; overlays never cover required controls or each other". Add the T86 sizes and seams. |
| | **Explicit retirement:** the `hideable-panels`, `compact-panels` and `battle-panel-fit` specs are retired, and their invariants restated. |
| **T80** | **Scope:** add "initial 0°/90° fit from board bounds and space; counts and text upright; swipe pans only when zoomed; pinch zooms; Fit returns to the whole archipelago". |
| | **Done-when 1:** add "rotation preserves world-space focus, selection and drafts". |
| | **Done-when 2:** add "swipe/pinch never dispatch a tap action" and E reframing. |
| | **Owns:** add `src/ui/workspaceState.ts` (camera orientation). |
| **T81** | **Scope:** lists and Inspect are requested overlays that clear on close; counts stay readable on the map without Inspect. |
| | **Done-when 1:** add "closing leaves no residual prose". |
| **T82** | **Scope:** "not a seventh dock button" → "an overlay icon control with an accessible name"; capture and move amounts → "pending preview with direct entry, ±, slider, fold/return"; add staging capture odds (exact, labelled "if fought to end", R5). |
| | **Done-when 1:** add the drafts surviving fold/return, and E at short landscape heights. |
| | **Done-when 2:** add running-selection refusal, `setThreshold` value guards and stale-revision phase controls (#129). |
| | **Hazards:** decide workspace patch ownership (#213 R2). |
| **T83** | **Scope:** "readable adaptive surfaces" → "temporary overlay cards on the full-viewport map". |
| | **Done-when 1:** add E (covered countries' badges stay beneath the card; the same counts reappear on close). |
| **T84** | **Scope:** "labelled destinations" → "requested overlays opened by icon and dismissed afterwards"; "Keep Pause visible" → "opponent-turn notice with Pause and Fast-forward throughout AI play; Changes recovery afterwards". |
| | **Done-when 1:** add newest-entry emphasis (#175). |
| **T85** | **Scope:** add the tap-accessible Help & icon names view with one matching name (R6, #61); round-limit results name the deciding criterion, and a human loss shows no winner badge while computers remain (#132). |
| | **Done-when 1:** add "Stop game keeps its visible label for the whole unresolved elimination card (D)". |
| | **Done-when 1:** add "the concise result (winner, reason, New game) reaches standings, seed, options and the record on request (ui-054)". |
| | **Done-when 1:** add "a native file input never clips its chosen file name (#51 R2)". |
| | **Done-when 1:** add "Fight on threshold and speed survive a load or new game that opens on a computer turn (#136 b)". |
| **T86** | Retired into T79 and T88, with the reason; its issue closes into T79. |
| **T87** | **Scope:** "Auto/Always-name detail" → "names on request or selection only; owner-shaped count badges on every country at Fit and zoomed". |
| | **Done-when 1:** add B fixtures (nonsequential 2-digit, 3-digit and compact >999 counts) and the A geometry rule (each badge centre on its own country or on open sea with a non-crossing leader). |
| | **Hazard:** "No always-readable tiny full-board claim" → "all 46 counts readable at Fit at the 14 px minimum; never shrink below it". |
| **T88** | **Scope:** "orientation-aware toolbar arrows" → "arrow navigation within each overlay icon group". |
| | **Done-when 1:** add gesture safety and single-pointer alternatives. |
| | **DEVICE-REPORT:** add A (ten random countries at phone Fit, both orientations, retained seeds, realistic stacks, errors and assistance recorded), D and E. |
| **T89** | **Done-when 1:** the acceptance matrix on `main` (R7), with A11 rewritten for overlay hits and occlusion, plus A–E. |
| | **Done-when 3:** record A's limits on current geography; remove or flag the legacy routes (R4). |
| **T43–T46, T49, T57** | "at both (desktop) sizes" / "all supported sizes" → "the 0.2.0 device matrix" (one amendment per file). |
| | T43: log context on request, overlay result, marks beside badges. |
| | T45: notice persists until dismissed. |
| | T46: record from the result's details, plus D. |
| | T57: organic boards meeting U1, after S2. |
| **T47** | **Scope:** extend `computer-view.ts`. **Merge after:** T41. |
| **T52, T53, T54, T56** | Residual scopes and merge-after changes as listed in the dispositions above. |
| **T58** | Owner D4 including U1; reuse T89/T90 tooling. |
| **T51** | Not amended. It closes as superseded once its transfers have landed in the files above. |
| **#181** | Body and labels as in S2, and a new task file for the versioned integration, written only after the spike reports. |

`docs/plans/release-0.2.0.md` gains the 0.2.0 acceptance matrix (R7) and the
twelve-task graph. `docs/tasks/README.md` and the new-game sequence gain the slice
order and the corrected merge-after edges. Labels change as listed. No status label
moves to `status:ready` without preflight.

## What this proposal does not do

It approves no implementation, model or review run, publication or rule change. It
adds no feature to the finished edition. U1 gets an owner and a gate, not a chosen
algorithm. Sound and help stay contracted. Exclusions stay excluded.
