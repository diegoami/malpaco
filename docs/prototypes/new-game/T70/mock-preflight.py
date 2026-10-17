#!/usr/bin/env python3
"""Disposable T70 acceptance feasibility probe; always restores exact production bytes.
Run: python3 docs/prototypes/new-game/T70/mock-preflight.py baseline|mock [Playwright flags]
Snapshots, manifests, raw logs and screenshots go to unique evidence directories.
"""
import datetime, gzip, hashlib, json, os, pathlib, signal, subprocess, sys, tarfile, time
ROOT = pathlib.Path(__file__).resolve().parents[4]
MODE = sys.argv[1] if len(sys.argv) > 1 else "baseline"
if MODE not in ("baseline", "mock"):
    raise SystemExit("Expected baseline or mock")
FULL = "--full" in sys.argv
FLAGS = [flag for flag in sys.argv[2:] if flag != "--full"]
FILES = ["src/ui/battleController.ts", "src/ui/computerTurnLoop.ts", "src/ui/referenceBattleGame.ts", "src/ui/panel.ts", "src/styles.css"]
RUN = ROOT / "docs/prototypes/new-game/T70" / (datetime.datetime.now(datetime.UTC).strftime("%Y%m%dT%H%M%S%fZ") + "-" + MODE)
RUN.mkdir(parents=True)
original = {name: (ROOT / name).read_bytes() for name in FILES}
sha = lambda data: hashlib.sha256(data).hexdigest()
def snapshot(name, sources):
    payload = json.dumps({path: data.decode() for path, data in sources.items()}, sort_keys=True).encode()
    (RUN / (name + ".json.gz")).write_bytes(gzip.compress(payload, mtime=0))
    return {path: sha(data) for path, data in sources.items()}
def patch(path, before, after):
    target = ROOT / path
    text = target.read_text()
    if before not in text:
        raise RuntimeError("Mock source anchor missing: " + path + " " + before[:70])
    target.write_text(text.replace(before, after, 1))
def input_archive():
    paths = set()
    for folder in ["src", "tests", "data", "tools/harness"]:
        paths.update(path for path in (ROOT / folder).rglob("*") if path.is_file())
    for pattern in ["package*.json", "*config*.ts", "tsconfig*.json", "harness*.json", "*.md", "index.html", "docs/*.md", "docs/tasks/T70.md", "docs/prototypes/new-game/T*/acceptance/*", "docs/prototypes/new-game/T*/*.mjs", "docs/prototypes/new-game/T*/*.json", "docs/prototypes/new-game/T*/*.svg", "docs/prototypes/new-game/T31/fixtures/*.json", "docs/prototypes/map-1994/preview.html", "docs/prototypes/new-game/T70/*.py", "docs/prototypes/new-game/T70/*.ts"]:
        paths.update(path for path in ROOT.glob(pattern) if path.is_file())
    with tarfile.open(RUN / "tested-inputs.tar.gz", "w:gz") as archive:
        for path in sorted(paths): archive.add(path, arcname=str(path.relative_to(ROOT)), recursive=False)
    return {str(path.relative_to(ROOT)): sha(path.read_bytes()) for path in sorted(paths)}
child = None
def interrupted(sig, _frame):
    if child is not None and child.poll() is None:
        os.killpg(child.pid, signal.SIGTERM)
        try: child.wait(timeout=10)
        except subprocess.TimeoutExpired: os.killpg(child.pid, signal.SIGKILL)
    raise SystemExit(128 + sig)
