import subprocess,time,json,hashlib
from pathlib import Path
p=Path(__file__).resolve().parent
c=json.loads((p/'config.json').read_text())
cmd=['/home/diego/.local/bin/claude','-p',(p/'prompt.txt').read_text(),'--model','sonnet','--setting-sources','user,project','--effort','medium','--verbose','--output-format','stream-json','--session-id',c['session'],'--permission-mode','dontAsk','--permission-prompts','none','--tools','Bash,Read,Grep,Glob','--allowedTools','Read','Grep','Glob','Bash(gh pr diff *)','Bash(gh pr view *)','Bash(git rev-parse *)','Bash(git status *)','Bash(git diff *)','Bash(git show *)','Bash(python3 docs/prototypes/new-game/T68/verify.py*)','Bash(python3 -I docs/prototypes/new-game/T68/verify.py*)','Bash(python3 /home/diego/projects/malpaco/.cache/claude-cli-review-153-trial2/checks.py)','Bash(python3 -I /home/diego/projects/malpaco/.cache/claude-cli-review-153-trial2/checks.py)','Bash(cat *)','Bash(sed *)','Bash(head *)','Bash(tail *)','Bash(ls *)','Bash(wc *)','Bash(rg *)','Bash(echo *)','--disallowedTools','Edit','Write','Agent','--strict-mcp-config','--disable-slash-commands','--no-chrome']
start=time.monotonic(); code=None
with (p/'stdout.jsonl').open('w') as out,(p/'stderr.txt').open('w') as err:
 try: code=subprocess.run(cmd,cwd=c['worktree'],stdin=subprocess.DEVNULL,stdout=out,stderr=err,timeout=900).returncode
 except subprocess.TimeoutExpired: code=124
events=[json.loads(x) for x in (p/'stdout.jsonl').read_text().splitlines() if x.strip()]
init=next((e for e in events if e.get('type')=='system' and e.get('subtype')=='init'),{})
actual_model=init.get('model','')
claude_model_verified=actual_model.startswith('claude-')
r={'actual_model':actual_model,'claude_model_verified':claude_model_verified,'exit_code':code,'duration_seconds':round(time.monotonic()-start,3),**c,'argv':[cmd[0],'-p','<prompt.txt>',*cmd[3:]],'sha256':{n:hashlib.sha256((p/n).read_bytes()).hexdigest() for n in ['prompt.txt','stdout.jsonl','stderr.txt']}}
(p/'receipt.json').write_text(json.dumps(r,indent=2)+'\n')
print(json.dumps(r),flush=True)
raise SystemExit(code if code else (0 if claude_model_verified else 65))
