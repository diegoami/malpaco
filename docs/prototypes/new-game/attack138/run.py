"""Repeat the bounded investigation in the established pinned browser image."""
from pathlib import Path
import hashlib, json, subprocess, tarfile, tempfile, sys
root = Path(__file__).resolve().parent
repo = root.parents[3]
(root / 'evidence').mkdir(exist_ok=True)
out = Path(tempfile.mkdtemp(prefix='run-', dir=root / 'evidence'))
raw = out / 'raw'
raw.mkdir()
relative = out.relative_to(repo)
files = sorted(set(p for folder in ['src', 'tests', 'data/maps', 'docs/prototypes/new-game/T63'] for p in (repo / folder).rglob('*') if p.is_file()) | set(root.glob('*.ts')) | {root / 'run.py', root / 'CONTRACT.md', repo / 'package.json', repo / 'package-lock.json', repo / 'playwright.config.ts'})
sha = lambda b: hashlib.sha256(b).hexdigest()
inputs = {str(p.relative_to(repo)): p.read_bytes() for p in files}
with tarfile.open(out / 'source-inputs.tar.gz', 'w:gz') as archive:
    for p in files: archive.add(p, arcname=str(p.relative_to(repo)))
command = ['docker', 'run', '--rm', '--user', '1000:1000', '-v', str(repo) + ':/work', '-v', '/home/diego/projects/malpaco/node_modules:/work/node_modules:ro', '--tmpfs', '/work/node_modules/.vite-temp:rw,mode=1777', '--tmpfs', '/work/node_modules/.vite:rw,mode=1777', '-e', 'ATTACK_COMPATIBILITY', '-e', 'REFERENCE_EVIDENCE_DIR=/work/' + str(relative / 'raw'), '-e', 'BATTLE_EVIDENCE_DIR=/work/' + str(relative / 'raw'), '-e', 'ATTACK_EVIDENCE_DIR=/work/' + str(relative / 'raw'), '-w', '/work', 'mcr.microsoft.com/playwright:v1.63.0-noble', 'npx', 'playwright', 'test', '--config', str(root.relative_to(repo) / 'playwright.config.ts'), '--workers=2', *sys.argv[1:]]
with (raw / 'output.txt').open('wb') as log:
    result = subprocess.run(command, cwd=repo, stdout=log, stderr=subprocess.STDOUT)
with tarfile.open(out / 'raw-outputs.tar.gz', 'w:gz') as archive:
    for p in sorted(raw.rglob('*')):
        if p.is_file(): archive.add(p, arcname=str(p.relative_to(raw)))
members = {str(p.relative_to(raw)): sha(p.read_bytes()) for p in raw.rglob('*') if p.is_file()}
with tarfile.open(out / 'raw-outputs.tar.gz') as archive:
    assert all(sha(archive.extractfile(name).read()) == digest for name, digest in members.items())
report = {'command': command, 'exit': result.returncode, 'sourceHashes': {name: sha(data) for name, data in inputs.items()}, 'sourcesUnchangedDuringRun': all((repo / name).read_bytes() == data for name, data in inputs.items()), 'archiveSha256': sha((out / 'raw-outputs.tar.gz').read_bytes()), 'archiveMemberHashes': members, 'outputTail': (raw / 'output.txt').read_text()[-8000:]}
(out / '.gitignore').write_text('/raw/\n')
(out / 'report.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({'output': str(relative), 'exit': result.returncode, 'tail': report['outputTail']}, indent=2))
raise SystemExit(result.returncode)
