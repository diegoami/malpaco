import {naturalizeBorders} from '/home/diego/projects/malpaco-work/148-review-b9b105a2/docs/prototypes/new-game/T65/borders.mjs';
import {inspect} from '/home/diego/projects/malpaco-work/148-review-b9b105a2/docs/prototypes/new-game/T62/contract.mjs';
import fs from 'node:fs';
const T64=JSON.parse(fs.readFileSync('/home/diego/projects/malpaco-work/148-review-b9b105a2/docs/prototypes/new-game/T64/board.json','utf8'));
// Override naturalizeBorders to be identity
const idNaturalize = input => JSON.parse(JSON.stringify(input));

const result = idNaturalize(T64);
const target = JSON.parse(fs.readFileSync('/home/diego/projects/malpaco-work/148-review-b9b105a2/docs/prototypes/new-game/T65/acceptance/board.json','utf8'));

// Test 1: replaces straight divisions with the frozen geographical border drawing
const t1Pass = JSON.stringify(result) === JSON.stringify(target);
console.log('Test 1 (equals frozen target):', t1Pass);

// Test 2: same frozen input and seed give identical boundaries
const a = idNaturalize(T64);
const b = idNaturalize(T64);
const t2Pass = JSON.stringify(a) === JSON.stringify(b);
console.log('Test 2 (deterministic):', t2Pass);

// Test 3: retains exact metadata, coast, ports, labels and routes
const sem = b=>({...b,provinces:b.provinces.map(({polygon,...p})=>p)});
const t3Pass = JSON.stringify(sem(result)) === JSON.stringify(sem(T64));
console.log('Test 3 (semantic identity):', t3Pass);

// Test 4: inspect passes
const checks = inspect(result);
const t4Pass = JSON.stringify(checks) === JSON.stringify({attachment:[],water:[],traceability:[],preserved:[]});
console.log('Test 4 (inspect passes):', t4Pass, JSON.stringify(checks));

// Test 5: contact graph - pairs match
const key=(a,b)=>[JSON.stringify(a),JSON.stringify(b)].sort().join('|');
const owners = new Map();
for(const p of result.provinces) for(let j=0;j<p.polygon.length;j++) {
  const a=p.polygon[j],b=p.polygon[(j+1)%p.polygon.length];
  const k=key(a,b);
  const s = owners.get(k) || new Set();
  s.add(p.id);
  owners.set(k,s);
}
const pairs = new Set();
for(const [k,o] of owners) if(o.size===2) pairs.add([...o].sort().join('|'));
const declared = new Set();
for(const p of result.provinces) for(const id of p.borders) declared.add([p.id,id].sort().join('|'));
const t5Pass = pairs.size === declared.size && [...pairs].every(p => declared.has(p));
console.log('Test 5 (contact graph identity):', t5Pass);
