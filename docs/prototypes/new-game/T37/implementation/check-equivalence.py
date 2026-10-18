from pathlib import Path
import re,json,hashlib
root=Path.cwd();base=root/'docs/prototypes/new-game/T37/parent-preflight/integrated-mock'
# Preserve quoted literals; omit only comments and whitespace outside literals.
pattern=re.compile(r'''(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(?P<comment>/\*[\s\S]*?\*/|//[^\n]*)|(?P<space>\s+)|(?P<code>.)''')
def tokens(s):return ''.join(m.group(0) for m in pattern.finditer(s) if m.group('comment') is None and m.group('space') is None)
results=[]
for entry in json.loads((base/'install-manifest.json').read_text()):
 p=entry['path'];actual=(root/p).read_text();original=(base/p).read_text();same=tokens(actual)==tokens(original);assert same,p
 results.append({'path':p,'tokensEqualIgnoringCommentsAndWhitespace':same,'productionSha256':hashlib.sha256(actual.encode()).hexdigest(),'mockSha256':hashlib.sha256(original.encode()).hexdigest()})
(root/'docs/prototypes/new-game/T37/implementation/mock-runtime-equivalence.json').write_text(json.dumps(results,indent=2)+'\n')
