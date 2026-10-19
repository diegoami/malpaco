# Release 0.2.0 implementation backlog

The owner selected map-first, all devices together and explicit Attack in
[DECISIONS.md](DECISIONS.md), then allocated the resulting backlog to **0.2.0**.
[Milestone](https://github.com/diegoami/malpaco/milestone/1) and delivery tracker
[#194](https://github.com/diegoami/malpaco/issues/194) own live status; the
[release map](../release-0.2.0.md) records scope/dependencies. This replaces the
planning-unit-only P1–P8 list with concrete task contracts. No task is dispatched
or made ready by backlog creation: main must freeze acceptance preflight first.

## Required delivery tasks

All thirteen are required for the selected all-device release. Priority affects
ordering/impact, not whether a selected device or required flow may be omitted.

| Task / issue | Deliverable | Priority | Difficulty | Dependencies |
| --- | --- | --- | --- | --- |
| [T78](../../tasks/T78.md) / [#197](https://github.com/diegoami/malpaco/issues/197) | Responsive workspace state and continuity | High | Hard | T76 baseline |
| [T79](../../tasks/T79.md) / [#198](https://github.com/diegoami/malpaco/issues/198) | Adaptive game shell and phone action dock | High | Hard | T78 |
| [T80](../../tasks/T80.md) / [#199](https://github.com/diegoami/malpaco/issues/199) | Map camera, zoom and resize continuity | High | Hard | T79 |
| [T81](../../tasks/T81.md) / [#200](https://github.com/diegoami/malpaco/issues/200) | Accessible country picker and safe touch inspection | High | Medium | T79, T80 |
| [T82](../../tasks/T82.md) / [#201](https://github.com/diegoami/malpaco/issues/201) | Explicit Attack and capture or movement commitments | High | Hard | T79, T81 |
| [T83](../../tasks/T83.md) / [#202](https://github.com/diegoami/malpaco/issues/202) | Responsive cards, Raid and mandatory reward choices | High | Hard | T82 |
| [T84](../../tasks/T84.md) / [#203](https://github.com/diegoami/malpaco/issues/203) | Four-player totals, complete histories and playback continuity | High | Medium | T83 |
| [T85](../../tasks/T85.md) / [#204](https://github.com/diegoami/malpaco/issues/204) | Responsive setup, settings, files, help and result views | High | Hard | T84 |
| [T86](../../tasks/T86.md) / [#205](https://github.com/diegoami/malpaco/issues/205) | Tablet and desktop workspace composition | High | Hard | T85 |
| [T87](../../tasks/T87.md) / [#206](https://github.com/diegoami/malpaco/issues/206) | Map annotation hierarchy, contrast and reduced motion | Medium | Medium | T81, T86 |
| [T88](../../tasks/T88.md) / [#207](https://github.com/diegoami/malpaco/issues/207) | Keyboard, touch, safe-area and zoom acceptance | High | Hard | T83, T84, T85, T86, T87 |
| [T89](../../tasks/T89.md) / [#208](https://github.com/diegoami/malpaco/issues/208) | Full-device 0.2.0 release candidate and artifact acceptance | High | Hard | T88 |
| [T90](../../tasks/T90.md) / [#209](https://github.com/diegoami/malpaco/issues/209) | Publish the exact accepted 0.2.0 artifact | High | Medium | T89 |

The dependency sequence is **T78 → T79 → T80 → T81 → T82 → T83 → T84 →
T85 → T86 → T87 → T88 → T89 → T90**. Camera phone-browser acceptance follows
the adaptive shell; shared UI/CSS integration is serialized until concrete
ownership permits safe overlap. T78 is the next acceptance-preflight candidate,
not an implementation running now. Each task names measurable future checks,
owned paths and hazards; commands are not claimed implemented or executed yet.

Design-unit mapping: P1→T78; P2→T79/T85; P3→T80/T81; P4→T82/T83/T85;
P5→T84/T85/T88; P7→T86; P8→T87; P6→T89/T90. Tablet/desktop and readability
therefore precede the full-device acceptance gate. The smaller portrait-first
alternative is not selected. The target is0.2.0; dates, implementation and
publication remain separately authorized.

## Separate generation sibling and existing overlaps

Existing [#181](https://github.com/diegoami/malpaco/issues/181) is **Medium / Hard**,
a separate post-0.1.x generation spike, with no dependency into T89/T90. It is
not part of camera or label polish and is not a required0.2.0 UI deliverable.
[ASSESSMENT-181.md](ASSESSMENT-181.md) bounds its candidate/corpus/geometry/cost/
gallery/integration outputs. It has no new issue, model assignment or dispatch.

The release map records #96/#97's overlapping current-game requirements and
residual historical/full-rules scope; do not launch competing implementations.
#195 focus/toolbar/visibility cases are allocated to T79/T85/T86/T88 without
claiming unproved defects or old evidence gaps repaired. #170 flavour naming and
#174 curved labels retain their separate ordering; no generator, naming, rules,
AI, autosave, sound or harness work is silently bundled.

## Dispatch and review

Standing owner UI selection: native **Sol Max** implementer and independent
**Opus High** reviewer. Each new implementation needs a preflighted contract,
recorded dispatch, independent review, green CI and applicable owner D4 judgment.
No new model/review/CI run starts here. The retained T77 review predates the
owner-selected Attack change; it is not approval of this backlog's future code.
T89 freezes0.2.0 and the exact accepted artifact; T90 publishes only that artifact
after separate authorization, with no rebuild or duplicate unchanged-head CI.
