import {expect, it} from 'vitest';
import {createGeographicGame} from '../../src/core/geographic-game';
import {defaultOptions} from '../../src/core/options';

it('explains zero-budget exhaustion so callers can offer a retry', () => {
  const result = createGeographicGame(defaultOptions(), undefined, {attempts:0});
  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.errors.join('; ')).toMatch(/exhausted.*0.*attempt/i);
  expect(result).toMatchObject({attempts:0, failures:[]});
  expect(result).not.toHaveProperty('state');
});
