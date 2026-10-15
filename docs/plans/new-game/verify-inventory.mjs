import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const directory = path.dirname(fileURLToPath(import.meta.url));
const revision = 'ae298e37c2f5177039e55767607f9345b6cb0e7a';
// Seal the independently enumerated manifest: deleting from both sides must fail.
export const manifestHash = 'db9cc9430aaec90433dfd92e5dd22bf91a16501a9b24aa19d4407062b9f97eaf';
const documents = ['core-rules', 'variety', 'computer', 'ui'];
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const need = (condition, message) => { if (!condition) throw new Error(message); };
const text = value => typeof value === 'string' && value.trim().length > 0;

export function verifyInventory(manifest, rows, { expectedManifestHash, repositoryRoot = root } = {}) {
  need(text(expectedManifestHash) && hash(manifest) === expectedManifestHash, 'Independent source manifest changed; re-enumerate upstream and review the new seal.');
  need(manifest.revision === revision, 'Wrong source revision');
  need(Array.isArray(manifest.sources) && manifest.sources.length === documents.length, 'Exactly four designs required');
  const expected = new Map();
  const seenDocuments = new Set();
  const byDocument = {};
  for (const source of manifest.sources) {
    need(documents.includes(source.document) && !seenDocuments.has(source.document), 'Unknown/duplicate source');
    seenDocuments.add(source.document);
    need(/^[a-f0-9]{64}$/.test(source.sha256), 'Missing source file hash');
    need(Array.isArray(source.requirements) && source.requirements.length > 0, 'Empty source enumeration');
    need(Array.isArray(source.exclusions) && source.exclusions.every(e => text(e.reason) && Array.isArray(e.lines) && e.lines.length === 2), 'Unexplained source exclusions');
    byDocument[source.document] = { covered: 0, total: source.requirements.length };
    for (const requirement of source.requirements) {
      need(text(requirement.id) && !expected.has(requirement.id), 'Duplicate/empty manifest requirement');
      need(text(requirement.anchor) && Array.isArray(requirement.lines) && requirement.lines.length === 2
        && requirement.lines.every(n => Number.isSafeInteger(n) && n > 0)
        && requirement.lines[1] >= requirement.lines[0], 'Invalid source location');
      expected.set(requirement.id, { ...requirement, document: source.document });
    }
  }
  const seen = new Set();
  const localFile = relative => {
    need(text(relative) && !path.isAbsolute(relative) && !relative.split(/[\\/]/).includes('..'), 'Reference escapes checkout');
    const absolute = path.resolve(repositoryRoot, relative);
    need(fs.existsSync(absolute) && fs.statSync(absolute).isFile(), `Missing referenced file: ${relative}`);
    need(fs.realpathSync(absolute).startsWith(fs.realpathSync(repositoryRoot) + path.sep), 'Reference symlink escapes checkout');
  };
  need(Array.isArray(rows), 'Inventory must be an array');
  for (const row of rows) {
    need(row && typeof row === 'object', 'Invalid inventory row');
    const source = expected.get(row.id);
    need(source && !seen.has(row.id), `Unknown/duplicate inventory requirement: ${row.id}`);
    seen.add(row.id);
    need(row.document === source.document, `Wrong document: ${row.id}`);
    const citation = `https://github.com/diegoami/isle-wars-archaeology/blob/${revision}/design/${source.document}.md#${source.anchor}`;
    need(row.citation === citation, `Missing/wrong pinned source anchor: ${row.id}`);
    for (const field of ['requirement', 'ownerDecision', 'assessment', 'missing']) need(text(row[field]), `Missing ${field}: ${row.id}`);
    need(['confirmed', 'derived', 'designed'].includes(row.confidence), `Invalid confidence: ${row.id}`);
    need(['reuse', 'extend', 'new', 'owner-question'].includes(row.disposition), `Invalid disposition: ${row.id}`);
    need(Array.isArray(row.questions) && row.questions.every(text), `Invalid owner questions: ${row.id}`);
    need(row.disposition !== 'owner-question' || row.questions.length > 0, 'Owner question needs explanation');
    for (const field of ['code', 'tests']) {
      need(Array.isArray(row[field]) && row[field].length > 0, `Missing ${field} references: ${row.id}`);
      row[field].forEach(localFile);
    }
    need(Array.isArray(row.tasks) && row.tasks.length > 0 && new Set(row.tasks).size === row.tasks.length, `Missing/duplicate tasks: ${row.id}`);
    for (const task of row.tasks) {
      need(/^T[0-9]+$/.test(task), 'Invalid task reference');
      localFile(`docs/tasks/${task}.md`);
    }
    byDocument[row.document].covered++;
  }
  const missing = [...expected.keys()].filter(id => !seen.has(id));
  need(missing.length === 0, `Unexplained omissions (${missing.length}): ${missing.join(', ')}`);
  return { covered: seen.size, total: expected.size, omissions: missing.length, byDocument };
}

export function loadInventory() {
  const manifest = JSON.parse(fs.readFileSync(path.join(directory, 'source-manifest.json'), 'utf8'));
  const files = fs.readdirSync(directory).filter(f => /^rules-inventory-.*\.json$/.test(f)).sort();
  const rows = files.flatMap(f => JSON.parse(fs.readFileSync(path.join(directory, f), 'utf8')));
  return { manifest, rows };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const { manifest, rows } = loadInventory();
    const report = verifyInventory(manifest, rows, { expectedManifestHash: manifestHash });
    for (const [document, count] of Object.entries(report.byDocument)) console.log(`${document}: ${count.covered}/${count.total}`);
    console.log(`Covered ${report.covered}/${report.total} source requirement units; unexplained omissions: ${report.omissions}`);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
