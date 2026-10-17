from pathlib import Path
import hashlib,json
root=Path(__file__).resolve().parent
rows={str(p.relative_to(root)):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(root.rglob("*")) if p.is_file() and "raw" not in p.relative_to(root).parts and p.name!="artifacts.json"}
(root/"artifacts.json").write_text(json.dumps(rows,indent=2)+"\n")
print(f"Indexed {len(rows)} preserved files")
