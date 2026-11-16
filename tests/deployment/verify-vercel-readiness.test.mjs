import assert from 'node:assert/strict';
import test from 'node:test';

import {
  PASS_MARKER,
  REASONS,
  SNAPSHOT_KEYS,
  analyzeReadiness,
  formatResult,
} from '../../scripts/verify-vercel-readiness.mjs';

/**
 * Foundation Uno — offline Vercel readiness fixtures (UNO-WO-012 / R02).
 *
 * Every fixture here is an in-memory string map. Nothing in this file reads the repository,
 * touches the network, consults the environment or invokes a provider tool. The point is to
 * prove the analyser REFUSES the specific ways a "deployment-ready" claim can be false, so a
 * green run cannot be the product of an always-true scanner.
 */

const SOURCE_URL = 'https://github.com/provelopment/provelopment-foundation-uno';

/** A complete, honest snapshot: the shape an accepted revision must have. */
function validSnapshot() {
  const packageJson = JSON.stringify(
    {
      name: 'provelopment-foundation-uno',
      version: '0.1.0',
      private: true,
      license: 'Apache-2.0',
      description: 'Foundation Uno — English informational demonstration.',
      packageManager: 'pnpm@11.6.0',
      engines: { node: '24.x' },
      scripts: {
        build: 'next build',
        'test:http': 'node scripts/verify-u01-http.mjs',
      },
      dependencies: { next: '16.4.2', react: '19.2.9', 'react-dom': '19.2.9' },
      devDependencies: { typescript: '5.9.3', vitest: '4.1.12' },
    },
    null,
    2,
  );

  const lockfile = "lockfileVersion: '9.0'\n\nsettings:\n  autoInstallPeers: true\n";
  const nextConfig = "const nextConfig = { devIndicators: false };\nexport default nextConfig;\n";

  const page = [
    '<div className="uno-page">',
    '  <h1>Foundation Uno — a single-Entity website foundation</h1>',
    '  <p className="uno-note">English demonstration — full authored Site publication is not yet enabled.</p>',
    `  <a href="${SOURCE_URL}">Read the Foundation Uno repository on GitHub</a>`,
    '</div>',
    '',
  ].join('\n');

  const layout = [
    'export const metadata = {',
    "  title: 'Foundation Uno — a single-Entity website foundation',",
    "  description: 'English demonstration of Foundation Uno, an independent Apache-2.0 Next.js foundation.',",
    '  robots: { index: false, follow: false, nocache: true },',
    '};',
    '',
    'export default function RootLayout({ children }) {',
    '  return (<html lang="en"><body>{children}</body></html>);',
    '}',
    '',
  ].join('\n');

  const gitignore = [
    '# private authority',
    '/.documents/WIP/workorder-active.md',
    '/.temp/',
    '/.vercel/',
    '/.next/',
    '/node_modules/',
    '.env',
    '.env.*',
    '',
  ].join('\n');

  const vercelignore = [
    '# upload exclusion',
    '.documents/',
    '.temp/',
    '.git/',
    '.vercel/',
    '.env',
    '.env.*',
    'node_modules/',
    '.next/',
    '',
  ].join('\n');

  const u01Workflow = [
    'name: Verify U01 baseline',
    'on:',
    '  push:',
    '    branches: [main]',
    'permissions:',
    '  contents: read',
    'jobs:',
    '  verify:',
    '    runs-on: ${{ matrix.os }}',
    '    strategy:',
    '      matrix:',
    '        os: [ubuntu-24.04, windows-2025]',
    '    steps:',
    '      - name: Governance',
    '        run: node scripts/verify-governance-docs.mjs',
    '      - name: Install (frozen lockfile)',
    '        run: pnpm install --frozen-lockfile --ignore-scripts',
    '      - name: Bootstrap governance gate',
    '        run: pnpm test:bootstrap',
    '      - name: Architecture boundaries',
    '        run: pnpm test:architecture',
    '      - name: Lint',
    '        run: pnpm lint',
    '      - name: Typecheck',
    '        run: pnpm typecheck',
    '      - name: Unit tests',
    '        run: pnpm test',
    '      - name: Production build',
    '        run: pnpm build',
    '      - name: Production HTTP (English demonstration)',
    '        run: pnpm test:http',
    '      - name: Deployment readiness fixtures',
    '        run: node --test tests/deployment/verify-vercel-readiness.test.mjs',
    '      - name: Deployment readiness (offline)',
    '        run: node scripts/verify-vercel-readiness.mjs',
    '',
  ].join('\n');

  return {
    packageJson,
    lockfile,
    nextConfig,
    page,
    layout,
    gitignore,
    vercelignore,
    u01Workflow,
  };
}

