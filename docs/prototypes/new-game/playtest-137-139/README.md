# Current root and owner legacy URL: playtest findings

This investigation compares merged parent `ee147f9` at seed 1994 using ordinary UI actions and real downloaded/uploaded saves. It does not implement T33, a new interaction, map readability changes, or historical rules/save changes. Main session implemented; the owner selected independent MiniMax M3 for review.

## Observed behavior

| Question | Current root `/` | Owner URL `/?view=generated-game&seed=1994&seats=4&opponents=computer` |
| --- | --- | --- |
| Entry/rules | One human, three Normal computers; versioned fixed-reference save; capture choice | Legacy generated board/v1 save; capture-all |
| Repeated enemy map clicks / Enter | Select target without attacking | Select target without attacking |
| Repeated attacks | Two Single exchange actions retain source/target without map reselection | Attack opens a result dialog; after Continue the target must be selected again |
| Continuous combat | Fight on starts; Stop prevents a subsequent queued exchange | No equivalent current battle controls; not treated as a missing current-flow feature |
| Human capture | Fight on interrupts at pending capture; further map input/Enter and elapsed callbacks do not confirm | Engine completes the transfer before the result dialog; no amount control |
| Pending save/resume | Real upload retains pending bounds 1–3; separate confirmations of 1, 2 and 3 yield exact expected histories/armies | No pending choice exists under historical capture-all |

These observations passed at 1280×800 and 1920×1080 in the pinned Playwright 1.63.0 image. The opener is driven by real computer timers (23 current / 26 legacy actions before the human). Independent pure simulation selects legal action sequences; no browser engine state is injected. Saved action histories, exact commands, sources and screenshots are in the archives below. The legacy sequence moved **3** armies automatically; it reproduces the reported behavior class, not the owner's exact historical five-army sequence.

Both maps still display the owner seat plus army count and prominent region names. Current-root screenshots show the move-in range and confirmation button. Those observations support #137's readability request; they do not establish owner approval of appearance, hierarchy or pacing. [Current 1280](previews/root-1280x800.png), [current 1920](previews/root-1920x1080.png), [legacy 1280](previews/legacy-1280x800.png), [legacy 1920](previews/legacy-1920x1080.png).

## Triage recommendation

- **#139:** the default launch correction addresses accidental entry into the legacy capture-all flow. This playtest independently reproduces the remaining explicit legacy behavior and demonstrates current-root pending choice. Keep compatibility semantics intact. The outstanding design choice is whether historical URLs need clearer mode identification; do not close the entire issue as though the old route was changed.
- **#138:** separate legacy target clearing (reproduced) from current-root repetition (works through Single exchange). Direct source→enemy click-to-attack and click-again repeat are a new interaction contract. Mouse/keyboard/touch semantics, safety checks and affected old acceptance must be locked explicitly before implementation.
- **#137:** independent presentation work, preserving logical identities and accessible ownership. It neither repairs combat nor requires map geometry changes. #111/T64 coastlines and #117/T65 shared borders remain the existing geometry work; no duplicate issue is needed.
- **Next scope:** rule 11 favors T33 validation while deferring nonblocking #137/#138. If the owner makes them prerequisites for appearance/pacing approval, main must explicitly amend the milestone/scope before dispatch. This investigation grants no T33 appearance approval or task readiness.

## Reproduction and retained evidence

```sh
python3 docs/prototypes/new-game/playtest-137-139/run.py
npm run build
git diff --check
```

The runner writes a new `evidence/run-*` directory each time. `source-inputs.tar.gz` preserves the measured sources; `raw-outputs.tar.gz` preserves full logs, saves, observations and screenshots. Each report records source and member SHA-256 values, archive hash, command, exit and exact source stability. Local ignored `raw/` folders remain available; extract a retained archive into a fresh directory when reviewing from GitHub.

- **Final positive:** `evidence/run-ux3f5pjl/report.json`: 4/4 pass, 10.4 seconds; source hashes unchanged. An earlier positive is retained at `run-u9y9ihi7` (before comment/diagnostic wording and animation-disabled screenshots).
- **Sensitivity controls:** `evidence/controls-w94sxuj5/report.json`: making map selection attack (`run-xhhv7in3`) and making human capture auto-confirm (`run-x2lsuoxx`) each cause both root probes to fail by behavioral assertions while both legacy probes pass. Actual original/mutant source bytes and raw failures are retained. Every temporary source edit restored byte-for-byte in `finally`. `controls.py` repeats these disposable controls, never a production change.
- **Build/inheritance:** `evidence/checks-ewgtu92f`: build, 583 unit tests, diff whitespace check, and empty diff against parent for runtime, inherited tests, map data, dependencies and browser/Vite config. Only investigation files and append-only RUN-NOTES.md are proposed.
- **Failures retained:** `run-b04tarxc` used the config directory as Vite cwd; fixed explicitly to repository root. `run-nhlbpyan` over-sampled downloads during automated turns and timed out waiting for a download; the exact browser cause is unverified, not a claimed game defect. The final probe advances the independently counted opener and saves once after it. `run-igoor_3g` successfully checked current flow but attempted to click legacy Save through a modal result dialog; corrected to save after Continue. The first control selector matched both move/attack branches; its uniqueness assertion refused before mutation (`controls-c3ne44xu`). No inherited assertion was changed.

## Practical limits

This is a bounded seed-1994 desktop playtest, not a full-game victory run, arbitrary-seed proof, new touch/rapid-key-repeat acceptance, responsiveness audit, or exact reconstruction of the owner's past action history. Save/resume is tested at a real pending human capture; independent computer-capture lifecycle coverage remains in the existing T32 suites. No original-game material is imported. A future interaction or readability task needs its own failing-before/passing-after acceptance; these characterization probes intentionally describe the current behavior and must not silently freeze the future design.


## Independent review and final parent check

MiniMax M3 approved the exact investigation sources at `e820073`, independently repeating 4/4 probes, both sensitivity controls, build/583 units, inheritance and archive/hash checks. Final session `ses_eb75aadccffeY3oNUCKd5GQLpv` lasted approximately 485.017 seconds; the two preceding infrastructure attempts ended without a final review at rejected temporary/dependency paths. Main read each final session before retrying; no fallback model or approving verdict was inferred. All three exact sessions, raw output/briefs, local run-specific configuration and fresh measured reviewer artifacts are published under `evidence/review-attempt1`, `review-attempt2` and `review-final`. Each fresh-measured-evidence archive excludes inherited author files already present in the PR and preserves every fresh source/report/raw-output archive with member hashes. Complete unfiltered reviewer copies and their redundant aggregate archives remain local at `.cache/playtest142-review-retained` and the ignored evidence archives; the unpublished original packet is preserved by local branch `evidence/playtest142-unpublished-packet`. Canonical reviewer/runner files are unchanged.

The full final review is retained in `evidence/review-final/review.txt`. Its screenshot metadata explanation is speculative; this report does not adopt it. The control evidence has distinct original/mutant hashes and exact original-byte restoration, despite imprecise wording in the review. Likewise the old download timeout's precise cause remains unverified. There were no blocking findings.

Main's final unchanged-source recheck is `evidence/run-ljs3ke8j`: 4/4 pass and all 250 source hashes exactly equal the independently reviewed inputs. A prior local recheck (`run-2zwal060`) accidentally discovered the main session's retained copied probe sources under the test directory. Those local copies were preserved outside discovery at `.cache/playtest142-review-retained`; the unchanged official probe then passed. No production source, assertion, config or golden was edited to make that check pass.
