# T78 main acceptance preflight

Main froze the API/controller ownership in BOUNDARY.md and 17 behavioral checks.
Six fixtures are reconstructed through the real versioned match codec: placement,
combat, pending capture, friendly movement, cards and result. No fabricated game
positions are accepted as legal-fixture evidence.

- red-01: 16 failed/1 passed; retained first draft, including a wrong result phase
  spelling. Main corrected that expectation to the actual `finished` phase before
  freezing tests; red-02 remains 16 behavioral failures/1 pass, no loader failures.
- mock-01 and mock-restored-01: all 17 pass against a disposable mock, not production.
- negative-confirmation-01, negative-core-mutation-01, negative-aliasing-01: each
  exits 1, catching the named bypass; full outputs retained.
- mock-npm-test-01: exit 0, 835 Vitest checks in 61 files plus 9 harness tests.
- mock-build-01: exit 0, both TypeScript boundaries and Vite build.

The temporary source mock was removed in finally; the tracked TXT is only a
feasibility control. This is not a production implementation, game preview,
independent approval or final-source acceptance. The implementer must rerun both
Done-when commands against its real source. No CI/model/browser run was made by
this preflight. Test SHA and command exits are retained alongside this report.
Main owns amendments to the frozen assertions and boundary; an implementer may
add tests but must report a conflict rather than weaken these.