signal.signal(signal.SIGTERM, interrupted)
signal.signal(signal.SIGINT, interrupted)
def mock():
    c = "src/ui/battleController.ts"
    patch(c, '"slow" | "normal" | "fast"', '"very-slow" | "slow" | "normal" | "fast"')
    patch(c, '{ slow: 1.5, normal: 1, fast: 0.5 }', '{ "very-slow": 2000 / 350, slow: 1.5, normal: 1, fast: 0.5 }')
    patch(c, '  private current: BattleView;', '''  playbackPaused = false;
  setPlaybackPaused(value: boolean): void {
    if (this.disposed || value === this.playbackPaused) return;
    this.playbackPaused = value; this.cancel();
    if (!value && this.current.running) this.schedule();
    this.publish({});
  }
  private current: BattleView;''')
    patch(c, '(!humanInput || this.allowInput(this.state))', '(!humanInput || (!this.playbackPaused && this.allowInput(this.state)))')
    patch(c, 'if (!this.accepts(revision, false) || activePlayer(this.state)', 'if (this.playbackPaused || !this.accepts(revision, false) || activePlayer(this.state)')
    loop = "src/ui/computerTurnLoop.ts"
    patch(loop, '    const {state,speed}', '    if (this.controller.playbackPaused) { this.cancel(); return; }\n    const {state,speed}')
    view = "src/ui/referenceBattleGame.ts"
    patch(view, '  private readonly controller: BattleController;', '''  private readonly playbackPause = h("button", { id: "game-pause-button", type: "button" }, "Pause");
  private readonly playbackSpeed = h("select", { id: "game-speed", "aria-label": "Game speed" },
    ...["very-slow", "slow", "normal", "fast"].map(value => h("option", { value }, value === "very-slow" ? "Very slow (2 s)" : value)));
  private readonly controller: BattleController;''')
    patch(view, '    this.files = new ReferenceMatchFiles', '''    this.playbackPause.onclick = () => this.controller.setPlaybackPaused(!this.controller.playbackPaused);
    this.playbackSpeed.onchange = () => this.controller.setSpeed(this.playbackSpeed.value as BattleSpeed);
    this.files = new ReferenceMatchFiles''')
    patch(view, 'subtitle), score, footer, this.files.el)', 'subtitle), score, h("div", { class: "mock-playback" }, this.playbackPause, h("label", { for: "game-speed" }, "Game speed"), this.playbackSpeed), footer, this.files.el)')
    patch(view, '    if (this.disposed) return;\n    const { state, from, to, mode', '    if (this.disposed || this.controller.playbackPaused) return;\n    const { state, from, to, mode')
    patch(view, '    this.renderMap();\n    this.panel.render', '''    this.playbackPause.textContent = this.controller.playbackPaused ? "Resume" : "Pause";
    this.playbackSpeed.value = this.controller.view.speed;
    this.renderMap();
    this.panel.render''')
    patch(view, 'import { activePlayer,', 'import { eventLogMock } from "../../docs/prototypes/new-game/T70/event-log-mock";\nimport { activePlayer,')
    patch(view, '  private readonly controller: BattleController;', '  private readonly eventLog: ReturnType<typeof eventLogMock>;\n  private readonly controller: BattleController;')
    patch(view, '    this.controller = new BattleController', '    this.eventLog = eventLogMock(options);\n    this.controller = new BattleController')
    patch(view, 'this.playbackPause, h("label"', 'this.eventLog.button, this.eventLog.dialog, this.playbackPause, h("label"')
    patch(view, '    this.playbackPause.textContent', '    this.eventLog.update(this.controller.state);\n    this.playbackPause.textContent')
    panel = "src/ui/panel.ts"
    patch(panel, 'h("div", { class: "score-num" }, `${provincesOf(state, p.id).length} provinces \\u00b7 ${armyTotal(state, p.id)} armies`)', 'h("div", { class: "score-num" }, h("strong", { "data-testid": "player-army-total", "data-player": p.id }, `Total armies: ${armyTotal(state, p.id)}`), h("div", {}, `${provincesOf(state, p.id).length} provinces`))')
    with (ROOT / "src/styles.css").open("a") as file:
        file.write('\n/* Disposable acceptance mock, restored by mock-preflight.py. */\n[data-testid="player-army-total"] { font-size:16px; white-space:nowrap; }\n.mock-playback { display:flex; align-items:center; gap:8px; }\n.battle-reference #reference-computer-status { order:-1; margin:0; }\n.battle-reference .reference-match-files { flex:1; flex-basis:auto; }\n.mock-playback dialog { background:#12202e; color:#f1f5f9; border:1px solid #8fa3b8; }\n.mock-playback dialog::backdrop { background:#000a; }\n')
manifest = {"mode": MODE, "original": snapshot("original-source", original), "full": FULL, "commands": []}
try:
    if MODE == "mock": mock()
    manifest["tested"] = snapshot("tested-source", {name: (ROOT / name).read_bytes() for name in FILES})
    manifest["inputs"] = input_archive()
    manifest["inputArchiveSha256"] = sha((RUN / "tested-inputs.tar.gz").read_bytes())
    specs = ["tests/e2e/playback-controls.spec.ts", "tests/e2e/game-event-log.spec.ts"]
    if FULL: specs += ["tests/e2e/computer-turn-flow.spec.ts", "tests/e2e/battle-controls.spec.ts"]
    commands = ([["npm", "test"], ["npm", "run", "build"]] if FULL else []) + [["npx", "playwright", "test", *specs, "--output", str(RUN / "test-results"), *FLAGS]]
    env = dict(os.environ, PLAYBACK_EVIDENCE_DIR=str(RUN / "screenshots"), COMPUTER_FLOW_EVIDENCE_DIR=str(RUN / "screenshots/computer"), BATTLE_EVIDENCE_DIR=str(RUN / "screenshots/battle"), PLAYWRIGHT_HTML_OUTPUT_DIR=str(RUN / "playwright-report"), FORCE_COLOR="0")
    for i, command in enumerate(commands):
        started = time.monotonic()
        name = "playwright.log" if command[0] == "npx" else ("unit-tests.log" if command[-1] == "test" else "build.log")
        with (RUN / name).open("w") as log:
            child = subprocess.Popen(command, cwd=ROOT, env=env, stdout=log, stderr=subprocess.STDOUT, start_new_session=True)
            code = child.wait()
        manifest["commands"].append({"command": command, "log": name, "exitCode": code, "seconds": round(time.monotonic() - started, 3)})
        manifest["exitCode"] = code
        if code: break
finally:
    for name, data in original.items(): (ROOT / name).write_bytes(data)
    manifest["restored"] = {name: sha((ROOT / name).read_bytes()) for name in FILES}
    manifest["restorationExact"] = manifest["restored"] == manifest["original"]
    (RUN / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(RUN.relative_to(ROOT))
if (RUN / "playwright.log").exists(): print("\n".join((RUN / "playwright.log").read_text().splitlines()[-24:]))
raise SystemExit(manifest.get("exitCode", 1))
