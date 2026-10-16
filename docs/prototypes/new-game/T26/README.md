# T26 reference-board walking skeleton

Run the app and open `?view=reference-game` (optionally `&seed=1994`). Choose two
to four human seats and start. The selected T63 A geography is fixed; the seed
selects the ordinary legal deal. Place income by country clicks, start combat,
select an owned attacker and an adjacent enemy, attack, continue and end turn.
Keyboard selection/arrows work. A conquest winner freezes play and New game
returns to reference setup with the last seed/seat count.

`createReferenceGame` injects the approved map into the existing validated seeded
setup seam; no geography draws or game constants are introduced. The 46-country
boundary prevents the existing fixed-count deal from leaving countries undealt.
The display adapts the T63 SVG and one map adjacency source to the existing App;
ownership, counts, centres and targets follow the real state. Generated/authored
routes and their save format remain untouched. Reference save/load is not offered.
The inherited battle lifecycle, capture choice, movement and victory timing gaps
remain assigned to T27–T30, as inventoried; this is a walking skeleton.

Parent preflight is retained separately, including exact archived mock source,
build, temporary new goldens and every failed attempt. Existing assertions are
preserved; an additional integration assertion proves target flags correspond
to visible painted outlines. `reference-map-validation.test.ts` independently
fails on the formerly accepted 48-country input and passes on the new boundary.
No prior golden was changed. Only new reference goldens are introduced.

Reproduce task commands:

```
npx vitest run tests/core/reference-game.test.ts
npx playwright test tests/e2e/reference-game.spec.ts
npm test
npm run build
```

Run browser checks in the pinned Playwright1.63.0-noble image, with the dependency
mounts used by `run-browser.py`. That runner writes a fresh directory, exact raw
archive, member hashes, source fingerprints and screenshots. `run-command.py`
does the same for other commands. The legal replay uses the existing test-only
passive-opponent policy through ordinary apply actions, without ownership/army/
dice/RNG edits: seed1994 reaches conquest after541 actions (163attacks,20handoffs,
337placements) at both1280x800 and1920x1080. This is a deterministic acceptance
fixture, not a balance or AI-strength measurement.

`mutate.py` proves six source deletions/changes are caught: wrong generated map,
missing size guard, stale visible counts, missing legal-target markers, missing
painted target outlines and wrong sea paths. Every original source is saved and
restored in finally; re-runs retain fresh reports and exact logs. The initial
five-mutant draft remains alongside the strengthened six-mutant evidence.

All original output bytes stay in tracked archives; loose raw copies are ignored.
`index.py <fresh-name>` creates an immutable source/evidence/member index;
`verify-evidence.py [index-name]` verifies it. Indexes describe the exact source
revision they record, including inherited rules/UI dependencies. Later gameplay
changes need their own evidence/index rather than rewriting this history.

Owner judges the integrated views; automated checks do not certify appearance.
The map geometry comes from approved A and the interface uses the existing game
components. No natural coast/border/terrain polish is included here.

Diagnostic history: the first strengthened six-mutant run (`mutations-wksnhrv4`)
is not accepted as proof because its subsequent unmodified run failed the newly
added immediate style assertion. `restored-1gdwyazu`, `diagnose-paint-j3gswjo1`,
`paint-fixed-c76mj9p2` and `diagnose-cascade-ctira2tk` preserve that investigation.
The target class and gold rule already matched while the sampled computed style
still showed the old border. The parser experiment was reverted. The same paint
requirements now use Playwright's bounded polling; `paint-settled-8l7cmb4w`
passes all four cases and541 actions per viewport. The mutation runner explicitly
requires green core/browser baselines before testing any deletion, preventing
unrelated baseline failures from masquerading as killed mutants.

Pre-layout mutation audit: `evidence/mutations-6a8cvhxn` requires green
core and complete browser baselines, then catches all six mutations and restores
both production source files exactly. The earlier six-mutant attempt is retained
as non-authoritative above. All52 pre-existing test/golden files match baseline
commit c71f9d8 byte-for-byte (`evidence/existing-tests-hfma7xsj`).

Final layout audit: `evidence/panel-before-14pzl_xw` demonstrates clipped player
totals at1920×1080 before the existing440px high-resolution panel rule was
extended to this route. Its prior reference snapshot is retained there unchanged;
`panel-fixed-ietu5a_h` passes the new text-boundary guard with the corrected
reference-only snapshot. Existing goldens remain unchanged. The same guard checks
opening,3/4-seat and winner panels at both desktop sizes.

Authoritative final mutation audit: `evidence/mutations-15e2jis9` starts with
green core and all four browser cases on this final layout, kills all six
mutants and restores exact source bytes. Its baseline browser captures include
opening,first attack and winner at both viewports. Final unit/build reports and
`existing-tests-f6k9uofn` retain the complete checks and unchanged52-file seal.

The immutable revision index is sharded into small readable parts. Its root is
`artifacts.v2.sha256.json` (the verifier default). The initial monolithic index
is preserved byte-for-byte in `evidence/initial-index.tar.gz`; its loose original
is ignored. Each shard and every original archived member is verified.
