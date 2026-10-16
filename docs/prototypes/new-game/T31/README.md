# T31 versioned deterministic replay acceptance

Pinned design: archaeology commit ae298e37c2f5177039e55767607f9345b6cb0e7a, core-rules.md Stored files/Randomness and approved taskT31. Saves identify format, board generator, rules and action schema. Rebuild from original settings/seed and ordinary actions, including pending captures, final friendly moves, Watch/Stop and terminal states; never load arbitrary rule/RNG snapshots. Unknown versions and illegal histories fail before replacing a live match. Preserve old supported files through their original path or reject clearly; never reinterpret a seed under a new generator.

Main prepares actual-negative/disposable-mock-positive acceptance before production. Native Sol High implements HardT31 under renewed owner authorization, MiniMax M3 independently reviews. Existing legacy codecs/routes/presets/tests/goldens stay protected; new reference UI uses explicit control=manual in fixtures. Default1human3Normalcomputer policy/scheduling remainsT32.

The storage identities are [designed] protocol constants: v1 is the existing generated/1 + malpaco/1 + action-schema/1 path; v2 is fixed-reference/1 + victory/1 + action-schema/2. Existing codecs and generated-game UI keep v1 semantics. The new codec delegates supported v1 files through that original path. The reference UI refuses generated-map files before replacement. It never draws a generated match using fixed-reference geography.

Frozen fixtures originate from merged T30 commit094887184312fcaecf6ba2a183a56a489d7bf33b. Their manifest records source/file hashes; split JSON parts keep individual files readable. Each case pins ordinary history, exact logical state (including ordered topology, RNG, pending/result data) and the next legal action where applicable. The projection omits province coordinates/labels but pins full island objects, including extra outline/coast coordinates from raw T63 data. This makes the fixtures stricter about island presentation changes than replay semantics require; they are deliberately preserved here. Cases cover legacy opening/progress, nondefault placement settings, pending/completed capture, ready/completed friendly move, domination, human loss, Watch, Stop and round limit. The authoring source is separate; tests read frozen data and never regenerate it.

Parent preflight records all attempts under evidence/ and preflight/. The original bundled fixture-authoring attempt failed because existing fixture import.meta.url paths became relative to a temporary bundle; Vite SSR preserves their original locations. Actual baseline tests fail15 core cases and14 browser cases. The disposable mock proves feasibility and is restored exactly in finally. Mock browser attempts retain a Node JSON-import-attribute failure, two error-overlay overflow failures and an overlay pointer-blocking failure; assertions were never relaxed. The final mock passes14 real download/upload cases at both sizes,15 focused core cases and568 units/build. Final inherited compatibility and restoration receipts accompany the production checkpoint. These mock controls are feasibility evidence, not production implementation proof.

The final disposable mock also passes all30 affected inherited browser cases (original saves, reference goldens/full legal game, movement and victory). The parent restoration receipt proves every temporary path restored, no mock files remain and the entire src tree matches merged T30. Production implementation must pass these checks independently.

Production uses `src/core/reference-map.ts` as the shared canonical geography,
with a Node-compatible JSON import attribute. `src/core/match-save.ts` retains
its v1 functions and adds the strict v2 API, exported through `src/core/index.ts`.
The reference host retains complete original options and owns a disposable
`ReferenceMatchFiles` component. Its inline error cell occupies header space;
it does not overlay the board or controls. Setup file readers and replaced host
readers/controllers are disposed together. Loaded pending choices retain their
source/target context; transient drafts and playback restart cleanly.

Reproduction from the repository root:

```sh
python3 docs/prototypes/new-game/T31/run-command.py core npx vitest run tests/core/versioned-match.test.ts
python3 docs/prototypes/new-game/T31/run-browser.py browser
python3 docs/prototypes/new-game/T31/run-command.py units npm test
python3 docs/prototypes/new-game/T31/run-command.py build npm run build
python3 docs/prototypes/new-game/T31/parent-audit.py protected
```

Each command creates a fresh evidence directory, captures exact inputs/raw
outputs with SHA-256 hashes and refuses to replace earlier evidence. Browser
runs use the pinned Playwright image. `run-browser.py --suites` accepts a
comma-separated list for the full inherited suite. Fixture authoring remains
separate and must not be rerun over frozen fixtures. The parent preflight index
describes only preflight bytes; later production evidence has its own index.

Production validation records:

- [Final core](evidence/final-core-_p1gfxmt/report.json): all 15 locked cases pass.
- [Final real-file browsers](evidence/final-versioned-1oivhflt/report.json): all 14 pass at both desktop sizes.
- [Full pinned source browsers](evidence/final-all-source-lmhky5iv/report.json): all 154 pass, including unchanged legacy goldens and all new file flows.
- [Final units](evidence/final-units-env8fgze/report.json): 570 pass; [final build](evidence/final-build-g_20qrd2/report.json) passes.
- [Protected data](evidence/final-protected-8g244cm4/report.json): all 82 inherited files and 87 frozen fixture files match; [parent acceptance](evidence/final-parent-acceptance-ctt7x7uh/report.json) is unchanged from checkpoint 4828b4b.
- [Eight actual-source controls](evidence/actual-controls-6y7330tw/report.json): deleting generator/rules identity checks, snapshot refusal, replay, generated-map refusal, failed-load atomicity, reader disposal or pending context produces real assertion failures. All four touched sources restore byte-exactly. Full mutant bytes and raw outputs are archived beside the report; the final checks above run on restored production bytes.

Visual inspection of the production captures checked the inline error row at
1280×800 and 1920×1080 and the restored capture labels. A new context regression
first fails two tests against actual null source/target values
([negative](evidence/pending-context-negative-s35bi25k/report.json)), then passes
with the existing controller safety suites
([positive](evidence/pending-context-positive-p86kexd3/report.json)). Screenshots
support owner assessment; automated checks do not judge visual quality.