/** Apply one mutation to a copy of the valid snapshot. */
function withChange(key, mutate) {
  const snapshot = { ...validSnapshot() };
  snapshot[key] = mutate(snapshot[key]);
  return snapshot;
}

test('the fixture covers exactly the snapshot contract and is accepted', () => {
  const snapshot = validSnapshot();
  assert.deepEqual(Object.keys(snapshot).sort(), [...SNAPSHOT_KEYS].sort());
  const result = analyzeReadiness(snapshot);
  assert.equal(result.accepted, true);
  assert.deepEqual(result.reasons, []);
  assert.equal(result.failed, 0);
  assert.equal(result.checks >= 60, true, 'the positive path must execute the full check set');
});

test('refuses unparseable package metadata', () => {
  assertRefused(analyzeReadiness(withChange('packageJson', (text) => `${text.slice(0, 40)}`)), 'package:malformed');
});

test('refuses a package that is not private', () => {
  const snapshot = withChange('packageJson', (text) => text.replace('"private": true', '"private": false'));
  assertRefused(analyzeReadiness(snapshot), 'package:private');
});

test('refuses an unsupported Node major', () => {
  const snapshot = withChange('packageJson', (text) => text.replace('"node": "24.x"', '"node": "20.x"'));
  assertRefused(analyzeReadiness(snapshot), 'package:engines-node');
});

test('refuses a package manager other than the pinned pnpm', () => {
  const snapshot = withChange('packageJson', (text) => text.replace('pnpm@11.6.0', 'pnpm@10.4.0'));
  assertRefused(analyzeReadiness(snapshot), 'package:package-manager');
});

test('refuses a drifted Next.js pin', () => {
  const snapshot = withChange('packageJson', (text) => text.replace('"next": "16.4.2"', '"next": "16.3.0"'));
  assertRefused(analyzeReadiness(snapshot), 'package:next-version');
});

test('refuses an unpinned direct dependency', () => {
  const snapshot = withChange('packageJson', (text) => text.replace('"typescript": "5.9.3"', '"typescript": "^5.9.3"'));
  assertRefused(analyzeReadiness(snapshot), 'package:unpinned-dependency');
});

test('refuses a dropped production HTTP script', () => {
  const snapshot = withChange('packageJson', (text) =>
    text.replace('"test:http": "node scripts/verify-u01-http.mjs"', '"test:http": "echo skipped"'),
  );
  assertRefused(analyzeReadiness(snapshot), 'package:http-script');
});

test('refuses a missing lockfile', () => {
  const result = analyzeReadiness(withChange('lockfile', () => ''));
  assert.equal(result.accepted, false);
  assert.deepEqual(result.reasons, ['lockfile:missing', 'lockfile:no-lockfile-version']);
});

test('refuses a lockfile without a lockfileVersion', () => {
  assertRefused(
    analyzeReadiness(withChange('lockfile', () => 'packages: {}\n')),
    'lockfile:no-lockfile-version',
  );
});

test('refuses a static export configuration', () => {
  const snapshot = withChange('nextConfig', () => "const nextConfig = { output: 'export' };\nexport default nextConfig;\n");
  assertRefused(analyzeReadiness(snapshot), 'next-config:static-export');
});

test('refuses suppressed type errors', () => {
  const snapshot = withChange(
    'nextConfig',
    () => 'const nextConfig = { typescript: { ignoreBuildErrors: true } };\nexport default nextConfig;\n',
  );
  assertRefused(analyzeReadiness(snapshot), 'next-config:ignored-build-errors');
});

test('refuses the superseded placeholder page', () => {
  const snapshot = withChange('page', (text) => `${text}<!-- this is a technical placeholder -->\n`);
  assertRefused(analyzeReadiness(snapshot), 'page:obsolete-placeholder');
});

test('refuses a page without a real heading', () => {
  const snapshot = withChange('page', (text) => text.replace('<h1>', '<h2>').replace('</h1>', '</h2>'));
  assertRefused(analyzeReadiness(snapshot), 'page:missing-heading');
});

test('refuses a page that drops the English demonstration disclosure', () => {
  const snapshot = withChange('page', (text) => text.replace('English demonstration', 'Welcome'));
  assertRefused(analyzeReadiness(snapshot), 'page:missing-disclosure');
});

test('refuses a page that loses the single approved source link', () => {
  const snapshot = withChange('page', (text) => text.split(SOURCE_URL).join('https://example.invalid/uno'));
  const result = analyzeReadiness(snapshot);
  assert.equal(result.accepted, false);
  assert.deepEqual(result.reasons, ['page:source-link']);
});

