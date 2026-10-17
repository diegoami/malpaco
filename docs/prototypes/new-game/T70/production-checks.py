#!/usr/bin/env python3
"""Owned production evidence and narrow real omissions; never changes frozen acceptance."""
import datetime, gzip, hashlib, json, os, pathlib, shutil, signal, subprocess, sys, tarfile, time
ROOT = pathlib.Path(__file__).resolve().parents[4]
MODE = sys.argv[1]
if MODE not in ("positive", "omissions", "regressions", "edges", "edge-baseline", "ci-like", "ci-targeted-pinned", "ci-full-pinned", "focused-rework", "rework-omissions", "final-units"): raise SystemExit("Expected positive, omissions, regressions, edges, edge-baseline, ci-like, ci-targeted-pinned, ci-full-pinned, focused-rework, rework-omissions or final-units")
RUN = ROOT / "docs/prototypes/new-game/T70" / (datetime.datetime.now(datetime.UTC).strftime("%Y%m%dT%H%M%S%fZ") + "-production-" + MODE)
RUN.mkdir(parents=True)
sha = lambda data: hashlib.sha256(data).hexdigest()
paths = set()
for folder in ["src", "tests", "data", "tools/harness"]:
    paths.update(path for path in (ROOT / folder).rglob("*") if path.is_file())
for pattern in ["package*.json", "*config*.ts", "tsconfig*.json", "harness*.json", "*.md", "index.html", "docs/*.md", "docs/tasks/T70.md", "docs/prototypes/new-game/T*/acceptance/*", "docs/prototypes/new-game/T*/*.mjs", "docs/prototypes/new-game/T*/*.json", "docs/prototypes/new-game/T*/*.svg", "docs/prototypes/new-game/T31/fixtures/*.json", "docs/prototypes/map-1994/preview.html", "docs/prototypes/new-game/T70/*.py", "docs/prototypes/new-game/T70/*.ts"]:
    paths.update(path for path in ROOT.glob(pattern) if path.is_file())
original = {str(path.relative_to(ROOT)): path.read_bytes() for path in paths}
manifest = {"mode": MODE, "inputs": {name: sha(data) for name, data in original.items()}, "commands": []}
with tarfile.open(RUN / "source-inputs.tar.gz", "w:gz") as archive:
    for path in sorted(paths): archive.add(path, arcname=str(path.relative_to(ROOT)), recursive=False)
manifest["sourceArchiveSha256"] = sha((RUN / "source-inputs.tar.gz").read_bytes())
cache = ROOT / ".cache/t70-tmp"; cache.mkdir(parents=True, exist_ok=True)
env = dict(os.environ, TMPDIR=str(cache), PLAYBACK_EVIDENCE_DIR=str(RUN / "screenshots"), COMPUTER_FLOW_EVIDENCE_DIR=str(RUN / "screenshots/computer"), BATTLE_EVIDENCE_DIR=str(RUN / "screenshots/battle"), VERSIONED_MATCH_EVIDENCE_DIR=str(RUN / "screenshots/versioned"), PLAYWRIGHT_HTML_OUTPUT_DIR=str(RUN / "playwright-report"), FORCE_COLOR="0")
child = None
def interrupt(sig, _frame):
    if child is not None and child.poll() is None:
        os.killpg(child.pid, signal.SIGTERM)
        try: child.wait(timeout=10)
        except subprocess.TimeoutExpired: os.killpg(child.pid, signal.SIGKILL)
    raise SystemExit(128 + sig)
signal.signal(signal.SIGTERM, interrupt); signal.signal(signal.SIGINT, interrupt)
def run(name, command, expected=0):
    global child
    command = [str(RUN / name / "test-results") if token == str(RUN / "test-results") else token for token in command]
    command_env = dict(env, PLAYWRIGHT_HTML_OUTPUT_DIR=str(RUN / name / "playwright-report"))
    if MODE in ("edge-baseline", "ci-like", "ci-targeted-pinned", "ci-full-pinned"):
        command_env.pop("PLAYBACK_EVIDENCE_DIR", None)
        default_screenshots = ROOT / "screenshots"
        before = {str(path.relative_to(default_screenshots)): sha(path.read_bytes())
                  for path in default_screenshots.rglob("*.png") if default_screenshots.exists()}
        if not manifest.get("defaultScreenshotsBeforeArchived"):
            with tarfile.open(RUN / "default-screenshots-before.tar.gz", "w:gz") as archive:
                if default_screenshots.exists():
                    for path in sorted(default_screenshots.rglob("*")):
                        if path.is_file(): archive.add(path, arcname=path.relative_to(default_screenshots), recursive=False)
            manifest["defaultScreenshotsBeforeArchived"] = True
    started = time.monotonic()
    with (RUN / (name + ".log")).open("w") as log:
        child = subprocess.Popen(command, cwd=ROOT, env=command_env, stdout=log, stderr=subprocess.STDOUT, start_new_session=True)
        code = child.wait()
    if MODE in ("edge-baseline", "ci-like", "ci-targeted-pinned", "ci-full-pinned"):
        copied = []
        for path in sorted((ROOT / "screenshots").rglob("*.png")):
            relative = str(path.relative_to(ROOT / "screenshots"))
            digest = sha(path.read_bytes())
            if before.get(relative) != digest:
                target = RUN / "screenshots-default" / relative
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(path, target)
                copied.append({"path": relative, "sha256": digest, "bytes": path.stat().st_size})
        manifest.setdefault("defaultScreenshotOutputs", []).extend(copied)
    manifest["commands"].append({"name": name, "command": command, "exitCode": code, "seconds": round(time.monotonic() - started, 3), "expected": expected})
    if (expected == 0 and code != 0) or (expected != 0 and code == 0): raise RuntimeError(f"Unexpected exit {code} for {name}")
