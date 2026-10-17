from pathlib import Path
import subprocess,json,tempfile,hashlib,gzip,time
E=Path(__file__).resolve().parent;R=Path(tempfile.mkdtemp(prefix='controls-',dir=E));P=Path('tools/harness/lib/claude.mjs');original=P.read_bytes();text=original.decode();(R/'original.mjs.gz').write_bytes(gzip.compress(original,mtime=0));results=[]
cases=[('model',"if (init[0].model !== model || init[0].session_id !== sessionId || results[0].session_id !== sessionId)","if (false)",'actual selected'),('denial',"if (!Array.isArray(result.permission_denials) || result.permission_denials.length)","if (false)",'actual selected'),('final-count',"results.length !== 1","false",'actual selected'),('provider',"export function validateClaudeEnvironment(env, model) {","export function validateClaudeEnvironment(env, model) { return;",'provider/remapped'),('scope',"export function scopeProblems(review, files) {","export function scopeProblems(review, files) { return [];",'coverage is explicit'),('total',"now-started >= totalTimeoutMs","false",'watched subprocess'),('startup',"!initSeen && now-started >= startupTimeoutMs","false",'watched subprocess'),('idle',"initSeen && now-lastActivity >= idleTimeoutMs","false",'watched subprocess')]
cases += [('assistant-model', 'if (assistantModels.some((actual) => actual !== model))', 'if (false)', 'actual selected')]
cases += [('evidence-code', 'const groupedEvidence = (f) =>', 'const groupedEvidence = (f) => true; //', 'coverage is explicit'), ('child-temp', 'env: childEnv', 'env', 'watched subprocess')]
cases += [('native-denials', '...publishing.map((p) => `Bash(${p})`)', '...[]', 'native Claude command')]
try:
 for name,old,new,pattern in cases:
  assert old in text,name;mutant=text.replace(old,new,1);P.write_text(mutant);start=time.monotonic()
  with (R/(name+'.log')).open('wb') as f:r=subprocess.run(['node','--test','--test-name-pattern',pattern,'tools/harness/test/claude.test.mjs'],stdout=f,stderr=subprocess.STDOUT,timeout=30)
  results.append({'name':name,'exit':r.returncode,'caught':r.returncode!=0,'seconds':round(time.monotonic()-start,3),'mutant_sha256':hashlib.sha256(mutant.encode()).hexdigest()});P.write_bytes(original);print(json.dumps(results[-1]),flush=True)
finally:
 P.write_bytes(original);(R/'report.json').write_text(json.dumps({'results':results,'restored_sha256':hashlib.sha256(P.read_bytes()).hexdigest()},indent=2)+'\n')
raise SystemExit(0 if len(results)==len(cases) and all(x['caught'] for x in results) else 1)
