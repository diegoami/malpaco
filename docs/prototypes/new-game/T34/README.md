# Seeded island geography

`src/core/island-geography.ts` exports deterministic partial geography and entrance reservations. It adds no playable board, rule, save format or UI entry. Read [CONTRACT.md](CONTRACT.md) for the construction, unchanged constraints, designed sampling choices and limits of the witness-based family.

```sh
npx vitest run tests/core/island-geography.test.ts
node docs/prototypes/new-game/T34/sweep.mjs
npm test
npm run build
python3 docs/prototypes/new-game/T34/run-browser.py compatibility --suites tests/e2e/reference-complete-game.spec.ts,tests/e2e/reference-game.spec.ts,tests/e2e/versioned-match.spec.ts,tests/e2e/entry.spec.ts
python3 docs/prototypes/new-game/T34/r2-controls.py
```

Use Node24, or Node22.15+ for the prototype TypeScript loader hooks. Every command wrapper writes a fresh owned directory with source hashes, exact source inputs and raw output archives. The sweep retains all100 outcomes, rejected candidates, constraint classes and replay hashes. Large raw seed/source sets are archived byte-exact with member hashes; loose originals remain local and are ignored rather than deleted.

The following initial evidence is historical and predates the broader-layout rework. The independent parent suite was locked before installation. The absent stub produces9 new-unit failures and0/100 sweep successes. Disposable positive `evidence/mock-preflight-8qho8jkt` and `evidence/sweep-t4EQcS` establish10 new tests and100/100 seeds with100 geometry hashes/four land topologies, identical replay and stable sources. `evidence/full-preflight-j1cgax17` adds603 units/build/24 pinned browser passes with exact stub restoration. That was the initial candidate. Exact integer/rational refinement subsequently passed10 tests/build/100seed replay in `evidence/mock-preflight-0o1mxuh1`; `evidence/sweep-XOJBkB` independently accepts100/100 with100 geometries/four topologies and stable sources. `evidence/final-units-xsghg2v_` passes603 units on the refined installed source. `evidence/controls-4hao3vym` catches all four source omissions with exact restoration. The browser bundle and clock-fixed test bytes are unchanged from the24-case positive.

`evidence/feasibility-zjVwJN` and `evidence/feasibility-QiwWlL` preserve the earlier6/100-seed unchanged-reference-constructor diagnostics. They vary drawing on one graph and are distinct from the new four-topology construction. `evidence/flip-probe-Tg7Pmr` preserves accepted and failed local exchanges. Broad placement failures and the unrepaired77/100 sweep remain, including an explicit source-drift note after a test assertion was added mid-run; that run is not the stable final acceptance.

A blocking one-line T33 test fix (#151, rule12) initializes its fake clock before the fixed pause timestamp. Both old cases failed after host time passed the pause; all809 actions, state assertions, fixture and timing limits remain unchanged. First browser evidence omitted15 hashed task inputs from its archive; an exact-hash-matched supplemental archive preserves them, and the wrapper now archives the complete input dictionary.

`preflight.py`, `full-preflight.py` and `candidate.ts` preserve the parent’s disposable-preflight procedure against the historical stub commit. Use the commands above for ordinary validation after installation. T35 constructs complete boards; T36 measures1,000 seeds, integrates UI and requires owner visual judgment. Cards follow those map tasks under the owner’s explicit roadmap decision.

## Rejected-candidate acceptance

The supplemental Sonnet review exposed an unexercised failure-history branch. Parent omission proof and disposable positive test are retained in T68/r1-proof-jwnmcnpm. The current geography unit test uses a cloned witness mock with invalid label anchors to exercise three real rejected candidates, replayed history/RNG, a51-request clamped to50 and non-finite budgets returning untouched zero-attempt exhaustion. That first acceptance correction left production geometry unchanged. `python3 docs/prototypes/new-game/T34/r1-controls.py` repeats actual-source omissions for failure recording, attempt clamp and first-rejection early exit, restores exact original bytes and runs full units/build. The fresh recorded run is604 units/build green; allthree omissions fail.

The owner required broader silhouettes/layouts after the initial implementation. Original MiniMax approval covers only the old narrow family. `evidence/breadth-amplitude-m02i9_al` retains failed independent-amplitude probes:1/6 seeds valid at4px intervals/8px jitter,0/6 at8px/16px and12px/24px. All rejections/candidates are retained. Independent jitter is inadequate; joint construction must meet unchanged constraints. These are measurements, not a broader generator delivery.

## Broader placement family

The frozen breadth acceptance first failed both new cases on the old source; retained `r2-absent-*` and `r2-absent-sweep-*` prove the negative. The three-plan candidate passed13 focused tests/606 full units/build/24 pinned browsers and100 seeds before adoption (`preflight/r2-mock-swmbla_b` and `evidence/sweep-Y38ssy`), then six independent smoke seeds passed again in `evidence/family-smoke-1ct68uz9` with exact original restoration. `family-candidate.ts` preserves that proven source; the installed source additionally checks T24 fortress/concentration limits determined by reservations. See `family-provenance.json` for the designed construction choices.

`r2-controls.py` runs actual-source omissions for layout, shape, all three fortress/concentration guards and the existing R1 retry-history protections. Its seed98 duplicate-entrance control demonstrates the previous sweep gate accepted99 valid results plus one invalid exported success; the corrected gate rejects that result while retaining all100 records and explicit exported/exhausted classification. The rejected-witness test uses four disjoint existing crossings; the initial mock that merely remapped ports was repaired by the constructor, so its failed test runs remain honestly retained as fixture development.

Final current-source validation is retained in `evidence/r2-final-di4unq58`:14 focused cases,607 Vitest cases plus6 harness tests, build and24 pinned browsers pass. `evidence/sweep-JPXDhX` accepts100/100 with identical replay and stable frozen inputs,100 geometries/four land graphs,38 middle/62 outer largest-island placements and max36/50 attempts. Every exported success is independently valid. Island aspect max/min ranges from1.215 to1.401. `evidence/family-gallery-pi361ktz` shows nine actual accepted boards across all three plans after orienting the unmoved island7 to the upper-left quadrant; plan frequencies are49/13/38. The gallery receipt preserves HTML/PNG/renderer hashes. This is evidence for review, not owner approval of final game visuals.

`controls.py` is the historical first-family omission runner for `candidate.ts`; its port-repair marker predates the broader constructor. Use `r2-controls.py` for the current source. Frozen run snapshots retain the exact docs/scripts present during each run. Later README/archival documentation changes do not change the tested core, acceptance test or sweep hashes; the archive utility added after the sweep began is absent from that sweep's enumerated inputs. No numerical rerun is claimed for documentation-only additions.

`evidence/integrity-jtiyx5h0` verifies100 recorded source/raw sets and all lossless member archives. `file-inventory.json` lists all75 changed code/script paths, including historical executable probes and immutable source copies; `artifacts.json` indexes952 retained artifact hashes.
