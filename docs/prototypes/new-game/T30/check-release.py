"""Package fresh pinned runtime, extract it and run only the changed browser suite."""
from pathlib import Path
import hashlib, json, subprocess, tarfile, tempfile

root = Path(__file__).resolve().parent
repo = root.parents[3]
out = Path(tempfile.mkdtemp(prefix="release-", dir=root / "evidence"))
raw = out / "raw"
for name in ["screenshots", "package", "build", "extracted"]: (raw / name).mkdir(parents=True)
(out / "captures").mkdir()
paths = subprocess.check_output(["git", "ls-files", "src", "public", "tools/release", "package.json", "package-lock.json", "tsconfig.json", "playwright.release.config.ts", "tests/e2e/generated-board.spec.ts", "tests/e2e/generated-board.spec.ts-snapshots", "tests/e2e/friendly-move.spec.ts", "tests/e2e/friendly-feedback.spec.ts", "tests/e2e/friendly-fixture.ts", "tests/e2e/victory-options.spec.ts", "tests/e2e/victory-fixture.ts", "tests/core/victory-options-fixture.ts", "tests/e2e/battle-fixture.ts", "tests/e2e/reference-game.spec.ts", "tests/e2e/reference-game.spec.ts-snapshots", "docs/prototypes/new-game/T63/board.json", "docs/prototypes/new-game/T63/map.svg", "docs/prototypes/new-game/T30/check-release.py"], cwd=repo, text=True).splitlines()
inputs = {p: (repo / p).read_bytes() for p in paths}
with tarfile.open(out / "source-inputs.tar.gz", "w:gz") as tar:
    for path in paths: tar.add(repo / path, arcname=path)
relative = str(out.relative_to(repo))
base_git = subprocess.check_output(["git","rev-parse","--path-format=absolute","--git-common-dir"],cwd=repo,text=True).strip()
common = ["docker", "run", "--rm", "--user", "1000:1000", "-v", str(repo) + ":/work",
          "-v", base_git + ":" + base_git + ":ro",
          "-v", str(raw / "package") + ":/work/release", "-v", str(raw / "build") + ":/work/dist",
          "-v", str(raw / "screenshots") + ":/work/screenshots",
          "-v", "/home/diego/projects/malpaco/node_modules:/work/node_modules:ro",
          "--tmpfs", "/work/node_modules/.vite-temp:rw,mode=1777", "--tmpfs", "/work/node_modules/.vite:rw,mode=1777",
          "-w", "/work"]
commands = []
sha = lambda b: hashlib.sha256(b).hexdigest()

def run(label, command):
    with (raw / (label + ".txt")).open("wb") as log:
        result = subprocess.run(command, cwd=repo, stdout=log, stderr=subprocess.STDOUT)
    commands.append({"command": command, "exit": result.returncode, "output": label + ".txt"})
    print(label, result.returncode, flush=True)
    assert result.returncode == 0, label

try:
    run("package", common + ["mcr.microsoft.com/playwright:v1.63.0-noble", "npm", "run", "package:playable"])
    archive = raw / "package/malpaco-playable.tar.gz"
    with tarfile.open(archive) as tar: tar.extractall(raw / "extracted", filter="data")
    package = raw / "extracted/malpaco-playable"
    for line in (package / "SHA256SUMS").read_text().splitlines():
        digest, path = line.split("  ", 1)
        assert sha((package / path).read_bytes()) == digest
    run("generated-board-release", common + ["-e", "PLAYABLE_EXTRACTED_DIR=/work/" + relative + "/raw/extracted",
        "-e", "PLAYABLE_EVIDENCE_DIR=/work/" + relative + "/raw/release-check",
        "-e", "GENERATED_EVIDENCE_DIR=/work/" + relative + "/captures", "-e", "FRIENDLY_EVIDENCE_DIR=/work/"+relative+"/captures", "-e", "REFERENCE_EVIDENCE_DIR=/work/"+relative+"/captures", "-e", "VICTORY_EVIDENCE_DIR=/work/"+relative+"/captures",
        "mcr.microsoft.com/playwright:v1.63.0-noble", "npx", "playwright", "test", "--config", "playwright.release.config.ts", "tests/e2e/generated-board.spec.ts", "tests/e2e/friendly-move.spec.ts", "tests/e2e/friendly-feedback.spec.ts", "tests/e2e/reference-game.spec.ts", "tests/e2e/victory-options.spec.ts", "--workers=2"])
finally:
    files = sorted(p for p in raw.rglob("*") if p.is_file())
    with tarfile.open(out / "raw-outputs.tar.gz", "w:gz") as tar:
        for path in files: tar.add(path, arcname=str(path.relative_to(raw)))
    with tarfile.open(out / "raw-outputs.tar.gz") as tar:
        assert all(tar.extractfile(str(p.relative_to(raw))).read() == p.read_bytes() for p in files)
    report = {"commands": commands, "sourceHashes": {p: sha(b) for p, b in inputs.items()},
        "sourcesUnchangedDuringRun": all((repo / p).read_bytes() == b for p, b in inputs.items()),
        "archiveSha256": sha((out / "raw-outputs.tar.gz").read_bytes()),
        "archiveMemberHashes": {str(p.relative_to(raw)): sha(p.read_bytes()) for p in files}}
    (out / "report.json").write_text(json.dumps(report, indent=2) + "\n")
    (out / ".gitignore").write_text("/raw/\n")
    print(str(out.relative_to(repo)), flush=True)
    assert report["sourcesUnchangedDuringRun"]
