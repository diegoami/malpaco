// Proposal: install at tests/core/geographic-board.test.ts; no producer is included.
import {describe, expect, it} from 'vitest';
import {generateGeographicBoard, generateGeographicBoardWithRng} from '../../src/core/geographic-board';
import {createGeographicGame} from '../../src/core/geographic-game';
import {generateIslandGeography, generateIslandGeographyWithRng} from '../../src/core/island-geography';
import {DeterministicRng} from '../../src/core/rng';
import {createGameWithRng} from '../../src/core/setup';
import {defaultOptions} from '../../src/core/options';
import {victoryRules} from '../../src/core/state';
import {apply} from '../../src/core/rules';
import {serializeVersionedMatch, deserializeVersionedMatch} from '../../src/core/match-save';
import type {GameMap} from '../../src/core/types';

const acceptance = new URL('../../fixtures/new-game/T35/acceptance.mjs', import.meta.url).href;
const {inspectBoard} = await import(acceptance) as {inspectBoard: (map: GameMap, geography: unknown) => string[]};
const identity = {boardGenerator: {id:'geographic',version:1}, rules:{id:'victory',version:1}, actionSchemaVersion:2};
const options = (seed: number) => ({...defaultOptions(), seed});

describe('complete geographic boards', () => {
  it.each([0,1,7,42,99,1994])('accepts actual geometry, edges, bonuses and fairness for seed %i', seed => {
    const result = generateGeographicBoard(seed);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(inspectBoard(result.map, result.geography)).toEqual([]);
    expect(result.attempts).toBeGreaterThan(0);
    expect(result.attempts).toBeLessThanOrEqual(50);
    expect(result.failures).toHaveLength(result.attempts-1);
    expect(generateGeographicBoard(seed)).toEqual(result);
  },30000);

  it('checks copied production outputs rather than replacing their values', () => {
    const result = generateGeographicBoard(42);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const stale = structuredClone(result);
    Object.assign(stale.map.provinces[0]!, {borders:[]});
    expect(inspectBoard(stale.map, stale.geography).length).toBeGreaterThan(0);
    const asymmetric = structuredClone(result);
    const entrance = asymmetric.map.provinces.find(p => p.seaLanes.length)!;
    Object.assign(entrance, {seaLanes:[]});
    expect(inspectBoard(asymmetric.map, asymmetric.geography).length).toBeGreaterThan(0);
    const bonus = structuredClone(result);
    Object.assign(bonus.map.islands[0]!, {bonus:bonus.map.islands[0]!.bonus+1});
    expect(inspectBoard(bonus.map, bonus.geography).length).toBeGreaterThan(0);
    const fractional = structuredClone(result);
    const first = fractional.map.provinces[0]!;
    const polygon = first.polygon.map((point,i)=>[point[0]+(i===0?0.5:0),point[1]] as const);
    Object.assign(first,{polygon});
    fractional.geography.provinces.find(p=>p.id===first.id)!.polygon[0]![0]+=0.5;
    expect(inspectBoard(fractional.map,fractional.geography)).toContain('geometry: noninteger coordinate');
    const missingRoute = structuredClone(result);
    missingRoute.geography.entranceReservations.pop();
    expect(inspectBoard(missingRoute.map, missingRoute.geography).length).toBeGreaterThan(0);
    const endpoint = structuredClone(result);
    endpoint.geography.entranceReservations[0]!.points[0] = [0,0];
    expect(inspectBoard(endpoint.map, endpoint.geography).length).toBeGreaterThan(0);
  },30000);

  it('keeps the geography seed wrapper and the shared stream equivalent', () => {
    const rng = new DeterministicRng(42);
    expect(generateIslandGeographyWithRng(rng)).toEqual(generateIslandGeography(42));
    const advanced = new DeterministicRng(42);
    advanced.nextInt(0,100);
    const replay = DeterministicRng.fromSnapshot(advanced.snapshot());
    const expectedPartial = generateIslandGeographyWithRng(DeterministicRng.fromSnapshot(advanced.snapshot()));
    expect(expectedPartial.ok).toBe(true);
    const board = generateGeographicBoardWithRng(advanced);
    expect(board).toEqual(generateGeographicBoardWithRng(replay));
    expect(board.ok).toBe(true);
    if(board.ok && expectedPartial.ok) expect(board.geography).toEqual(expectedPartial.geography);
    expect(board.rng).toEqual(expectedPartial.rng);
    expect(board.rng).toEqual(advanced.snapshot());
    expect(board).not.toEqual(generateGeographicBoard(42));
  },30000);

  it('continues the geography stream through the real deal and centre selection', () => {
    const opts = options(42), rules = victoryRules(opts), rng = new DeterministicRng(opts.seed);
    const board = generateGeographicBoardWithRng(rng);
    expect(board.ok).toBe(true);
    if (!board.ok) return;
    const expected = createGameWithRng(opts, rng, () => ({ok:true, map:board.map}), rules);
    const actual = createGeographicGame(opts, rules);
    expect(actual.ok).toBe(true);
    if (!actual.ok || !expected.ok) { expect(expected.ok).toBe(true); return; }
    expect(actual.state).toEqual(expected.state);
    expect(actual.geography).toEqual(board.geography);
    expect(actual.state.rng).toEqual(rng.snapshot());
  },30000);

  it('returns reproducible zero-budget exhaustion without publishing a board or drawing RNG', () => {
    const rng = new DeterministicRng(42);
    rng.nextInt(0,100);
    const before = rng.snapshot();
    const result = generateGeographicBoardWithRng(rng,{attempts:0});
    expect(result).toMatchObject({ok:false,attempts:0,failures:[],rng:before});
    expect(result).not.toHaveProperty('map');
    expect(result).not.toHaveProperty('geography');
    expect(rng.snapshot()).toEqual(before);
    expect(createGeographicGame(options(42), undefined, {attempts:0}).ok).toBe(false);
  },30000);

  it('retains each real rejected candidate and spends one global budget', () => {
    // T34 sweep-JPXDhX records seed 0 taking seven attempts. Reconfirm in parent preflight.
    const seed = 0;
    const rng = new DeterministicRng(seed), replay = new DeterministicRng(seed);
    const partial = generateIslandGeographyWithRng(replay,{attempts:1});
    expect(partial.ok).toBe(false);
    const exhausted = generateGeographicBoardWithRng(rng,{attempts:1});
    expect(exhausted).toMatchObject({ok:false,attempts:1,failures:partial.failures,rng:partial.rng});
    expect(exhausted.failures).toHaveLength(1);
    expect(exhausted.failures[0]!.constraints.length).toBeGreaterThan(0);
    expect(exhausted.failures[0]).toHaveProperty('candidate');
    expect(rng.snapshot()).toEqual(replay.snapshot());
    expect(exhausted).not.toHaveProperty('map');
    expect(generateGeographicBoard(seed,{attempts:1})).toEqual(exhausted);
  },30000);

  it('replays the explicit geographic/1 modern identity and ordinary actions', () => {
    const opts = options(42), created = createGeographicGame(opts);
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const player = created.state.players[created.state.currentPlayer]!.id;
    const province = created.state.map.provinces.find(p=>created.state.ownerOf[p.id]===player)!;
    const action = {kind:'reinforce', province:province.id, amount:1} as const;
    const next = apply(created.state,action);
    expect(next.ok).toBe(true);
    if (!next.ok) return;
    const text = serializeVersionedMatch(opts,[action],identity);
    const loaded = deserializeVersionedMatch(text);
    expect(loaded.identity).toEqual(identity);
    expect(loaded.state).toEqual(next.state);
    expect(JSON.parse(text).version).toBe(2);
    const unsupported = JSON.parse(text);
    unsupported.boardGenerator.version = 999;
    expect(()=>deserializeVersionedMatch(JSON.stringify(unsupported))).toThrow(/unsupported.*boardGenerator/i);
  },30000);
});
