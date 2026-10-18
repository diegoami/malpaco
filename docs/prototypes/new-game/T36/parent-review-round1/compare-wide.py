from pathlib import Path
import hashlib,json,sys
original=Path(sys.argv[1]);independent=Path(sys.argv[2]);out=Path(sys.argv[3])
rows=[]
for seed in list(range(1000))+[1994]:
 name="seed-1994-diagnostic.json" if seed==1994 else f"seed-{seed:04d}.json"
 left=original/name;right=independent/name
 a=json.loads(left.read_text());b=json.loads(right.read_text())
 assert a==b,(seed,[key for key in a if a[key]!=b.get(key)])
 rows.append({"seed":seed,"independentSha256":hashlib.sha256(right.read_bytes()).hexdigest(),"success":b["success"],"attempts":b["attempts"]})
report={"completeRecordsEqual":len(rows),"successes0to999":sum(r["success"] for r in rows[:1000]),"refusedSeeds0to999":[r["seed"] for r in rows[:1000] if not r["success"]],"separate1994":rows[-1],"records":rows,"regenerationRun":False}
out.write_text(json.dumps(report,indent=2)+"\n")
print(json.dumps({k:v for k,v in report.items() if k!="records"}))
