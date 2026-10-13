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
1. The main session plans, runs `/run-task`, triages and talks to the user. A subagent it spawns
   implements (or it does itself), and OpenCode reviews, asking the user before each (rule 6). It
   delegates (`/delegate`) repeated decisions to Jev after a trial, and images and audio to
   OpenRouter or ElevenLabs models, whose ids come from live lists, never memory.
2. Nobody works in the main checkout but the main session: the main session implements in a
   worktree of its own, OpenCode's reviewer runs in the worktree the script makes, Claude agents run
   with worktree isolation. Never `git stash`.
3. Status lives in GitHub labels. No document carries a status snapshot.
4. A question is not a request to edit files. Answer it; propose any fix and wait.
5. The Done-when is not negotiable by the implementer. It stops and reports; it never weakens an
   assertion, skips a test or edits its task file. The main session amends a Done-when on `main`
   with the reason in the commit message.
6. **Who implements, who reviews** (the owner, 2026-10-11 and 2026-10-12, carried from
   isle-wars-archaeology #189 on 2026-10-12, superseding every earlier model-choice rule; kept as
   history in `docs/models.md`). What worked: the main session implements, or a Claude Code agent
   it spawns does, and a separate OpenCode process of another family reviews. The roster is the
   owner's, and changes often: the defaults and the blocked list live in `harness.json` and change
   through `/switch-model`, never by a rule that names a model. No quota, tier or difficulty table
   picks a model.
   0. **The orchestrator is set by the Anthropic environment variables alone** (`ANTHROPIC_BASE_URL`,
      `ANTHROPIC_AUTH_TOKEN`, `ANTHROPIC_MODEL`): Claude by default; when Claude's tokens are out, another
      Anthropic-compatible provider such as Z.AI, MiniMax or Moonshot, which then works like Claude.
      The harness never names the orchestrator's model. It reads the orchestrator's **family**
      from that environment (`lib/common.mjs` `sessionFamily`: Claude when the base URL is unset
      or Anthropic's, GLM for Z.AI, MiniMax, Kimi for Moonshot; `HARNESS_SESSION_FAMILY` overrides, and an unknown endpoint
      refuses to review until it is set), because every subagent the session spawns, whatever
      its model, runs through the same endpoint and is of that provider's family.
   1. **Before each implementation, ask the user ONE question** with the question tool: which
      **subagent** implements, or does the main session implement directly? The implementer is
      normally a subagent spawned inside Claude Code with the Agent tool
      (`subagent_type: "implementer"`, `.claude/agents/implementer.md`, worktree isolation) on a
      model of its own, not the orchestrator's: for example, an Opus session spawns Sonnet. The model is
      a Claude Code alias (`sonnet`, `opus`, `haiku`, `fable`) or any model id the session's
      provider serves; under another Anthropic-compatible provider (Z.AI's GLM, MiniMax, Kimi) the same
      alias resolves to whatever that provider maps it to (GLM-5.3 Flash for `sonnet` on Z.AI),
      or the id names its model outright. When the provider cannot spawn a subagent (one model
      only, or the Agent tool's model is not honoured), the main session implements directly, in
      its own git worktree (never the main checkout). Propose `harness.json`'s
      `implementer.default` first. Whatever the model, a subagent runs through the session's
      endpoint, so its family for the reviewer rule is the session's (6.0). OpenCode models may
      implement when the user dispatches them (the owner lifted the old ban on 2026-10-13, after
      T09's clean OpenCode implement run; the removed `implement.mjs` and its failure classes are
      history in `docs/models.md`). Whoever implements keeps `RUN-NOTES.md` in its worktree (the
      plan, a progress line per commit, an END block), pushes after every commit, and opens the PR.
      When a subagent ends, the main session reads its final report before acting (rule 8), and
      posts its notes on the issue.
   2. **Before each review, ask the user ONE question:** which OpenCode model reviews? Propose
      `harness.json`'s `reviewer.default` first (GPT-5.6 Luna today; GPT-6.1 Sol at `low` for a
      guard, a gate or a hard task), and list the registered models that are neither of the
      session's family nor blocked. Then `tools/harness/review.mjs --pr <n> --brief <file>
      --issue <n> --apply-label [--reviewer <name>]`, one review per PR unless the user asks for
      more; its findings are relayed in full (rule 8). OpenCode's models do not always follow the
      brief: the script posts what came back, flags what it cannot read (exit 4), and the main
      session reads a flagged review and decides rather than paying for another. Record the
      answers to both questions on the issue or PR. UI work is also checked against the
      Playwright goldens, and the owner judges the look (rule 20).
   3. **The fixed rules:** the reviewer is never of the session's family (`review.mjs` refuses it
      from the environment; a `/code-review` or the `reviewer` agent, which are that family, run
      only when the user asks); a model on `harness.json`'s `blocked` list never runs (the list is
      empty today; `/switch-model --block` and `--unblock` change it).
   4. **Permissions, not briefs** (the owner, 2026-10-11): an agent gets the permissions its work
      needs, in its agent file (`.opencode/agents/reviewer.md`: `/tmp/opencode/*` outside its
      worktree; `.claude/agents/*.md`). A run that dies on a rejected path is fixed by widening
      the grant, never by re-briefing.
   5. A failed run is diagnosed and fixed, not silently re-routed: another model only when the
      provider does not answer, and the user names it. The PR records who implemented and which
      model reviewed.
   6. **Watching a review or any other background job** (L48): start it as its own systemd unit,
      `tools/harness/run-unit.sh <name> <log> -- <command>` (unit `mlp-<name>`, memory cap, stdin
      from /dev/null), never with an inherited pipe (`opencode run` waits for stdin's end-of-file).
      Watch it with one monitor every 1–2 minutes,
      `tools/harness/watch.sh --label <name> --unit mlp-<name> --file <log>` (`--opencode-log <log>`
      for an OpenCode run), never `pgrep -f` in a loop (it matches the watching shell itself;
      isle-wars-archaeology, 2026-10-11, 1.5 hours lost). As soon as the log shows
      `session ses_… started`, give the user the session id and
      `tools/harness/peek.sh ses_… [-n 20]`, and say in plain language what the agent is doing,
      never raw log lines or byte counts. "Possibly stuck" after 10 minutes without change: check
      the process and read its newest messages; a long build or test is not stuck. Dead, or
      silent for 20 minutes: stuck; kill it only if it is ours. For a Claude agent, the progress
      signal is its transcript file's size plus its worktree.
   7. **Still in force:** the effort rule (a heavy model, Opus, GPT-6.1 Sol, GLM-5.3, MiMo v2.6
      Pro or MiniMax-M3, runs at `medium` at most and at `low` when medium is not needed; a model
      with no medium takes its lowest variant at or below `high`; a light model stays at `high`);
      Sonnet's
      tripwire (`docs/models.md`) in every Sonnet brief; reach (L26: an OpenCode reviewer cannot
      reach the user's machine outside its worktree, so the main session runs those lines and posts
      their output on the PR); every model id comes from a live list (`opencode models
      <provider>`), never memory.

   The roster, how a run is made and what each model has shown are in `docs/models.md`, kept
   identical to isle-wars-archaeology's copy; the main session keeps it current.
7. Merge only with an approving review and green CI. Two rework rounds, then escalate. Who
   implements the next round is rule 6's question again (L68 supersedes L38's ladder).
8. Relay review findings in full. Read a run's final message before you retry or re-route it (L55).
9. A test proves behaviour only if it fails without that behaviour; re-take a claim that nothing failed.
10. A comment asserting behaviour at an edge arrives with the test that visits that edge.
11. Until the first playable build, schedule only bugs that break play; the rest are `post-playable`.
12. A bug whose fix stays in the files it names and changes no outcome is a `fix`; a blocking
    one-file mechanical fix may ride the PR that found it, declared under Scope.
13. Design decisions go to the user, and rule 6's two questions; nothing else waits for the user.
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

