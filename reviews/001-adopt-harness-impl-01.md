# Review: adopt harness r4 — implementation, round 01

- **Revision covered:** `39b4630347a2d88e90428fa93b505ce74e0be48e` (branch
  `adopt-harness`, pull request #1).
- **Target proof:** `git rev-parse adopt-harness` =
  `39b4630347a2d88e90428fa93b505ce74e0be48e`; `gh pr view 1 --json
  files,headRefOid` gives `headRefOid` = the same sha. `git merge-base main
  adopt-harness` = `b0d49b0b0021a2ba5f5e27130da4897550eea5eb`; `git diff
  --name-only b0d49b0..adopt-harness` and the pull request's files agree:
  - `AGENTS.md` (added)
  - `CLAUDE.md` (modified)
  - `PRINCIPLES.md` (added)
  - `design/README.md` (added)
  - `reviews/README.md` (added)

  One commit on the branch (`39b4630 Adopt harness release r4`). The working
  tree also has an untracked `addons/gdUnit4/src/dotnet/GdUnit4CSharpApi.cs.uid`;
  it is not committed and not part of this change.
- **Harness source:** procedure `ADOPT.md` read at harness HEAD (`a2ef546`); the
  adopted text compared against tag `r4` → commit
  `39c29e3b40534bdcfa379e4f426cd3dc3dc88440` (2026-09-23), via
  `git -C harness_template show r4:<file>`.
- **Reviewer:** Claude Opus 5.5, model id `claude-opus-5-5`.
- **Mode:** Claude Code, fresh-context session (has not seen how the change was
  made).

## What was checked

1. **Files against r4.** `AGENTS.md`, `design/README.md`, `reviews/README.md`
   are byte-identical to `r4`. `CLAUDE.md` differs from `r4` only inside
   `SLOT:BEGIN`/`SLOT:END` (the scaffold comment removed, the fields filled);
   the process text above the slot is identical. `PRINCIPLES.md` differs in
   one place only, the conservative-floor path list (`PRINCIPLES.md:43-46`):
   the web paths (`public/**`, `mobile/**`, `netlify.toml`, package manifests)
   are replaced by this repository's (`core/**`, `game/**`, `data/**`,
   `test/**`, `addons/**`, `.githooks/**`, `project.godot`,
   `export_presets.cfg`, the design-stating documents). That is a justified
   adaptation, and it matches the slot's doc-only owner decision.
2. **Slot truth.** Checked against the tree: `core/rules`, `core/validate`,
   `game/`, `data/maps`, `test/guard` exist; gdUnit4 is 6.2.1
   (`addons/gdUnit4/plugin.cfg`); `.godot/`, `/build/`, `/reports/` are
   gitignored and produced as stated; `export_presets.cfg` has no signing
   material (`codesign/enable=false`). The gates table matches
   `tools/gates.sh` (five gates, same commands, `GODOT_BIN` fallback, export
   skip unless `MALPACO_REQUIRE_EXPORT=1`) and `.github/workflows/gates.yml`
   (on `pull_request` and pushes to `main`, sets `MALPACO_REQUIRE_EXPORT`).
   "100 full games" (`test_hundred_games.gd:14`), the purity guard
   (`test/guard/test_core_purity.gd`), the smoke gate's history
   (`tools/gates.sh:68-71`), the gdtoolkit lag (`ONBOARDING.md:147`), the
   Esperanto/diacritic-free convention (`RULES.md:283-284`), "Commercial
   intent" (`DECISIONS.md:406`) and the owed-decisions list at the end of
   `ONBOARDING.md` are all real. The product paragraph is drawn from
   `README.md:7-12`. "Four gates" → five is a correct fix.
3. **Adapters.** The `CLAUDE.md` process section and `AGENTS.md` are the r4
   text unchanged; neither restates the principles beyond r4's own links. I
   found nothing in the slot that contradicts `PRINCIPLES.md`, with the one
   edge in finding 4.
4. **Collision.** Every item of `git show main:CLAUDE.md` was traced: the doc
   pointers → *paths to inspect* (plus `ASSETS.md`, added); branch/push/merge
   → *Branches* and `merge: owner`; doc-only → replaced, owner decision; the
   six "keep X current" rules → *Keep the documents current*; roles and
   verification steps, screenshots → *Roles*; rabbit holes → *Rabbit holes*;
   all six engine and three look hard rules → verbatim, as
   decided-not-to-reopen; stack → *Stack* and the gates table. Only one
   phrase has no home (finding 3).
