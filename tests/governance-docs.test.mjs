import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FROZEN_GOVERNANCE_FILES, validateGovernanceDocs } from '../scripts/verify-governance-docs.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const approved = new Map(FROZEN_GOVERNANCE_FILES.map(({ path }) => [path, readFileSync(resolve(ROOT, path))]));
const read = (path) => approved.get(path);
const target = 'AGENTS.md';
const withBytes = (value) => (path) => path === target ? value : read(path);

test('three exact Owner-frozen files pass', () => {
  assert.deepEqual(validateGovernanceDocs(), []);
});

test('an appended history note is refused', () => {
  const issues = validateGovernanceDocs(withBytes(Buffer.concat([read(target), Buffer.from('\nHistoric status\n')])));
  assert.ok(issues.some((issue) => issue.includes('AGENTS.md') && issue.includes('SHA-256')));
});

test('a same-length word replacement is refused', () => {
  const changed = Buffer.from(read(target));
  changed[0] = changed[0] === 35 ? 64 : 35;
  assert.ok(validateGovernanceDocs(withBytes(changed)).some((issue) => issue.includes('SHA-256')));
});

test('a deletion is refused', () => {
  assert.ok(validateGovernanceDocs(withBytes(read(target).subarray(0, -1))).length > 0);
});

test('oversized content fails the byte cap', () => {
  const changed = Buffer.alloc(6400, 65);
  assert.ok(validateGovernanceDocs(withBytes(changed)).some((issue) => issue.includes('byte cap')));
});

test('missing governance text is refused', () => {
  assert.ok(validateGovernanceDocs((path) => path === target ? (() => { throw Error('missing'); })() : read(path))
    .some((issue) => issue.includes('missing/unreadable')));
});
