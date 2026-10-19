import json,subprocess,sys,time
from pathlib import Path
folder=Path(__file__).parent
name=sys.argv[1]
command=sys.argv[2:]
assert not any((folder/(name+suffix)).exists() for suffix in ['.stdout','.stderr','.receipt.json'])
start=time.monotonic()
with (folder/(name+'.stdout')).open('wb') as stdout,(folder/(name+'.stderr')).open('wb') as stderr:
 result=subprocess.run(command,stdout=stdout,stderr=stderr)
receipt={'command':command,'cwd':str(Path.cwd()),'exitCode':result.returncode,'durationSeconds':time.monotonic()-start}
(folder/(name+'.receipt.json')).write_text(json.dumps(receipt,indent=2)+'\n')
print(json.dumps(receipt))
sys.exit(result.returncode)
