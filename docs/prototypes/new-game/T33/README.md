# Reference playable validation

The reference-board, ordinary-turn, victory, save/load and computer slices supply the game behavior. This integration adds no rules, RNG, historical save or map algorithm. Actual human controls and scheduled computer actions drive the acceptance; pure expected-state replay observes the result and never injects engine state.

Reproduce with `npx playwright test tests/e2e/reference-complete-game.spec.ts`, `npm run package:playable`, `npm test`, `npm run build` and `git diff --check`. The pinned wrappers are `run-browser.py <fresh-label>`, `run-release.py`, and `run-command.py <fresh-label> <command...>`. They retain exact sources, command outputs and raw archives under a fresh owned evidence path.

## Geographical presentation candidate

The candidate includes readability #137, direct/repeat attack #138, geographical layout/coasts #111 and shared borders #117. Drawing geometry changes independently of the canonical T63 game map and saves. The 809-action fixture is unchanged:579 human and230 computer actions, one human/one Normal computer, seed7, domination off, friendly movement, pending-capture download/reload/upload, fourteen rounds, elimination and full conquest. Exact state/history is checked at computer handoffs and the winner; finished input freezes and New game restarts.

| Measurement | Retained evidence |
| --- | --- |
| Current input baseline | `updated-input-baseline-npazwq_s`: two exact-army assertion failures from obsolete target-click-plus-button double attack |
| Current source complete game | `updated-presentation-complete-nzu5_3i8`:2/2 pass, same809 actions,32–33seconds |
| Extracted standalone package | `release-in9xedra`:9files/8checksums,4HTTPpaths and launcher outside checkout,6/6 browser cases including both complete games |
| Current unit suite | `updated-presentation-units-dx_k0679`:593pass |
| Archive integrity | `updated-integrity-mkek5fm0`:all four source/raw archive pairs verified; no runtime/drawing differences |

Paths in the table are under `evidence/`. Current source-deletion controls `evidence/controls-hezos6vr` also catch omitted computer dispatch and omitted loaded-session replacement at both sizes, with exact restoration. The reviewed-parent integration retains identical source/test/data hashes.

The sole current-input recipe amendment removes the obsolete second Single exchange press after direct target activation. No actions, expected states, fixture, assertions or timing limits were relaxed. Source complete-game inputs match current sources exactly. Package runtime, tests and static drawing inputs match current bytes; later changes concern provenance capture and presentation documentation.

Package source commit:`6f0d0b8de0fa815110d6b0dcef02f732e410392e`. Archive SHA-256:`32aa87c8fc88c138c24045609a33617d2786848bf1a09ee51d68ea08b3610a37`. Exact archive is `evidence/release-in9xedra/malpaco-playable.tar.gz`. `evidence/windows-preview-s_oyweq2` contains the prepared extracted package/gallery with opening,battle,friendly move,computer turn,capture choice,save/resume,elimination and winner at both sizes,plus matched T22/T63/T64/T65 map views and close-ups. The top-level Windows shortcut `C:\Users\diego\malpaco-preview\OPEN-REVIEW.html` opens this geographical gallery; the prior shortcut and every older version are preserved. Its copy manifest hashes all111 included files; `evidence/windows-copy-new-k2demqgq` verifies the Windows copy, package identity and local gallery links. The corrected preparation metadata is retained beside its original; bundle bytes are unchanged. Node.js22+ launches the package without source checkout or npm dependencies.

## Preserved original investigation

Earlier measurements remain intact: `baseline-complete-27oe007b` (2fullgames),`release-z6kxqt0f` (6extracted cases),`final-units-1dks6w8f` (583units),`affected-compatibility-9caaf95n` (56affected cases),and`controls-5l4jbn86` (deleted computer dispatch/load replacement each fails both desktops; exact restoration). The former package fromd77bd31/SHAaf653a97 remains in its original release directory; root `previews/` preserves that original presentation. Earlier Windows files and screenshots are retained.

`feasibility.mjs` preserves fixture searches: simple human policy loses seeds1994,42,0–6 and wins7. This selected fixture is not a balance or wide-seed claim. Both omitted-capture-amount and explicit-amount drafts remain. The first package wrapper failure from missing container Git metadata is retained; the wrapper mounts existing Git metadata read-only, without changing packaging code.

The owner judges appearance and pacing; automated counts cannot grant that approval. This is a fixed Nine Isles development milestone. Generated boards and terrain decoration remain separate work. The historical capture-all route is unchanged. `artifacts.json` indexes preserved originals and measurements.
