# Generated gameplay acceptance preparation

Run from the repository root in `mcr.microsoft.com/playwright:v1.63.0-noble` with dependencies available:

```sh
node docs/prototypes/generated-play/replay.mjs docs/prototypes/generated-play/preflight-NEW
```

The output directory must not already exist. The replay records baseline failures, temporarily installs the single mock candidate, runs the task commands, independently removes one country's fill, one army count's paint, placement handling, and connections, and reruns the restored suite. Every production file is saved byte for byte and restored in `finally`; `manifest.json` records matching before/after SHA-256 values. It creates the two new generated-game goldens in the pinned image; existing goldens are compared without update.

`*.mock.txt` files are disposable candidate fixtures, not production imports. Tests intentionally fail until stage 2 lands. The candidate keeps core untouched, creates its initial state through `createGame`, projects only presentation geometry, and uses the existing App controller for `apply` actions, panel, and combat result dialog. Numeric seat labels distinguish the two generated player IDs.

The unit suite compares all nongeometry state fields to independent `createGame` output for seeds 1/2/3/7/42/1994 and freezes source input. Browser gates check names/count boxes, readable font size, hit targets, pixel owner fills, actual count glyph ink, exact graph edges and endpoints, bonuses, reinforcement spending, a core-predicted attack outcome, handoff and the real refused seed 1506 followed by retry/recovery.

Evidence batches are retained, including rejected candidates. Batch A caught overlapping count/name boxes; B caught the same font metric issue at the larger size; C passed all normal checks but demonstrated that contrast alone did not reject hidden army text, prompting the independent glyph ink gate. Each batch manifest names exact commands and exit codes. Screenshots remain for owner judgement; passing geometry/pixel gates does not decide their visual quality.

Batch D completes the replay: baseline commands red; mock unit 7/7, generated browser 10/10, complete unit 346/346, complete browser 58/58 and build green; all four mutations red; restored generated browser 10/10 green. All five production source before/after hashes match. `preflight-sha256.txt` records artifact hashes. Stage 1 stops here for independent parent replay before production changes.
