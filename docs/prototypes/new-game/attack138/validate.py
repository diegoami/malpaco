from pathlib import Path
import subprocess,os
root=Path(__file__).resolve().parent;repo=root.parents[3]
subprocess.run(["python3",str(root/"checks.py")],cwd=repo,check=True)
subprocess.run(["python3",str(root/"run.py")],cwd=repo,env={**os.environ,"ATTACK_COMPATIBILITY":"1"},check=True)
