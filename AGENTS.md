# Agents

For any agent or tool working in this repository (OpenCode, Codex, Claude Code, others):

- **Rules**: [`CLAUDE.md`](CLAUDE.md), numbered and cited as "rule n".
- **Process**: [`docs/process.md`](docs/process.md): setup, task files, the loop, reviews,
  artifacts.
- **Tasks**: [`docs/tasks/README.md`](docs/tasks/README.md) indexes `docs/tasks/T<nn>.md`; the
  issue's `status:*` label is the status.
- **Reviewing a PR**: [`docs/review-pr.md`](docs/review-pr.md). **Reviewing a milestone**:
  [`docs/milestone-review.md`](docs/milestone-review.md).

For the next continuation, read [0.5.0 scope #381](https://github.com/diegoami/malpaco/issues/381), its linked exact-candidate milestone-review issue, the T144–T149 task contracts and live issue labels/PR checks. Follow `docs/milestone-review.md`: main takes only candidate-review fixes until tagging; the owner launches the independent reviewer. The required usability scope is Attack/Move selection with both legal actions (#382), readable center stars (#386), mobile icon commands (#385), viewport-contained launcher with Start/Resume on top (#384), and larger results (#379). Candidate checks, owner visual acceptance, review and explicit publication go-ahead remain separate gates. Do not launch a reviewer, tag or deploy automatically. Keep the exact [0.4.0 publication](docs/releases/0.4.0/PUBLICATION.md), [provenance](docs/releases/0.4.0/PROVENANCE.md) and [milestone #371](https://github.com/diegoami/malpaco/issues/371) as the immutable released baseline. The reviewed v0.4.0 tag and published CI bytes are immutable. Review follow-ups #372–#377 and earlier quality/reliability work remain separate; freeze a new bounded contract before changing a measured policy. Do not routinely roll production back to v0.3.1: #372 reproduces scoreboard loss and preference reset. Prefer a 0.4-compatible forward fix. Native delivery, held balance experiments and personalities remain separate. Replace this pointer when superseded.
