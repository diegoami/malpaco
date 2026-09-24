# Review: export template path — implementation, round 01

- **Revision covered:** `a3d3eda6009b72725a82ff95b252eb175482eb12` (branch
  `fix-export-template-path`, pull request #2).
- **Target proof:** `git rev-parse fix-export-template-path` =
  `a3d3eda6009b72725a82ff95b252eb175482eb12`; `gh pr view 2 --json
  files,headRefOid` gives `headRefOid` = the same sha. `git merge-base main
  fix-export-template-path` = `e902441e82592243f5d3c9393e557228051a0d77`;
  `git diff --name-only e902441..fix-export-template-path` and the pull
  request's files agree:
  - `ONBOARDING.md`
  - `tools/gates.sh`

  One commit since the base (`a3d3eda`). The working tree was on the branch at
  that sha; the untracked `addons/gdUnit4/src/dotnet/GdUnit4CSharpApi.cs.uid`
  is not part of the change.
- **Reviewer:** Claude Opus 5.5, model id `claude-opus-5-5`.
- **Mode:** Claude Code, fresh-context session. I have not seen the
  implementer's context; the branch was read with `git show` / `git diff`.

## What I reproduced

- **Template roots.** `tools/gates.sh:89-98` matches Godot 4's editor data
  directory on each OS: `%APPDATA%\Godot` (Git Bash/MSYS/Cygwin),
  `~/Library/Application Support/Godot` (Darwin),
  `${XDG_DATA_HOME:-~/.local/share}/godot` (everything else), then
  `export_templates/<version>`. Every expansion of the space-containing path is
  quoted (`:96`, `:100`, `:101`).
- **Version folder.** `"$GODOT_BIN" --version` on this machine emits exactly
  one line, `4.7.2.stable.mono.official.ed1daf0bf\r\n` (checked with `od -c`).
  The pipeline at `:99-100` yields `4.7.2.stable.mono`; fed the standard string
  (with and without `\r`) it yields `4.7.2.stable`; `4.7.3.rc1.official.<hash>`
  gives `4.7.3.rc1`; a banner line *before* the version is dropped by
  `tail -1`. See findings 1 and 2 for the inputs it gets wrong.
- **Windows skip path.** `bash tools/gates.sh` at `a3d3eda` (Git Bash, .NET
  console build): test and smoke PASS, format/lint SKIP (gdtoolkit not on this
  shell's PATH, unrelated), and
  `SKIP export — no export templates at C:\Users\diego\AppData\Roaming/Godot/export_templates/4.7.2.stable.mono`.
  That folder is what the .NET editor's Manage Export Templates installs to.
  Bash's `-d` accepts the mixed `\` / `/` path (reproduced on a scratch dir).
- **CI.** Run `36006321489` on head `a3d3eda` concluded `success`; its log
  shows `Godot Engine v4.7.2.stable.official.ed1daf0bf` and
  `PASS  export — build/linux/malpaco.x86_64` with `MALPACO_REQUIRE_EXPORT=1`.
  The Linux branch still resolves `$HOME/.local/share/godot/export_templates/4.7.2.stable`,
  the folder `.github/workflows/gates.yml:33-34` moves the templates to. The
  PR's third done-when box is therefore met, though still unchecked in the PR
  body.
- **`-s` versus `-x`.** In a scratch dir under
  `C:\Users\diego\AppData\Local\Temp`: a file starting `\x7fELF`, after
  `chmod +x`, tests `-x:n -s:y`; a `#!` script tests `-x:y`. `mount` shows `/`
  and `/c` mounted `noacl`, where Cygwin/MSYS grant `x` only to `.exe`/`.com`/
  `.bat` names or `#!`/`MZ` content. So `-x` would have reported a good
  Windows export as "produced no binary"; `-s` (`:94`, `:111`) is the right
  test there, and Linux/macOS keep `-x` (`:88`).
- **`set -uo pipefail`.** `APPDATA` and `XDG_DATA_HOME` are both read with
  `:-` defaults (`:91`, `:97`), so `-u` cannot trip on them. A failing
  `--version` inside the command substitution cannot abort the script (no
  `-e`); its effect is finding 2.
- **bash 3.2.** Here-strings, `sed -E` (BSD sed accepts it), `case` with `|`
  patterns and `tr -d '\r'` all exist in bash 3.2 / macOS userland. I could not
  run bash 3.2 or macOS here; this is by reading, not reproduction.
- **Not exercised by anyone:** a real Windows export with installed templates,
  so the `-s` branch has never gone green end to end. The PR says so under
  "Left out"; I agree it is the owner's call (1 GB download), and it is not a
  blocker because the Linux path, which CI enforces, is unchanged in behaviour.

## Findings

1. **non-blocking — the version folder is derived by stripping, not by
   matching.** `tools/gates.sh:100`, `sed -E 's/\.[^.]+\.[^.]+$//'`, assumes
   the last two dot-fields are always build name and hash. Godot appends the
   hash only when the build has one; a distro/tarball build prints e.g.
   `4.7.2.stable.arch_linux`, which this turns into `4.7.2` (reproduced), and
   the gate SKIPs locally with a wrong folder named. Likewise `tail -1`
   (`:99`) would pick up any line a future Godot prints *after* the version
   (reproduced: `…ed1daf0bf\nsome trailing line` → `some trailing line`). Not
   reachable with the official builds the project pins, and the SKIP line
   names the folder, so it fails visibly. A sturdier form matches what Godot
   itself names the folder (`VERSION_FULL_CONFIG`):
   `grep -oE '^[0-9]+(\.[0-9]+)+\.[a-z]+[0-9]*(\.mono)?' | head -1`.

2. **non-blocking — an empty version resolves to `export_templates/`
   itself.** If `"$GODOT" --version` prints nothing, `:100` builds
   `…/export_templates/`, and `[[ ! -d … ]]` at `:101` is false whenever any
   template set was ever installed or the folder was merely created — as on
   this machine, where `%APPDATA%\Godot\export_templates` exists and is empty.
   The gate then attempts the export and reports a bare `FAIL export` instead of
   saying the version could not be read. Loud, not a false green, and
   `--version` failing after the `:29` existence check is unlikely. A
   `[[ -n "$GODOT_VERSION" ]]` guard with its own message would close it.

3. **non-blocking — the "produced no binary" check can be satisfied by a stale
   build.** `tools/gates.sh:108-111` never removes
   `build/linux/malpaco.x86_64` before exporting, so a binary left by an
   earlier run passes `-s` (and `-x`) even if this export wrote nothing. Pre-
   existing with `-x`, but this change is what makes the check reachable on
   Windows, where `build/` persists between runs; CI's fresh checkout is not
   affected. `rm -f build/linux/malpaco.x86_64` before `:109` would make the
   message true. Flagged, not required here.

4. **non-blocking — ONBOARDING names a narrower Linux path than the gate
   uses.** `ONBOARDING.md:114` gives `~/.local/share/godot`; the gate and
   Godot honour `$XDG_DATA_HOME` first (`tools/gates.sh:97`). It also names
   only the .NET folder (`4.7.2.stable.mono`, `:117`), not the standard
   `4.7.2.stable`. The SKIP line prints the real folder, so a reader is not
   misled for long; "`$XDG_DATA_HOME/godot` (default `~/.local/share/godot`)"
   and naming both folders would make the paragraph exact. The rest of the
   paragraph is accurate: the menu is Editor → Manage Export Templates, and
   the .NET editor does need the `.mono` set even for a GDScript-only project
   (the one `.cs` file in the repo is inside `addons/gdUnit4/`, which
   `export_presets.cfg:11` excludes, and there is no `.csproj`).

Pre-existing and already listed by the PR under "Left out", so not a finding:
the export pipeline at `tools/gates.sh:109-110` takes its status from `grep
-v`, so an export whose every output line matched `alsa|audio driver` would
FAIL. Godot's self-contained mode (`._sc_` beside the binary, data under
`editor_data/`) is not handled; the local install has no marker, and the SKIP
line would name the folder it checked.

— Claude Opus 5.5 (claude-opus-5-5), reviewer
No blocking finding remains.
