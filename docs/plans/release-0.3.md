# Release 0.3: balance and Android

Parent [#271](https://github.com/diegoami/malpaco/issues/271), owner decisions
[#272](https://github.com/diegoami/malpaco/issues/272). GitHub labels carry live state.

## Direction

The owner requested 0.3 work on 2026-10-23 after publishing 0.2.1, then specified:
Android only; investigate starting deals and island-bonus snowballing together;
approve a Tauri 2 prototype and its build dependencies. The release also takes
confirmed player-facing fixes. The owner subsequently added larger generated maps,
replenishment choices 1/3/5/7 and 1–3 computer opponents, all in Settings for the
next game. Initial launch still starts play immediately. Events, new AI levels, hot-seat, sound, decorative
map work and desktop packaging remain later work.

Keep instant start, one human against three computers, minimal floating cards,
card values 5/8/15, quiet computer turns and local kept games. Share the existing
core and UI between web and Android. New balance rules require a new exact match
identity; all earlier saves replay with their original deal, bonuses and RNG.

## Sequence and decisions

| Slice | Contract | Boundary |
| --- | --- | --- |
| Balance measurement | [T105](../tasks/T105.md), #273 | Fixed four-way comparison, then owner chooses production rules from evidence and play |
| Balance implementation | [T102](../tasks/T102.md), #256 | Amend on main after selection; freeze positional criteria, bonus scope and replay identity before implementation |
| Android prototype | [T106](../tasks/T106.md), #274 | Tauri 2, bundled offline debug APK, real WebView checks; independent of balance selection |
| Next-game Settings | [T107](../tasks/T107.md), #278 | First expose 1–3 computers; map/rate selectors join when their core support is implemented; edits never alter the active match |
| Larger maps | [T111](../tasks/T111.md), #280 | Same grown-island style, more regions/islands, frozen preset sizes and new generator identity |
| Replenishment | [T110](../tasks/T110.md), #281 | Selected 1/3/5/7 value saved with the match and replay; default 3; apply only to new games |
| Android lifecycle | [T108](../tasks/T108.md), #285, parent #279 | Native save/pause on background, explicit Resume; Back closes/folds or backgrounds |
| Android durable data | #286, parent #279 | Atomic app-private snapshots, hydration before instant start, failure recovery and upgrade |
| Android delivery | #282, split build/signing and publication | Signed APK download; Google Play later; owner-controlled signing, stable identity, upgrade test |
| Player fixes | Reproduce candidates below before scheduling | Existing public player flow; protect current intentional removals |
| Candidate and publication | Separate bounded contracts after scope selection | Web and Android artifacts, green CI, manual milestone review, owner device judgment and publication go-ahead |

The owner selected signed APK downloads before Google Play, offline app-local data
independent from browser data, save/pause on background with explicit Resume, and
Back that dismisses/folds or backgrounds the map. Several physical Android devices
are available; record the actual matrix before claiming coverage.

The combined balanced deal + halved island bonuses is selected for a playable
candidate, preserving older identities. Current-map 46-region/divisor-3 measurements
remain a baseline; larger-map and rate combinations require their own checks.
The owner selected prototypes at 46/72/96 regions with more islands, and region
divisors 1/3/5/7 with minimum base 2 and separately added island bonuses. All game options live in Settings and apply to the next game: no
launch-time questionnaire, automatic restart on edit or mutation of the current
match. Defaults stay 46 regions, rate 3 and three computers until changed.

## Larger-map prototype findings

T111 keeps standard 46-region geographic/2 unchanged. The new geographic/3
candidate provides 72 regions on a 1152×680 construction canvas with 11–15
islands, or 96 on 1330×780 with 15–20 islands. The original lattice, country
area, label spacing, sea clearance and bounded acceptance checks stay fixed.
These are [designed] prototype profiles after inspecting T95's construction;
the owner judges their appearance and pacing before adoption.

The fixed seed corpus 0–49 at each size accepted all 150 complete games, with
no exhausted generations or errors. It retained every rejected attempt (15,
14 and 27 respectively); the largest attempt count was 4 of the unchanged
40-attempt budget. Median complete creation times on this host were 100/178/276
ms; maxima were 310/609/1026 ms. This is bounded corpus evidence, not a claim
that all seeds succeed or that Android has the same runtime. `node
tools/maps/run.mjs artifacts/FRESH-DIR 50` records the exact bundle, source
commit/diff, all outcomes and timings.

Settings version 3 migrates prior opponent/rate preferences to standard size.
A new game snapshots its size, divisor and seats under the exact generator/rules
identity. The larger-map prototype uses numbered names because existing themes
lack enough island names; it does not silently repeat names or alter old name
assignment. The preview retains the 14 px count minimum and phone zoom. Its
readability and longer-game balance remain owner playtest decisions, independent
of the held 46-region balance candidate #283.

## Balance investigation protocol

T105 freezes seeds, options, candidate formulas and budgets on #273 before its
full comparison. Baseline uses the published 0.2.1 core, geographic generator 2,
four Normal computers, cards enabled and Domination on. Compare current/current,
balanced/current, current/reduced-bonus and balanced/reduced-bonus on paired seeds.
Keep topology, first mover and initial game RNG paired; document experimental
allocation randomness separately. Report 500 initial deals and 200 games per arm,
including refusal/error/unfinished counts, per-seat and first-mover wins, finishing
rounds, starting concentration/share/army/exposure metrics and round-5 incomes.
State exactly when incomes are sampled and how early finishes and elimination
are counted. These are diagnostic self-play results, not a human-win-rate claim.

T102 uses the selected combined candidate and an explicit graph-position predicate:
BFS-prefix island splits, selected by balanced province counts, with each side's
summed island-seat caps below the minimum seat share. The cap/share invariants
then force every seat onto both sides. A diagnostic over seeds 0–499 at each of
2/3/4 seats found every split feasible. Initial army totals preserve the old total
budget while equalizing seat totals, resolving the old per-holding rounding gap.
Its local/CI checks follow the current process. Exact contracts are amended on main
before implementation; future map sizes/rates do not alter this identity.

## Open-backlog reconciliation

This is a proposed disposition, not a completion claim or replacement for an issue's
labels. Audit current code/tests before closing overlaps or dispatching fixes.
Historical worktree/automatic-review requirements in older task files do not
supersede current CLAUDE.md and process.md. Rewrite affected contracts on main
before using them; never resurrect obsolete controls through an old Done-when.

| Issues | Proposed treatment and reason |
| --- | --- |
| #256 | Balance implementation after T105 and owner rule choice; reuse T102 |
| #244, #222 | Archive answered release questions after checking unresolved decisions; carry forward only explicit residuals |
| #241 | Keep real-device/D4 obligations explicit; 0.3 Android device testing can supply relevant evidence, not retroactive blanket success |
| #194 | Reconcile umbrella checkboxes with shipped 0.2.0/0.2.1; separate carried device obligations from completed delivery |
| #96 (T51) | Reconcile superseded responsive work against T79–T89; do not implement the old panels or 800×540-only scope |
| #90, #91 (T45/T46) | Audit T96/T100 persistence, give-up and scoreboard overlap; retain storage-failure/deduplication gaps, defer obsolete multi-human/file requirements |
| #97 (T52) | Audit remaining accessibility/high-contrast obligations; Android-specific accessibility joins device acceptance, full events/hot-seat residuals wait |
| #99 (T54) | Audit current pause/speed/quiet-turn coverage; remove superseded odds/Fight on promises only through an explicit amendment |
| #101 (T56) | Keep help accurate for selected balance and native controls; complete events/audio/options promises wait for those features |
| #132, #195, #61 | Reproduce current result clarity, focus/keyboard and Help-name issues; fix real player defects, retain retired-route-only cases separately |
| #175 | Check newest-history emphasis with ?log; optional polish, not a reason to restore visible history |
| #129, #213 | Controller/workspace boundary hardening only where current reachable behavior warrants it; do not rebuild removed threshold controls |
| #92–#95 (T47–T50) | Strategic AI and new difficulty policies remain later; T105 measures the unchanged baseline rather than claiming this chain |
| #87, #88 (T42/T43) | Events and centre mechanics/UI remain later, so they do not confound the balance experiment |
| #89 (T44), #98 (T53) | Setup options/seat mixtures and hot-seat remain later; retain current instant-start default |
| #100 (T55) | Sound/audio controls remain later |
| #102, #103 (T57/T58) | Full finished-game acceptance remains later; 0.3 gets release-specific acceptance without claiming unfinished feature coverage |
| #174, #119 | Curved labels and rivers/ridges remain optional later visual work |
| #169, #172, #179 | Card invariant/protocol/provenance follow-ups: current factories and privacy remain protected; no demonstrated player blocker |
| #127, #134, #157 | Preserve replay/map/generator safeguards; revisit concrete witnesses or projection changes only in an owning task, never relax old fixtures silently |
| #161, #165 | Preserve generator refusal/measurement evidence; optional diagnostics only unless reproduced as a player issue |
| #139, #51, #40 | Retired legacy route/prototype behavior: development backlog, preserve old rule/save identities |
| #37, #122, #178 | Historical documentation/verifier ergonomics: archive-aware maintenance, not game requirements |
| #35, #65, #125, #143, #149 | Retired automated review harness/evidence workflow: reconcile with the current manual-review process and Drive archive; no new harness implementation in 0.3 |
| #214 | Historical cleanup/recovery audit stays separate; current repository uses one checkout and no worktrees |
| #136 | Split historical runner/header findings from any remaining preference issue; current UI removed Fight on, so reproduce before scheduling |
| #3 | Historical model-trial ledger, not a release feature |

## Next-game Settings boundary

Changing Settings persists preferences for a future game, not game state. Reload
resumes the current match with its original options; only the existing explicit
New game/give-up flow constructs the next match from preferences. Keep one human
and offer 1, 2 or 3 computer opponents. Map and rate selectors expose implemented
choices only. Never read mutable preferences from core income, AI or replay. Store
selected values with every new match and include these preferences in native
durability/upgrade tests.

## Acceptance

Balance: deterministic construction, no initial full/near-monopoly island under the
selected invariant, equal country/army shares as selected, replay compatibility and
paired measurements with no omitted failures. Owner judges fun and runaway leads.

Android: first launch offline from packaged assets; ordinary legal play; pending
choices survive rotation and interruption; stable data across process death and app
upgrade; Back never commits a move/gives up; safe areas, keyboard, TalkBack and
physical-device use. Desktop Chromium checks alone do not establish these facts.
The prototype records limitations; production acceptance must close them explicitly.

Use the current process: local build/type/unit plus only affected pinned browser
specs; CI runs the full extracted-artifact suite. Add native build/device checks for
Android. Review and owner acceptance precede separately authorized publication;
Android signing identity and reproducible source/asset/APK hashes accompany artifacts.

## Architecture sources

The owner selected Tauri 2 after an initial shared desktop/mobile recommendation;
the Android-only correction does not revoke that explicit dependency approval.
Tauri documents [Vite integration](https://v2.tauri.app/start/frontend/vite/),
[Android prerequisites](https://v2.tauri.app/start/prerequisites/#android) and
[Android distribution](https://v2.tauri.app/distribute/google-play/).
Use minimal native privileges and bundled content. No remote production URL is
substituted for an offline application.

## Owner-requested setting and event investigations

The Pro options screenshot supplied on 2026-10-23 distinguishes starting-army
maxima 1/3/5/7/10 from recurring income. The owner selected a fixed-income pilot
with symmetric starting ranges 1–2 / 1–3 / 1–4; [T113](../tasks/T113.md), #292,
records the bounded protocol. This does not yet replace existing saved rules or
adopt the held balance/map prototypes. Archaeology clarification: isle-wars-archaeology#286.

Production centres are currently marked but their effects and disasters are not
implemented. The owner reopened investigation in #293, preflighting existing
T42/#87 and T43/#88 rather than silently enabling events during balance work.
Original runtime/wording clarification: isle-wars-archaeology#287. Original centre
production is an event effect, not ordinary turn income; Malpaco adoption remains
a separate balance and release-scope decision.

### Archaeology clarification returned

The [starting-armies report](https://github.com/diegoami/isle-wars-archaeology/issues/286#issuecomment-6365980951)
and [production/disaster report](https://github.com/diegoami/isle-wars-archaeology/issues/287#issuecomment-6366008177)
reuse evidence pinned to archaeology commit `084c1087119fcf45f0d0d2774eea7121487f1cb4`;
no new gameplay runs were made. For the inspected unregistered Pro build, 1/3/5/7/10
is a per-country starting-army upper bound, default 3, applied equally across seats.
It is neither a human-only minimum nor a recurring-income divisor. Equal aggregate
seat budgets in T113 are Malpaco's designed fairness constraint, not a Pro finding.

Frequency controls the event path (effects and presentation) in the static reading,
not merely notification visibility. The original draw precedes suppression/override;
Never is not established as consuming no random draws. Malpaco's proposed Off/no-draw
contract therefore remains an intentional design choice. Centres provide no ordinary
income; production is a local stack-doubling event and relocation changes the centre
list. Preserve the distinction between event announcements observed in recordings
and uncorroborated exact before/after effects, capture-marker persistence, registered
alternatives and other versions. These returns inform #292/#293; they do not adopt
event mechanics or change the held prototypes' acceptance requirements.
