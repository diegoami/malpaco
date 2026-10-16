"""Render exact acceptance tails without routing Markdown through a shell."""
import hashlib
import json
from pathlib import Path

root = Path(__file__).resolve().parent
body = (root/'pr-body.md').read_text()
start = body.index('Done-when commands and actual output tails')
end = body.index('Additional verification:', start)
report = json.loads((root/'evidence/acceptance-it47nb_p/report.json').read_text())
lines = ['Done-when commands and actual output tails (full logs: T62/evidence/acceptance-it47nb_p/raw-logs.tar.gz):', '']
for entry in report['commands'][:7]:
    lines += ['```sh', ' '.join(entry['command']), '```', '```text', *entry['stdoutTail'], 'exit '+str(entry['exit']), '```', '']
body = body[:start] + '\n'.join(lines) + '\n' + body[end:]
body = body.replace('artifacts.sha256.json hashes the owned artifact set.', 'artifacts.v2.sha256.json hashes the final owned artifact set; the first index is retained historically.')
(root/'pr-body.md').write_text(body)
notes = root.parents[3]/'RUN-NOTES.md'
notes.write_text(notes.read_text()+'\nT62 PR formatting correction: the first description generator lost Markdown command fences to shell substitution. Corrected only the mutable PR description with prepare-pr.py, preserving every checker/test/measurement/archive byte. Original artifact index retained historically; artifacts.v2.sha256.json covers the corrected description and renderer script. Working, staged and full-branch whitespace checks pass.\n')
index = root/'artifacts.v2.sha256.json'
assert not index.exists()
paths = sorted(p for p in root.rglob('*') if p.is_file() and p != index)
index.write_text(json.dumps({'algorithm':'sha256', 'pathsRelativeTo':'docs/prototypes/new-game/T62', 'excludes':['artifacts.v2.sha256.json (this index)'], 'hashes':{str(p.relative_to(root)):hashlib.sha256(p.read_bytes()).hexdigest() for p in paths}},indent=2)+'\n')
assert body.count('```') == 28
print('Rendered seven fenced commands and indexed',len(paths),'files')
