from pathlib import Path
import shutil,tempfile,subprocess,json,hashlib
R=Path('/home/diego/projects/malpaco/.cache/t68-work');E=R/'docs/prototypes/new-game/T68';W=Path('/home/diego/projects/malpaco/.cache/t34-work');out=Path(tempfile.mkdtemp(prefix='r1-proof-',dir=E));F=out/'fixture';F.mkdir()
shutil.copy2(W/'tsconfig.json',F/'tsconfig.json');shutil.copytree(W/'src/core',F/'src/core');(F/'tests/core').mkdir(parents=True);shutil.copy2(W/'tests/core/island-geography.test.ts',F/'tests/core/island-geography.test.ts');shutil.copy2(W/'package.json',F/'package.json')
for task in ['T24','T62','T34']:
 d=F/'docs/prototypes/new-game'/task;d.mkdir(parents=True)
 for p in (W/'docs/prototypes/new-game'/task).iterdir():
  if p.is_file() and p.suffix in ['.json','.mjs']:shutil.copy2(p,d/p.name)
(F/'node_modules').symlink_to('/home/diego/projects/malpaco/node_modules',target_is_directory=True)
core=F/'src/core/island-geography.ts';test=F/'tests/core/island-geography.test.ts';original=core.read_bytes();testoriginal=test.read_bytes();checks=[]
def run(label):
 r=subprocess.run(['npx','vitest','run','tests/core/island-geography.test.ts'],cwd=F,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True,timeout=120)
 (out/(label+'.txt')).write_text(r.stdout);checks.append({'label':label,'exit':r.returncode,'core_sha256':hashlib.sha256(core.read_bytes()).hexdigest(),'test_sha256':hashlib.sha256(test.read_bytes()).hexdigest()});return r.returncode
assert run('baseline')==0
mutant=original.replace(b'failures.push({attempt,constraints,candidate:geography});',b'/* omitted failure history */');assert mutant!=original
try:
 core.write_bytes(mutant);assert run('omitted-history-existing-tests')==0
finally:core.write_bytes(original)
extra='''
it('parent probe exercises real rejected candidates and retained failure history',async()=>{
 const {vi}=await import('vitest');
 vi.resetModules();
 vi.doMock('../../docs/prototypes/new-game/T34/witness.json',async()=>{
  const actual=await vi.importActual<{default:{provinces:{labelAt:number[]}[]}}>('../../docs/prototypes/new-game/T34/witness.json');
  const bad=structuredClone(actual.default); for(const p of bad.provinces)p.labelAt=[0,0];
  return {default:bad};
 });
 try {
  const {generateIslandGeography:generate}=await import('../../src/core/island-geography');
  const a=generate(42,{attempts:3}),b=generate(42,{attempts:3});
  expect(a.ok).toBe(false);expect(a.attempts).toBe(3);expect(a.failures).toHaveLength(3);expect(b).toEqual(a);
  for(const [i,f]of a.failures.entries()){expect(f.attempt).toBe(i+1);expect(f.constraints.length).toBeGreaterThan(0);expect(f.candidate).toBeDefined();}
  expect(a.rng.state).not.toBe(42);
 }finally{vi.doUnmock('../../docs/prototypes/new-game/T34/witness.json');vi.resetModules();}
});
'''
try:
 test.write_bytes(testoriginal+extra.encode());assert run('forced-rejection-positive')==0
 core.write_bytes(mutant);assert run('omitted-history-new-test')!=0
finally:core.write_bytes(original);test.write_bytes(testoriginal)
assert core.read_bytes()==original and test.read_bytes()==testoriginal
(out/'report.json').write_text(json.dumps({'source_head':'7f1860dac78932629340c561e8fae4cfcdf44589','checks':checks,'all_restored':True,'finding':'R1 confirmed: existing10 tests pass with failure-history recording deleted; added disposable forced-rejection test passes original and fails mutant. No production edits.'},indent=2)+'\n')
(out/'new-test.txt').write_text(extra);(F/'.gitignore').write_text('/node_modules\n');print(out,json.dumps(checks))
