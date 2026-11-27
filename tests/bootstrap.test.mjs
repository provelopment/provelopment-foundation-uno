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

/**
 * A complete, minimal, valid U00 scaffold, with sample planning notes.
 *
 * The README fixture carries only the durable public truth: baseline, progress authority
 * (current `main` + the single report), and the publication/release disclaimer. It pins no
 * stage, no commit and no implementation-status claim.
 */
const VALID_FILES = {
  'README.md':
    '# Foundation Uno\n\n' +
    'Foundation Uno is a **technical baseline**, adapted from audited Foundation code. ' +
    'Read current `main` and the [single execution report](.documents/Reports/execution-report.md) ' +
    'for progress; the repository is https://github.com/provelopment/provelopment-foundation-uno. ' +
    'A technical baseline or passing test does not establish a published website and does not ' +
    'authorize release or deployment without separate Owner authorization.\n',
  'AGENTS.md': '# Local work',
  LICENSE:
    '\n                                 Apache License\n' +
    '                           Version 2.0, January 2004\n',
  '.gitignore': '/.documents/WIP/workorder-active.md\n/workorder-active.md\n/.temp/\n',
  '.documents/SOP/sop-implementation.md':
    '# Local implementation SOP\n\n1. One Entity only.\n2. Write only inside the root.\n',
  '.documents/Architecture/source-inventory.md': '# Source inventory\n\nU00 fixture.\n',
  '.documents/WIP/plan-roadmap.md': '# Roadmap\n\nU00 is open.\n',
  '.documents/WIP/plan-next.md': '# Foundation Uno — Next\n',
  '.documents/WIP/plan-outlook.md': '# Outlook\n\nIdeas only, never requirements.\n',
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

const VALID_README = VALID_FILES['README.md'];

test('a README that claims a working website is refused', () => {
  const root = makeFixture('dishonest-readme', {
    override: { 'README.md': '# Foundation Uno\n\nA production-ready Next.js website.\n' },
  });
  const issues = validateBootstrap(root);
  assert.ok(
    issues.length > 0 && issues.every((i) => i.startsWith('README.md')),
    JSON.stringify(issues),
  );
});

test('a README without the baseline, progress authority or disclaimer is refused rule by rule', () => {
  const cases = [
    ['missing-baseline', VALID_README.replaceAll(/technical baseline/giu, 'repository')],
    [
      'missing-progress-authority',
      VALID_README.replace('https://github.com/provelopment/provelopment-foundation-uno', 'the repository'),
    ],
    ['missing-current-main', VALID_README.replace('current `main`', 'the default branch')],
    [
      'missing-report-link',
      VALID_README.replace('.documents/Reports/execution-report.md', 'the report'),
    ],
    [
      'missing-publication-disclaimer',
      VALID_README.replace('does not establish a published website', 'is not finished'),
    ],
    [
      'missing-release-disclaimer',
      VALID_README.replace('does not authorize release or deployment', 'is not released'),
    ],
  ];
  for (const [label, body] of cases) {
    assert.notEqual(body, VALID_README, `${label} must actually change the README`);
    const root = makeFixture(`readme-${label}`, { override: { 'README.md': body } });
    const issues = validateBootstrap(root);
    assert.ok(
      issues.some((i) => i.includes(label)),
      `${label}: ${JSON.stringify(issues)}`,
    );
  }
});

test('a README that reintroduces a superseded stage claim, published-website claim or pinned commit is refused', () => {
  const cases = [
    ['not implemented yet', `${VALID_README}\nThe Uno runtime is not implemented yet.\n`],
    ['projected Page header', `${VALID_README}\nThe projected Page header is authoritative.\n`],
    ['exactly one public Site', `${VALID_README}\nA1 permits exactly one public Site.\n`],
    ['U01 remains open', `${VALID_README}\nU01 remains open\n`],
    ['published website', `${VALID_README}\nThis is a published website.\n`],
    ['pinned commit', `${VALID_README}\nStart at 2a815c2.\n`],
  ];
  for (const [label, body] of cases) {
    const root = makeFixture(`readme-stale-${label.replace(/[^a-z0-9]+/gi, '-')}`, {
      override: { 'README.md': body },
    });
    const issues = validateBootstrap(root);
    assert.ok(
      issues.length > 0 && issues.some((i) => i.startsWith('README.md')),
      `${label}: ${JSON.stringify(issues)}`,
    );
  }
});

test('a missing AGENTS.md is refused', () => {
  const root = makeFixture('no-agents', { omit: ['AGENTS.md'] });
  const issues = validateBootstrap(root);
  assert.ok(issues.some((i) => i.includes('AGENTS.md')), JSON.stringify(issues));
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
      'README.md': `${VALID_README}\nExample token: ${sampleToken}\n`,
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
      'README.md': `${VALID_README}\nLocal path: ${privatePath}\n`,
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

test('a missing local implementation SOP is refused', () => {
  const root = makeFixture('no-sop', { omit: ['.documents/SOP/sop-implementation.md'] });
  const issues = validateBootstrap(root);
  assert.ok(
    issues.some((i) => i.includes('sop-implementation.md')),
    `expected a missing-SOP diagnostic, got: ${JSON.stringify(issues)}`,
  );
});

test('an over-broad .gitignore that screens the whole WIP directory is refused', () => {
  const root = makeFixture('wip-dir-ignored', {
    override: {
      '.gitignore': '/.documents/WIP/workorder-active.md\n/.documents/WIP/\n/.temp/\n',
    },
  });
  const issues = validateBootstrap(root);
  assert.ok(
    issues.some((i) => i.includes('entire .documents/WIP directory must not be ignored')),
    `expected a whole-directory ignore refusal, got: ${JSON.stringify(issues)}`,
  );
});

test('plans can be reorganized without an order or fixed slots', () => {
  const root = makeFixture('flexible-plans', {
    omit: ['.documents/WIP/plan-roadmap.md'],
    extra: { '.documents/WIP/design/plan-execution.md': '# Plan' },
  });
  assert.deepEqual(validateBootstrap(root), []);
  write(join(root, '.documents/WIP/design/plan-execution.md'), 'C:/Users/someone/private');
  assert.ok(validateBootstrap(root).some((issue) => issue.includes('private path')));
});
