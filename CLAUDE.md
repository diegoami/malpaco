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
6. Each task file names its implementer and its reviewer, at the effort below, and says
   whether the task is `easy` or `hard`, and why. The pairs (the owner's decision, 2026-10-03):

   | Difficulty | Implementer | Its fallback | Reviewer | Its fallback |
   | --- | --- | --- | --- | --- |
   | Easy, the default | GLM-5.3 Flash (Z.AI Coding Plan only) | Sonnet | GPT-5.6 Luna (direct OpenAI) | Sonnet |
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
   - **GPT-6.1 Sol, sparingly** (the owner, 2026-10-03): only for hard reviews, at effort `low`;
     `medium` only when the task file says why; never `high`.
   - **Effort** (the owner, 2026-10-05): a heavy model (Opus, GPT-6.1 Sol, GLM-5.3, DeepSeek V4 Pro)
     runs at `medium` at most, and at `low` when medium is not needed. A model that offers no
     medium takes its lowest variant at or below `high`: GLM-5.3 `low`, DeepSeek V4 Pro `high`
     (its lowest). A light model (Sonnet, GPT-5.6 Luna, GLM-5.3 Flash, DeepSeek V4.1 Flash) stays
     at `high`. A heavy model switched with `switch-model.mjs` takes `--variant medium` or `low`.
   - **Luna** (harness_imperial L51): the light OpenAI model, and the reviewer `luna`, is GPT-5.6
     Luna on the direct OpenAI route (`openai/gpt-5.6-luna`, effort `high`), on its own weekly
     pool. GPT-6 Luna draws on OpenAI's main pool with Sol: it stays registered as `luna-6`, outside
     every chain, never the reviewer. Never a Luna on OpenCode Go (`opencode-go/…`).
   - **Quota first** (harness_imperial L50 and L52; the owner, 2026-10-05, superseding every
     earlier limit on which models may be used): before choosing, recommending or delegating to a
     model, check its provider with quota-tracker (`docs/environment.md`). A provider that is
     `exhausted` is not used until it is usable again: take the next model of the pair or chain
     whose provider has quota, pass it explicitly (`--model`, `--reviewer`, the Agent's model,
     `opencode -m`), and say so in the run's report or the PR body. The scripts also skip an
     exhausted provider themselves (L52). Without the service, count a usage-limit error as
     `exhausted`. Ids still come from the live list (`opencode models <provider>`), never memory.
   - **Sonnet's tripwire** (the owner, 2026-10-04). Every Sonnet brief carries the paragraph in
     `docs/models.md`. Sonnet stops and hands back an `ESCALATE` block when:
     - two hypotheses for the same question have failed;
     - it would rely on bytes, code or behaviour it cannot explain;
     - it is about to write a claim it cannot back;
     - it has made three attempts at one step without progress.

     The main session then brings in Opus, to answer the question (consult) or to take the task
     (takeover), on the pushed branch.
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

     It never chooses models by budget; it checks only whether a provider has quota (Quota first,
     above).

   The difficulty pairs were the owner's decision on 2026-10-03. This overrides the family rule in
   the harness copies, which `harness.lock` pins. The Claude
   agent files (`.claude/agents/`) carry the effort above: `implementer` (Sonnet) `high`,
   `reviewer` (Opus) `medium`.

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
22. **Be practical** (the owner, 2026-10-05, a lesson from goal2-archaeology). Be flexible: when
    something is true with a probability of 80–90%, accept it rather than spend much more time
    proving it, and say how sure you are.
    - **Work:** stop investigating once the answer is clearly likely.
    - **Reviews:** blocking is for a likely problem that gets past what the task protects (a rule
      value with no evidence (rule 17), unseeded randomness in rule code (rule 18), copied original
      content (rule 19), a broken UI bar (rule 20)). An unlikely edge case, or one a later run would
      expose loudly, is a follow-up.
    - **Game rules:** a rule value from isle-wars-archaeology's findings is used as the finding states
      it, with its confidence; a value it leaves unknown stays `[designed]`, with what was searched
      (rule 17).

