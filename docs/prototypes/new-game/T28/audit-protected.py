"""Prove parent acceptance, core and existing test/golden bytes remain intact."""
from pathlib import Path
import hashlib, json, subprocess, tempfile

root = Path(__file__).resolve().parent
repo = root.parents[3]
base = "c3d2645"
out = Path(tempfile.mkdtemp(prefix="protected-inputs-", dir=root / "evidence"))
paths = subprocess.check_output(["git", "ls-tree", "-r", "--name-only", base, "src/core", "tests/core", "tests/ui", "tests/e2e"], cwd=repo, text=True).splitlines()
sha = lambda b: hashlib.sha256(b).hexdigest()
records = {}
for path in paths:
    before = subprocess.check_output(["git", "show", base + ":" + path], cwd=repo)
    after = (repo / path).read_bytes()
    records[path] = {"parentSha256": sha(before), "currentSha256": sha(after), "exact": before == after}
style = subprocess.check_output(["git", "show", base + ":src/styles.css"], cwd=repo)
report = {"parentAcceptanceCommit": subprocess.check_output(["git", "rev-parse", base], cwd=repo, text=True).strip(),
          "files": records, "existingStylesAreExactPrefix": (repo / "src/styles.css").read_bytes().startswith(style)}
(out / "report.json").write_text(json.dumps(report, indent=2) + "\n")
print(json.dumps({"output": str(out.relative_to(repo)), "files": len(records), "allExact": all(r["exact"] for r in records.values()), "existingStylesAreExactPrefix": report["existingStylesAreExactPrefix"]}, indent=2))
assert all(r["exact"] for r in records.values()) and report["existingStylesAreExactPrefix"]
