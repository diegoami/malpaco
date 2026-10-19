from pathlib import Path
import subprocess,json,time
b=Path('/home/diego/projects/malpaco/.cache/release-011');start=time.monotonic()
cmd=['claude','-p','--model','opus','--effort','medium','--tools','','--setting-sources','','--strict-mcp-config','--mcp-config','{"mcpServers":{}}','--output-format','stream-json','--verbose','Reply only READY. Do not use tools. This is an identity check before the owner-selected Opus Medium review.']
r=subprocess.run(cmd,cwd=b,capture_output=True,text=True,stdin=subprocess.DEVNULL,timeout=120)
(b/'opus-discovery.jsonl').write_text(r.stdout);(b/'opus-discovery.stderr').write_text(r.stderr)
events=[json.loads(x) for x in r.stdout.splitlines() if x.strip()];init=[x for x in events if x.get('type')=='system' and x.get('subtype')=='init'];final=[x for x in events if x.get('type')=='result'];safe={'exit':r.returncode,'seconds':time.monotonic()-start,'models':[x.get('model') for x in init],'success':len(final)==1 and final[0].get('is_error')==False};(b/'opus-discovery-receipt.json').write_text(json.dumps(safe,indent=2)+'\n');print(json.dumps(safe));assert r.returncode==0 and safe['success'] and len(init)==1