test('refuses an extra external URL on the page', () => {
  const snapshot = withChange('page', (text) => `${text}<script src="https://cdn.example.invalid/x.js"></script>\n`);
  assertRefused(analyzeReadiness(snapshot), 'page:unauthorized-external-url');
});

test('refuses a fabricated publication claim on the page', () => {
  const snapshot = withChange('page', (text) => `${text}<p>PUBLIC_PREVIEW_READY</p>\n`);
  assertRefused(analyzeReadiness(snapshot), 'page:fabricated-publication');
});

test('refuses a missing language guard', () => {
  assertRefused(analyzeReadiness(withChange('layout', (text) => text.replace('lang="en"', 'lang="en-US"'))), 'layout:lang');
});

test('refuses a weakened noindex guard', () => {
  assertRefused(analyzeReadiness(withChange('layout', (text) => text.replace('index: false', 'index: true'))), 'layout:index-guard');
});

test('refuses a weakened nofollow guard', () => {
  assertRefused(analyzeReadiness(withChange('layout', (text) => text.replace('follow: false', 'follow: true'))), 'layout:follow-guard');
});

test('refuses a missing nocache guard', () => {
  const snapshot = withChange('layout', (text) => text.replace(', nocache: true', ''));
  assertRefused(analyzeReadiness(snapshot), 'layout:nocache-guard');
});

test('refuses an invented canonical or hreflang alternate', () => {
  const snapshot = withChange('layout', (text) => text.replace('  robots:', "  alternates: { canonical: '/' },\n  robots:"));
  assertRefused(analyzeReadiness(snapshot), 'layout:canonical-or-hreflang');
});

test('refuses a gitignore that would publish the private ACTIVE order', () => {
  const snapshot = withChange('gitignore', (text) => text.split('/.documents/WIP/workorder-active.md\n').join(''));
  assertRefused(analyzeReadiness(snapshot), 'gitignore:active-order');
});

test('refuses an upload exclusion that drops the documents tree', () => {
  const snapshot = withChange('vercelignore', (text) => text.split('.documents/\n').join(''));
  assertRefused(analyzeReadiness(snapshot), 'vercelignore:documents');
});

test('refuses a match-all upload exclusion', () => {
  const snapshot = withChange('vercelignore', (text) => `${text}*\n`);
  assertRefused(analyzeReadiness(snapshot), 'vercelignore:overbroad-match-all');
});

test('refuses an upload exclusion that hides the build inputs', () => {
  const snapshot = withChange('vercelignore', (text) => `${text}src/\n`);
  assertRefused(analyzeReadiness(snapshot), 'vercelignore:overbroad-source');
});

test('refuses redirect or rewrite rules in the deployment configuration', () => {
  const snapshot = withChange(
    'nextConfig',
    () => 'const nextConfig = { async redirects() { return []; }, redirects: [] };\nexport default nextConfig;\n',
  );
  assertRefused(analyzeReadiness(snapshot), 'next-config:redirects-or-rewrites');
});

test('refuses a provider deployment command inside CI', () => {
  const snapshot = withChange('u01Workflow', (text) => `${text}      - name: Deploy\n        run: npx vercel deploy --prod\n`);
  assertRefused(analyzeReadiness(snapshot), 'workflow:provider-command');
});

test('refuses a credential reference inside CI', () => {
  const snapshot = withChange('u01Workflow', (text) => `${text}    env:\n      TOKEN: \${{ secrets.VERCEL_TOKEN }}\n`);
  assertRefused(analyzeReadiness(snapshot), 'workflow:secret-reference');
});

test('refuses a softened workflow that tolerates failure', () => {
  const snapshot = withChange('u01Workflow', (text) => `${text}        continue-on-error: true\n`);
  assertRefused(analyzeReadiness(snapshot), 'workflow:bypass');
});

test('refuses the stale technical-placeholder HTTP step label', () => {
  const snapshot = withChange('u01Workflow', (text) =>
    text.replace('Production HTTP (English demonstration)', 'Run production HTTP (technical placeholder)'),
  );
  assertRefused(analyzeReadiness(snapshot), 'workflow:stale-http-label');
});

test('refuses a dropped production HTTP gate', () => {
  const snapshot = withChange('u01Workflow', (text) => text.split('        run: pnpm test:http\n').join(''));
  assertRefused(analyzeReadiness(snapshot), 'workflow:no-http');
});

test('refuses a dropped deployment-readiness gate', () => {
  const snapshot = withChange('u01Workflow', (text) =>
    text.split('        run: node scripts/verify-vercel-readiness.mjs\n').join(''),
  );
  assertRefused(analyzeReadiness(snapshot), 'workflow:no-readiness-cli');
});

