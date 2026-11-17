import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
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
      engines: { node: '26.x' },
      scripts: {
        build: 'next build',
        'test:http': 'node scripts/verify-u01-http.mjs',
      },
      dependencies: {
        '@vercel/analytics': '2.0.1',
        next: '16.4.2',
        react: '19.2.9',
        'react-dom': '19.2.9',
      },
      devDependencies: { typescript: '5.9.3', vitest: '4.1.12', playwright: '1.65.1' },
    },
    null,
    2,
  );

  const lockfile = "lockfileVersion: '9.0'\n\nsettings:\n  autoInstallPeers: true\n";
  const nextConfig = [
    "const UNO_DEPLOYMENT_INPUTS = [",
    "  './deployment/efs/manifest.json',",
    "  './deployment/uno.config.json',",
    "  './deployment/efs/content/**/*.md',",
    "  './deployment/efs/content/**/*.json',",
    "];",
    '',
    'const nextConfig = {',
    '  devIndicators: false,',
    '  experimental: {',
    '    globalNotFound: true,',
    '  },',
    '  outputFileTracingIncludes: {',
    "    '/[locale]/[[...segments]]': UNO_DEPLOYMENT_INPUTS,",
    "    '/sitemap.xml': UNO_DEPLOYMENT_INPUTS,",
    "    '/robots.txt': UNO_DEPLOYMENT_INPUTS,",
    '  },',
    '};',
    '',
    'export default nextConfig;',
    '',
  ].join("\n");

  const page = [
    '<div className="uno-page">',
    '  <p className="uno-brand">',
    '    <Image className="uno-brand__mark" src="/uno-logo.svg" alt="Foundation Uno" width={30} height={30} unoptimized />',
    '    <span className="uno-brand__name">Foundation Uno</span>',
    '  </p>',
    '  <h1>One organisation. One connected digital presence.</h1>',
    '  <h3>Example: a community organisation</h3>',
    '  <h3>Example: a service provider with regional audiences</h3>',
    '  <p>Foundation Uno will bring an organisation&apos;s websites, information and regional editions into one coherent publishing foundation.</p>',
    '  <p>This is the live single-page introduction to Foundation Uno. The examples below illustrate the experience.</p>',
    '  <p>© 2026 Provelopment. Foundation Uno is an open-source website foundation and a Provelopment initiative.</p>',
    '  <a href={SOURCE_URL}>Explore the open-source project</a>',
    '  <a href={SOURCE_URL}>View Foundation Uno on GitHub</a>',
    `  const SOURCE_URL = '${SOURCE_URL}';`,
    '</div>',
    '',
  ].join('\n');

  // The approved vector cannot be synthesised: its SHA-256 and byte length are the contract, so
  // the positive snapshot carries the committed artifact and every negative mutates a copy of it.
  const logoSvg = readFileSync(new URL('../../public/uno-logo.svg', import.meta.url), 'utf8');

  const layout = [
    "import { Analytics } from '@vercel/analytics/next';",
    'export const metadata = {',
    "  title: 'Foundation Uno | One organisation. One connected digital presence.',",
    "  description: 'Foundation Uno by Provelopment will give organisations clear ownership, structured content, reliable publishing and intentionally authored regional editions.',",
    '  robots: { index: false, follow: false, nocache: true },',
    '};',
    '',
    'export default function RootLayout({ children }) {',
    '  return (<html lang="en"><body>{children}<Analytics /></body></html>);',
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
    "      - name: Set up Node 26",
    '        with:',
    "          node-version: '26'",
    '      - name: Governance',
    '        run: node scripts/verify-governance-docs.mjs',
    '      - name: Install (frozen lockfile)',
    '        run: pnpm install --frozen-lockfile --ignore-scripts',
    '      - name: Install pinned headless Chromium (test-only, repo-local)',
    '        run: pnpm exec playwright install --only-shell chromium',
    '        env:',
    '          PLAYWRIGHT_BROWSERS_PATH: .temp/uno-u03-browsers',
    '      - name: Node 26 and dependency security floors',
    '        run: node --test tests/deployment/node26-security-floor.test.mjs',
    '      - name: Brand and copy contract',
    '        run: node --test tests/deployment/uno-brand-copy.test.mjs',
    '      - name: Dependency audit (high and critical must be zero)',
    '        run: pnpm audit --audit-level high',
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
    '      - name: Bounded output tracing (committed build)',
    '        run: node scripts/verify-u03-trace.mjs --expect committed',
    '      - name: Production HTTP (English demonstration)',
    '        run: pnpm test:http',
    '      - name: Production HTTP and browser (U03 published Pages, restored afterwards)',
    '        run: node scripts/verify-u03-published-http.mjs',
    '        env:',
    '          PLAYWRIGHT_BROWSERS_PATH: .temp/uno-u03-browsers',
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
    logo: logoSvg,
    icon: logoSvg,
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

/** Mutate the header mark and the favicon together, as an asset revision would. */
function withAssets(mutate) {
  const snapshot = { ...validSnapshot() };
  snapshot.logo = mutate(snapshot.logo);
  snapshot.icon = mutate(snapshot.icon);
  return snapshot;
}

test('the fixture covers exactly the snapshot contract and is accepted', () => {
  const snapshot = validSnapshot();
  assert.deepEqual(Object.keys(snapshot).sort(), [...SNAPSHOT_KEYS].sort());
  const result = analyzeReadiness(snapshot);
  assert.equal(result.accepted, true, JSON.stringify(result.reasons));
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
  const snapshot = withChange('packageJson', (text) => text.replace('"node": "26.x"', '"node": "24.x"'));
  assertRefused(analyzeReadiness(snapshot), 'package:engines-node');
});

test('refuses a drifted analytics pin', () => {
  const snapshot = withChange('packageJson', (text) =>
    text.replace('"@vercel/analytics": "2.0.1"', '"@vercel/analytics": "1.6.1"'),
  );
  assertRefused(analyzeReadiness(snapshot), 'package:analytics-version');
});

test('refuses a second, unapproved provider package', () => {
  const snapshot = withChange('packageJson', (text) =>
    text.replace('"@vercel/analytics": "2.0.1",', '"@vercel/analytics": "2.0.1",\n    "@vercel/speed-insights": "2.0.0",'),
  );
  assertRefused(analyzeReadiness(snapshot), 'package:unapproved-provider');
});

test('refuses a layout without the approved analytics integration', () => {
  const snapshot = withChange('layout', (text) =>
    text
      .replace("import { Analytics } from '@vercel/analytics/next';\n", '')
      .replace('<Analytics />', ''),
  );
  assertRefused(analyzeReadiness(snapshot), 'layout:analytics-missing');
});

test('refuses a duplicated analytics render', () => {
  const snapshot = withChange('layout', (text) => text.replace('<Analytics />', '<Analytics /><Analytics />'));
  assertRefused(analyzeReadiness(snapshot), 'layout:analytics-duplicate');
});

test('refuses an unapproved provider module in the layout', () => {
  const snapshot = withChange('layout', (text) =>
    text.replace(
      "import { Analytics } from '@vercel/analytics/next';",
      "import { Analytics } from '@vercel/analytics/next';\nimport { SpeedInsights } from '@vercel/speed-insights/next';",
    ),
  );
  assertRefused(analyzeReadiness(snapshot), 'layout:unapproved-provider');
});

test('refuses a workflow that is not pinned to Node 26', () => {
  const snapshot = withChange('u01Workflow', (text) => text.replace("node-version: '26'", "node-version: '24'"));
  assertRefused(analyzeReadiness(snapshot), 'workflow:no-node26');
});

test('refuses a workflow without the security-floor or audit gate', () => {
  const noFloor = withChange('u01Workflow', (text) =>
    text.replace('node --test tests/deployment/node26-security-floor.test.mjs', 'echo skipped'),
  );
  assertRefused(analyzeReadiness(noFloor), 'workflow:no-security-floor');

  const noAudit = withChange('u01Workflow', (text) =>
    text.replace('pnpm audit --audit-level high', 'echo audit-skipped'),
  );
  assertRefused(analyzeReadiness(noAudit), 'workflow:no-audit-gate');
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
  const snapshot = withChange('nextConfig', (text) => text.replace('devIndicators: false,', "output: 'export',\n  devIndicators: false,"));
  assertRefused(analyzeReadiness(snapshot), 'next-config:static-export');
});

test('refuses suppressed type errors', () => {
  const snapshot = withChange('nextConfig', (text) =>
    text.replace('devIndicators: false,', 'devIndicators: false,\n  typescript: { ignoreBuildErrors: true },'),
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

test('refuses a page that drops the live single-page disclosure', () => {
  const snapshot = withChange('page', (text) =>
    text.replace('This is the live single-page introduction to Foundation Uno.', 'Welcome.'),
  );
  assertRefused(analyzeReadiness(snapshot), 'page:missing-disclosure');
});

test('refuses a page that loses the approved source anchors', () => {
  const snapshot = withChange('page', (text) => text.replaceAll('href={SOURCE_URL}', 'href="/local"'));
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
  const snapshot = withChange('nextConfig', (text) =>
    text.replace('devIndicators: false,', 'devIndicators: false,\n  redirects: [],'),
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

// --- UNO-WO-015 / R01: copy and brand regressions ------------------------------------

test('refuses a retired status claim in the page copy', () => {
  const snapshot = withChange('page', (text) => `${text}<p>This page is not deployed.</p>\n`);
  assertRefused(analyzeReadiness(snapshot), 'page:retired-claim');
});

test('refuses a drifted hero heading', () => {
  const snapshot = withChange('page', (text) =>
    text.replace(
      '<h1>One organisation. One connected digital presence.</h1>',
      '<h1>Foundation Uno — a single-Entity website foundation</h1>',
    ),
  );
  assertRefused(analyzeReadiness(snapshot), 'page:hero-heading');
});

test('refuses a missing brand mark in the header', () => {
  const snapshot = withChange('page', (text) => text.replace('src="/uno-logo.svg"', 'src="/logo.png"'));
  assertRefused(analyzeReadiness(snapshot), 'page:brand-mark');
});

test('refuses a logo carrying active content', () => {
  const snapshot = withAssets((text) => text.replace('</svg>', '<script>alert(1)</script></svg>'));
  const result = analyzeReadiness(snapshot);
  assert.equal(result.accepted, false);
  assert.equal(result.reasons.includes('brand:logo-unsafe'), true, 'brand:logo-unsafe');
});

test('refuses a favicon that is not byte-identical to the header mark', () => {
  const snapshot = withChange('icon', (text) => text.replaceAll('2048', '2049'));
  assertRefused(analyzeReadiness(snapshot), 'brand:favicon-parity');
});

test('refuses a logo without the approved palette', () => {
  const snapshot = withAssets((text) => text.replaceAll('#1f6f6b', '#ff0000'));
  const result = analyzeReadiness(snapshot);
  assert.equal(result.accepted, false);
  assert.equal(result.reasons.includes('brand:logo-palette'), true, 'brand:logo-palette');
});

test('refuses a page claiming the EFS content runtime is live', () => {
  const snapshot = withChange('page', (text) =>
    text.replace(
      '<p>This is the live single-page introduction to Foundation Uno.',
      '<p>EFS publication is live and locale routes are live.<p>This is the live single-page introduction to Foundation Uno.',
    ),
  );
  assertRefused(analyzeReadiness(snapshot), 'page:fabricated-publication');
});

test('refuses a workflow without the blocking brand and copy step', () => {
  const snapshot = withChange('u01Workflow', (text) =>
    text.replace('node --test tests/deployment/uno-brand-copy.test.mjs', 'echo skipped'),
  );
  assertRefused(analyzeReadiness(snapshot), 'workflow:no-brand-test');
});

// --- UNO-WO-032 / R01: the test-only browser proof must not be lost or bypassed ----------

test('refuses a workflow without the hermetic browser install step', () => {
  const snapshot = withChange('u01Workflow', (text) =>
    text.replace('pnpm exec playwright install --only-shell chromium', 'echo skipped'),
  );
  assertRefused(analyzeReadiness(snapshot), 'workflow:no-browser-install');
});

test('refuses a browser install that escapes the repository-local path', () => {
  const snapshot = withChange('u01Workflow', (text) =>
    text
      .replace('PLAYWRIGHT_BROWSERS_PATH: .temp/uno-u03-browsers', 'PLAYWRIGHT_BROWSERS_PATH: ~/.cache/ms-playwright')
      .replace('PLAYWRIGHT_BROWSERS_PATH: .temp/uno-u03-browsers', 'PLAYWRIGHT_BROWSERS_PATH: ~/.cache/ms-playwright'),
  );
  assertRefused(analyzeReadiness(snapshot), 'workflow:no-browser-path');
});

test('refuses a browser proof that is no longer driven by the publication runner', () => {
  const snapshot = withChange('u01Workflow', (text) =>
    text.replace('run: node scripts/verify-u03-published-http.mjs', 'run: echo skipped'),
  );
  assertRefused(analyzeReadiness(snapshot), 'workflow:no-browser-runner');
});

test('refuses a browser install that would write OS packages outside Uno', () => {
  const snapshot = withChange('u01Workflow', (text) =>
    `${text}      - name: Extra\\n        run: pnpm exec playwright install --with-deps chromium\\n`,
  );
  assertRefused(analyzeReadiness(snapshot), 'workflow:browser-system-deps');
});

test('refuses Playwright promoted into the production dependency set', () => {
  const snapshot = withChange('packageJson', (text) =>
    text.replace('"react": "19.2.9",', '"react": "19.2.9",\n    "playwright": "1.65.1",'),
  );
  assertRefused(analyzeReadiness(snapshot), 'package:playwright-not-dev-only');
});

test('refuses a drifted Playwright pin', () => {
  // A different but still pinned version: only the pin itself is wrong, so the refusal stays single-coded.
  const snapshot = withChange('packageJson', (text) => text.replace('"playwright": "1.65.1"', '"playwright": "1.64.0"'));
  assertRefused(analyzeReadiness(snapshot), 'package:playwright-wrong-pin');
});

test('refuses an unpinned Playwright range', () => {
  const snapshot = withChange('packageJson', (text) => text.replace('"playwright": "1.65.1"', '"playwright": "^1.60.0"'));
  const result = analyzeReadiness(snapshot);
  assert.equal(result.accepted, false);
  assert.equal(result.reasons.includes('package:playwright-wrong-pin'), true, 'package:playwright-wrong-pin');
  assert.equal(result.reasons.includes('package:unpinned-dependency'), true, 'package:unpinned-dependency');
});

// --- UNO-WO-033 / R01: the bounded file-trace gate must not be lost or widened ------------

test('refuses a workflow without the blocking bounded-trace step', () => {
  const snapshot = withChange('u01Workflow', (text) =>
    text.replace('node scripts/verify-u03-trace.mjs --expect committed', 'echo skipped'),
  );
  assertRefused(analyzeReadiness(snapshot), 'workflow:no-trace-inspector');
});

test('refuses a next config that drops the bounded tracing includes', () => {
  const snapshot = withChange('nextConfig', (text) => text.replace('outputFileTracingIncludes:', 'someIncludeBlock:'));
  assertRefused(analyzeReadiness(snapshot), 'trace:no-includes');
});

test('refuses a next config that excludes traced files', () => {
  const snapshot = withChange('nextConfig', (text) =>
    text.replace('outputFileTracingIncludes: {', 'outputFileTracingExcludes: {},\n  outputFileTracingIncludes: {'),
  );
  assertRefused(analyzeReadiness(snapshot), 'trace:excludes');
});

test('refuses a tracing root override that would widen the payload', () => {
  const snapshot = withChange('nextConfig', (text) =>
    text.replace('devIndicators: false,', "outputFileTracingRoot: './',\n  devIndicators: false,"),
  );
  assertRefused(analyzeReadiness(snapshot), 'trace:root-override');
});

test('refuses a root-wide include glob inside the allowlist', () => {
  const snapshot = withChange('nextConfig', (text) =>
    text.replace("'./deployment/efs/manifest.json'", "'./**/*'"),
  );
  const result = analyzeReadiness(snapshot);
  assert.equal(result.accepted, false);
  assert.equal(result.reasons.includes('trace:include-allowlist'), true, 'trace:include-allowlist');
  assert.equal(result.reasons.includes('trace:root-wide-include'), true, 'trace:root-wide-include');
});


// --- UNO-WO-016 / R01: official vector and benefits-copy regressions -----------------

test('refuses a logo whose digest drifts by a single path coordinate', () => {
  const snapshot = withAssets((text) => text.replace('<path', '<path data-drift="1"'));
  const result = analyzeReadiness(snapshot);
  assert.equal(result.accepted, false);
  assert.equal(result.reasons.includes('brand:logo-digest'), true, 'brand:logo-digest');
});

test('refuses the superseded concept canvas', () => {
  const snapshot = withAssets((text) => text.replaceAll('0 0 2048 2048', '0 0 128 128'));
  const result = analyzeReadiness(snapshot);
  assert.equal(result.accepted, false);
  assert.equal(result.reasons.includes('brand:logo-viewbox'), true, 'brand:logo-viewbox');
});

test('refuses the withdrawn charcoal numeral', () => {
  const snapshot = withAssets((text) => text.replaceAll('#000000', '#36454f'));
  const result = analyzeReadiness(snapshot);
  assert.equal(result.accepted, false);
  assert.equal(result.reasons.includes('brand:logo-palette'), true, 'brand:logo-palette');
  assert.equal(result.reasons.includes('brand:logo-superseded'), true, 'brand:logo-superseded');
});

test('refuses the superseded concept numeral colour', () => {
  const snapshot = withAssets((text) => text.replaceAll('#000000', '#101620'));
  const result = analyzeReadiness(snapshot);
  assert.equal(result.accepted, false);
  assert.equal(result.reasons.includes('brand:logo-superseded'), true, 'brand:logo-superseded');
});

test('accepts the true-black numeral and keeps the official network', () => {
  const result = analyzeReadiness(validSnapshot());
  assert.equal(result.accepted, true, JSON.stringify(result.reasons));
  const logo = validSnapshot().logo;
  assert.equal(logo.includes('#1f6f6b'), true, 'green network retained');
  assert.equal(logo.includes('fill="#000000"'), true, 'true black numeral');
  assert.equal(logo.includes('#36454f'), false, 'charcoal withdrawn');
});

test('refuses a page that drops an illustrative example label', () => {
  const snapshot = withChange('page', (text) =>
    text.replace('Example: a community organisation', 'A community organisation'),
  );
  assertRefused(analyzeReadiness(snapshot), 'page:example-labels');
});

test('refuses a page whose benefit sentence is missing', () => {
  const snapshot = withChange('page', (text) =>
    text.replace('Foundation Uno will bring an organisation&apos;s websites', 'Foundation Uno brings websites'),
  );
  assertRefused(analyzeReadiness(snapshot), 'page:hero-lead');
});
test('refuses an unapproved experimental Next flag', () => {
  const snapshot = withChange('nextConfig', (text) =>
    text.replace('globalNotFound: true,', 'globalNotFound: true,\n    ppr: true,'),
  );
  assertRefused(analyzeReadiness(snapshot), 'next-config:unapproved-experimental-flag');
});

test('accepts only the approved global not-found flag', () => {
  const snapshot = withChange('nextConfig', (text) => text.replace('globalNotFound: true,', 'globalNotFound: true,'));
  assert.deepEqual(analyzeReadiness(snapshot).reasons, []);
});

test('the demonstration and its document live in the demo route group', () => {
  // `src/app` has two root layouts (`(demo)` and `(site)`), so the demonstration must be inside its group and the
  // superseded top-level paths must be gone. The snapshot is path-keyed, so this guard proves the real paths.
  const readiness = readFileSync(new URL('../../scripts/verify-vercel-readiness.mjs', import.meta.url), 'utf8');
  assert.equal(readiness.includes("page: 'src/app/(demo)/page.tsx'"), true);
  assert.equal(readiness.includes("layout: 'src/app/(demo)/layout.tsx'"), true);
  assert.equal(readiness.includes("page: 'src/app/page.tsx'"), false);
  assert.equal(readiness.includes("layout: 'src/app/layout.tsx'"), false);
});
