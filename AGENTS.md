# AGENTS.md

Claude Code reads `CLAUDE.md`; OpenCode and other harnesses read this file. The rules are
binding for every agent working in this repository, and they live in
[`CLAUDE.md`](CLAUDE.md) — read it before doing anything here. This file only points; it
never restates a rule, so there is exactly one copy of each.

- **Rules**: [`CLAUDE.md`](CLAUDE.md) — numbered, cited everywhere as "rule n".
- **Process**: [`docs/process.md`](docs/process.md) — how a task runs. §4 is the implementer's
  contract (it travels with every brief); §5 the reviewer's.
- **Tasks**: [`docs/tasks/README.md`](docs/tasks/README.md) indexes `docs/tasks/T<nn>.md`.
  A task's issue (`status:ready`) points at its task file; the task file is the contract, and
  its Done-when is not negotiable (rule 5).
- **Models**: [`docs/models.md`](docs/models.md) — who implements, who reviews, each model's
  record. Model ids come from live lists (`opencode models`), never memory.