5. **Provenance and scope.** Provenance is at `CLAUDE.md:175-181` (release
   `r4`, commit `39c29e3`, 2026-09-24). The diff touches the five files above
   and nothing else.

## Findings

1. **blocking** — Three of the four owner decisions are not recorded as the
   protocol requires. `PRINCIPLES.md:108`: owner decisions are "Recorded with
   a recommended default, the reason, and an owner-decision mark."
   *Doc-only changes* (`CLAUDE.md:106-114`) meets that. The *Harness
   provenance* bullet (`CLAUDE.md:175-181`) has the mark, but it folds in
   three decisions the pull request and commit message name ("r4 over the
   unreleased main; keep Malpaco's ROADMAP.md and skip the PLAN/ROADMAP
   overlay; keep both modes"). None of them states a recommended default. Only
   the overlay decision gives a reason ("Malpaco's `ROADMAP.md` stays the
   plan"). "Both modes are kept" gives no reason, and choosing r4 over the
   harness `main` is never stated as a decision. Fix: give each decision its
   own line in the slot with the recommended default and the reason. Examples:
   r4 because it is the tagged release, and `main` is unreleased and carries
   rules (milestones) not in r4; both modes because both tools are used here.
   The adoption is its own first owner-decision record, so it should be the
   model record.

2. **non-blocking** — `milestones:` is not filled, and the adoption does not
   say why. `ADOPT.md` §6 (harness HEAD) makes it a done-when item: "`merge:`,
   `design:`, `milestones:` and gates table are filled". The r4 slot has no
   `milestones:` field, and r4 `PRINCIPLES.md` has no *Milestones* section.
   Both arrived after r4 (harness `dbfbfa0`). Leaving the field out is right
   for an r4 adoption; adding it would invent a rule r4 lacks. The gap between
   the procedure and the adopted text still belongs in the record. Add one
   line to the provenance bullet, such as "milestones: not part of r4; not
   adopted (the repository has no release tags yet)". Otherwise a later
   reader checking §6 sees an unmet item.

3. **non-blocking** — Small loss in the collision. Old `CLAUDE.md:19` (main):
   "Test locally and report concrete verification steps so the user can test
   it themselves too." The new *Branches* bullet (`CLAUDE.md:103-105`) drops
   "Test locally". *Roles* keeps the verification steps but not the
   instruction to run the change yourself first. The r4 habit "A passing test
   is not a working feature … go and play it" (`PRINCIPLES.md:171-172`) covers
   most of it, but not in Malpaco's own words. Restore the two words, or note
   that the habit replaces them.

4. **non-blocking** — The doc-only decision says more than `PRINCIPLES.md`
   allows. `CLAUDE.md:110-112`: "notes in `ONBOARDING.md` and `ASSETS.md`,
   and typos stay trivial and may go straight to `main`." Under
   `PRINCIPLES.md:37-38` (c), a change to "the design or process a builder
   must follow" is non-trivial. Some `ONBOARDING.md` notes are exactly that,
   because they change how the project is set up or its gates are run
   (`ONBOARDING.md:147-151` tells a builder how to treat lint failures). The
   floor is a floor, and the (a)–(d) test still applies. Fallback order puts
   `PRINCIPLES.md` first, so the slot sentence is at most misleading, not in
   force. Suggest: "…stay trivial when they meet none of (a)–(d)".

5. **non-blocking** — The ownership map points at files that are absent or
   hold a different role. `PRINCIPLES.md:19-20,23` assign "the iteration
   overlay" to `PLAN.md`, "feature requests and artistic license" to
   `ROADMAP.md`, and verification patterns to `verification/README.md`.
   `PLAN.md` and `verification/README.md` were not taken, and Malpaco's
   `ROADMAP.md` is its iteration plan, not the harness overlay. The table is
   "authoritative" (`PRINCIPLES.md:25`), so a reader who follows it is
   misdirected. `PRINCIPLES.md` was already adapted for the floor, so
   annotate those rows the same way ("not taken here; see the slot's *Open
   work*").

6. **non-blocking** — Gates table accuracy for local runs. The *when* column
   for format and lint (`CLAUDE.md:87-88`) says "every push, every PR". But
   `tools/gates.sh:37-38,47-48` **skips** both when gdtoolkit is not
   installed, and the run still ends "all gates green"
   (`tools/gates.sh:108-113`). The table records this skip for export and
   leaves it out for format and lint. Record it the same way: "locally when
   gdtoolkit is installed, otherwise skipped". A local green with a missing
   linter is a silent false green, which is what gates discipline 3 warns
   about.

— Claude Opus 5.5 (claude-opus-5-5), reviewer
One blocking finding remains (finding 1).
