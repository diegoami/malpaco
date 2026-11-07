# Agents

For any agent or tool working in this repository (OpenCode, Codex, Claude Code, others):

- **Rules**: [`CLAUDE.md`](CLAUDE.md), numbered and cited as "rule n".
- **Process**: [`docs/process.md`](docs/process.md): setup, task files, the loop, reviews,
  artifacts.
- **Tasks**: [`docs/tasks/README.md`](docs/tasks/README.md) indexes `docs/tasks/T<nn>.md`; the
  issue's `status:*` label is the status.
- **Reviewing a PR**: [`docs/review-pr.md`](docs/review-pr.md). **Reviewing a milestone**:
  [`docs/milestone-review.md`](docs/milestone-review.md).

For the next continuation, read the [0.5.4 contracts](docs/plans/release-0.5.4.md), [acceptance protocol](docs/releases/0.5.4/ACCEPTANCE.md), [provenance boundaries](docs/releases/0.5.4/PROVENANCE.md) and live [milestone #457](https://github.com/diegoami/malpaco/issues/457) / labels / checks. Owner accepted six fixes: selected Oxygen End turn artwork (#452), always-text primary result New game (#456), phone scoreboard (#377), safe known-Legacy classification (#376), opposite-setting actual-rule Help checks (#374), and review citations (#406). T167/#455 carries the version/manual work; T168–T171 cover the release. #458 records choices and #462 owns preparation. The issue holds the authoritative exact source/CI/archive pin; do not infer it from whichever branch is newest.

Implementation/review stays on `release/0.5.4`: pushing `main` publishes Pages. Promote only the exact successful CI-tested commit unchanged once all included heads are green; record event, PR head, actual checkout and reachable branch pin separately. Owner launches milestone review and judges the actual candidate before separately authorizing publication. Do not auto-start a reviewer, tag, release, main/Pages or Netlify deployment. No physical-device/screen-reader approval is inferred. Retain original failed/superseded runs and proofs, including the 37-pixel diagnostic reference screenshot leak fixed by scoping the badge to the player entry without changing goldens.

Preserve published v0.5.3 at `b6f9e5458fc066a4badce518404d4ed10bbfe53c`, its [publication](docs/releases/0.5.3/PUBLICATION.md)/[provenance](docs/releases/0.5.3/PROVENANCE.md), exact tar SHA-256 `508726737d7d97998da14b48b0e2facef12dba2319f331dfd9694cd38078511b`, and production `6ae7d5b45d42a9050b8ff7c9`. Preserve v0.5.2 at `198de7ef8a7cc2aaa48ae7107860f3dbb488cad0`, its records/prior production `6ae7548ddc4c0e92de7aa4fe`, v0.5.1 at `2fec967d39d8cc0a367df47db5900708ccd12d3d`, and all older tags/assets unchanged. #90/#409/#410/#432, native delivery and held balance/personality work remain separate. Freeze bounded contracts before policy changes. Prefer compatible forward fixes; #372 documents scores/preferences loss on v0.3.1 rollback. Replace this pointer when superseded.
