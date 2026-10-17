# Map readability (#137)

Owner now requires presentation/interaction issues before the game can be shown; this overrides the earlier deferral. Main implements; MiniMax independently reviews. T33 appearance/pacing remains unapproved.

Scope: ReferenceMapView and scoped styles; new actual-browser acceptance; intentionally amend only combined seat/army text assertions and two reference opening goldens. Keep T63 drawing/board, core, saves, histories, hit geometry and input semantics byte-exact. Names remain visible but substantially quieter, strengthening on hover, focus and selection. Army counts are the only numeric annotation inside regions. Distinct ownership badge shapes match the score legend; full accessible name/seat/armies and selection context remain.

Done when:
1. `python3 docs/prototypes/new-game/readability137/run.py` passes actual root setup, four-seat ownership, name hierarchy, mouse/keyboard/touch and large-stack real save upload at both sizes. Retain matched views and actual-negative baseline; inspect images, owner judges appearance.
2. The reference-game and battle-controls pinned browser suites pass after the declared text/golden amendment; geometry, complete replay and fit assertions remain exact. Retain original goldens and all failures. No update of unrelated goldens.
3. `npm test`, `npm run build`, `git diff --check` pass; record source identity and evidence before independent review and one final CI. Preserve inherited entries/worktrees.

No broad coastline/border redesign (#111/#117), direct-attack change (#138), legacy-rule change (#139), OpenCode migration (#143), or owner acceptance inferred.
