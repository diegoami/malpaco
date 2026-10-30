# 0.5.1 provenance

Milestone [#407](https://github.com/diegoami/malpaco/issues/407), T150–T155.
These records follow publication and do not move the reviewed tag.

## Source, review and authorization

- `v0.5.1` points directly to **`2fec967d39d8cc0a367df47db5900708ccd12d3d`**.
- First candidate `2489eaf27e98f15345b5f7c19b6bcc51a4c544b6` received a MiniMax-M3
  BLOCK for #408 and a GLM AGREE with a coordination/independence disclosure.
  Both verdicts remain on #407; the latter was not used to dismiss the blocker.
- #411 fixed the stale Help assertions and added a focused source-Help CI guard.
  Application, player guide, images, rules, fixtures and dependency records were
  unchanged. The replacement archive's 19 application/manual files are identical
  to the first candidate; only BUILD.json and SHA256SUMS differ.
- [Fresh owner-launched re-review](https://github.com/diegoami/malpaco/issues/407#issuecomment-6530554293):
  **AGREE**, `zai-coding-plan/glm-5.3-flash`, exact replacement SHA, #408 resolved,
  no new findings. This reviewer disclosed using the same model ID as the earlier
  GLM session, with no implementation or coordination role in this fresh session.
- The owner explicitly approved publication of the verified CI bytes and deferred
  visual inspection until afterward: **“yes do it”** in response to that exact
  question. This does not claim owner visual acceptance.
- Included PRs: #397, #399, #402, #403, #405 and #411, plus historical publication
  and planning/continuation documents. Core tree `b61fb9adfac9e0e7bf5b19f4c2e5025180e54bba`
  and fixture tree `97eb8e0703af6868a2d23c9d8e1665aa069c1222` match v0.5.0.

Exact-main [CI 41078705791](https://github.com/diegoami/malpaco/actions/runs/41078705791)
passed build/root+core types, dev-watch checks, **1191 units / 96 files**, **6
source-Help cases** and **610 extracted-playable cases / 318 project/route skips**.
The full source suite is not claimed as a CI gate; #409 remains separate.
Reviewer-local timeout/font limitations and earlier feature/superseded checks
remain disclosed on #407. No test budgets or goldens were relaxed for publication.

## Exact published CI archive

| Field | Value |
| --- | --- |
| Main CI artifact | `malpaco-playable`, id `12991343031` |
| Original artifact ZIP | 2294792 bytes |
| ZIP SHA-256 | `59a695b92f13a47c59cafb6dcd71e5cf4d403461f5b733e4b5ab78358e9b76c5` |
| Playable tar.gz | 2294047 bytes |
| Archive SHA-256 | `3545c7c39b46c7cfebf50a932716bc22d0aef3ac797138db4fd361e1d1869226` |
| BUILD.json | schemaVersion 1; sourceCommit `2fec967d39d8cc0a367df47db5900708ccd12d3d`; minimumNode 22 |
| Manifest | All 20 entries / 21 files verified, including the guide, eight images and quickstart |

The original CI tar.gz was renamed for publication without rebuilding or changing
its bytes. Its checksum is a separate release asset. Guide images match the source;
dirty capture provenance is explicitly retained and is not clean-head visual
acceptance evidence.

## Deployment and permanent evidence

Draft `6ae4f25a07d82a13c26dde41` and production `6ae4f425fc4292b166df8859` each
pass all 21 byte comparisons and 21 final browser cases described in
[PUBLICATION.md](PUBLICATION.md). Production was published
**2026-10-30T19:46:46.341Z**; GitHub release publication **2026-10-30T19:51:24Z**.

Permanent [publication evidence](https://github.com/diegoami/malpaco/releases/download/v0.5.1/malpaco-0.5.1-publication-evidence.tar.gz):
**13513090 bytes**, SHA-256
`68496cbb5dfd7f2ffeb86a80e368cb0c2715e425464fb48c60a10b1818c30d6d`.
A separate checksum asset is attached. It includes the candidate proof/original
CI bytes, review receipt, owner authorization, deployment receipts, complete byte
comparisons, original failed/corrected draft smoke logs, production smoke, scripts
and screenshots. Authentication-ticket files and redundant failure trace ZIPs are
excluded. All four final public downloads were read back and match their local
uploads, byte counts and GitHub asset digests. Those final receipts and the
release publication time are recorded on #407 after evidence assembly.

Retain previous production `6ae1d127c8b090a2288caf48` (v0.5.0) and all older
published tags/assets and historical records unchanged. No rollback was needed.
Do not routinely downgrade to 0.3.1: #372 reproduces scoreboard/preferences loss.
No physical-device, screen-reader or owner visual acceptance is claimed.
