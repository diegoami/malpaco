"""Retain reversible guard-deletion proof; never modify parent or legacy files."""
import hashlib
import io
import json
from pathlib import Path
import re
import subprocess
import tarfile
import tempfile

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[3]
SOURCE = ROOT / 'contract.mjs'
original = SOURCE.read_bytes()
text = original.decode()
out = Path(tempfile.mkdtemp(prefix='mutations-', dir=ROOT / 'evidence'))
sha = lambda b: hashlib.sha256(b).hexdigest()
tests = ['docs/prototypes/new-game/T62/contract.test.mjs', 'docs/prototypes/new-game/T62/guards.test.mjs']
command = ['node', '--test', '--test-reporter=tap', *tests]
members = {}
records = []
mutants = []

def add(name, old, new):
    assert text.count(old) == 1, (name, text.count(old))
    mutants.append((name, old, new))

for group in ['attachment', 'water', 'traceability', 'preserved']:
    anchor = "  if(group==='preserved')return preservedConstraints"
    add('delete-group-' + group, anchor, f"  if(group==='{group}')return [];\n" + anchor)
for category in ['counts','symmetry','connectivity','degree','cells','borders','crossings','bonus','fortress','concentration','remoteness','crowding','labels']:
    add('delete-legacy-' + category, "!['coasts','intersections'].includes(n)", f"!['coasts','intersections','{category}'].includes(n)")
for name, expression in [
    ('competitor', 'margin<P.competingCountryMarginCss'),
    ('unrelated-clearance', 'gap<P.unrelatedCoastClearanceCss'),
    ('endpoint-span', 'distance(r.points[0],r.points.at(-1))*scale<P.endpointSpanCss'),
    ('pair-separation', 'routeGap(x,y)*scale<P.routeSeparationCss'),
    ('whole-inward', 'location(inward,p.polygon)!==1||segmentPieces(end,inward,p.polygon).pieces.some(p=>p.where!==1)'),
    ('silhouette', '||location(end,island.polygon)!==0'),
    ('ambiguous', 'board.provinces.some(q=>q.id!==id&&location(end,q.polygon)>=0)'),
    ('zero-segment', 'distance(p,q)<=E'),
    ('adjacent-reversal', 'onSegment(t,p,q)||onSegment(p,s,t)'),
    ('self-contact', 'segmentGap(p,q,s,t)<=E'),
]:
    add('delete-' + name, expression, '' if name == 'silhouette' else 'false')
add('sample-only-inward', '||segmentPieces(end,inward,p.polygon).pieces.some(p=>p.where!==1)', '')
add('delete-legacy-water', "if(group==='water')errors.push(...legacy('intersections',board));", '')
add('delete-segment-gap', 'export function segmentGap(a,b,c,d) {', 'export function segmentGap(a,b,c,d) { return Infinity;')
for name, old, new in [
    ('competitor', 'pointSegmentGap(end,a,b))))*scale', 'pointSegmentGap(end,a,b))))'),
    ('inward', 'P.inwardContinuationCss/scale', 'P.inwardContinuationCss'),
    ('unrelated-clearance', 'segmentGap(a,b,c,d))))*scale', 'segmentGap(a,b,c,d))))'),
    ('endpoint-span', 'distance(r.points[0],r.points.at(-1))*scale', 'distance(r.points[0],r.points.at(-1))'),
    ('pair-separation', 'routeGap(x,y)*scale', 'routeGap(x,y)'),
]:
    add('delete-scale-' + name, old, new)

def run(name):
    result = subprocess.run(command, cwd=REPO, capture_output=True)
    members[name + '.stdout.txt'] = result.stdout
    members[name + '.stderr.txt'] = result.stderr
    return result, re.findall(r'^not ok \d+ - (.+)$', result.stdout.decode(), re.M)

try:
    baseline, _ = run('before')
    assert baseline.returncode == 0, 'Baseline must be green before mutation'
    for name, old, new in mutants:
        mutated = text.replace(old, new).encode()
        SOURCE.write_bytes(mutated)
        result, failed = run(name)
        records.append({'name': name, 'replace': old, 'with': new, 'sourceSha256': sha(mutated), 'exit': result.returncode, 'failedTests': failed})
        assert result.returncode == 1 and failed, 'Mutation survived or crashed outside tests: ' + name
finally:
    SOURCE.write_bytes(original)
    assert SOURCE.read_bytes() == original
    final, _ = run('restored')
    members['contract.mjs.snapshot'] = original
    failures = set().union(*(set(r['failedTests']) for r in records))
    # Parent positives are expected to survive a deleted guard. Every additional
    # test contains its own targeted negative, or directly checks segmentGap.
    added = subprocess.run(['node','--test','--test-reporter=tap','docs/prototypes/new-game/T62/guards.test.mjs'], cwd=REPO, capture_output=True)
    members['additional-restored.stdout.txt'] = added.stdout
    members['additional-restored.stderr.txt'] = added.stderr
    added_names = set(re.findall(r'^# Subtest: (.+)$', added.stdout.decode(), re.M))
    with tarfile.open(out / 'raw-logs.tar.gz', 'w:gz') as archive:
        for name, data in members.items():
            entry = tarfile.TarInfo(name)
            entry.size = len(data)
            entry.mtime = 0
            archive.addfile(entry, io.BytesIO(data))
    # Validate exact archive bytes, including whitespace, before publishing hashes.
    with tarfile.open(out / 'raw-logs.tar.gz') as archive:
        assert all(archive.extractfile(name).read() == data for name, data in members.items())
    report = {'command': command, 'sourceSha256': sha(original), 'restoredSha256': sha(SOURCE.read_bytes()),
              'baselineExit': baseline.returncode, 'restoredExit': final.returncode, 'additionalRestoredExit': added.returncode,
              'mutants': records, 'killed': sum(r['exit'] == 1 and bool(r['failedTests']) for r in records),
              'additionalTests': len(added_names), 'additionalTestsNeverFailed': sorted(added_names - failures),
              'fingerprints': {str(p.relative_to(REPO)): sha(p.read_bytes()) for p in [ROOT/'audit.py', ROOT/'guards.test.mjs', ROOT/'contract.test.mjs', ROOT/'parameters.mjs']},
              'archiveSha256': sha((out/'raw-logs.tar.gz').read_bytes()), 'archiveMemberHashes': {name: sha(data) for name, data in members.items()}}
    (out/'report.json').write_text(json.dumps(report, indent=2)+'\n')
    print(json.dumps({'output': str(out.relative_to(REPO)), 'killed': report['killed'], 'mutants': len(mutants), 'restoredExit': final.returncode, 'additionalTestsNeverFailed': report['additionalTestsNeverFailed']}, indent=2))
assert final.returncode == 0
assert added.returncode == 0
assert len(records) == len(mutants)
assert not report['additionalTestsNeverFailed']
