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


For the permanent implementation, run the actual-source verifier in the pinned image:

```sh
node docs/prototypes/generated-play/verify-final.mjs docs/prototypes/generated-play/implementation-NEW
```

To regenerate only the two generated-game goldens in that image, append
`--update-goldens`. The verifier runs every task command, mutates the actual
source for each of the four required removal classes independently, restores
exact saved bytes in `finally`, and reruns the generated suite green. Unlike the
historical preflight replay, it does not install a mock or expect baseline failure.


Permanent implementation verification is recorded in `implementation-20261015-a/`.
Generated semantic tests: 7 passed; generated browser tests: 10 passed; all unit
tests: 346 passed; build: exit 0; full browser suite: 58 passed. Each actual-source
mutation fails for its intended cause: absent owner fill gives painted share 0;
invisible army text gives glyph ink 0; deleted placement leaves pool 7 instead
of 6; a removed land connection changes the exact edge set. After restoring all
saved source bytes, the generated browser suite passes 10/10. The manifest hashes
match and `implementation-sha256.txt` records final artifacts and source hashes.
Existing authored/prototype goldens and core files remain unchanged. The visible
legend explains numeric ownership and solid/dashed connections; the two new
settled generated-game goldens are ready for owner judgement.
