# Generated-board CI readiness correction

The final CI run `38945668172` passed all 122 source browser cases and 121 of
122 extracted-artifact cases. The one failure was the existing exact generated
preview reload comparison: its baseline contained only the white mask rectangle,
while the reload contained the completed font-dependent label exclusions. The
original failure remains unchanged in `evidence/ci-failure-p60vszze/`.

Under rule 12's blocking one-file mechanical exception, the correction adds one
readiness assertion in `tests/e2e/generated-board.spec.ts` before its baseline:
wait for one black route-mask exclusion per country name and island title. The
following full `innerHTML` equality, every seed/failure assertion and every golden
remain unchanged. No masks are removed or filtered, no timeout is raised, and no
production source changes.

`prove-mask-readiness.py` retains a deterministic timing reproduction in
`evidence/ci-mask-proof-jvemudn9/`. Its temporary test-only harness delays the
final seed-1994 font-load promise by 1500 ms and lets the reload's mask complete
before the unchanged comparison. The old and corrected test receive identical
instrumentation at both desktop sizes:

| Actual spec | Baseline mask rectangles | Reload mask rectangles | Full HTML equality | Result |
| --- | --- | --- | --- | --- |
| Before readiness | 1 | 56 | false | Both cases fail |
| With readiness | 56 | 56 | true | Both cases pass |

The 56 rectangles are one white background, 46 country-label exclusions and nine
island-title exclusions. Full before/after SVG bytes are retained as Playwright
attachments. Old, fixed and temporarily instrumented spec bytes are losslessly
archived. The fixed spec is restored in `finally` and compared byte-for-byte;
all production causal inputs remain stable during the proof.

Bounded positive validation after restoration:

- `ci-readiness-source-3fnltr4q`: 22 pinned source browser cases pass: the entire
  changed generated-board suite plus T28 battle controls/accessibility, at both
  desktop sizes. Existing goldens pass unchanged.
- `ci-mask-release-iijv763i`: the official `npm run package:playable` builds a fresh
  package in the pinned Playwright image, including core/full TypeScript checks.
  The archive is extracted into a fresh owned directory, its `SHA256SUMS` verify,
  and all eight generated-board cases pass with `playwright.release.config.ts`.
  Package, extracted runtime, exact commands and outputs are retained losslessly.
- `ci-readiness-controller-vfdrdsw_`: all nine parent controller cases pass.

Both normal browser checks confirm source stability. The release evidence captures
the changed test and unchanged `src/ui/prototype/preview.ts` before packaging;
the new current index also includes these causal inputs and the existing preview
goldens. Historical v1/v2 indices, READMEs and original measured outputs remain
untouched. Current CI-correction index: `artifacts.ci.v3.sha256.json`.

This corrects test readiness only. Independent review and owner acceptance of the
production UI remain as recorded. The main session decides whether to rerun CI;
the implementer did not invoke review, CI or merge.
