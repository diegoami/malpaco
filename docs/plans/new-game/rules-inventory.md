# Approved rules and implementation reuse

This is the implementation comparison for the four canonical malpaco designs, pinned to
research commit `ae298e37c2f5177039e55767607f9345b6cb0e7a`. The code baseline is malpaco
commit `12fed5af03bebfab52b99f38eef0002c8944bd5e`. References below describe that baseline,
not uncommitted owner changes or a promise that an option already affects play.

The designs are owner-approved malpaco behaviour, classified **[designed]** here. They are
not new confirmations of predecessor behaviour. Each row records the owner approval date,
the pinned source anchor, the canonical requirement, existing code and tests, a reuse
assessment, the remaining work and destination tasks. Code/test links identify a seam to
inspect; they do not claim that those tests prove the entire canonical requirement.

## Coverage and how to read it

| Design | Enumerated units | Inventory files |
| --- | ---: | --- |
| Core rules | 109 | [1](rules-inventory-core-rules-01.json), [2](rules-inventory-core-rules-02.json), [3](rules-inventory-core-rules-03.json) |
| Variety | 84 | [1](rules-inventory-variety-01.json), [2](rules-inventory-variety-02.json), [3](rules-inventory-variety-03.json) |
| Computer | 136 | [1](rules-inventory-computer-01.json), [2](rules-inventory-computer-02.json), [3](rules-inventory-computer-03.json), [4](rules-inventory-computer-04.json) |
| UI | 211 | [1](rules-inventory-ui-01.json), [2](rules-inventory-ui-02.json), [3](rules-inventory-ui-03.json), [4](rules-inventory-ui-04.json), [5](rules-inventory-ui-05.json), [6](rules-inventory-ui-06.json) |
| Total | **540** | **Zero unexplained omissions against the independently enumerated manifest** |

A unit is a canonical-body paragraph, top-level list item (including nested clauses), or
table row; contextual introductions and table headings inside those sections are retained.
It is not a count of atomic propositions or predecessor claims. Requirement text is from
the approved original design, with whitespace folded; no predecessor evidence or assets
are vendored. The matrix is split into small files for reading and review.

[source-manifest.json](source-manifest.json) was enumerated from the pinned designs,
independently of the implementation comparison. It lists IDs, source headings and inclusive
line ranges, plus explicit exclusions for introductory provenance, illustrative model code,
supporting arguments and historical alternatives. These are not alternate gameplay rules.
The canonical text incorporates the owner's decisions and reconciliations. In particular,
do not substitute a recommendation the owner rejected for the canonical variety mechanics.

The [source enumeration audit](inventory-evidence/source-audit.txt) records whole-file
SHA-256 hashes and counts. To reproduce with a local clone of the research repository:

```sh
python3 docs/plans/new-game/inventory-evidence/enumerate-sources.py /path/to/isle-wars-archaeology
node docs/plans/new-game/verify-inventory.mjs
node --test docs/plans/new-game/verify-inventory.test.mjs
```

The verifier seals the manifest independently of the matrix, checks one-to-one coverage,
pinned citations, dispositions, provenance and existing file/task references. Removing a
requirement from both manifest and matrix fails the seal. It does not automatically prove
that a natural-language assessment is correct; review must compare it with the source and
code. Any changed source enumeration requires a reviewed seal update and fresh source audit.

## Reuse and gaps

