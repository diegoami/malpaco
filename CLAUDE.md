# malpaco

An original turn-based island-conquest game, inspired by Soleau Software's *Isle Wars Pro*. It
knows its predecessor's strengths, and aims for a UI at least as good as Pro's. Its design comes
from the reviewed findings of
[isle-wars-archaeology](https://github.com/diegoami/isle-wars-archaeology), its research
repository. The stack is TypeScript: a pure rules core, an SVG map, a DOM and CSS UI, Vite, Vitest
and Playwright. It restarts, on 2026-10-03, from the TypeScript spike of
[malpaco-godot-poc](https://github.com/diegoami/malpaco-godot-poc), the archived Godot proof of
concept, which keeps its decisions, postmortem and reviews.

The process is `docs/process.md`; read it before running a task. Tasks are `docs/tasks/T<nn>.md`,
indexed in `docs/tasks/README.md`.

## Rules
1. The main session plans, runs `/run-task`, triages and talks to the user. It delegates (`/delegate`):
   code to OpenCode, review to another model (rule 6), repeated decisions to Jev after a trial, and
   images and audio to OpenRouter or ElevenLabs models, whose ids come from live lists, never memory.
2. Nobody works in the main checkout but the main session: OpenCode runs in the worktree the script
   makes, Claude agents run with worktree isolation. Never `git stash`.
3. Status lives in GitHub labels. No document carries a status snapshot.
4. A question is not a request to edit files. Answer it; propose any fix and wait.
5. The Done-when is not negotiable by the implementer. It stops and reports; it never weakens an
   assertion, skips a test or edits its task file. The main session amends a Done-when on `main`
   with the reason in the commit message.
6. Each task file names its implementer and its reviewer, at effort `high` at most, and says
   whether the task is `easy` or `hard`, and why. The pairs (the owner's decision, 2026-10-03):

   | Difficulty | Implementer | Its fallback | Reviewer | Its fallback |
   | --- | --- | --- | --- | --- |
   | Easy, the default | GLM-5.3 Flash (Z.AI Coding Plan only) | Sonnet | GPT-6 Luna (direct OpenAI) | Sonnet |
   | Hard | DeepSeek V4.1 Flash (Go) | Sonnet | GPT-6.1 Sol (direct OpenAI) | Opus |

   - **Hard** is any of:
     - a gate or a test that guards the UI or the rules core;
     - a new mechanism across several files, or a new external dependency;
     - a task whose earlier round found blocking bypasses (T02: Sol found new evasions in each round).

     Everything else is easy.
   - **Family:** the reviewer comes from another family than the implementer. When a constraint
     forces the same family, the task file names it.
   - **UI work** is also checked against the Playwright goldens, and the owner judges the look.
   - **Other probed models** (`harness.json`, for an explicit `--model` or a switch): DeepSeek V4
     Pro, GLM-5.3 and GPT-6 Sol; Opus and Fable implement only when a task file says why.
   - **Escalation after a heavy review** (the owner, 2026-10-03). The implementer moves up one step
     for the next round when either holds:
     - a review asks for rework with three or more blocking findings;
     - a rework round brings new blocking findings of the class the last round raised.

     The steps are GLM-5.3 Flash → DeepSeek V4.1 Flash → Opus, and Sonnet → Opus. The round count
     does not reset (rule 7). The new implementer gets the task file, every review so far, and the
     previous implementer's unpushed work as a patch to weigh, never to apply blindly.
   - **Excluded:** never Haiku. Gemini (cost), Kimi and Grok are not used.
   - **Switching:** the owner decides which models are in use, and switches them often. The main
     session keeps every switch cheap:
     - every candidate stays probed, with a `harness.json` entry;
     - task files name each role in one line;
     - a switch the owner calls applies to tasks not yet started.

     It never chooses models by budget.

   The difficulty pairs were the owner's decision on 2026-10-03. This overrides the family rule in
   the harness copies, which `harness.lock` pins. The Claude
   agent files (`.claude/agents/`) carry `effort: high`.

   The working strategy, how runs are made, the adjustments and what each model has shown are in
   `docs/models.md`, kept identical to isle-wars-archaeology's copy; the main session keeps it current.
7. Merge only with an approving review and green CI. Two rework rounds, then escalate.
8. Relay review findings in full, never a subset.
9. A test proves behaviour only if it fails when the behaviour is removed; a claim that nothing
   failed is re-taken before it is believed.
10. A comment asserting behaviour at an edge arrives with the test that visits that edge.
11. Until the first playable build, schedule only bugs that break play; label the rest
    `post-playable`.
12. A bug whose fix stays in the files it names and changes no outcome is a `fix`; a blocking
    one-file mechanical fix may ride the PR that found it, declared under Scope.
13. Design decisions go to the user; nothing else waits for the user.
14. At session start: `gh issue list --label triage:needed --state open`, and any task in flight.

## Token economy
15. A brief carries the task file pasted in full, never a pointer to it.
16. Keep every file an agent must read under ~20k tokens. Scope searches to the source and test
    directories; keep terminal output quiet; show diffs, not files.

## Conditional
17. [evidence-driven] Every rule constant (a reinforcement divisor, a cap, a probability) traces to
    a reviewed finding of isle-wars-archaeology, or is marked `[designed]` with what was searched.
    A constant guessed without saying so is how the proof of concept stalemated.
18. [seeded] No wall clock or unseeded random in rule code. `src/core` is pure: no DOM, no I/O,
    integer arithmetic, a seeded RNG. A compiler config and a purity test enforce it.

## This project
19. **An original work, never a copy.** The originals' code, assets, help text and name are never
    reused. No evidence from isle-wars-archaeology (saves, screenshots, quotes from the game's
    files) ever enters this repository. Only the behaviour and design it documents pass here, as
    citations of its findings.
20. **The UI bar is *Isle Wars Pro*.** Each UI task names what it checks with Playwright: a page
    that loads, a board that is painted, flows driven by clicks. It also names what only the owner
    can judge from the screenshots.
21. **Model trials.** After every implement or review run, the main session adds one comment to this
    repository's model-trials issue, cross-linked with isle-wars-archaeology#9:
    - the model, its role and the task;
    - the exit code, the duration and the review round;
    - what the review caught or missed.

    A model that fails is diagnosed and fixed before any fallback.
