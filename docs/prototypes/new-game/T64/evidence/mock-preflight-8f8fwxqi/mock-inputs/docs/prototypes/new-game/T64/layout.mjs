// Disposable static mock, not production implementation.
import fs from 'node:fs';
const reference=JSON.parse(fs.readFileSync(new URL('./acceptance/board.json',import.meta.url)));
export function coastPostprocess(input){
 const b=structuredClone(input);
 for(const p of b.provinces){const target=reference.provinces.find(q=>q.id===p.id);p.polygon=structuredClone(target.polygon);p.labelAt=[...target.labelAt];}
 for(const i of b.islands)i.polygon=structuredClone(reference.islands.find(q=>q.id===i.id).polygon);
 for(const r of b.routes)r.points=structuredClone(reference.routes.find(q=>q.from===r.from&&q.to===r.to).points);
 return b;
}
