/**
 * Foundation Uno — U00 bootstrap tests.
 *
 * Dependency-free: Node's built-in test runner and assertions only, no packages.
 *
 * Every fixture is created inside this repository's own ignored `.temp/` directory and
 * removed when the suite ends. Nothing is written outside the Uno root, and never into
 * the read-only upstream reference.
 *
 * The suite proves both directions: a complete minimal scaffold is accepted, and each
 * specific defect is refused with a diagnostic.
 */

import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { validateBootstrap } from '../scripts/verify-bootstrap.mjs';

/** The real repository root (the parent of tests/). */
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** All fixtures live here, inside the ignored task-scratch directory. */
const FIXTURE_BASE = join(REPO_ROOT, '.temp', 'bootstrap-tests');

/** A complete, minimal, valid U00 scaffold. */
const VALID_FILES = {
  'README.md': '# Foundation Uno\n\nThe Uno runtime is not implemented yet.\n',
  'AGENTS.md':
    '# AGENTS.md\n\n' +
    'Canonical documents: https://drive.google.com/drive/folders/1FhR56l6zVwl7To9S0v5-R4uA24jjkCj0\n' +
    'The physical order is workorder-active.md in the project root.\n',
  LICENSE:
    '\n                                 Apache License\n' +
    '                           Version 2.0, January 2004\n',
  '.gitignore': '/.documents/WIP/workorder-active.md\n/workorder-active.md\n/.temp/\n',
  '.documents/Architecture/source-inventory.md': '# Source inventory\n\nU00 fixture.\n',
  '.github/workflows/verify-bootstrap.yml':
    'name: Uno Bootstrap Verify\non:\n  push:\n    branches: [main]\npermissions:\n  contents: read\n',
  'tests/bootstrap.test.mjs': '// fixture placeholder for the bootstrap test file\n',
};

/**
 * Materialise a disposable fixture.
 *
 * @param {string} name unique fixture directory name
 * @param {{omit?: string[], override?: Record<string,string>, extra?: Record<string,string>}} [plan]
 * @returns {string} the fixture root
 */
function makeFixture(name, plan = {}) {
  const { omit = [], override = {}, extra = {} } = plan;
  const root = join(FIXTURE_BASE, name);

  rmSync(root, { recursive: true, force: true });
  mkdirSync(root, { recursive: true });

  for (const [rel, content] of Object.entries(VALID_FILES)) {
    if (omit.includes(rel)) continue;
    const body = Object.hasOwn(override, rel) ? override[rel] : content;
    write(join(root, rel), body);
  }
  for (const [rel, content] of Object.entries(extra)) {
    write(join(root, rel), content);
  }
  return root;
}

function write(fullPath, body) {
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, body, 'utf8');
}

after(() => {
  // Remove only the test-owned fixture directory, never the whole .temp/.
  rmSync(FIXTURE_BASE, { recursive: true, force: true });
});

test('a complete minimal scaffold is accepted with zero issues', () => {
  const root = makeFixture('valid');
  assert.deepEqual(validateBootstrap(root), []);
});

test('the real Uno root passes the same validation', () => {
  assert.deepEqual(validateBootstrap(REPO_ROOT), []);
});

test('a missing LICENSE is refused', () => {
  const root = makeFixture('no-license', { omit: ['LICENSE'] });
  const issues = validateBootstrap(root);
  assert.ok(issues.length > 0, 'expected at least one issue');
  assert.ok(
    issues.some((i) => i.includes('LICENSE')),
    `expected a LICENSE diagnostic, got: ${JSON.stringify(issues)}`,
  );
});

test('a LICENSE that is not Apache-2.0 is refused', () => {
  const root = makeFixture('wrong-license', {
    override: { LICENSE: 'MIT License\n\nPermission is hereby granted...\n' },
  });
  const issues = validateBootstrap(root);
  assert.ok(issues.some((i) => i.includes('Apache License')), JSON.stringify(issues));
});

