// Only known prose additions/modifications can bypass runtime verification.
export function classifyChanges(input) {
  if (!input || input.eventName !== 'pull_request' || input.complete !== true ||
      !Array.isArray(input.files) || !Number.isSafeInteger(input.changedFiles) ||
      input.changedFiles < 1 || input.files.length !== input.changedFiles) return 'full';
  const seen = new Set();
  for (const file of input.files) {
    if (!file || !['added', 'modified'].includes(file.status) ||
        Object.hasOwn(file, 'previous_filename') || typeof file.filename !== 'string') return 'full';
    const path = file.filename;
    if (/[\\\x00-\x1f\x7f]/.test(path) || path.split('/').some(p => !p || p === '.' || p === '..') || seen.has(path)) return 'full';
    seen.add(path);
    if (!['README.md', 'RUN-NOTES.md', 'docs/ci-development.md'].includes(path) &&
        !/^docs\/tasks\/[^/]+\.md$/.test(path) && !/^docs\/plans\/(?:[^/]+\/)*[^/]+\.md$/.test(path)) return 'full';
  }
  return 'docs';
}

export function gatePass(input) {
  if (!input || input.classificationResult !== 'success') return false;
  if (input.mode === 'docs') return input.verificationResult === 'skipped';
  return input.mode === 'full' && input.verificationResult === 'success';
}
