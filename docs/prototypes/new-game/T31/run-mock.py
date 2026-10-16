"""Apply a disposable feasibility patch, run one wrapped command, restore exact bytes in finally.

Usage: python3 docs/prototypes/new-game/T31/run-mock.py -- python3
docs/prototypes/new-game/T31/run-command.py mock-core npx vitest run tests/core/versioned-match.test.ts
No production runtime is written until this parent-invoked tool runs.
"""
from pathlib import Path
import hashlib, io, json, subprocess, sys, tarfile, tempfile

root = Path(__file__).resolve().parent
repo = root.parents[3]
paths = ['src/core/match-save.ts', 'src/ui/referenceGame.ts', 'src/ui/referenceBattleGame.ts',
         'src/core/__t31_mock_codec.ts', 'src/ui/__t31_mock_files.ts']
before = {name: (repo/name).read_bytes() if (repo/name).exists() else None for name in paths}
assert all(before[name] is None for name in paths[-2:]), 'Mock runtime already exists; restore it first.'
(root/'preflight').mkdir(exist_ok=True)
out = Path(tempfile.mkdtemp(prefix='mock-runtime-', dir=root/'preflight'))
sha = lambda data: hashlib.sha256(data).hexdigest()
def archive(name, payload):
    with tarfile.open(out/name, 'x:gz') as target:
        for path, data in payload.items():
            if data is not None:
                member = tarfile.TarInfo(path); member.size = len(data)
                target.addfile(member, io.BytesIO(data))
archive('original-sources.tar.gz', before)
(out/'original-manifest.json').write_text(json.dumps({n: sha(b) if b is not None else None for n,b in before.items()}, indent=2)+'\n')
def change(name, old, new):
    path = repo/name; source = path.read_text()
    assert source.count(old) == 1, (name, old, source.count(old))
    path.write_text(source.replace(old, new))
command = sys.argv[1:]
if command and command[0] == '--': command = command[1:]
assert command, 'Supply a command after --'
code = 1
try:
    (repo/paths[-2]).write_bytes((root/'mock-codec.ts.txt').read_bytes())
    (repo/paths[-1]).write_bytes((root/'mock-files.ts.txt').read_bytes())
    with (repo/'src/core/match-save.ts').open('a') as target:
        target.write('\n// Disposable preflight exports.\nexport { serializeVersionedMatch, deserializeVersionedMatch } from "./__t31_mock_codec";\n')
    change('src/ui/referenceBattleGame.ts', '  mount(root: HTMLElement): void {', '  get state(): GameState { return this.controller.state; }\n\n  mount(root: HTMLElement): void {')
    change('src/ui/referenceGame.ts', 'import {victoryRules,defaultOptions}', 'import {mockFiles} from "./__t31_mock_files";\nimport type {GameOptions,GameState} from "../core";\nimport {victoryRules,defaultOptions}')
    change('src/ui/referenceGame.ts', ' const setup=()=>{', ''' let epoch=0;let active:ReferenceBattleGame|null=null;
 const replaceLoaded=(options:GameOptions,state:GameState)=>{
  epoch++;active?.dispose();seed=String(options.seed);seats=String(options.seats.length);
  dominationWin=options.dominationWin;roundLimit=options.roundLimit;
  controllers=Array.from({length:4},(_,i)=>options.seats[i]?.kind??"human");
  root.id="reference-game";root.className="reference-game-root";root.dataset["seats"]=seats;
  const app=new ReferenceBattleGame(referenceMap,options.seed,()=>{app.dispose();setup();},state,preferences);
  active=app;app.mount(root);root.querySelector("header")!.append(mockFiles(()=>epoch,replaceLoaded,options,()=>app.state));
 };
 const setup=()=>{
  epoch++;active?.dispose();active=null;''')
    change('src/ui/referenceGame.ts', 'app.mount(root);\n    const humans=', 'app.mount(root);\n    if(!legacy){epoch++;active=app as ReferenceBattleGame;root.querySelector("header")!.append(mockFiles(()=>epoch,replaceLoaded,options,()=>(app as ReferenceBattleGame).state));}\n    const humans=')
    change('src/ui/referenceGame.ts', '  };root.replaceChildren(form);', '  };if(!legacy)form.append(mockFiles(()=>epoch,replaceLoaded));root.replaceChildren(form);')
    archive('mock-sources.tar.gz', {name: (repo/name).read_bytes() for name in paths})
    code = subprocess.run(command, cwd=repo).returncode
finally:
    for name, data in before.items():
        path = repo/name
        if data is None:
            if path.exists(): path.unlink()
        else: path.write_bytes(data)
    restored = {name: (not (repo/name).exists() if data is None else (repo/name).read_bytes() == data) for name, data in before.items()}
    (out/'restoration.json').write_text(json.dumps({'command': command, 'exit': code, 'exactRestoration': restored}, indent=2)+'\n')
    assert all(restored.values()), 'Exact restoration failed'
    print(json.dumps({'mockArchive': str(out.relative_to(repo)), 'exactRestoration': all(restored.values()), 'exit': code}, indent=2), flush=True)
sys.exit(code)
