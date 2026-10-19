"""Append-only command evidence; run from the task worktree, never reuse a label."""
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import time
from datetime import datetime, timezone

label, *command = sys.argv[1:]
root = Path(__file__).resolve().parent
output_path = root / (label + '.txt')
record_path = root / (label + '.json')
if output_path.exists() or record_path.exists():
    raise SystemExit('Refusing to overwrite retained evidence: ' + label)
started = datetime.now(timezone.utc).isoformat()
clock = time.monotonic()
with output_path.open('xb') as output:
    result = subprocess.run(command, stdout=output, stderr=subprocess.STDOUT, check=False)
record = {
    'command': command, 'started_utc': started,
    'elapsed_seconds': round(time.monotonic() - clock, 3),
    'native_exit': result.returncode,
    'output': output_path.name,
    'output_sha256': hashlib.sha256(output_path.read_bytes()).hexdigest(),
    'source_sha256': hashlib.sha256(Path('src/ui/workspaceState.ts').read_bytes()).hexdigest() if Path('src/ui/workspaceState.ts').exists() else None,
    'tests_sha256': hashlib.sha256(Path('tests/ui/workspace-state.test.ts').read_bytes()).hexdigest(),
}
with record_path.open('x') as output:
    json.dump(record, output, indent=2)
    output.write('\n')
print(json.dumps(record, indent=2))
print(output_path.read_text()[-3500:])
sys.exit(result.returncode)
