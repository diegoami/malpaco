# Review: adopt harness r4 — implementation, round 02

- **Revision covered:** `1aa2beb9bfbf30a046232f0b30d8eb0d1a25f758` (branch
  `adopt-harness`, pull request #1).
- **Target proof:** `git rev-parse adopt-harness` =
  `1aa2beb9bfbf30a046232f0b30d8eb0d1a25f758`; `gh pr view 1 --json
  files,headRefOid` gives `headRefOid` = the same sha. `git merge-base main
  adopt-harness` = `b0d49b0b0021a2ba5f5e27130da4897550eea5eb`; `git diff
  --name-only b0d49b0..adopt-harness` and the pull request's files agree:
  - `AGENTS.md`
  - `CLAUDE.md`
  - `PRINCIPLES.md`
  - `design/README.md`
  - `reviews/001-adopt-harness-impl-01.md`
  - `reviews/README.md`

  There are three commits since the base: `39b4630` (the adoption), `d51a8d8`
  (round-01 review recorded), and `1aa2beb` (the answer). The round-01 fixes
  are `git diff 39b4630..1aa2beb`, excluding the review file: `CLAUDE.md`
  +31/−14, `PRINCIPLES.md` +1/−3. The committed
  `reviews/001-adopt-harness-impl-01.md` is the round-01 review as written.
  The untracked `addons/gdUnit4/src/dotnet/GdUnit4CSharpApi.cs.uid` is still in
  the working tree, uncommitted and not part of the change.
- **Harness source:** procedure `ADOPT.md` at harness HEAD; adopted text
  compared against `r4` = `39c29e3b40534bdcfa379e4f426cd3dc3dc88440`.
- **Reviewer:** Claude Opus 5.5, model id `claude-opus-5-5`.
- **Mode:** Claude Code. A continuation of the round-01 reviewer session, which
  `PRINCIPLES.md` (*Reviewer sessions*) allows for a re-review. That session
  has not seen the implementer's context, and I re-read the current revision
  rather than the coordinator's message.

## Round-01 findings

1. **Owner decisions (was blocking): resolved.** `CLAUDE.md:188-199` gives
   each adoption decision its own line: *Which release*, *The overlay*, *The
   modes*. Each has the `[owner decision, 2026-09-24]` mark, the recommended
   default, and a reason. *The modes* records that the owner went against the
   recommended default (Claude-only) and says why. The protocol allows that.
   With *Doc-only changes* (`CLAUDE.md:110-119`), all four decisions named in
   the commit message and PR body are now recorded in the required form. I
   cannot check what the owner actually said; the record is internally
   consistent and matches the PR body.
2. **Milestones: resolved.** `CLAUDE.md:181-183` says r4 has no milestone rules
   and no `milestones:` field, so none is recorded. That is true of
   `r4:CLAUDE.md` and `r4:PRINCIPLES.md`. The "for reference" tag scheme
   (`v0.1.0` at Iteration 11) comes from `ROADMAP.md:266-271`, where it is
   still an unchecked, planned item; the repository has no tags. It is framed
   as reference, not rule, so it is acceptable.
3. **"Test locally": resolved.** `CLAUDE.md:103`, "developer. Test locally."
   The collision is now complete.
4. **Doc-only vs (a)–(d): resolved.** `CLAUDE.md:114-118` now ties triviality
   to `PRINCIPLES.md`'s (a)–(d). It also says an `ONBOARDING.md` edit that
   changes how the project is set up, run or worked on is not trivial. No
   longer broader than `PRINCIPLES.md`.
5. **Ownership map: resolved, with a small new overlap (finding 1 below).**
   `PRINCIPLES.md:19` replaces the three rows for files that were not taken
   with one row for Malpaco's `ROADMAP.md`, and states that the overlay and
   `verification/README.md` were not taken. `PLAN.md` and
   `verification/README.md` no longer appear anywhere in the adopted files.
   The provenance bullet (`CLAUDE.md:185-186`) now says the ownership map was
   adapted too, so the deviation from r4 is recorded.
6. **Gates skip: resolved.** `CLAUDE.md:84-86` says format and lint are
   skipped, not failed, without gdtoolkit, and that the run can still end "all
   gates green". That matches `tools/gates.sh:37-38,47-48,108-113`. "CI
   installs gdtoolkit" matches `.github/workflows/gates.yml:36-37`.

## New findings

1. **non-blocking** — "open work" now has two owners in the authoritative
   table. `PRINCIPLES.md:18` gives "… decided-not-to-reopen, open work" to
   "`CLAUDE.md`, the project slot". The new `PRINCIPLES.md:19` gives "the
   iteration plan, its status and open work" to `ROADMAP.md`. The two are
   compatible, since the slot says where open work lives
   (`CLAUDE.md:178-180`) and `ROADMAP.md` holds it. But the table is meant to
   settle ownership in a single row. Suggest dropping "and open work" from
   row 19 ("the iteration plan and its status").
2. **non-blocking** — A reflow leftover. `CLAUDE.md:103-105`: "it done — give"
   ends a line early, and "concrete steps to verify it" follows on the next
   line. Cosmetic only; rewrap the paragraph.
3. **non-blocking** — The PR body is out of date. Its file table still
   describes the `PRINCIPLES.md` change as "conservative floor adapted to this
   repo's paths" only; since `1aa2beb` the ownership map is adapted as well.
   The repository record is correct (`CLAUDE.md:185-186` and the `1aa2beb`
   commit message), so this concerns the PR description, not a file in the
   change. Update the body before merge so it keeps matching the repository.

Nothing else in the fix commits touches a file outside the list. The `r4`
comparison from round 01 still holds for `AGENTS.md`, `design/README.md` and
`reviews/README.md`, which are unchanged since `39b4630`.

— Claude Opus 5.5 (claude-opus-5-5), reviewer
No blocking finding remains.

## Completion

Merged to `main` as `a69b3c2` (PR #1, head `7b9f913`), 2026-09-24, on the
owner's instruction.

- Every chosen harness file exists — `PRINCIPLES.md`, `AGENTS.md`,
  `CLAUDE.md`, `design/README.md`, `reviews/README.md`: round 02, target
  proof and findings 1–6 resolved.
- The slot is filled from this repository, and the gates table names commands
  that run here: `./tools/gates.sh` locally (format, lint, test with 88 cases,
  smoke pass; export skipped, no local templates), and CI `gates` green on the
  head, run 36004904867.
- Collisions reported, with where the old `CLAUDE.md` knowledge went: PR #1
  body, *Collisions*.
- Review records and provenance exist: this file, `-impl-01`, and the slot's
  *Harness provenance*.
- Nothing else changed: the PR's file list is the five harness files plus the
  two review records.
- After round 02: one whitespace-only rewrap in `CLAUDE.md` (`7b9f913`),
  non-material. Round 02's non-blocking finding 1 (two owners named for "open
  work" in the ownership map) is left open for the owner.

— Implementer (Claude Opus 5.5, claude-opus-5-5)
