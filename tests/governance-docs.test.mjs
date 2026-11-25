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

/** Inject replacement bytes for one frozen file, leaving the other two real. */
const withBytesFor = (path, value) => (requested) => requested === path ? value : read(requested);

test('a README same-length edit is refused by the same exact-hash gate', () => {
  const readme = read('README.md');
  const changed = Buffer.from(readme);
  changed[1] = changed[1] === 70 ? 71 : 70;
  const issues = validateGovernanceDocs(withBytesFor('README.md', changed));
  assert.ok(issues.some((issue) => issue.includes('README.md') && issue.includes('SHA-256')));
});

test('an appended README status note is refused', () => {
  const appended = Buffer.concat([read('README.md'), Buffer.from('\nU03 is open\n')]);
  const issues = validateGovernanceDocs(withBytesFor('README.md', appended));
  assert.ok(issues.some((issue) => issue.includes('README.md')));
});

test('the unchanged README still passes and keeps its 3,200-byte cap', () => {
  assert.deepEqual(validateGovernanceDocs(withBytesFor('README.md', read('README.md'))), []);
  const entry = FROZEN_GOVERNANCE_FILES.find(({ path }) => path === 'README.md');
  assert.equal(entry.maxBytes, 3200);
  assert.deepEqual(Object.keys(entry).sort(), ['maxBytes', 'path', 'sha256']);
});

/**
 * `UNO-WO-115 / R01` — the three corrected files. The gate proves exact bytes; these tests additionally prove the *content*
 * that was approved: the concurrent publication contract is present and the superseded single-public-Site restriction is
 * gone. A future byte change still fails the hash, and a future content regression fails here even before a hash update.
 */
const FROZEN_PATHS = FROZEN_GOVERNANCE_FILES.map(({ path }) => path);

/** The approved contract phrases every corrected file must carry, as case-insensitive patterns. */
const CONTRACT_PATTERNS = [
  ['concurrent facets', /one or more concurrently active facets/iu],
  ['sites per facet', /sites per facet/iu],
  ['pages per site', /pages per site/iu],
  ['full-locale representations', /full-locale representations/iu],
  ['validated host/path binding', /validated (?:facet\/site )?host and\/or path binding/iu],
  ['entry preference', /entry preference/iu],
  ['never an exclusive publisher', /never an exclusive publisher/iu],
];

/** The superseded wording that must never return. */
const SUPERSEDED = [
  'exactly one public Site',
  'exactly one explicitly selected public Site',
  'one selected public Site',
  'one public Site selected',
  'single selected public Site',
  'single public Site',
];

const text = (buffer) => buffer.toString('utf8');

/** Content-level issues for one file: the contract must be present and the superseded restriction absent. */
function contractIssues(path, bytes) {
  const body = text(bytes);
  const issues = [];
  for (const [name, pattern] of CONTRACT_PATTERNS) {
    if (!pattern.test(body)) issues.push(`${path}: missing approved contract phrase (${name})`);
  }
  for (const phrase of SUPERSEDED) {
    if (body.toLowerCase().includes(phrase.toLowerCase())) issues.push(`${path}: superseded wording "${phrase}"`);
  }
  return issues;
}

test('all three corrected governance files pass the hash gate, the unchanged caps and the approved contract', () => {
  assert.deepEqual(validateGovernanceDocs(), []);
  for (const path of FROZEN_PATHS) {
    assert.deepEqual(contractIssues(path, read(path)), [], path);
  }
  assert.deepEqual(
    FROZEN_GOVERNANCE_FILES.map(({ path, maxBytes }) => [path, maxBytes]),
    [
      ['AGENTS.md', 3200],
      ['README.md', 3200],
      ['.documents/SOP/sop-implementation.md', 6000],
    ],
  );
  // The two files the order charges with the new rule record STOP-and-preserve for an unexplained mid-run mutation.
  assert.match(text(read('AGENTS.md')), /mid-run external file change means STOP/iu);
  assert.match(text(read('AGENTS.md')), /preserve it and restore nothing without Owner direction/u);
  assert.match(text(read('.documents/SOP/sop-implementation.md')), /mid-run mutation/iu);
  assert.match(text(read('.documents/SOP/sop-implementation.md')), /preserve the unknown change/u);
  // The README keeps its mission, rights, development and authority boundaries while dropping the stale maturity claim.
  const readme = text(read('README.md'));
  assert.match(readme, /Apache-2\.0 does not automatically license Provelopment trademarks/u);
  assert.match(readme, /Changes to this frozen README, `AGENTS\.md` or the local SOP require explicit Owner approval/u);
  assert.match(readme, /pnpm test:http/u);
  assert.doesNotMatch(readme, /is not implemented yet|projected Page header/iu);
  // The concurrent contract is stated exactly once per file and never as a hidden sole publisher.
  for (const path of FROZEN_PATHS) {
    const body = text(read(path));
    assert.equal((body.match(/host and\/or path binding/giu) ?? []).length, 1, path);
    assert.equal((body.match(/concurrently active facets/giu) ?? []).length, 1, path);
  }
});

test('an unexpected byte change in any corrected file is refused by the exact-hash gate', () => {
  for (const path of FROZEN_PATHS) {
    const approvedBytes = read(path);
    const changed = Buffer.from(approvedBytes);
    changed[Math.floor(changed.length / 2)] ^= 0x01;
    const issues = validateGovernanceDocs(withBytesFor(path, changed));
    assert.ok(
      issues.some((issue) => issue.includes(path) && issue.includes('SHA-256')),
      `${path}: ${issues.join(',')}`,
    );
    assert.ok(issues.every((issue) => !issue.includes('byte cap')), path);
  }
});

test('a stale single-public-Site revision of each file is refused by content and by hash', () => {
  for (const path of FROZEN_PATHS) {
    const approvedBytes = read(path);
    const doctored = Buffer.from(
      text(approvedBytes).replace(/host and\/or path binding/iu, 'one public Site selected initially'),
    );
    assert.notEqual(text(doctored), text(approvedBytes), path);
    assert.ok(
      contractIssues(path, doctored).some((issue) => issue.includes('superseded wording') || issue.includes('missing approved')),
      path,
    );
    assert.ok(
      validateGovernanceDocs(withBytesFor(path, doctored)).some((issue) => issue.includes('SHA-256')),
      path,
    );
  }
});

test('the previous approved bytes of each corrected file are refused after the authorized hash update', () => {
  const prior = {
    'AGENTS.md': '6c6d5dcba44c9769df8a18db00d4791b38fc804759cb1da14e20daf9de31ca6f',
    'README.md': '97f93bdaf710bac53e3be48be0365c414042e89ef4461e55e98852cd0fd1995a',
    '.documents/SOP/sop-implementation.md': '6d790ad43349c434297d4d8a1e98311a822d4ec31df67aa882542aeab21cb388',
  };
  for (const path of FROZEN_PATHS) {
    const entry = FROZEN_GOVERNANCE_FILES.find((item) => item.path === path);
    assert.notEqual(entry.sha256, prior[path], path);
    assert.match(entry.sha256, /^[0-9a-f]{64}$/u, path);
  }
});
