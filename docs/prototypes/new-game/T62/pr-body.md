Closes #115

Proposes country-specific exposed-coast attachment and independent route tracing for owner-selected T60 A, replacing the old midpoint prescription only after owner approval. A passes; baseline exposes two inward-attachment misses, one insufficient unrelated-coast margin, one short endpoint span and six route-pair contacts. A retains 30 disclosed old-midpoint conflicts.

[designed] Owner decision: 8px competing-country margin, whole 12px inward continuation, 20px direct endpoint span, 10px unrelated-coast clearance and 10px separation of every route pair, including shared-country pairs. These geometry proxies do not prove comprehension or generation success. A minimum competitor margin is 9.857px versus baseline 27px; 10px competitor or 25px span criteria would reject A.

Scope files/why:

- T62/parameters.mjs and contract.mjs define only the proposed guards, reusing the 13 unaffected T24 categories and the complete legacy water-intersection guard unchanged.
- T62/probe.mjs and README.md publish pinned A/baseline values, pass/fail counts, designed rationale, known conflicts and limits; no mutable T60 selector is read.
- T62/guards.test.mjs isolates thresholds, inward notches, shared-country gaps, self-merges, all five scaling factors and exact inherited-category error delegation. Parent contract.test.mjs and preflight are unchanged.
- T62/audit.py and validate.py retain reproducible acceptance, negative controls and exact restoration. Evidence directories retain all reports, snapshots, lossless raw-log archives and exact member hashes; evidence/rationale.json pins the reviewed F022 source and searches. artifacts.v2.sha256.json hashes the final owned artifact set; the first index is retained historically.
- RUN-NOTES.md appends plan, per-commit progress and END. No legacy checker/evidence, production, renderer or fixture geometry changes.

Done-when commands and actual output tails (full logs: T62/evidence/acceptance-it47nb_p/raw-logs.tar.gz):

```sh
node docs/prototypes/new-game/T62/probe.mjs
```
```text
        "minRouteSeparationCss": 21.9814453125
      },
      "groupErrors": {
        "attachment": 0,
        "water": 0,
        "traceability": 0,
        "preserved": 0
      },
      "legacyMidpointErrors": 30
    }
  ]
}
exit 0
```

```sh
node --test --test-name-pattern=attachment docs/prototypes/new-game/T62/contract.test.mjs
```
```text
✔ attachment: rejects off coast (6.432899ms)
✔ attachment: rejects ambiguous boundary endpoint (5.125497ms)
✔ attachment: rejects missing points (5.654056ms)
✔ attachment: rejects nonfinite endpoint (4.222858ms)
ℹ tests 7
ℹ suites 0
ℹ pass 7
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 83.600153
exit 0
```

```sh
node --test --test-name-pattern=water docs/prototypes/new-game/T62/contract.test.mjs
```
```text
✔ water: A positive control (23.646801ms)
✔ water: rejects unrelated land entry (12.627734ms)
✔ water: rejects source land reentry (9.958185ms)
ℹ tests 3
ℹ suites 0
ℹ pass 3
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 81.928995
exit 0
```

```sh
node --test --test-name-pattern=traceability docs/prototypes/new-game/T62/contract.test.mjs
```
```text
✔ traceability: rejects merged route geometry (3.511793ms)
✔ traceability: rejects shared-country ports merged (4.154928ms)
✔ traceability: rejects subpixel sea gap (3.586126ms)
✔ traceability: rejects zero length (4.216013ms)
ℹ tests 6
ℹ suites 0
ℹ pass 6
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 62.395542
exit 0
```

```sh
node --test --test-name-pattern=preserved docs/prototypes/new-game/T62/contract.test.mjs
```
```text
✔ preserved: rejects small count text (19.735785ms)
✔ preserved: rejects changed bonus (18.229561ms)
✔ preserved: rejects fairness fortress (19.783938ms)
✔ preserved: rejects cell overlap (21.095093ms)
ℹ tests 10
ℹ suites 0
ℹ pass 10
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 275.205929
exit 0
```

```sh
git diff --check
```
```text
exit 0
```

```sh
git diff --check origin/main...HEAD
```
```text
exit 0
```

Additional verification: 153/153 combined T62/T24/T61 tests pass. Mutation audit evidence/mutations-zpbad1le kills 35/35 mutations; all 34 added tests fail under a relevant deletion. Checker restored byte for byte. Every preserved legacy category is independently proven by exact error comparisons on meaningful mutants, so a connectivity refusal cannot mask a removed fairness guard. Parent/legacy diff from dispatch commit 862bcf4 is empty.

Docs changed: T62/README.md records the contract proposal, rationale, original A/baseline tradeoffs, reproduction and limits; append-only RUN-NOTES.md. All old artifacts remain unchanged, including first probe and first mutation archive. Current probe: evidence/probe-S8fFXb; current acceptance: evidence/acceptance-it47nb_p.

Implementation: owner-selected native Sol High. MiniMax M3 review and owner approval remain pending; no reviewer invoked, final CI triggered, merge or downstream task started.
