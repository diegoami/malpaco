# Release 0.3: balance and Android

Parent [#271](https://github.com/diegoami/malpaco/issues/271), owner decisions
[#272](https://github.com/diegoami/malpaco/issues/272). GitHub labels carry live state.

## Direction

The owner requested 0.3 work on 2026-10-23 after publishing 0.2.1, then specified:
Android only; investigate starting deals and island-bonus snowballing together;
approve a Tauri 2 prototype and its build dependencies. The release also takes
confirmed player-facing fixes. Events, new AI levels, hot-seat, sound, decorative
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
| Android data and lifecycle | Split after prototype and #272 answers | Durable local data across restart/update, Back/background, rotation, safe areas, keyboard and accessibility |
| Android delivery | Split after distribution/signing decision | Signed APK and/or store bundle; owner-controlled signing, stable app identity, upgrade test |
| Player fixes | Reproduce candidates below before scheduling | Existing public player flow; protect current intentional removals |
| Candidate and publication | Separate bounded contracts after scope selection | Web and Android artifacts, green CI, manual milestone review, owner device judgment and publication go-ahead |

Android distribution, test devices and lifecycle/data defaults are gathered in
#272. Prototype debug builds can proceed before release signing/store decisions.
No actual bonus formula or new public game options are selected by this proposal.

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

T102 needs explicit reconciliation: its positional clause leaves the margin open;
“within one army” conflicts with the old per-holding army formula when country
shares differ. Its source-browser command also predates the current local/CI split.
Choose exact constructive invariants and the selected bonus formula before
amending this task; preserve its equal-share/spread/replay obligations.

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
