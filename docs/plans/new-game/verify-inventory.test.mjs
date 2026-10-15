import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { verifyInventory } from './verify-inventory.mjs';

const revision = 'ae298e37c2f5177039e55767607f9345b6cb0e7a';
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
function fixture() {
  const documents = ['core-rules', 'variety', 'computer', 'ui'];
  const manifest = { revision, sources: documents.map(document => ({ document,
    sha256: 'a'.repeat(64), requirements: [{ id: `${document}-001`, anchor: 'terms', lines: [1, 2] }],
    exclusions: [{ lines: [3, 4], reason: 'Historical alternatives, not canonical rules.' }] })) };
  const rows = documents.map(document => ({ id: `${document}-001`, document,
    requirement: 'A meaningful approved requirement.',
    citation: `https://github.com/diegoami/isle-wars-archaeology/blob/${revision}/design/${document}.md#terms`,
    confidence: 'designed', ownerDecision: 'Approved canonical design, 2026-10-12.',
    disposition: 'extend', code: ['src/core/rules.ts'], tests: ['tests/core/turns.test.ts'],
    assessment: 'Existing actions provide a seam; full rule needs implementation.',
    missing: 'Add remaining canonical actions.', tasks: ['T27'], questions: [] }));
  return { manifest, rows, expectedManifestHash: digest(manifest) };
}
const check = f => verifyInventory(f.manifest, f.rows, { expectedManifestHash: f.expectedManifestHash });
test('complete independently enumerated matrix passes with exact counts', () => {
  assert.deepEqual(check(fixture()), { covered: 4, total: 4, omissions: 0,
    byDocument: { 'core-rules': { covered: 1, total: 1 }, variety: { covered: 1, total: 1 },
      computer: { covered: 1, total: 1 }, ui: { covered: 1, total: 1 } } });
});
for (const [name, mutate] of [
  ['missing requirement', f => f.rows.pop()],
  ['duplicate requirement', f => f.rows.push(structuredClone(f.rows[0]))],
  ['unknown requirement', f => f.rows[0].id = 'invented'],
  ['missing citation', f => delete f.rows[0].citation],
  ['wrong source anchor', f => f.rows[0].citation = f.rows[0].citation.replace('#terms', '#invented')],
  ['unpinned citation', f => f.rows[0].citation = f.rows[0].citation.replace(revision, 'main')],
  ['wrong document', f => f.rows[0].document = 'ui'],
  ['missing task mapping', f => f.rows[0].tasks = []],
  ['unknown task', f => f.rows[0].tasks = ['T9999']],
  ['missing disposition', f => delete f.rows[0].disposition],
  ['invented disposition', f => f.rows[0].disposition = 'complete'],
  ['missing confidence', f => delete f.rows[0].confidence],
  ['missing owner decision', f => f.rows[0].ownerDecision = ''],
  ['missing assessment', f => f.rows[0].assessment = ''],
  ['missing gap explanation', f => f.rows[0].missing = ''],
  ['missing requirement description', f => f.rows[0].requirement = ''],
  ['missing code reference', f => f.rows[0].code = []],
  ['nonexistent test reference', f => f.rows[0].tests = ['tests/missing.test.ts']],
  ['reference escapes checkout', f => f.rows[0].code = ['../src/core/rules.ts']],
  ['simultaneous manifest and matrix omission', f => { f.manifest.sources[0].requirements = []; f.rows.shift(); }],
  ['duplicate manifest ID', f => f.manifest.sources[0].requirements.push(f.manifest.sources[0].requirements[0])],
  ['missing source document', f => { f.manifest.sources.pop(); f.rows.pop(); }],
  ['empty matrix', f => f.rows = []],
]) test(`rejects ${name}`, () => {
  const f = fixture(); mutate(f);
  assert.throws(() => check(f), Error);
});