test('refuses a single-host matrix', () => {
  const snapshot = withChange('u01Workflow', (text) =>
    text.replace('os: [ubuntu-24.04, windows-2025]', 'os: [ubuntu-24.04]'),
  );
  assertRefused(analyzeReadiness(snapshot), 'workflow:no-two-host-matrix');
});

test('refuses expanded workflow permissions', () => {
  const snapshot = withChange('u01Workflow', (text) => text.replace('contents: read', 'contents: write'));
  assertRefused(analyzeReadiness(snapshot), 'workflow:permissions');
});

test('refuses a hostile accessor snapshot without invoking it', () => {
  const snapshot = validSnapshot();
  let invoked = 0;
  Object.defineProperty(snapshot, 'page', {
    enumerable: true,
    get() {
      invoked += 1;
      return '<h1>Foundation Uno — a single-Entity website foundation</h1>';
    },
  });
  const result = analyzeReadiness(snapshot);
  assert.equal(result.accepted, false);
  assert.deepEqual(result.reasons, ['snapshot:malformed']);
  assert.equal(invoked, 0, 'the analyser must never run a caller-supplied getter');
});

test('refuses a snapshot whose property trap throws', () => {
  const hostile = new Proxy(
    {},
    {
      getOwnPropertyDescriptor() {
        throw new Error('HOSTILE-LEAK-TOKEN');
      },
    },
  );
  const result = analyzeReadiness(hostile);
  assert.equal(result.accepted, false);
  assert.deepEqual(result.reasons, ['snapshot:malformed']);
  assert.equal(JSON.stringify(result).includes('HOSTILE-LEAK-TOKEN'), false);
});

test('refuses a snapshot with a non-string field', () => {
  const snapshot = validSnapshot();
  snapshot.packageJson = 42;
  assertRefused(analyzeReadiness(snapshot), 'snapshot:malformed');
});

test('refuses a snapshot with a missing field', () => {
  const snapshot = validSnapshot();
  delete snapshot.lockfile;
  assertRefused(analyzeReadiness(snapshot), 'snapshot:missing-field');
});

test('refuses a null snapshot', () => {
  assertRefused(analyzeReadiness(null), 'snapshot:malformed');
});

test('never echoes fixture text into a refusal', () => {
  const snapshot = withChange('layout', (text) => text.replace('lang="en"', 'lang="HOSTILE-LEAK-TOKEN"'));
  const result = analyzeReadiness(snapshot);
  assert.equal(result.accepted, false);
  assert.deepEqual(result.reasons, ['layout:lang']);
  assert.equal(JSON.stringify(result).includes('HOSTILE-LEAK-TOKEN'), false);
  for (const reason of result.reasons) assert.equal(REASONS.includes(reason), true);
});

test('reports only closed reason codes', () => {
  const refusals = [
    withChange('packageJson', () => 'not-json'),
    withChange('layout', (text) => text.replace('lang="en"', 'lang="fr"')),
    withChange('gitignore', () => ''),
    { ...validSnapshot(), page: '' },
  ];
  for (const snapshot of refusals) {
    const result = analyzeReadiness(snapshot);
    assert.equal(result.accepted, false);
    for (const reason of result.reasons) {
      assert.equal(typeof reason, 'string');
      assert.equal(REASONS.includes(reason), true, `undeclared reason code ${reason}`);
    }
  }
});

test('formats a deterministic verdict without a deployed claim', () => {
  const accepted = formatResult(analyzeReadiness(validSnapshot()));
  assert.equal(accepted.includes('verify-vercel-readiness: PASS'), true);
  assert.equal(accepted.includes('VERCEL_NOT_DEPLOYED_BY_AGENT'), true);
  assert.equal(accepted.includes('PUBLIC_PREVIEW_READY'), false);
  assert.equal(PASS_MARKER.includes('VERCEL_NOT_DEPLOYED_BY_AGENT'), true);

  const refused = formatResult(analyzeReadiness(withChange('lockfile', () => '')));
  assert.equal(refused.includes('verify-vercel-readiness: FAIL'), true);
  assert.equal(refused.includes('  - lockfile:missing'), true);
  assert.equal(refused.includes('VERCEL_DEPLOYED'), false);
});

/** Every refusal must be a non-vacuous `accepted: false` carrying the specific code. */
function assertRefused(result, code) {
  assert.equal(result.accepted, false, `expected refusal ${code}`);
  assert.equal(result.failed > 0, true, 'a refusal must report at least one failure');
  assert.deepEqual(result.reasons, [code]);
  assert.equal(result.checks > 0, true, 'a refusal must be the product of executed checks');
}