| Area | Reuse | Remaining work / destination |
| --- | --- | --- |
| Board | `GameMap`, seeded graph generation, symmetry/degree/connectivity and fairness checks | Joint geographic feasibility T24; approved reference T25; silhouettes/subdivisions T34; crossings/fairness T35; wide-seed integration T36 |
| Setup | Options/seats validation, seeded deal, no-complete-island repair, equal army accounting, three opening centres | Correct per-country handicap redistribution and exercise seat mixtures T44; board and complete options UI T26/T44 |
| Income | Complete-island bonus summation, once-per-turn pool, own-country whole-pool placement | Cards T38; reversible UI staging T28/T54 |
| Combat | Malpaco one-die exchange, tie rerolls, two-army minimum and no forfeit | Explicit battle lifecycle and chosen capture transfer T27; controls T28; adjacent friendly move T29 |
| Round/victory | Elimination and conquest mechanics | Random-origin rounds and end-of-turn victory ordering, domination, limit/tie-breaks and no-human lifecycle T30 |
| Replay/storage | Validated settings + seed + ordinary-action replay; reject invalid actions before UI replacement | Generator/rules/action version identity T31; settings/autosave T45; exactly-once records/resign/overwrite T46 |
| Cards/events | `capturedThisTurn`, army/owner state, opening centres | Cards T37–T41; deterministic events/centre effects T42; presentation T43 |
| Computer | Basic legal-action policy and separate RNG seams | Ordinary phases T32; card baseline T41; restricted view/evaluation T47; Normal T48; Easy/Hard T49; measurements T50 |
| UI | SVG map, DOM controls, setup/result/help components, browser scene checks | Full flow and reference playable T26–T33; responsive geography T51; input/ownership T52; privacy T53; pacing/odds T54; sound T55; settings/help/no-trace T56; complete acceptance T57–T58 |

Four discrepancies deserve explicit attention:

- `rules.ts` increments the round at seat index zero. The approved round returns to the
  randomly drawn first seat, including when eliminated seats are skipped (T30).
- Conquest is checked inside `attack()` immediately after capture. The approved lifecycle
  places capture movement and end-of-turn effects before its ordered victory check (T27/T30).
- `MATCH_SAVE_VERSION = 1` validates an envelope but calls the current generator/rules.
  Future changes can reinterpret an old seed/action history unless T31 preserves or clearly
  rejects incompatible semantics before replacing the current match.
- Candidate G is not the canonical generated map. At prototype commit
  `1e472c5de76c588662971fa50ee8e53b7031cfa0`, it has 69 land edges and 16 sea edges,
  with degree-six countries. The [measured audit](inventory-evidence/candidate-g-audit.json)
  names them. Keep its visual learning; T25 must meet degree 2–5 and obtain exact topology
  approval. Do not silently relax the approved invariant.

One further setup gap: `countryShares()` chooses a largest/smallest computer once for an
entire human transfer; the canonical deal chooses again for each country. For four seats
in order with human share +4, the baseline returns `[15,11,12,8]`; per-country redistribution
gives `[15,11,10,10]`. T44 must reconcile the implementation/tests with the approved rule,
including the computer minimum and stable ties. Existing tests do not resolve a source conflict.

## Owner decisions and open implementation questions

The canonical decisions (core 1–12, variety V1–V12, computer A1–A17 and UI1–UI18) remain
upstream at the pin. Their chosen rules, rather than discarded alternatives, are inventoried.
No new gameplay decision is made here. Reuse verified seams; do not replace the engine or
framework wholesale.

T24 must ask the owner for geometry tolerances, label-spacing target, required generation
success rate and attempt budget after its feasibility measurements. The approved UI gives
proposed display constants, not measurements proving all geographic constraints jointly
feasible. T25 requires approval of the exact compliant reference topology and visual result.
T30 must expose and test the distinction between a human-loss result and optional continued
computer watching; that result must not become a second recorded loss later. T50 reports
measured strength/length before tuning proposals. T51/T52 leave the palette and final look
to owner judgment under the measurable readability requirements. None of these is permission
to weaken a Done-when or invent an unrecorded constant.

## Verification evidence

The parent-authored test suite was pushed before implementation (commit `dc7586c`).
[Positive mock](inventory-evidence/preflight-mock.txt) passed 24/24; a completeness-only fake
failed all 23 negative controls in [the negative transcript](inventory-evidence/preflight-incomplete.txt).
Temporary verifier files were removed before implementation. The final
[coverage output](inventory-evidence/acceptance-coverage.txt) and
[test output](inventory-evidence/acceptance-tests.txt) retain the acceptance results.
Actual matrix mutations and byte-for-byte restoration are recorded separately in
[mutation evidence](inventory-evidence/mutations.json). No production code changes belong to T23.
