import {expect, it} from 'vitest';
import {defaultOptions} from '../../src/core/options';
import {deserializeVersionedMatch, REFERENCE_MATCH_IDENTITY} from '../../src/core/match-save';
import {pinned} from './versioned-match-fixture';

// Parent acceptance for the geographic-specific bypasses proven in PR160's review.
const base = {
  format:'malpaco-match', version:2,
  boardGenerator:{id:'geographic',version:1},
  rules:{id:'victory',version:1}, actionSchemaVersion:2,
  options:{...defaultOptions(),seed:42}, actions:[],
};

it.each([
  ['different rules', {rules:{id:'malpaco',version:1}}, /unsupported.*rules/i],
  ['different rules version', {rules:{id:'victory',version:2}}, /unsupported.*rules/i],
  ['different action schema', {actionSchemaVersion:1}, /unsupported.*action schema/i],
  ['extra generator key', {boardGenerator:{id:'geographic',version:1,extra:true}}, /unsupported.*boardGenerator/i],
  ['extra rules key', {rules:{id:'victory',version:1,extra:true}}, /unsupported.*rules/i],
] as const)('refuses geographic identity with %s', (_name, change, message) => {
  expect(() => deserializeVersionedMatch(JSON.stringify({...base,...change}))).toThrow(message);
});

it('still replays the pinned historical fixed-reference identity', () => {
  const fixture=pinned('placement'), loaded=deserializeVersionedMatch(fixture.text);
  expect(loaded.formatVersion).toBe(2);
  expect(loaded.identity).toEqual(REFERENCE_MATCH_IDENTITY);
  expect(loaded.state.history).toEqual(fixture.actions);
});
