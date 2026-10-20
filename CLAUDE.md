# malpaco

An original turn-based island-conquest game, inspired by Soleau Software's *Isle Wars Pro*. It
knows its predecessor's strengths, and aims for a UI at least as good as Pro's. Its design comes
from the reviewed findings of
[isle-wars-archaeology](https://github.com/diegoami/isle-wars-archaeology), its research
repository. The stack is TypeScript: a pure rules core, an SVG map, a DOM and CSS UI, Vite, Vitest
and Playwright.

How a task runs: `docs/process.md`. Tasks: `docs/tasks/T<nn>.md`, indexed in `docs/tasks/README.md`.
The harness was cut down on 2026-10-20 so it works in a cloud session (owner's request); the old
process, lessons and run notes are on the `local` branch, as history only.

## Rules
1. **Everything needed is in the repository.** No rule depends on files outside it (home-directory
   skills, sibling checkouts, systemd). A fresh clone in a cloud session can run every step.
2. **One checkout, branches.** Work on a branch in the checkout you are in: `task/T<nn>-<slug>`
   locally, the session's own branch in a cloud session (`docs/process.md` §3); no worktrees, no
   extra clones. Never `git stash`.
3. **Who implements.** The main session implements directly, or spawns the `implementer` subagent
   (`.claude/agents/implementer.md`) on a model of its choice; the user may name one.
4. **Reviews after a PR are optional.** When one is wanted, `node tools/review.mjs --pr <n>` runs
   `harness.json`'s `review.default` (or `--model <key>`) and posts one PR comment. Any model may
   review; there is no family rule and no fresh checkout. The big review is the milestone review
   (`docs/milestone-review.md`), which the owner starts by calling a model's CLI directly.
5. **Choosing models:** `harness.json` holds the defaults; the user decides otherwise. No quota,
   tier or chooser table applies to this project.
6. **Artifacts never go into Git.** Screenshots, logs, proof runs and builds go to `artifacts/`
   (ignored), then to a GitHub release if they must last, otherwise to Google Drive
   (`tools/artifacts.py`, `artifacts.json`, `docs/process.md` §6). Test fixtures the suite reads live in `fixtures/`.
7. Status lives in GitHub labels. No document carries a status snapshot.
8. A question is not a request to edit files. Answer it; propose any fix and wait.
9. The Done-when is not negotiable by the implementer: it stops and reports; it never weakens an
   assertion, skips a test or edits its task file. The main session amends a Done-when on `main`
   with the reason in the commit message.
10. Merge with green CI (and, when a review ran, its findings answered). Relay review findings in
    full. Design decisions go to the user; nothing else waits for the user. **Gather questions
    early** (the owner, 2026-10-20): before working on a milestone, read its whole queue and ask
    every owner question at once (`docs/process.md` §7), then work on whatever they do not block.
11. A test proves behaviour only if it fails without that behaviour. A comment asserting behaviour
    at an edge arrives with the test that visits that edge.
12. At session start: `gh issue list --label triage:needed --state open`, and any task in flight
    (`gh pr list`).

## Project rules
13. [evidence-driven] Every rule constant (a reinforcement divisor, a cap, a probability) traces to
    a reviewed finding of isle-wars-archaeology, or is marked `[designed]` with what was searched.
14. [seeded] No wall clock or unseeded random in rule code. `src/core` is pure: no DOM, no I/O,
    integer arithmetic, a seeded RNG. A compiler config and a purity test enforce it.
15. **An original work, never a copy.** The originals' code, assets, help text and name are never
    reused. No evidence from isle-wars-archaeology (saves, screenshots, quotes from the game's
    files) ever enters this repository; only the behaviour and design it documents, as citations.
16. **The UI bar is *Isle Wars Pro*.** Each UI task names what it checks with Playwright (a page
    that loads, a board that is painted, flows driven by clicks) and what only the owner can judge
    from the screenshots.
17. **Be practical** (the owner, 2026-10-05). When something is true with a probability of 80–90%,
    accept it rather than spend much more time proving it, and say how sure you are. Stop
    investigating once the answer is clearly likely. A rule value from the findings is used as the
    finding states it; a value it leaves unknown stays `[designed]`.
18. Keep files an agent must read short; a brief carries the task file pasted in full.