test('a missing work-order ignore pattern is refused', () => {
  const root = makeFixture('no-workorder-ignore', {
    override: { '.gitignore': '/.temp/\n' },
  });
  const issues = validateBootstrap(root);
  assert.ok(
    issues.some((i) => i.includes('workorder-active.md')),
    `expected a work-order ignore diagnostic, got: ${JSON.stringify(issues)}`,
  );
});

test('a missing .temp ignore pattern is refused', () => {
  const root = makeFixture('no-temp-ignore', {
    override: { '.gitignore': '/.documents/WIP/workorder-active.md\n' },
  });
  const issues = validateBootstrap(root);
  assert.ok(issues.some((i) => i.includes('.temp')), JSON.stringify(issues));
});

test('a stray Hub/Spoke deployment file is refused', () => {
  const root = makeFixture('stray-spokes', {
    extra: { 'deployment/spokes.json': '{"spokes":[]}\n' },
  });
  const issues = validateBootstrap(root);
  assert.ok(
    issues.some((i) => i.includes('deployment/spokes.json')),
    `expected a Hub/Spoke diagnostic, got: ${JSON.stringify(issues)}`,
  );
});

test('a missing README is refused', () => {
  const root = makeFixture('no-readme', { omit: ['README.md'] });
  const issues = validateBootstrap(root);
  assert.ok(issues.some((i) => i.includes('README.md')), JSON.stringify(issues));
});

test('a README that claims a working website is refused', () => {
  const root = makeFixture('dishonest-readme', {
    override: { 'README.md': '# Foundation Uno\n\nA production-ready Next.js website.\n' },
  });
  const issues = validateBootstrap(root);
  assert.ok(issues.some((i) => i.includes('not implemented yet')), JSON.stringify(issues));
});

test('a missing AGENTS.md is refused', () => {
  const root = makeFixture('no-agents', { omit: ['AGENTS.md'] });
  const issues = validateBootstrap(root);
  assert.ok(issues.some((i) => i.includes('AGENTS.md')), JSON.stringify(issues));
});

test('an AGENTS.md without the canonical documentation reference is refused', () => {
  const root = makeFixture('agents-no-drive', {
    override: { 'AGENTS.md': '# AGENTS.md\n\nOrder: workorder-active.md\n' },
  });
  const issues = validateBootstrap(root);
  assert.ok(
    issues.some((i) => i.includes('canonical Uno documentation folder')),
    JSON.stringify(issues),
  );
});

test('an empty required file is refused', () => {
  const root = makeFixture('empty-inventory', {
    override: { '.documents/Architecture/source-inventory.md': '' },
  });
  const issues = validateBootstrap(root);
  assert.ok(issues.some((i) => i.includes('source-inventory.md')), JSON.stringify(issues));
});

test('a credential in a published document is refused', () => {
  // Assembled at runtime: a token-shaped literal must never appear in this repository.
  const sampleToken = ['ghp', '0123456789abcdefghijABCDEFGHIJ012345'].join('_');
  const root = makeFixture('secret-leak', {
    override: {
      'README.md':
        '# Foundation Uno\n\nThe Uno runtime is not implemented yet.\n' +
        `Example token: ${sampleToken}\n`,
    },
  });
  const issues = validateBootstrap(root);
  assert.ok(
    issues.some((i) => i.includes('credential')),
    `expected a credential diagnostic, got: ${JSON.stringify(issues)}`,
  );
});

test('a machine-specific private path in a published document is refused', () => {
  const separator = String.fromCharCode(92);
  const privatePath = 'C:' + separator + 'Users' + separator + 'someone' + separator + 'repo';
  const root = makeFixture('private-path-leak', {
    override: {
      'README.md':
        '# Foundation Uno\n\nThe Uno runtime is not implemented yet.\n' +
        `Local path: ${privatePath}\n`,
    },
  });
  const issues = validateBootstrap(root);
  assert.ok(
    issues.some((i) => i.includes('private path')),
    `expected a private-path diagnostic, got: ${JSON.stringify(issues)}`,
  );
});

test('a non-existent root is reported rather than thrown', () => {
  const issues = validateBootstrap(join(FIXTURE_BASE, 'does-not-exist'));
  assert.equal(issues.length, 1);
  assert.ok(issues[0].includes('does not exist'), issues[0]);
});
