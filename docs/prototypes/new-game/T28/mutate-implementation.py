"""Mutation proof against saved actual implementation bytes, never the mock."""
from pathlib import Path
import hashlib, io, json, subprocess, tarfile, tempfile

root = Path(__file__).resolve().parent
repo = root.parents[3]
out = Path(tempfile.mkdtemp(prefix="actual-mutations-", dir=root / "evidence"))
files = ["src/ui/battleController.ts", "src/ui/battleView.ts", "src/ui/referenceBattleGame.ts", "src/styles.css"]
saved = {p: (repo / p).read_bytes() for p in files}
raw = {}
snapshots = {"baseline/" + p: b for p, b in saved.items()}
records = []
sha = lambda b: hashlib.sha256(b).hexdigest()

unit = ["npx", "vitest", "run", "tests/ui/battle-controller.test.ts", "tests/ui/battle-controller-safety.test.ts"]

def run(label, command, expected):
    result = subprocess.run(command, cwd=repo, capture_output=True)
    raw[label + "/stdout.txt"] = result.stdout
    raw[label + "/stderr.txt"] = result.stderr
    records.append({"label": label, "command": command, "exit": result.returncode,
                    "expected": expected, "matched": (result.returncode == 0) == expected,
                    "stdoutTail": result.stdout.decode(errors="replace")[-3000:],
                    "stderrTail": result.stderr.decode(errors="replace")[-1000:]})
    print(label, result.returncode, flush=True)
    assert records[-1]["matched"], label

def mutate(path, needle, replacement):
    source = saved[path]
    before, after = needle.encode(), replacement.encode()
    assert source.count(before) == 1, needle
    return source.replace(before, after)

unit_mutants = [
    ("stop", "stop(revision?: number): boolean {", "stop(revision?: number): boolean {\n    return false;"),
    ("pending-selection", ' || this.pending() || this.state.phase !== "attack") return false;', ') return false;'),
    ("revision", "(revision === undefined || revision === this.current.revision)", "true"),
    ("generation", "this.disposed || own !== this.generation", "this.disposed"),
    ("moving-threshold", "const threshold = armyCount(result.state, from) <= this.current.effectiveThreshold;", "const threshold = armyCount(result.state, from) <= Math.max(1, Math.min(this.current.threshold, armyCount(result.state, from) - 1));"),
    ("tie-trace", "const rolls = exchangeRolls(before, from, to);", "const rolls: BattleRoll[] = [];"),
    ("speed", "}, EXCHANGE_TIME * scale);", "}, EXCHANGE_TIME);"),
    ("watch-pause", "if ((this.watchExchanges + 1) * EXCHANGE_TIME * scale > HUMAN_BATTLE_WATCH * scale)", "if (false)"),
    ("disposed-input", "return !this.disposed && (revision === undefined || revision === this.current.revision);", "return (revision === undefined || revision === this.current.revision);"),
    ("paused-threshold", "this.current.running || this.current.paused || !Number.isSafeInteger(value)", "this.current.running || !Number.isSafeInteger(value)"),
]

browser = lambda label, pattern: ["python3", str(root / "run-browser.py"), label, "--suites", "tests/e2e/battle-accessibility.spec.ts", "--project", "1280x800", "--grep", pattern]
browser_mutants = [
    ("capture-phase", "src/ui/referenceBattleGame.ts", '    if (state.phase === "capture") this.panel.el.querySelector("#turn-phase")!.textContent = "Capture move-in";\n', "", "capture confirmation"),
    ("keyboard-focus", "src/ui/battleView.ts", '    if (focused) this.el.querySelector<HTMLElement>(`#${focused}`)?.focus({ preventScroll: true });', "", "keyboard Stop"),
    ("capture-viewport", "src/styles.css", None, "\n.battle-reference .capture-choice { margin-top:400px; }\n", "capture confirmation"),
    ("stale-phase-command", "src/ui/referenceBattleGame.ts", 'this.controller.dispatch({ kind: "endTurn" }, revision)', 'this.controller.dispatch({ kind: "endTurn" })', "keyboard Stop"),
]

try:
    run("unit-baseline", unit, True)
    run("browser-baseline", browser("actual-mutant-browser-baseline", "."), True)
    for label, needle, replacement in unit_mutants:
        path = files[0]
        changed = mutate(path, needle, replacement)
        snapshots[label + "/" + path] = changed
        try:
            (repo / path).write_bytes(changed)
            run(label, unit, False)
        finally:
            (repo / path).write_bytes(saved[path])
            assert (repo / path).read_bytes() == saved[path]
    for label, path, needle, replacement, pattern in browser_mutants:
        changed = saved[path] + replacement.encode() if needle is None else mutate(path, needle, replacement)
        snapshots[label + "/" + path] = changed
        try:
            (repo / path).write_bytes(changed)
            run(label, browser("actual-mutant-" + label, pattern), False)
        finally:
            (repo / path).write_bytes(saved[path])
            assert (repo / path).read_bytes() == saved[path]
    run("unit-restored", unit, True)
    run("browser-restored", browser("actual-mutant-browser-restored", "."), True)
finally:
    for path, data in saved.items():
        (repo / path).write_bytes(data)
    archives = {}
    for name, contents in [("raw-logs.tar.gz", raw), ("source-snapshots.tar.gz", snapshots)]:
        archive = out / name
        with tarfile.open(archive, "w:gz") as tar:
            for path, data in contents.items():
                item = tarfile.TarInfo(path); item.size = len(data); item.mtime = 0
                tar.addfile(item, io.BytesIO(data))
        with tarfile.open(archive) as tar:
            assert all(tar.extractfile(path).read() == data for path, data in contents.items())
        archives[name] = {"sha256": sha(archive.read_bytes()), "members": {p: sha(b) for p, b in contents.items()}}
    (out / "report.json").write_text(json.dumps({
        "records": records, "archives": archives,
        "restoration": {p: {"sha256": sha(b), "exact": (repo / p).read_bytes() == b} for p, b in saved.items()},
    }, indent=2) + "\n")
    print(str(out.relative_to(repo)), flush=True)
