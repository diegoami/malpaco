"""Check untouched inherited tests/assets, parent acceptance and final runtime bytes."""
from pathlib import Path
import subprocess,tempfile,hashlib,json
root=Path(__file__).resolve().parent;repo=root.parents[3]
out=Path(tempfile.mkdtemp(prefix='implementation-protected-',dir=root/'evidence'))
base='63cda030a9ed7a485527c9851eb5423e72cb29cb';checkpoint='a3b0d915a00cbcb02c53f0b1385b06a3911cbd2f';runtime=subprocess.check_output(['git','rev-parse','HEAD'],cwd=repo,text=True).strip()
sha=lambda b:hashlib.sha256(b).hexdigest()
def git(*args):return subprocess.check_output(['git',*args],cwd=repo)
def same(ref,path):
 expected=git('show',f'{ref}:{path}');actual=(repo/path).read_bytes()
 return {'path':path,'reference':ref,'expected':sha(expected),'actual':sha(actual),'equal':expected==actual}
paths=git('ls-tree','-r','--name-only',base,'tests','data','docs/prototypes/new-game/T63/board.json','docs/prototypes/new-game/T63/map.svg').decode().splitlines()
legacy=[same(base,p) for p in paths]
parent=[same(checkpoint,p) for p in ['tests/core/victory-options.test.ts','tests/core/victory-options-fixture.ts','tests/e2e/victory-options.spec.ts','tests/e2e/victory-fixture.ts']]
production=[same(runtime,p) for p in git('ls-tree','-r','--name-only',runtime,'src').decode().splitlines()]
css=git('show',base+':src/styles.css');prefix=(repo/'src/styles.css').read_bytes().startswith(css)
report={'inherited':legacy,'parentAcceptance':parent,'productionAtCommit':production,'runtimeCommit':runtime,'changedSinceFirstGreen':git('diff','--name-only','d2047d0',runtime,'--','src').decode().splitlines(),'originalStylesheetExactPrefix':prefix,'mockAbsent':not(repo/'src/core/__t30_mock.ts').exists()}
(out/'report.json').write_text(json.dumps(report,indent=2)+'\n')
assert report['changedSinceFirstGreen']==['src/ui/panel.ts']
assert all(r['equal'] for r in legacy+parent+production) and prefix and report['mockAbsent']
print(json.dumps({'output':str(out.relative_to(repo)),'inheritedFiles':len(legacy),'parentFiles':len(parent),'runtimeFiles':len(production),'oldCssExactPrefix':prefix,'mockAbsent':report['mockAbsent']}))
