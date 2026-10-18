import subprocess,sys,json,time
from pathlib import Path
name=sys.argv[1];command=sys.argv[2:];root=Path(__file__).resolve().parent
started=time.time();result=subprocess.run(command,stdin=subprocess.DEVNULL)
(root/(name+'-result.json')).write_text(json.dumps({'command':command,'exit':result.returncode,'elapsedSeconds':time.time()-started},indent=2))
sys.exit(result.returncode)
