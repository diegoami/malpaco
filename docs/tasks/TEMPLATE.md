# T<nn> <Title>

- **Kind**: feature | correction (of T<nn>, bug #<n>) | slice | infrastructure
- **Issue**: #<n> · **Branch**: `task/T<nn>-<slug>` · **Merge after**: T<nn>, …
- **Review**: none | PR review (say why: rule core, saves, risky) — reviews are optional
  (`docs/process.md` §4); everything is covered by the next milestone review.
- **Evidence**: the isle-wars-archaeology findings or investigations this task rests on, with links.
- **Owns**: directories or files, e.g. `src/core/combat.ts`, `tests/core/**`.
- **Scope**: what to build, in a few sentences. What is out of scope, if it is easy to confuse.
- **Done when**:
  1. One check a command can run, with the expected result. Before dispatch, it fails on `main`.
  2. …
  3. `npm run build`, `npm test` and `npx playwright test` are green.
- **Hazards**: the mistake an implementer is most likely to make here, and how to avoid it.
