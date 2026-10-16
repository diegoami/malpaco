from pathlib import Path
p=Path('src/ui/referenceGame.ts');s=p.read_text()
old='return h("label",{for:`reference-control-${i}`},`Seat ${i+1} control`,select);'
new='return h("div",{},h("label",{for:`reference-control-${i}`},`Seat ${i+1} control`),select);'
assert s.count(old)==1;s=s.replace(old,new)
old='h("label",{for:"reference-round-limit"},"Round limit",limit)'
new='h("label",{for:"reference-round-limit"},"Round limit"),limit'
assert s.count(old)==1;s=s.replace(old,new);p.write_text(s)
