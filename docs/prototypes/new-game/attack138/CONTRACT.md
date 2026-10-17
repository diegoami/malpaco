# Direct and repeat attack interaction (#138)

Owner requires this before another presentation. Main implements in an isolated worktree, MiniMax independently reviews. Readability137 precedes it; coastline111/shared-border117 follow; T33 remains unapproved.

Scope: ReferenceMapView input intent, MapHandlers optional activation metadata, ReferenceBattleGame and battle guidance; docs/play.md, release PLAY and the current reference-controls section in docs/spike.md. Preserve core, controllers, topology, RNG, saves, legacy route input semantics and all golden images. Lock the actual-input tests before production.

Interaction: selecting an owned source then activating a legal enemy performs exactly one ordinary exchange. Activate that enemy again to repeat without reselection. Mouse click, Enter/Space and touch agree. A held key's repeat events do not issue additional attacks. Shift-click/Shift-Enter/Shift-Space selects a target without attacking, retaining side-panel Single exchange and Fight on. Show concise guidance and engine refusal reasons. Fight on/Stop retain existing behavior. Capture always interrupts for explicit human amount/confirm; arbitrary map/keyboard/repeated inputs cannot confirm it. Computer turns, invalid targets, insufficient armies, friendly moves and stale controls keep their gates.

The main-session contract amendment is limited to input recipes in existing battle-controls/accessibility, friendly-move/feedback, victory-options and versioned-match browser tests: where the test intends only to select before testing a separate control, use the explicit Shift selection gesture; victory's complete real action driver uses the new direct attack. Assertions, fixtures, expected states, timing bounds and goldens remain unchanged. New direct-input tests cover the default gesture independently; no compatibility URL/test mode is introduced.

Done when:
1. `python3 docs/prototypes/new-game/attack138/run.py` passes actual mouse/keyboard/touch first/repeat exchanges, held-key suppression, Shift selection, invalid/friendly/one-army/computer gating, responsive Stop and explicit capture min/intermediate/max with pending save/reload/upload. Compare exact logical state/history/RNG and retain screenshots/action saves at both desktop sizes. Direct/Shift/held-key tests fail before the change; existing gate regressions may already pass.
2. `ATTACK_COMPATIBILITY=1 python3 docs/prototypes/new-game/attack138/run.py` passes affected battle/accessibility/friendly/victory/versioned/computer suites plus readability/entry; no assertions or goldens weakened. Retain actual-source deletion controls with exact restoration.
3. `npm test`, `npm run build`, `git diff --check` pass; audit inherited source/test/golden identity except the explicitly declared input-recipe amendment. Retain commands, source/raw archives and all failures; independent approval then one CI before merge.

No coastline/border work in this change, no full legacy-capture migration139 or OpenCode143 dispatch. Owner appearance/pacing judgment is separate.