def browser(*flags): return ["npx", "playwright", "test", "--output", str(RUN / "test-results"), *flags]
def edge(*flags): return browser("tests/e2e/playback-edge-cases.spec.ts", *flags)
def pinned_browser(name, *specs):
    relative = (RUN / name).relative_to(ROOT).as_posix()
    output = f"/work/{relative}/test-results"
    html = f"/work/{relative}/playwright-report"
    return ["docker", "run", "--rm", "--cpus=2", "--user=1000:1000",
        "-v", f"{ROOT}:/work", "-v", "/home/diego/projects/malpaco/node_modules:/work/node_modules:ro",
        "--tmpfs", "/work/node_modules/.vite-temp:rw,mode=1777", "--tmpfs", "/work/node_modules/.vite:rw,mode=1777",
        "-e", "TMPDIR=/work/.cache/t70-tmp", "-e", "CI=true", "-e", f"PLAYWRIGHT_HTML_OUTPUT_DIR={html}",
        "-w", "/work", "mcr.microsoft.com/playwright:v1.63.0-noble",
        "npx", "playwright", "test", *specs, "--workers=2", "--output", output]
try:
    if MODE == "final-units":
        run("unit-tests", ["npm", "test"]); run("build", ["npm", "run", "build"])
    elif MODE == "focused-rework":
        run("focused-rework", ["npx", "vitest", "run", "tests/ui/playback-controls.test.ts", "tests/ui/game-event-log.test.ts"])
    elif MODE == "positive":
        run("focused", ["npx", "vitest", "run", "tests/ui/playback-controls.test.ts", "tests/ui/game-event-log.test.ts"])
        run("unit-tests", ["npm", "test"]); run("build", ["npm", "run", "build"])
        run("acceptance", browser("tests/e2e/playback-controls.spec.ts", "tests/e2e/game-event-log.spec.ts", "tests/e2e/computer-turn-flow.spec.ts", "tests/e2e/battle-controls.spec.ts", "--workers=2"))
        run("presentation-edges", edge("--workers=2"))
    elif MODE == "edges":
        run("presentation-edges", edge("--workers=2"))
    elif MODE == "edge-baseline":
        run("presentation-edges-unset-env-baseline", edge("--workers=2"), expected=1)
    elif MODE == "ci-like":
        run("all-browser-regressions-unset-playback-env", browser("tests/e2e/playback-controls.spec.ts", "tests/e2e/game-event-log.spec.ts", "tests/e2e/computer-turn-flow.spec.ts", "tests/e2e/battle-controls.spec.ts", "tests/e2e/playback-edge-cases.spec.ts", "tests/e2e/versioned-match.spec.ts", "tests/e2e/finished-copy.spec.ts", "--workers=2"))
    elif MODE == "ci-targeted-pinned":
        run("targeted-updated-acceptance-and-map-readability", pinned_browser("targeted-updated-acceptance-and-map-readability", "tests/e2e/playback-controls.spec.ts", "tests/e2e/game-event-log.spec.ts", "tests/e2e/map-readability.spec.ts"))
    elif MODE == "ci-full-pinned":
        run("full-playwright-suite", pinned_browser("full-playwright-suite"))
    elif MODE == "regressions":
        run("build", ["npm", "run", "build"])
        run("all-browser-regressions", browser("tests/e2e/playback-controls.spec.ts", "tests/e2e/game-event-log.spec.ts", "tests/e2e/computer-turn-flow.spec.ts", "tests/e2e/battle-controls.spec.ts", "tests/e2e/playback-edge-cases.spec.ts", "tests/e2e/versioned-match.spec.ts", "tests/e2e/finished-copy.spec.ts", "--workers=2"))
    else:
        controls = [
            ("capture-net-label", "src/ui/gameEventLog.ts", "Net after combat and capture", "Combat and capture", ["npx", "vitest", "run", "tests/ui/game-event-log.test.ts", "-t", "capture region counts are labelled net"]),
            ("pause-pressed-state", "src/ui/referenceBattleGame.ts", '    this.playbackPause.setAttribute("aria-label", this.controller.playbackPaused ? "Resume game" : "Pause game");\n', '    this.playbackPause.setAttribute("aria-label", this.controller.playbackPaused ? "Resume game" : "Pause game");\n    this.playbackPause.setAttribute("aria-pressed", String(this.controller.playbackPaused));\n', edge("--grep", "modal Escape", "--project=1280x800", "--workers=1")),
            ("queued-dialog-close-focus", "src/ui/gameEventLog.ts", "    this.append(this.history.events[0]!);\n", '    this.dialog.addEventListener("close", () => this.button.focus({ preventScroll: true }));\n    this.append(this.history.events[0]!);\n', edge("--grep", "closing the event log does not steal focus", "--workers=2")),
            ("computer-pause", "src/ui/computerTurnLoop.ts", "    if (this.controller.playbackPaused) { this.cancel(); return; }\n", "", ["npx", "vitest", "run", "tests/ui/playback-controls.test.ts", "-t", "paused computer rejects"]),
            ("battle-stale", "src/ui/battleController.ts", "this.generation += 1;", "this.generation += 0;", ["npx", "vitest", "run", "tests/ui/playback-controls.test.ts", "-t", "global pause invalidates"]),
            ("manual-pause", "src/ui/battleController.ts", "(!this.playbackPaused && this.allowInput(this.state))", "this.allowInput(this.state)", ["npx", "vitest", "run", "tests/ui/playback-controls.test.ts", "-t", "paused computer rejects"]),
            ("totals", "src/ui/panel.ts", "${armyTotal(state, p.id)}", "${0}", browser("tests/e2e/playback-controls.spec.ts", "--grep", "labelled army totals", "--project=1280x800", "--workers=1")),
            ("complete-log", "src/ui/gameEventLog.ts", "while (this.count < state.history.length)", "if (this.count < state.history.length)", ["npx", "vitest", "run", "tests/ui/game-event-log.test.ts", "-t", "complete replay is cached"]),
            ("combat-casualties", "src/ui/gameEventLog.ts", "${outcome.attackerLosses} combat casualties", "${999} combat casualties", browser("tests/e2e/game-event-log.spec.ts", "--grep", "complete domination", "--project=1280x800", "--workers=1")),
            ("modal-escape", "src/ui/referenceBattleGame.ts", ' || this.eventLog.isOpen', '', edge("--grep", "modal Escape", "--project=1280x800", "--workers=1")),
            ("local-speed", "src/ui/battleView.ts", 'h("option", { value: "very-slow" }, "Very slow"), ', '', edge("--grep", "modal Escape", "--project=1280x800", "--workers=1")),
        ]
        if MODE == "rework-omissions": controls = controls[:3]
        for name, path, before, after, command in controls:
            saved = original[path]
            try:
                text = saved.decode(); assert before in text, path
                mutated = text.replace(before, after, 1).encode(); (ROOT / path).write_bytes(mutated)
                manifest.setdefault("mutations", []).append({"name": name, "path": path, "before": before, "after": after, "originalSha256": sha(saved), "mutatedSha256": sha(mutated)})
                run(name, command, expected=1)
            finally: (ROOT / path).write_bytes(saved)
finally:
    manifest["inputsUnchanged"] = all((ROOT / name).read_bytes() == data for name, data in original.items())
    with tarfile.open(RUN / "raw-logs.tar.gz", "w:gz") as archive:
        for path in sorted(RUN.rglob("*")):
            if path.is_file() and (path.suffix == ".log" or "test-results" in path.parts or "playwright-report" in path.parts):
                archive.add(path, arcname=str(path.relative_to(RUN)), recursive=False)
    manifest["rawLogsSha256"] = sha((RUN / "raw-logs.tar.gz").read_bytes())
    with tarfile.open(RUN / "captures.tar.gz", "w:gz") as archive:
        for path in sorted(RUN.rglob("*.png")): archive.add(path, arcname=str(path.relative_to(RUN)), recursive=False)
    manifest["capturesSha256"] = sha((RUN / "captures.tar.gz").read_bytes())
    (RUN / "report.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(RUN.relative_to(ROOT), flush=True)
