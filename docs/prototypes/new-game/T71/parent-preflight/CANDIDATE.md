# Disposable candidate receipt

The current replacement set is exactly four complete files under `mock-src/src/`:

- `ui/referenceBattleGame.ts`: integrates the native mode select into persistent
  playback controls, normalizes/retains session preference, sets shared host data
  attribute and exposes existing computer-active status to presentation CSS.
- `ui/panelDetail.ts`: actual helper API requested by the parent for independent
  unit acceptance; native labelled select with compact/detailed, compact fallback,
  invalid-value normalization, preference update and callback only.
- `ui/battleView.ts`: adds pending-capture presentation attribute; ordinary
  controller calls, state, actions, RNG, timings and existing selectors unchanged.
- `styles.css`: appends scoped shared-host stable tracks, compact optional-detail
  hiding, bounded scrollable dice, compact AI presentation and arrangement of
  existing mandatory controls to fit the small viewport.

No production source or existing test was edited. `disposable-app/` is a private
copied build root with unchanged project sources plus these four replacements,
the required original data assets, and privately built output. It has no external
symlink or adopted production edits. No dependencies were installed. Original
source sets of earlier candidates remain in `candidate-v1-source/`,
`candidate-v2-source/`, and `candidate-v3-source/`.

## Measured feasibility

Final AI run (`candidate-v4-probe/`, raw `candidate-probe-run6.*`) exits 0 with
empty stderr. The eight host/mode/viewport combinations each load six real
seeded prefixes and advance an actual 350ms computer callback. All 96 samples
have exactly unchanged rectangles across topbar, board, panel, turn card,
action card, recent-log card and playback controls. No page error, horizontal
overflow or action-content overflow was observed. Phase-labelled screenshots
and videos remain in each matrix directory.

Final human run (`candidate-v4-human-expanded/`, raw `human-probe4.*`) exits 0
with empty stderr. Sixteen reference/manual samples cover pending capture,
ordinary attack controls, friendly movement and human loss at both sizes and
in both modes. Every visible control is inside its action card and viewport;
action scrollHeight equals clientHeight. All input/Confirm, Cancel/Skip and
Watch/Stop controls remain present. This probe checks visibility/geometry;
it does not click their confirmation actions or replace independent acceptance.

TypeScript check against the disposable root exits 0; raw output is
`candidate-typecheck.*`. Subsequent changes affected CSS only; all checked
TypeScript bytes match the current candidate.

## Preserved failed attempts

The first disposable build lacked copied tsconfig; the second lacked three
required historical data assets. Their build errors are retained separately as
`candidate-probe.*` and `candidate-probe-run2.*`; neither is behavioral proof.
The first successful candidate had excessive stretched reinforcement content;
the next version reduced reserve but exposed mandatory human controls spilling
into the adjacent log card. `candidate-v2-human/` preserves that failure.
The next version still spilled compact loss choices by roughly 10px;
`candidate-v3-human/` preserves it. Final spacing corrections use existing
controls and text, without clipping or hiding mandatory choices.

## Practical limits

This is a disposable positive candidate, not parent-frozen acceptance, formal
implementation, independent review, full regression validation or owner visual
approval. The probes load real legal prefixes then run callbacks; they do not
independently compare downloaded post-action histories, test mode changes during
pause/log/load, or run continuous computer sequences from initial setup.
Those stronger checks belong to the parent's frozen acceptance.

The layout reserves 320 local CSS px for the compact action card and 380 for
Detailed, within the available sidebar height; the existing desktop zoom still
applies at 1920. Reinforcement uses less content than capture, leaving some
reserve. Inner reinforcement content now keeps its natural height. The parent
and owner must judge that density from the retained images; no appearance
approval is claimed. Dice use bounded scrolling in Detailed; only optional dice
are scrolled, while tested mandatory human actions remain in the visible card.
