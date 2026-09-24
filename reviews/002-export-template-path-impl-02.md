# Review: export template path — implementation, round 02

- **Revision covered:** `80830f1828e77c4e0f48c52dafea3a3a7121e47a` (branch
  `fix-export-template-path`, pull request #2).
- **Target proof:** `git rev-parse fix-export-template-path` =
  `origin/fix-export-template-path` = `HEAD` =
  `80830f1828e77c4e0f48c52dafea3a3a7121e47a`; `gh pr view 2 --json
  files,headRefOid` gives `headRefOid` = the same sha. `git merge-base main
  fix-export-template-path` = `e902441e82592243f5d3c9393e557228051a0d77`;
  `git diff --name-only e902441..fix-export-template-path` and the pull
  request's files agree:
  - `ONBOARDING.md`
  - `reviews/002-export-template-path-impl-01.md`
  - `tools/gates.sh`

  Three commits since the base: `a3d3eda` (the change, reviewed in round 01),
  `61311c9` (round-01 review recorded; the committed file is byte-identical to
  the one I wrote, checked with `diff -q`), and `80830f1` (the answer:
  `tools/gates.sh` +10/−4, `ONBOARDING.md` +4/−3). The untracked
  `addons/gdUnit4/src/dotnet/GdUnit4CSharpApi.cs.uid` is not part of the
  change.
- **Reviewer:** Claude Opus 5.5, model id `claude-opus-5-5`.
- **Mode:** Claude Code. A continuation of the round-01 reviewer session, which
  `PRINCIPLES.md` (*Reviewer sessions*) allows for a re-review. That session
  has not seen the implementer's context; I re-read the branch at `80830f1`
  with `git show` / `git diff` rather than relying on the coordinator's
  message.

## Round-01 findings, checked against `80830f1`

1. **Version derived by stripping — fixed.** `tools/gates.sh:101-102` now
   matches `^[0-9]+\.[0-9]+(\.[0-9]+)?\.[a-z]+[0-9]*(\.mono)?` after
   `tr -d '\r'` and takes `head -1`. Reproduced, feeding the pipeline with
   `printf '%b'`:
   `4.7.2.stable.official.ed1daf0bf\r\n` → `4.7.2.stable`;
   `4.7.2.stable.mono.official.ed1daf0bf\r\n` → `4.7.2.stable.mono`;
   `4.3.stable.official.77dcf97d8` → `4.3.stable`;
   `4.7.3.rc1.official.abc` → `4.7.3.rc1`;
   `4.7.2.stable.arch_linux` → `4.7.2.stable` (was `4.7.2`);
   `4.7.2.stable.mono.custom_build.abc` → `4.7.2.stable.mono`;
   a banner line before the version → ignored by `^`;
   a line *after* the version → ignored (was picked by `tail -1`);
   empty input → empty. The live `"$GODOT_BIN" --version` (.NET 4.7.2 console
   build) gives `4.7.2.stable.mono`.
2. **Empty version resolving to `export_templates/` — fixed.** `:104-105` fail
   with `export — could not read a version from '<godot> --version'` before the
   `-d` test. Reproduced with a fake Godot (below) printing nothing, and again
   printing `garbage`: both give that FAIL and `1 gate(s) failed`. This is red
   even without `MALPACO_REQUIRE_EXPORT`, so it stops a local push; I think
   that is right, since a Godot that cannot report its version is a broken
   setup, not a missing optional download.
3. **Stale binary satisfying the check — fixed.** `:114` runs
   `rm -f build/linux/malpaco.x86_64` before exporting. Reproduced: with
   templates present and a stale ELF-headed file in `build/linux/`, a fake
   export that reports success but writes nothing now gives
   `FAIL  export — Godot reported success but produced no binary`, and the
   stale file is gone afterwards. A fake export that writes an ELF-headed file
   gives `PASS  export — build/linux/malpaco.x86_64` through the Git Bash `-s`
   branch.
4. **ONBOARDING narrower than the gate — fixed.** `ONBOARDING.md:114-117` now
   gives `${XDG_DATA_HOME:-~/.local/share}/godot`, names
   `export_templates/4.7.2.stable` for the standard editor and
   `export_templates/4.7.2.stable.mono` for the .NET one. That agrees with
   `tools/gates.sh:97` and `:101-103`.

## How the new paths were exercised

`tools/gates.sh` at `80830f1` was copied into a scratch directory
(`…\scratchpad\r02\proj\tools\gates.sh`), so the script's `cd` to its parent
landed there and the repository was not touched. `GODOT_BIN` pointed to a
bash fake that prints `$FAKE_VER` for `--version`, and for `--export-release`
prints one line and optionally writes an ELF-headed file. `APPDATA` pointed to
a scratch dir. Results, export lines only:

| case | result |
|---|---|
| empty version | `FAIL export — could not read a version …` |
| `garbage` | same FAIL |
| `4.7.2.stable.arch_linux`, no templates | `SKIP … export_templates/4.7.2.stable` |
| `.mono` version, `MALPACO_REQUIRE_EXPORT=1`, no templates | `FAIL export — templates missing at …/4.7.2.stable.mono` |
| templates present, stale binary, export writes nothing | `FAIL … produced no binary`; stale file removed |
| templates present, export writes ELF | `PASS export` |

Real runs:

- `bash tools/gates.sh` on the working tree at `80830f1`: test PASS, smoke
  PASS, and `SKIP export — no export templates at
  C:\Users\diego\AppData\Roaming/Godot/export_templates/4.7.2.stable.mono`,
  the same as round 01. Format and lint SKIP because gdtoolkit is not on this
  shell's PATH, which has nothing to do with the change.
- CI run `36007168109` on `80830f1`: `success`. Format, lint, test, smoke all
  PASS, then `Godot Engine v4.7.2.stable.official.ed1daf0bf` and
  `PASS  export — build/linux/malpaco.x86_64` under
  `MALPACO_REQUIRE_EXPORT=1`. So the Linux standard build still resolves
  `$HOME/.local/share/godot/export_templates/4.7.2.stable`, and the new
  `rm -f` does not upset the fresh checkout.

## macOS (bash 3.2, BSD grep) — by reading, not reproduction

I have no macOS or bash 3.2 here.

- **BSD grep:** `-o` and `-E` with `+`, `?` and groups are supported. The
  known older BSD `grep -o` quirk re-applies `^` after each match on the same
  line. At worst it adds extra output lines; `head -1` keeps the first, which
  is the correct one. It cannot add a match here anyway, because the text left
  after `4.7.2.stable[.mono]` starts with `.`, not a digit.
- **bash 3.2:** it has here-strings (no longer used), multi-line pipelines
  inside `$( … )` continued after `|`, and single-quoted parentheses inside
  `$( … )`. Nothing in `:88-125` needs bash 4.

The fake Godot shows the new logic behaves; only a real macOS run would prove
the grep binary does.

## New findings

1. **non-blocking — a build name that begins with `mono` would be read as
   .NET.** `tools/gates.sh:102`: `(\.mono)?` is not followed by a boundary, so
   a custom build `4.7.2.stable.monolith_build` gives `4.7.2.stable.mono`
   (reproduced). Official builds are named `official`, and CI and ONBOARDING
   both use official builds, so this cannot happen in practice. If it did, the
   SKIP line names the wrong folder visibly. No change needed. A trailing
   `(\.|$)` would need the dot trimmed again, which is not worth the
   complexity.

Nothing else changed in the diff. The comment at `:85-87` still says "minus its
build and hash", which describes the result correctly even though the method
is now a match.

— Claude Opus 5.5 (claude-opus-5-5), reviewer
No blocking finding remains.

## Completion

Merged to `main` as `b63c536` (PR #2, head `d60ecd4`), 2026-09-24, on the
owner's instruction to merge once round 02 was clean.

- On Windows with no templates, export skips and names
  `%APPDATA%\Godot\export_templates\4.7.2.stable.mono`: local
  `./tools/gates.sh` run, PR #2 *Check output*.
- On Windows with that folder present, the gate attempts the export: local
  run with `APPDATA` pointed at a scratch folder, PR #2 *Check output*.
- CI still finds `~/.local/share/godot/export_templates/4.7.2.stable` and
  exports with `MALPACO_REQUIRE_EXPORT=1`: `gates` green on the head, run
  36007581698.
- Left open, as the pull request says: a real Windows export with installed
  templates, which is needed before the Git Bash `-s` check has passed on a
  real build.

— Implementer (Claude Opus 5.5, claude-opus-5-5)
