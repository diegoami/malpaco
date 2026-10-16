"""Reproduce CI's delayed initial label mask; restore the exact fixed spec."""
from pathlib import Path
import hashlib, io, json, subprocess, tarfile, tempfile

root = Path(__file__).resolve().parent
repo = root.parents[3]
out = Path(tempfile.mkdtemp(prefix="ci-mask-proof-", dir=root / "evidence"))
spec = repo / "tests/e2e/generated-board.spec.ts"
saved = spec.read_bytes()
old = subprocess.check_output(["git", "show", "0d15ae0:tests/e2e/generated-board.spec.ts"], cwd=repo)
readiness = b'''  await expect(page.locator('#prototype-route-mask rect[fill="black"]')).toHaveCount(map.provinces.length + map.islands.length);\n'''
assert saved.count(readiness) == 1 and saved.replace(readiness, b"") == old
original_hook = 'test.beforeEach(async ({page})=>{'
instrumented_hook = '''test.beforeEach(async ({page}, info)=>{
  await page.addInitScript(() => {
    const query = new URL(location.href).searchParams;
    if (query.get("view") !== "generated-prototype" || query.get("seed") !== "1994") return;
    const visits = Number(sessionStorage.getItem("t28-mask-visits") ?? "0") + 1;
    sessionStorage.setItem("t28-mask-visits", String(visits));
    if (visits !== 2) return;
    const load = document.fonts.load.bind(document.fonts);
    document.fonts.load = async (font, text) => {
      const faces = await load(font, text);
      await new Promise<void>(done => setTimeout(done, 1500));
      return faces;
    };
  });
  const reload = page.reload.bind(page);
  page.reload = async options => {
    const before = await page.locator("#generated-map").innerHTML();
    const beforeMaskRects = await page.locator("#prototype-route-mask rect").count();
    const response = await reload(options);
    await expect(page.locator('#prototype-route-mask rect[fill="black"]')).toHaveCount(map.provinces.length + map.islands.length);
    const after = await page.locator("#generated-map").innerHTML();
    const afterMaskRects = await page.locator("#prototype-route-mask rect").count();
    await info.attach("before-full-svg", {body:Buffer.from(before),contentType:"text/html"});
    await info.attach("after-full-svg", {body:Buffer.from(after),contentType:"text/html"});
    console.log("T28_MASK_TIMING " + JSON.stringify({beforeMaskRects,afterMaskRects,fullHtmlEqual:before===after}));
    return response;
  };
'''
assert old.decode().count(original_hook) == 1
sources = sorted(set([str(p.relative_to(repo)) for p in (repo / "src").rglob("*.ts")] +
                     ["tests/e2e/generated-board.spec.ts", "src/styles.css", "playwright.config.ts", "playwright.release.config.ts", "package-lock.json"]))
protected = {p: (repo / p).read_bytes() for p in sources if p != "tests/e2e/generated-board.spec.ts"}
snapshots = {"old/generated-board.spec.ts": old, "fixed/generated-board.spec.ts": saved, **{"inputs/" + p: b for p, b in protected.items()}}
outputs = {}
records = []
sha = lambda b: hashlib.sha256(b).hexdigest()
try:
    for label, source, expected in [("negative", old, 1), ("positive", saved, 0)]:
        injected = source.decode().replace(original_hook, instrumented_hook).encode()
        snapshots[label + "/generated-board.spec.ts"] = injected
        try:
            spec.write_bytes(injected)
            command = ["python3", str(root / "run-browser.py"), "ci-mask-" + label, "--suites", "tests/e2e/generated-board.spec.ts", "--grep", "editable seeds"]
            result = subprocess.run(command, cwd=repo, capture_output=True)
            outputs[label + "/stdout.txt"], outputs[label + "/stderr.txt"] = result.stdout, result.stderr
            summary = json.loads(result.stdout)
            run_dir = repo / summary["output"]
            report = json.loads((run_dir / "report.json").read_text())
            with tarfile.open(run_dir / "raw-outputs.tar.gz") as tar:
                log = tar.extractfile("output.txt").read().decode()
            timings = [json.loads(line.split("T28_MASK_TIMING ", 1)[1]) for line in log.splitlines() if "T28_MASK_TIMING " in line]
            record = {"label": label, "command": command, "exit": result.returncode, "evidence": summary["output"], "timings": timings,
                      "specStableDuringRun": spec.read_bytes() == injected, "protectedSourcesStable": all((repo / p).read_bytes() == b for p, b in protected.items())}
            records.append(record)
            print(json.dumps(record), flush=True)
            assert result.returncode == expected and len(timings) == 2
            assert all(t["afterMaskRects"] == 56 and t["beforeMaskRects"] == (1 if label == "negative" else 56) and t["fullHtmlEqual"] == (label == "positive") for t in timings)
            assert record["specStableDuringRun"] and record["protectedSourcesStable"] and report["sourcesUnchangedDuringRun"]
        finally:
            spec.write_bytes(saved)
            assert spec.read_bytes() == saved
finally:
    spec.write_bytes(saved)
    archives = {}
    for name, contents in [("source-inputs.tar.gz", snapshots), ("raw-command-logs.tar.gz", outputs)]:
        with tarfile.open(out / name, "w:gz") as tar:
            for path, data in contents.items():
                item = tarfile.TarInfo(path); item.size = len(data); item.mtime = 0
                tar.addfile(item, io.BytesIO(data))
        with tarfile.open(out / name) as tar: assert all(tar.extractfile(p).read() == b for p, b in contents.items())
        archives[name] = {"sha256": sha((out / name).read_bytes()), "members": {p: sha(b) for p, b in contents.items()}}
    (out / "report.json").write_text(json.dumps({"records": records, "archives": archives,
        "restoredSpecSha256": sha(saved), "exactRestoration": spec.read_bytes() == saved,
        "protectedSourceHashes": {p: sha(b) for p, b in protected.items()}}, indent=2) + "\n")
    print(str(out.relative_to(repo)), flush=True)
