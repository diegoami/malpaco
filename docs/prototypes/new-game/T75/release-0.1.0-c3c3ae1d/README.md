# Malpaco 0.1.0 release evidence

Published on 2026-10-19: [release and download](https://github.com/diegoami/malpaco/releases/tag/v0.1.0).

PR #188 shipped the approved border redraw, current card-enabled game and blocking fixes. The Vite watch fix from #187 shipped in the same tested tree; companion PR #190 was closed without a second CI run.

## Validation and provenance

- Final CI [39237888108](https://github.com/diegoami/malpaco/actions/runs/39237888108) passed 818 unit tests, 9 harness checks, 344 source-browser tests, standalone package acceptance and 344 extracted-browser tests.
- The downloaded CI archive passed six additional Worker, cache, pointer-hit and battle-layout checks at both supported desktop sizes. Source and preexisting outputs retained their exact bytes and modes.
- The published archive SHA-256 is `1a9002e290dd857877fd041ab2834542c714c7b4c3b305935fe3061bdfa6bb34`. GitHub's uploaded asset digest matches it.
- The tested head is `2fe0787b133f064b068b5865586b7f25c59d4fd8`; the release tag points to squash commit `c3c3ae1d32d3ab275877dbed5bbe995e0203ae3a`. Both have source tree `83f2dc9f740bc551daee75e8570df1cbe0b479da`. The package's truthful BUILD metadata names the tested GitHub merge commit.

Owner appearance approval and independent Kimi reviews are linked in PR #188. The final review's report-format flag and coverage limits are explicitly recorded in [the review disposition](../review-seed-readiness-20261019/REPORT.md). The separate static acceptance CLI passed in final CI. Older failed runs and preservation limitations remain recorded.

## Preview and retained files

The released artifact is served at http://localhost:4190/. The Windows gallery is `C:\Users\diego\malpaco-preview\OPEN-REVIEW.html`, with the complete release under `v0.1.0-c3c3ae1d-20261019-110745`. All ten served package files and all 65 copied files were verified. The previous gallery entry was backed up.

[receipt.json](receipt.json) lists the four archive parts and every member's checksum, size and POSIX permissions. The archive includes the complete CI log, artifact and screenshot inventories, raw final checks, screenshots, HTML/JSON results, source/output preservation manifests, and publication helpers and receipts. All originals and worktrees remain retained. The seven inherited dirty entries retain their exact bytes and modes.

Migration #143 remains queued next. The model-neutral generator redesign #181 remains deferred until after 0.1.x; no new task was started during release completion.
