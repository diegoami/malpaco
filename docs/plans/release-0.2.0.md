# Release 0.2.0: map-first UI across devices

Owner allocation, 2026-10-19: the selected #191 design and resulting delivery
backlog target **0.2.0** (the owner's “0.2”). [Milestone](https://github.com/diegoami/malpaco/milestone/1)
and [delivery tracker #194](https://github.com/diegoami/malpaco/issues/194) own the
live queue; this file records scope, dependencies and acceptance, not status.
Design authority: [DECISIONS](https://github.com/diegoami/malpaco/blob/adf7f5ac0e9c581dddf8afc7a7fc8e8fc7a8262d/docs/plans/responsive-ui/DECISIONS.md), [proposal](https://github.com/diegoami/malpaco/blob/adf7f5ac0e9c581dddf8afc7a7fc8e8fc7a8262d/docs/plans/responsive-ui/PROPOSAL.md),
[sketches](https://github.com/diegoami/malpaco/blob/adf7f5ac0e9c581dddf8afc7a7fc8e8fc7a8262d/docs/plans/responsive-ui/WIREFRAMES.md) and [acceptance](https://github.com/diegoami/malpaco/blob/adf7f5ac0e9c581dddf8afc7a7fc8e8fc7a8262d/docs/plans/responsive-ui/ACCEPTANCE.md). Publication,
implementation dispatch and final playable appearance remain separate gates.

## Selected scope

Map-first workspace for mobile portrait/landscape, tablet and desktop in the same
release. Source/target selection stages combat; explicit Attack performs one
existing exchange. Fight on waits for the first confirmed Attack on that pair;
pair/load changes clear confirmation. Place1, combat arithmetic, old maps/saves,
RNG and replay rules remain unchanged. Preserve all current cards, required
choices, four-player totals, complete logs, Pause/speed and files/help/setup.

## Delivery contracts

All thirteen tasks are required for the selected release. Priority expresses
ordering/impact, not permission to omit a selected device or accessibility flow.
Task issue labels determine readiness. No task is made ready by this document:
main must run acceptance preflight and record dispatch decisions first.

| Task / issue | Deliverable | Priority | Difficulty | Dependencies |
| --- | --- | --- | --- | --- |
| [T78](../tasks/T78.md) / [#197](https://github.com/diegoami/malpaco/issues/197) | Responsive workspace state and continuity | High | Hard | T76 baseline |
| [T79](../tasks/T79.md) / [#198](https://github.com/diegoami/malpaco/issues/198) | Adaptive game shell and phone action dock | High | Hard | T78 |
| [T80](../tasks/T80.md) / [#199](https://github.com/diegoami/malpaco/issues/199) | Map camera, zoom and resize continuity | High | Hard | T79 |
| [T81](../tasks/T81.md) / [#200](https://github.com/diegoami/malpaco/issues/200) | Accessible country picker and safe touch inspection | High | Medium | T79, T80 |
| [T82](../tasks/T82.md) / [#201](https://github.com/diegoami/malpaco/issues/201) | Explicit Attack and capture or movement commitments | High | Hard | T79, T81 |
| [T83](../tasks/T83.md) / [#202](https://github.com/diegoami/malpaco/issues/202) | Responsive cards, Raid and mandatory reward choices | High | Hard | T82 |
| [T84](../tasks/T84.md) / [#203](https://github.com/diegoami/malpaco/issues/203) | Four-player totals, complete histories and playback continuity | High | Medium | T83 |
| [T85](../tasks/T85.md) / [#204](https://github.com/diegoami/malpaco/issues/204) | Responsive setup, settings, files, help and result views | High | Hard | T84 |
| [T86](../tasks/T86.md) / [#205](https://github.com/diegoami/malpaco/issues/205) | Tablet and desktop workspace composition | High | Hard | T85 |
| [T87](../tasks/T87.md) / [#206](https://github.com/diegoami/malpaco/issues/206) | Map annotation hierarchy, contrast and reduced motion | Medium | Medium | T81, T86 |
| [T88](../tasks/T88.md) / [#207](https://github.com/diegoami/malpaco/issues/207) | Keyboard, touch, safe-area and zoom acceptance | High | Hard | T83, T84, T85, T86, T87 |
| [T89](../tasks/T89.md) / [#208](https://github.com/diegoami/malpaco/issues/208) | Full-device 0.2.0 release candidate and artifact acceptance | High | Hard | T88 |
| [T90](../tasks/T90.md) / [#209](https://github.com/diegoami/malpaco/issues/209) | Publish the exact accepted 0.2.0 artifact | High | Medium | T89 |

Suggested sequence: **T78 → T79 → T80 → T81 → T82 → T83 → T84 → T85 →
T86 → T87 → T88 → T89 → T90**. T80 follows T79 because its phone acceptance needs the responsive shell. Shared
UI/CSS integration is serialized unless task dependencies and ownership explicitly permit overlap.

Original plan mapping: P1→T78; P2→T79/T85; P3→T80/T81; P4→T82/T83/T85;
P5→T84/T85/T88; P7→T86; P8→T87; P6→T89/T90. The release acceptance gate
comes after tablet/desktop and readability work, never before them.

## Cross-device release bar

Both geographic and reference-battle hosts: 320x568 minimum portrait,
360x640/390x844/430x932, 568x320 minimum landscape,640x360/667x375,
844x390/932x430, tablet768x1024/1024x768, desktop1280x800/1920x1080; retain
the earlier800x540 landscape case. Also test breakpoint seams, safe areas,
240px available-height fallback, browser zoom/reflow and native keyboard/gesture
limits. Every A1–A11 path has core/history/RNG oracles and reachable actions.
Owner D4 judges actual appearance/touch quality; automated rectangles/ARIA alone
are insufficient. Use one final reviewed0.2.0 source freeze, exact-head CI and
the same extracted artifact through acceptance/publication. No unchanged-head
CI repetition or rebuild after artifact approval.

## Existing work and exclusions

- **#194** is reused as this release's delivery parent; its earlier0.1.2 portrait
  target is superseded by the owner's0.2.0 all-device allocation.
- **#96/T51** and **#97/T52** retain their historical full-rules contracts. Their
  current-game responsive/keyboard/ownership overlaps are mapped to T79–T89; do
  not launch competing UI implementations. Future event/high-contrast or other
  residual requirements are not silently declared complete by this release.
- **#195** behavior checks map to T79/T85/T86/T88: heading/toolbar actual hits,
  horizontal keyboard order, load focus and required-control visibility. Only
  reproduced defects are fixed; historical evidence gaps remain acknowledged.
- **#181** remains a separate Medium/Hard post-0.1.x generation spike, linked
  from the master backlog, outside this release's required delivery graph.
  [Assessment](https://github.com/diegoami/malpaco/blob/adf7f5ac0e9c581dddf8afc7a7fc8e8fc7a8262d/docs/plans/responsive-ui/ASSESSMENT-181.md). No generation rewrite is bundled or started.
- **#170** flavour naming and **#174** curved-label placement stay separate;
  T87's label hierarchy neither duplicates them nor reverses their ordering.
  New rules, AI roadmap, autosave, sound, themes and harness migration are excluded.

## Dispatch and publication

Owner update, 2026-10-19: native **Sol Low/Medium/High** subagent implements
according to difficulty; independent **Sonnet Medium/High or Opus Medium** reviews.
Dispatch mapping: Easy → Sol Low / Sonnet Medium; Medium → Sol Medium / Sonnet High;
Hard → Sol High / Opus Medium. Choose by the actual change and record before each run. No models or CI are launched by backlog
allocation. Each new PR gets its own recorded decision, preflighted contract,
independent review and green CI; prior T77 review does not approve new source.
No tag, production deployment, due date or implementation run is created here.
