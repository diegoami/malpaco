# Integrated disposable T37 mock

Preflight only. Production was never installed or edited. Main's actual tests/core/card-deck*.ts and fixtures were not read or changed by this work. This mock is for main to install temporarily with saved-byte restoration and independently evaluate; it is not formal adoption or completion.

## Exact temporary install list

Copy these eight files from this folder into the same relative paths in the worktree (no runtime files, probes or prepare.py need installation):

- src/core/cards.ts (new card types, constants, projection and internal shuffle/draw)
- src/core/types.ts (optional cards/rules capability, discardCard action)
- src/core/state.ts (frozen cardsRules and deep clone; old newGame compatibility)
- src/core/setup.ts (conditional shared-stream post-centres shuffle)
- src/core/rules.ts (actual apply gate, reward/finalize split, discard resume, elimination disposal)
- src/core/index.ts (public exports)
- src/core/match-save.ts (strict exact cards1/schema3 identity selection, action parser and real replay)
- src/ui/gameEventLog.ts (one mechanical discardCard label only)

The exact source paths and candidate/original hashes are in install-manifest.json. Restore original bytes for every existing file and remove only the newly installed src/core/cards.ts after main's probe, preserving any concurrent work. This agent performed no temporary source installation or restoration.

## Semantics and boundaries

The REPORT.md API is frozen: CardKind/CardState/CardView/cardView, CARD_COMPOSITION/HAND_LIMIT, cardsRules(options?), discardCard handIndex, optional GameState.cards and RuleSet.cards. No new phase. Exact reference/geographic board1 + cards1/schema3 identities opt into deck-v1; old tuples keep old factories and reject discardCard. Future cards2/schema4 and cards3/schema5 remain **unsupported**, so they cannot accidentally replay through this factory.

The shuffle is conditional after centres on the single game RNG. Old rules consume no extra randomness and have no cards field. cloneState copies every nested hand/pile and pending metadata. Pending discard rejects unrelated actions before clone/dispatch, draw/RNG/victory/handoff. Initiating friendlyMove applies once before pending; discard finalizes rather than replaying movement. Capturing-turn reward precedes victory; elimination empties victim hand in actual attack resolution. Squall discards hand plus itself without replacement. Public card view provides counts and only the viewer's hand; no card-kind log event was added. Existing modern UI continues using victoryRules and old identities.

Source constants/provenance remain approved designed T23 variety009..028/040, pinned ae298e37. Canonical kind order, index-zero draw top and appended discard ordering are stable deck-v1 protocol choices [designed]. No trade/raid effects or computer discard policy were introduced.

## Probe evidence

Probes run against runtime/src: a private copy of real src overlaid with the eight mirrored files. Imported JSON inputs are copied to their real relative paths; runtime/tsconfig.json is the existing config. No alternate codec exists: tests invoke mirrored src/core/match-save.ts exports directly.

- probe-01.txt: missing runtime tsconfig setup failure retained.
- probe-02.txt: four passed; geographic test exceeded default5s; retained. Only owned probe timeout changed to20s.
- probe-03.txt: all five passed; real exports/setup, actual capture/elimination and pending victory, friendlyMove once plus Squall, legal history codec roundtrip, geographic card/old identity compatibility.
- probe-04.txt: strengthened pending-reached assertion found original seed37 policy did not reach pending. Retained; no assertion weakened.
- probe-05.txt: bounded seed search found seed2 pending, all five passed.
- probe-06.txt: six passed including ordinary-action reshuffle and exact replay/RNG continuation.
- probe-07-decisive.txt: bounded symmetric decisive strategy failed to produce victory; raw outcomes retained decisive-search-07-failed.json.
- probe-08-decisive.txt: asymmetric legal strategy produced decisive history; decisive probe passed, six other probes intentionally unselected. No claim of a final seven-test aggregate run.
- tsc-core-01.txt/tsc-ui-01.txt: missing private copied JSON inputs, retained; tsc-core-02.txt/tsc-ui-02.txt empty output and exit0 after copying inputs. Existing core and all UI TypeScript compile with mirrored source.

Commands: `node_modules/.bin/vitest run --config docs/prototypes/new-game/T37/parent-preflight/integrated-mock/vitest.config.ts`; decisive-only adds `-t 'finds legal decisive'`. Type checks: `node_modules/.bin/tsc --noEmit -p docs/prototypes/new-game/T37/parent-preflight/integrated-mock/runtime/src/core` and `.../runtime`.

## Legal saved histories available to independent acceptance

These are **ordinary options/actions-only real codec saves**, not state snapshots. Main should freeze their options/actions independently and assert separate expected state values, rather than use this mock output as the only oracle.

`reshuffle-before-match.json` is immediately before action329; `reshuffle-match.json` is after action329. Fixed-reference seed2, four human seats, dominationWin:false, roundLimit:null, other defaults retained in JSON. Round16 action329 discardCard0 consumes the pre-draw chosen hand card, shuffles the discard pile, draws once, and leaves draw25. Rule RNG2233696394→778201463; resulting counts seat1:4 seat2:1 seat3:5 seat4:5. Both reconstructed via real codec, final continuation compared exactly. Search source is next() and bounded reshuffle probe in probe.test.ts. Its policy: reinforce strongest owned country with currently legal enemy attackTargets (fall back strongest owned); perform first legal attack with source>defender+1 until one capture; captureMove1; endTurn; discardCard0 when pending. Seed1 exhausted5000 actions without reshuffle, seed2 reached it after329; retained summary reshuffle-search.json. The policy's known isolated-stack stall affects search efficiency only; the saved history itself is legal and replayed.

`decisive-before-match.json` ends after194 actions in a real pending discard; `decisive-match.json` includes action195 discardCard0 and finishes seat1 domination at round7. Fixed-reference seed37, three humans, dominationWin:true, roundLimit:null. Before reward hand [Anchor,Raid,Lantern,Compass,Compass], draw topAnchor, draw34→33, after hand [Raid,Lantern,Compass,Compass,Anchor], RNG1970355341 unchanged. Exact reconstruction verified. Strategy source is final probe in probe.test.ts: favor seat1 with strongest owned geometric border reinforcement and repeated safe attacks (source>defender+1); default captureMove moves maximum; other seats place income in weakest own country and end turn. All actions obey the same rules, with no core policy alteration. Full options and ordinary actions retained in JSON; expected metadata decisive-search.json.

## Limitations

No npm test, npm build/Vite production bundle, browser suite, CI, paid review or formal acceptance run was performed. Main owns frozen tests, mutation acceptance and production installation/restoration. TypeScript compile and the seven probe cases across the named runs are bounded feasibility evidence only. The old standalone candidate and failures are preserved separately; they are superseded for integration feasibility by these real mirrored modules. Current computerAction has no pending-card choice policy; defaults cannot enter card mode, and T53/T40 must deliberately handle it before enabling card UI/computer play.
