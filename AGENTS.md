# Agents

For any agent or tool working in this repository (OpenCode, Codex, Claude Code, others):

- **Rules**: [`CLAUDE.md`](CLAUDE.md), numbered and cited as "rule n".
- **Process**: [`docs/process.md`](docs/process.md): setup, task files, the loop, reviews,
  artifacts.
- **Tasks**: [`docs/tasks/README.md`](docs/tasks/README.md) indexes `docs/tasks/T<nn>.md`; the
  issue's `status:*` label is the status.
- **Reviewing a PR**: [`docs/review-pr.md`](docs/review-pr.md). **Reviewing a milestone**:
  [`docs/milestone-review.md`](docs/milestone-review.md).

For the next continuation, read [0.5.0 scope #381](https://github.com/diegoami/malpaco/issues/381), the T145–T148 task contracts and live issue labels/PR checks. The owner requires all four usability fixes: Attack/Move selection with both actions when available (#382, PR #387), readable center stars (#386), mobile icon commands (#385), and viewport-contained launcher with Start on top (#384). Larger results (#379, PR #380) are also assigned to 0.5.0. Implementation is authorized; candidate review and publication remain separate. Keep the exact [0.4.0 publication](docs/releases/0.4.0/PUBLICATION.md), [provenance](docs/releases/0.4.0/PROVENANCE.md) and [milestone #371](https://github.com/diegoami/malpaco/issues/371) as the immutable released baseline. The reviewed v0.4.0 tag and published CI bytes are immutable. Review follow-ups #372–#377 and earlier quality/reliability work remain separate; freeze a new bounded contract before changing a measured policy. Do not routinely roll production back to v0.3.1: #372 reproduces scoreboard loss and preference reset. Prefer a 0.4-compatible forward fix. Native delivery, held balance experiments and personalities remain separate. No automatic reviewer or unattended merge was started. Replace this pointer when superseded.
