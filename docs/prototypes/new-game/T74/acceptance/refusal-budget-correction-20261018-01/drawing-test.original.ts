import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {derivePresentation,DRAWING_VERSION} from '../../src/ui/generatedGeographyPresentation';
import type {AcceptedGeometry,Presentation} from '../../src/ui/generatedGeographyPresentation';
import {createGeographicGame} from '../../src/core/geographic-game';
import {deserializeVersionedMatch,serializeVersionedMatch,GEOGRAPHIC_MATCH_IDENTITY} from '../../src/core/match-save';
import type {GameOptions} from '../../src/core/options';
// Parent-approved: once-validated PhaseA geometry is pinned completely here.
// Exact typed-output equivalence protects every point/contact/route without rerunning the quadratic checker.
import frozenOracles from '../../docs/prototypes/new-game/T74/acceptance/frozen-oracles.json' with {type:'json'};
const read=(p:string)=>readFileSync(process.env['T74_FIXTURE_DIR']?process.env['T74_FIXTURE_DIR']+'/'+p:new URL('../../docs/prototypes/new-game/T74/acceptance/measurements/'+p,import.meta.url),'utf8');
const sha=(s:string)=>createHash('sha256').update(s).digest('hex');
const geometry=(b:Presentation)=>({seed:b.seed,bounds:b.bounds,islands:b.islands.map(({id,polygon,provinces})=>({id,polygon,provinces})),provinces:b.provinces.map(({id,island,polygon,labelAt,borders})=>({id,island,polygon,labelAt,borders})),routes:b.routes.map(({from,to,points})=>({from,to,points}))});
for(const seed of [1994,0,1,6,7,513,749,2,3,4,5,8])it(`matches frozen drawing and retains actual engine/save/RNG bytes ${seed}`,()=>{
 const text=read(`seed-${seed}-result.json`),original=JSON.parse(text),options=JSON.parse(read(`seed-${seed}-options.json`)) as GameOptions,measurement=frozenOracles.find(r=>r.seed===seed)!;
 expect(sha(text)).toBe(measurement.resultHash);expect(sha(JSON.stringify(original.rng))).toBe(measurement.rngHash);
 const input=original.geography as AcceptedGeometry,before=JSON.stringify(input),drawing=derivePresentation(input),oracle=JSON.parse(read(`seed-${seed}-after.json`));
 expect(drawing.drawingVersion).toBe(DRAWING_VERSION);expect(JSON.stringify(geometry(drawing))).toBe(JSON.stringify(geometry(oracle)));expect(Object.isFrozen(drawing.provinces[0]!.polygon[0])).toBe(true);expect(JSON.stringify(input)).toBe(before);expect(Object.isFrozen(input.provinces[0]!.borders)).toBe(false);expect(Object.isFrozen(input.islands[0]!.provinces)).toBe(false);
 // Frozen PhaseA ran unchanged T62/T24 inspection on exactly these oracle bytes.
 expect(sha(read(`seed-${seed}-after.json`))).toBe(measurement.candidateHash);
 expect(measurement.accepted).toBe(true);expect(Object.values(measurement.checks!).flat()).toEqual([]);
 expect(measurement.connectedCells).toBe(46);expect(measurement.hit40).toBe(46);expect(measurement.sharedDisagreements).toBe(0);
 expect(JSON.stringify(createGeographicGame(options))).toBe(text);
 const save=serializeVersionedMatch(options,[],GEOGRAPHIC_MATCH_IDENTITY);expect(save).toBe(read(`seed-${seed}-save.json`));expect(sha(save)).toBe(measurement.saveHash);expect(JSON.stringify(deserializeVersionedMatch(save))).toBe(read(`seed-${seed}-loaded.json`));
},120000);
it('retains all original398 refusal attempts and exact final RNG without deriving a replacement',()=>{const text=read('seed-398-result.json'),result=JSON.parse(text);expect(sha(text)).toBe(frozenOracles.find(r=>r.seed===398)!.resultHash);expect(result.ok).toBe(false);expect(result.attempts).toBe(50);expect(result.failures).toHaveLength(50);expect(JSON.stringify(createGeographicGame(JSON.parse(read('seed-398-options.json'))))).toBe(text);});
it('normal cards1994 save replays its original state and geography',()=>{const normal=JSON.parse(read('normal-1994-result.json')),loaded=deserializeVersionedMatch(read('normal-1994-save.json'));expect(JSON.stringify(loaded.state)).toBe(JSON.stringify(normal.state));expect(JSON.stringify(loaded.geography)).toBe(JSON.stringify(normal.geography));expect(normal.state.rules.cards).toBe('raid-v1');});
it('explicitly rejects unsupported input rather than returning old polygons',()=>{const input=JSON.parse(read('seed-1994-result.json')).geography;expect(()=>derivePresentation({...input,version:'future'})).toThrow(/Unsupported/);});
