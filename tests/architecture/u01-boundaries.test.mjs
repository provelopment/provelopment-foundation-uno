import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

/**
 * Foundation Uno — U01 architecture boundary tests (Node-native, dependency-free).
 *
 * These tests scan only the authored U01 surfaces: `src/core/**`, `src/application/**`,
 * `src/app/**` and `package.json`. Historical documentation elsewhere in `.documents/**` is
 * deliberately NOT treated as active source, so upstream references recorded there cannot create a
 * false violation.
 *
 * The scanners are pure functions over a `{ path: content }` map so that a synthetic
 * negative fixture can prove the scanner actually refuses a violation instead of always
 * returning PASS.
 */

const ROOT = fileURLToPath(new URL('../..', import.meta.url));

/** Modules a framework-free `src/core` module must never import. */
export const CORE_FORBIDDEN_MODULES = Object.freeze([
  'next',
  'react',
  'react-dom',
  'node:fs',
  'node:child_process',
  'fs',
  'child_process',
]);

/** Markers that must never appear in the `src/app` placeholder layer. */
export const APP_FORBIDDEN_MARKERS = Object.freeze([
  'SpokeRuntimeContext',
  'spokeRuntime',
  'spokeMembership',
  'spokeSelector',
  'ownerSelector',
  'multiOwner',
  'modules/connect',
  'deployment/',
]);

/**
 * The ONE approved provider integration (`UNO-WO-014 / R01`).
 *
 * The previous rule refused the string `@vercel/analytics` anywhere in `src/app` and any such
 * dependency. That prohibition is now an exceptionally narrow allowlist rather than a broad
 * refusal, because the Owner approved exactly one official analytics integration. Everything the
 * old rule protected is still refused: any other provider, any other analytics entrypoint, any
 * second injection, any other module in the app tree, and any other `@vercel/*` package.
 */
export const APPROVED_ANALYTICS = Object.freeze({
  packageName: '@vercel/analytics',
  version: '2.0.1',
  specifier: '@vercel/analytics/next',
  placement: 'src/app/layout.tsx',
  renderMarker: '<Analytics',
});

/** Known third-party analytics/advertising packages that are never approved for Uno. */
export const UNAPPROVED_PROVIDER_PACKAGES = Object.freeze([
  '@vercel/speed-insights',
  'posthog-js',
  'plausible-tracker',
  'react-ga',
  'react-ga4',
  'matomo',
]);

/** Any `@vercel/*` module specifier, however it is written. */
const VERCEL_SPECIFIER_RE = /(?:from\s*|require\s*\(\s*|import\s*)['"](@vercel\/[^'"]+)['"]/g;

/**
 * Scan a `{ path: content }` map for analytics-integration violations.
 *
 * Refuses: any `@vercel/*` module other than the exact approved App Router entry, the approved
 * entry imported anywhere but the root layout, the approved import repeated, the component
 * rendered zero or more than once, and analytics imported by more than one module overall.
 */
export function scanAnalyticsUsage(files) {
  const violations = [];
  let placements = 0;

  for (const [path, content] of Object.entries(files)) {
    const normalised = path.split('\\').join('/');
    VERCEL_SPECIFIER_RE.lastIndex = 0;
    const specifiers = [];
    let match = VERCEL_SPECIFIER_RE.exec(content);
    while (match !== null) {
      specifiers.push(match[1]);
      match = VERCEL_SPECIFIER_RE.exec(content);
    }
    if (specifiers.length === 0) continue;

    placements += 1;
    for (const specifier of specifiers) {
      if (specifier !== APPROVED_ANALYTICS.specifier) {
        violations.push(`${normalised}: "${specifier}" is not the approved provider entry`);
      }
    }
    if (normalised !== APPROVED_ANALYTICS.placement) {
      violations.push(`${normalised}: provider code may only live in ${APPROVED_ANALYTICS.placement}`);
    }
    if (specifiers.length > 1) {
      violations.push(`${normalised}: the approved provider must be imported exactly once`);
    }
    const rendered = content.split(APPROVED_ANALYTICS.renderMarker).length - 1;
    if (rendered !== 1) {
      violations.push(`${normalised}: <Analytics /> must be rendered exactly once, found ${rendered}`);
    }
  }

  if (placements > 1) {
    violations.push(`analytics may be imported by exactly one module, found ${placements}`);
  }
  return violations;
}

/** Node 26 is the only supported runtime major: anything else is refused, never tolerated. */
export function nodeEngineIssue(parsed) {
  const engines = parsed !== null && typeof parsed === 'object' ? parsed.engines : undefined;
  const node = engines !== null && typeof engines === 'object' ? engines.node : undefined;
  return node === '26.x' ? null : 'package.json: engines.node must be exactly "26.x" (Node 26 LTS)';
}


/**
 * Modules an application use case must never import.
 *
 * `src/application/**` may depend on core contracts and on its own siblings; it is not allowed to
 * reach a framework, the Node filesystem/process/network surface, an adapter, `src/app/**`, the
 * deployment layer or a separately licensed module. Those belong behind an injected port.
 */
export const APPLICATION_FORBIDDEN_MODULES = Object.freeze([
  'next',
  'react',
  'react-dom',
  'node:fs',
  'node:fs/promises',
  'node:child_process',
  'node:net',
  'node:http',
  'node:https',
  'node:dns',
  'node:os',
  'node:worker_threads',
  'fs',
  'fs/promises',
  'child_process',
  'net',
  'http',
  'https',
  'dns',
  'worker_threads',
]);

/**
 * Legacy Foundation address/locale machinery that must never re-enter Uno `src/core` code.
 * Checked against CODE ONLY (comments stripped), so provenance prose such as "there is no
 * `/ww` segment" cannot create a false violation.
 */
export const LEGACY_ADDRESS_MARKERS = Object.freeze([
  '/ww/',
  'siteCode',
  'countryCode',
  'geoIp',
  'geo-ip',
  'acceptLanguagePrefix',
  'preferencePrefixMatch',
]);

/**
 * The exact authored Node adapters this repository declares (`UNO-WO-020 / R01`).
 *
 * An adapter is the ONLY place allowed to touch the real filesystem. It must never be imported by a
 * pure core contract or an application use case, and it must never pull a framework, a provider, the
 * app/router layer or the deployment layer into the process.
 */
export const ADAPTER_AUTHORED_FILES = Object.freeze([
  'src/adapters/efs/uno-confined-source-reader.ts',
]);

/** Modules a concrete Node adapter must never import. */
export const ADAPTER_FORBIDDEN_MODULES = Object.freeze([
  'next',
  'react',
  'react-dom',
  '@vercel/analytics',
  '@vercel/blob',
  '@vercel/kv',
]);

/**
 * Scan a `{ path: content }` map of concrete adapters for boundary violations.
 * @returns {string[]} one message per violation; empty means clean
 */
export function scanAdapters(files) {
  const violations = [];
  for (const [path, content] of Object.entries(files)) {
    const normalised = path.split('\\').join('/');
    for (const specifier of specifiersOf(content)) {
      if (specifier.startsWith('node:')) continue;
      const forbidden = ADAPTER_FORBIDDEN_MODULES.some(
        (name) => specifier === name || specifier.startsWith(`${name}/`),
      );
      const reachesAppOrDeployment =
        specifier.includes('/app/') ||
        specifier.startsWith('@/app') ||
        specifier.includes('deployment/') ||
        specifier.startsWith('@/deployment') ||
        specifier.includes('modules/connect');
      if (forbidden || reachesAppOrDeployment) {
        violations.push(`${normalised}: a Node adapter must not import "${specifier}"`);
      }
    }
  }
  return violations;
}

/** The exact authored `src/core` kernel this baseline declares. */
export const CORE_AUTHORED_FILES = Object.freeze([
  'src/core/efs/identity.ts',
  'src/core/efs/manifest-graph.ts',
  'src/core/efs/properties.ts',
  'src/core/efs/uno-config.ts',
  'src/core/efs/uno-route-address.ts',
  'src/core/efs/uno-page-header.ts',
  'src/core/efs/uno-discovery-policy.ts',
  'src/core/efs/uno-canonical-base.ts',
  'src/core/efs/uno-locales.ts',
  'src/core/modules/capability-registry.ts',
  'src/core/page-authoring-policy.ts',
  'src/core/page-content.ts',
  'src/core/page-route-path.ts',
  'src/core/safe-author-url.ts',
]);

/**
 * Strip block and line comments so marker scanning sees executable code only.
 * A lexical approximation, deliberately simple: this is a boundary test, not a parser.
 */
export function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .split('\n')
    .map((line) => line.replace(/(^|[^:])\/\/.*$/, '$1'))
    .join('\n');
}

const SPECIFIER_RE = /(?:from\s*|require\s*\(\s*|import\s*)['"]([^'"]+)['"]/g;

function specifiersOf(source) {
  const found = [];
  SPECIFIER_RE.lastIndex = 0;
  let match = SPECIFIER_RE.exec(source);
  while (match !== null) {
    found.push(match[1]);
    match = SPECIFIER_RE.exec(source);
  }
  return found;
}

function isForbiddenCoreSpecifier(specifier) {
  if (
    CORE_FORBIDDEN_MODULES.some((name) => specifier === name || specifier.startsWith(`${name}/`))
  ) {
    return true;
  }
  // A pure core module must not reach into a concrete adapter implementation.
  return specifier.includes('/adapters/') || specifier.startsWith('@/adapters');
}

/**
 * An application use case may import core contracts and sibling application modules only. It must
 * not import a framework, Node I/O, an adapter, the app/router layer, the deployment layer or the
 * separately licensed module tree.
 */
function isForbiddenApplicationSpecifier(specifier) {
  if (
    APPLICATION_FORBIDDEN_MODULES.some(
      (name) => specifier === name || specifier.startsWith(`${name}/`),
    )
  ) {
    return true;
  }
  return (
    specifier.includes('/adapters/') ||
    specifier.startsWith('@/adapters') ||
    specifier.includes('/app/') ||
    specifier.startsWith('@/app') ||
    specifier.includes('deployment/') ||
    specifier.startsWith('@/deployment') ||
    specifier.includes('modules/connect')
  );
}

/**
 * Scan a `{ path: content }` map for U01 boundary violations.
 * @returns {string[]} one message per violation; empty means clean
 */
export function scanSources(files) {
  const violations = [];
  for (const [path, content] of Object.entries(files)) {
    const normalised = path.split('\\').join('/');

    if (normalised.startsWith('src/core/')) {
      for (const specifier of specifiersOf(content)) {
        if (isForbiddenCoreSpecifier(specifier)) {
          violations.push(`${normalised}: src/core must stay pure but imports "${specifier}"`);
        }
      }
      const code = stripComments(content);
      for (const marker of LEGACY_ADDRESS_MARKERS) {
        if (code.includes(marker)) {
          violations.push(`${normalised}: src/core must not reintroduce legacy "${marker}"`);
        }
      }
    }

    if (normalised.startsWith('src/application/')) {
      for (const specifier of specifiersOf(content)) {
        if (isForbiddenApplicationSpecifier(specifier)) {
          violations.push(
            `${normalised}: src/application must stay adapter-free but imports "${specifier}"`,
          );
        }
      }
    }

    if (normalised.startsWith('src/app/')) {
      for (const marker of APP_FORBIDDEN_MARKERS) {
        if (content.includes(marker)) {
          violations.push(`${normalised}: the app layer must not reference "${marker}"`);
        }
      }
    }
  }
  return violations;
}

const PACKAGE_FORBIDDEN_MARKERS = Object.freeze([
  'modules/connect',
  'postinstall',
  'spoke',
  'provelopment-foundation.git',
  'provelopment-foundation#',
]);

// Assembled from fragments so this test file never contains a private absolute path itself.
const PRIVATE_PATH_RE = new RegExp(['[A-Za-z]:', '[\\\\/]{1,2}', 'Users', '[\\\\/]'].join(''));

/** Scan a package.json text for forbidden dependencies, scripts and remotes. */
export function scanPackageJson(raw) {
  const violations = [];
  const lower = raw.toLowerCase();
  for (const marker of PACKAGE_FORBIDDEN_MARKERS) {
    if (lower.includes(marker.toLowerCase())) {
      violations.push(`package.json must not contain "${marker}"`);
    }
  }
  if (PRIVATE_PATH_RE.test(raw)) {
    violations.push('package.json must not embed a private absolute path');
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [...violations, 'package.json must be valid JSON'];
  }

  const direct = { ...(parsed.dependencies ?? {}), ...(parsed.devDependencies ?? {}) };

  // The approved provider, narrowly: exactly this package at exactly this version, and no
  // other Vercel package or known analytics provider anywhere in the dependency set.
  const approvedAnalytics = direct[APPROVED_ANALYTICS.packageName];
  if (approvedAnalytics !== undefined && approvedAnalytics !== APPROVED_ANALYTICS.version) {
    violations.push(
      `package.json: ${APPROVED_ANALYTICS.packageName} must be exactly ${APPROVED_ANALYTICS.version}`,
    );
  }
  for (const name of Object.keys(direct)) {
    if (name.startsWith('@vercel/') && name !== APPROVED_ANALYTICS.packageName) {
      violations.push(`package.json: unapproved provider package "${name}"`);
    }
    if (UNAPPROVED_PROVIDER_PACKAGES.includes(name)) {
      violations.push(`package.json: unapproved analytics provider "${name}"`);
    }
  }

  for (const [name, range] of Object.entries(direct)) {
    // A direct dependency must pin an exact version: x.y.z, optionally with a prerelease tag.
    if (typeof range !== 'string' || !/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(range)) {
      violations.push(`package.json: direct dependency "${name}" must use an exact version`);
    }
  }
  return violations;
}

function readTree(dir, prefix) {
  const files = {};
  const walk = (absolute, relative) => {
    for (const entry of readdirSync(absolute)) {
      const abs = join(absolute, entry);
      const rel = `${relative}/${entry}`;
      if (statSync(abs).isDirectory()) walk(abs, rel);
      else files[rel] = readFileSync(abs, 'utf8');
    }
  };
  walk(resolve(ROOT, dir), prefix);
  return files;
}

const authoredSources = () => ({
  ...readTree('src/core', 'src/core'),
  ...readTree('src/application', 'src/application'),
  ...readTree('src/app', 'src/app'),
});
const packageJson = () => readFileSync(resolve(ROOT, 'package.json'), 'utf8');
const doc = (name) => readFileSync(resolve(ROOT, name), 'utf8');

// --- Refusal proof: the scanners must reject synthetic violations --------------

test('the boundary scanner refuses a framework import in src/core', () => {
  const clean = { 'src/core/efs/pure.ts': 'export const value = 1;\n' };
  assert.deepEqual(scanSources(clean), []);

  const dirty = {
    'src/core/efs/dirty.ts':
      "import { readFileSync } from 'node:fs';\nexport const read = readFileSync;\n",
  };
  const violations = scanSources(dirty);
  assert.equal(violations.length, 1);
  assert.match(violations[0], /node:fs/);
});

test('the boundary scanner refuses React, Next and adapters inside src/core', () => {
  assert.equal(
    scanSources({ 'src/core/a.ts': "import { useState } from 'react';\nexport {};\n" }).length,
    1,
  );
  assert.equal(
    scanSources({ 'src/core/b.ts': "import Link from 'next/link';\nexport default Link;\n" }).length,
    1,
  );
  assert.equal(
    scanSources({
      'src/core/c.ts': "import { x } from '@/adapters/content/json-page';\nexport { x };\n",
    }).length,
    1,
  );
  assert.equal(
    scanSources({ 'src/core/d.ts': "const cp = require('node:child_process');\nexport { cp };\n" })
      .length,
    1,
  );
});

test('the boundary scanner refuses Node I/O, framework and adapter imports in src/application', () => {
  const clean = {
    'src/application/use-case.ts':
      "import { selectDeclaredPageSource } from '../core/page-authoring-policy';\nexport { selectDeclaredPageSource };\n",
  };
  assert.deepEqual(scanSources(clean), []);

  const ioViolations = scanSources({
    'src/application/io.ts':
      "import { readFileSync } from 'node:fs';\nexport const read = readFileSync;\n",
  });
  assert.equal(ioViolations.length, 1);
  assert.match(ioViolations[0], /node:fs/);

  const adapterViolations = scanSources({
    'src/application/adapter.ts':
      "import { reader } from '../adapters/content/json-page';\nexport { reader };\n",
  });
  assert.equal(adapterViolations.length, 1);
  assert.match(adapterViolations[0], /adapters/);

  assert.equal(
    scanSources({ 'src/application/next.ts': "import Link from 'next/link';\nexport default Link;\n" })
      .length,
    1,
  );
  assert.equal(
    scanSources({ 'src/application/ui.ts': "import { page } from '../app/page';\nexport { page };\n" })
      .length,
    1,
  );

  // The real application tree is genuinely inspected, not merely declared.
  assert.ok(
    Object.keys(authoredSources()).includes('src/application/resolve-declared-page-source.ts'),
  );
});

test('the boundary scanner refuses Spoke and deployment markers in src/app', () => {
  const spoke = scanSources({
    'src/app/page.tsx': 'export const ctx: SpokeRuntimeContext = {} as never;\nexport {};\n',
  });
  assert.equal(spoke.length, 1);
  assert.match(spoke[0], /SpokeRuntimeContext/);

  // Provider code is no longer a blanket string match: the narrow allowlist below owns it,
  // and it still refuses deployment-layer leakage into the app tree.
  assert.equal(
    scanSources({ 'src/app/y.tsx': "import { m } from 'deployment/efs/manifest';\nexport { m };\n" })
      .length,
    1,
  );
});

test('the analytics allowlist permits exactly one approved placement and nothing else', () => {
  const approved = {
    'src/app/layout.tsx':
      "import { Analytics } from '@vercel/analytics/next';\n" +
      'export default function Layout({ children }) {\n' +
      '  return (<html lang="en"><body>{children}<Analytics /></body></html>);\n' +
      '}\n',
  };
  assert.deepEqual(scanAnalyticsUsage(approved), []);

  // A second app module importing the same entrypoint is refused three ways: wrong module,
  // a second placement overall, and no render in that module.
  assert.equal(
    scanAnalyticsUsage({
      ...approved,
      'src/app/page.tsx': "import { Analytics } from '@vercel/analytics/next';\nexport { Analytics };\n",
    }).length,
    3,
  );

  // The bare package entry, the React entry and Speed Insights are all refused.
  for (const specifier of ['@vercel/analytics', '@vercel/analytics/react', '@vercel/speed-insights/next']) {
    const violations = scanAnalyticsUsage({
      'src/app/layout.tsx': `import { Analytics } from '${specifier}';\nexport { Analytics };\n`,
    });
    assert.ok(violations.some((line) => line.includes('not the approved provider entry')), specifier);
  }

  // Duplicate injection and a removed render are both refused.
  assert.equal(
    scanAnalyticsUsage({
      'src/app/layout.tsx':
        "import { Analytics } from '@vercel/analytics/next';\nimport { Analytics as Again } from '@vercel/analytics/next';\n<Analytics />\n",
    }).length,
    1,
  );
  assert.equal(
    scanAnalyticsUsage({
      'src/app/layout.tsx': "import { Analytics } from '@vercel/analytics/next';\nexport { Analytics };\n",
    }).length,
    1,
  );
});

test('the package scanner refuses postinstall and a drifted analytics pin', () => {
  const dirty = JSON.stringify({
    scripts: { postinstall: 'node evil.mjs' },
    dependencies: { '@vercel/analytics': '1.0.0' },
  });
  const violations = scanPackageJson(dirty);
  assert.ok(violations.some((line) => line.includes('postinstall')));
  assert.ok(violations.some((line) => line.includes('must be exactly 2.0.1')));
});

test('the package scanner accepts the exact provider pin and refuses other providers', () => {
  assert.deepEqual(
    scanPackageJson(JSON.stringify({ dependencies: { '@vercel/analytics': '2.0.1' } })),
    [],
  );
  assert.ok(
    scanPackageJson(JSON.stringify({ dependencies: { '@vercel/speed-insights': '1.0.0' } })).some(
      (line) => line.includes('unapproved provider package'),
    ),
  );
  assert.ok(
    scanPackageJson(JSON.stringify({ dependencies: { 'posthog-js': '1.0.0' } })).some((line) =>
      line.includes('unapproved analytics provider'),
    ),
  );
});

test('the package scanner refuses a non-exact direct dependency', () => {
  assert.equal(scanPackageJson(JSON.stringify({ dependencies: { next: '^16.4.2' } })).length, 1);
  assert.equal(scanPackageJson(JSON.stringify({ dependencies: { next: '16.x' } })).length, 1);
  assert.deepEqual(scanPackageJson(JSON.stringify({ dependencies: { next: '16.4.2' } })), []);
});

// --- Positive proof over the real authored tree -------------------------------

test('the real authored sources contain no boundary violation', () => {
  assert.deepEqual(scanSources(authoredSources()), []);
});

test('the real package.json is exact, boundary clean and pinned', () => {
  assert.deepEqual(scanPackageJson(packageJson()), []);

  const parsed = JSON.parse(packageJson());
  assert.equal(parsed.private, true);
  assert.equal(parsed.version, '0.1.0');
  assert.equal(parsed.license, 'Apache-2.0');
  assert.equal(parsed.packageManager, 'pnpm@11.6.0');
  assert.equal(parsed.engines.node, '26.x');
  assert.equal(nodeEngineIssue(parsed), null);
  assert.equal(parsed.dependencies.next, '16.4.2');
  assert.equal(parsed.dependencies.react, '19.2.9');
  assert.equal(parsed.dependencies['react-dom'], '19.2.9');
  assert.equal(parsed.dependencies[APPROVED_ANALYTICS.packageName], APPROVED_ANALYTICS.version);
  assert.match(parsed.devDependencies['@types/node'], /^26\.\d+\.\d+$/);
});

test('a Node 24 or unpinned engine is refused even when everything else is exact', () => {
  assert.match(nodeEngineIssue({ engines: { node: '24.x' } }), /26\.x/);
  assert.match(nodeEngineIssue({ engines: { node: '>=26' } }), /26\.x/);
  assert.match(nodeEngineIssue({}), /26\.x/);
  assert.equal(nodeEngineIssue({ engines: { node: '26.x' } }), null);
});

test('the real root layout carries exactly the one approved provider integration', () => {
  const layoutSource = doc('src/app/layout.tsx');
  assert.ok(layoutSource.includes(`from '${APPROVED_ANALYTICS.specifier}'`));
  assert.deepEqual(scanAnalyticsUsage({ 'src/app/layout.tsx': layoutSource }), []);
  assert.deepEqual(scanAnalyticsUsage(authoredSources()), []);
  // The visitor-visible page and the noindex policy are untouched by the integration.
  assert.equal(layoutSource.includes('/_vercel/insights'), false);
  assert.match(layoutSource, /index:\s*false/);
});

/**
 * Every README truth rule in one place, so the mutation test cannot drift from the real check.
 * Returns the list of violated rules; an empty list means the README tells the truth.
 */
const readmeTruthIssues = (body) => {
  const issues = [];
  if (!body.includes('The authored public Uno A1 website is not implemented yet.')) issues.push('missing-disclaimer');
  if (!body.includes('Node.js 26.x')) issues.push('missing-node26');
  if (!body.includes('pnpm 11.6.0')) issues.push('missing-pnpm');
  if (!/execution-report\.md/.test(body)) issues.push('missing-report-link');
  for (const stale of ['U01 remains open', 'U03 is open', 'Node.js 24']) {
    if (body.includes(stale)) issues.push(`stale:${stale}`);
  }
  if (/(?=[0-9a-f]*[0-9])[0-9a-f]{7,40}/.test(body)) issues.push('pinned-commit');
  return issues;
};

test('README and AGENTS describe the current technical baseline truthfully', () => {
  const readme = doc('README.md');
  const agents = doc('AGENTS.md');

  assert.ok(
    readme.includes('The authored public Uno A1 website is not implemented yet.'),
    'README.md must carry the exact truthful sentence about the A1 website',
  );
  assert.match(readme, /technical baseline/i);
  assert.match(agents, /technical baseline/i);

  // The README must point progress at GitHub instead of freezing a stage or a commit.
  assert.deepEqual(readmeTruthIssues(readme), []);
  assert.match(readme, /github\.com\/provelopment\/provelopment-foundation-uno/);

  for (const [name, body] of [
    ['README.md', readme],
    ['AGENTS.md', agents],
  ]) {
    assert.doesNotMatch(body, PRIVATE_PATH_RE, `${name} must not embed a private absolute path`);
    assert.doesNotMatch(
      body,
      /is a published (Uno )?website/i,
      `${name} must not claim a published website`,
    );
  }
});

test('a README that reintroduces a stale stage, Node 24 or a lost disclaimer is refused', () => {
  const readme = doc('README.md');
  assert.deepEqual(readmeTruthIssues(readme), [], 'the committed README must keep passing every rule');

  const mutations = [
    ['appended U01 stage claim', `${readme}\nU01 remains open\n`],
    ['appended U03 stage claim', `${readme}\nU03 is open\n`],
    ['restored Node 24 claim', readme.replace('Node.js 26.x', 'Node.js 24.x')],
    ['removed disclaimer', readme.replace('The authored public Uno A1 website is not implemented yet.', '')],
    ['pinned commit', `${readme}\nStart at 2a815c2.\n`],
  ];
  for (const [label, body] of mutations) {
    assert.notEqual(body, readme, `${label} must actually change the text`);
    const issues = readmeTruthIssues(body);
    assert.ok(issues.length > 0, `${label} must be refused by the README truth rules`);
  }

  // The exact Owner-approved disclaimer is still present word for word.
  assert.equal(readme.includes('The authored public Uno A1 website is not implemented yet.'), true);
});

test('the authored core kernel is exactly the declared file set', () => {
  const core = readTree('src/core', 'src/core');
  assert.deepEqual(Object.keys(core).sort(), [...CORE_AUTHORED_FILES].sort());
});

test('only the identity codec is a verbatim copy; the kernel declares adaptation', () => {
  const core = readTree('src/core', 'src/core');

  for (const path of [
    'src/core/page-content.ts',
    'src/core/page-route-path.ts',
    'src/core/efs/uno-locales.ts',
  ]) {
    assert.match(core[path], /ADAPTED|NEW UNO-OWNED ADAPTATION/i, `${path} must declare provenance`);
    assert.match(
      core[path],
      /not a byte-for-byte copy|NOT a copy/i,
      `${path} must state that it is not a verbatim copy`,
    );
  }

  // The upstream codec keeps its own contract text and is never relabelled as an adaptation.
  assert.doesNotMatch(core['src/core/efs/identity.ts'], /ADAPTED for Uno/i);
});

test('the kernel refuses legacy address machinery in code but not in provenance prose', () => {
  // Provenance prose that mentions the rejected shape must NOT trip the scanner.
  assert.deepEqual(
    scanSources({
      'src/core/notes.ts':
        '/** there is no `/ww/` segment and no siteCode, countryCode or geoIp here */\nexport const x = 1;\n',
    }),
    [],
  );

  // The same markers in executable code must be refused.
  for (const source of [
    'export const siteCode = "ww";\n',
    'export const path = "/ww/" + locale;\n',
    'export const countryCode = header.slice(0, 2);\n',
    'export const geoIp = lookupCountry;\n',
  ]) {
    const violations = scanSources({ 'src/core/legacy.ts': source });
    assert.equal(violations.length, 1, source);
    assert.match(violations[0], /legacy/);
  }
});

// --- U03 concrete Node adapter boundary (UNO-WO-020 / R01) ---------------------

test('the Node source adapters are exactly the declared file set', () => {
  const adapters = readTree('src/adapters', 'src/adapters');
  assert.deepEqual(Object.keys(adapters).sort(), [...ADAPTER_AUTHORED_FILES].sort());
});

test('the real adapter uses Node built-ins and composes the accepted Uno contracts', () => {
  const adapters = readTree('src/adapters', 'src/adapters');
  assert.deepEqual(scanAdapters(adapters), []);

  const source = adapters['src/adapters/efs/uno-confined-source-reader.ts'];
  assert.match(source, /from "node:fs"/);
  assert.match(source, /from "node:path"/);
  assert.match(source, /resolve-declared-page-source/);
  assert.match(source, /uno-route-address/);
  assert.doesNotMatch(stripComments(source), /from\s+['"]node:(child_process|http|https|net|dns|worker_threads)['"]/);
});

test('the adapter scanner refuses a framework, provider, app or deployment import', () => {
  for (const specifier of [
    'next/link',
    'react',
    '@vercel/analytics/next',
    '@/app/page',
    'deployment/efs/manifest',
  ]) {
    const violations = scanAdapters({
      'src/adapters/efs/dirty.ts': `import { x } from "${specifier}";\nexport const y = x;\n`,
    });
    assert.equal(violations.length, 1, `${specifier} must be refused`);
  }

  // A Node built-in is permitted in an adapter, and only there.
  assert.deepEqual(
    scanAdapters({
      'src/adapters/efs/clean.ts': "import { readFileSync } from 'node:fs';\nexport const r = readFileSync;\n",
    }),
    [],
  );
});

test('the pure kernel and the use cases stay Node-free and never reach an adapter', () => {
  assert.equal(
    CORE_AUTHORED_FILES.includes('src/adapters/efs/uno-confined-source-reader.ts'),
    false,
    'a Node adapter must never join the pure core kernel',
  );

  for (const target of ['src/core/efs/x.ts', 'src/application/y.ts']) {
    const violations = scanSources({
      [target]:
        'import { loadUnoCandidateSource } from "../adapters/efs/uno-confined-source-reader";\nexport const z = loadUnoCandidateSource;\n',
    });
    assert.equal(violations.length, 1, `${target} must not import the concrete adapter`);
  }

  const kernel = { ...readTree('src/core', 'src/core'), ...readTree('src/application', 'src/application') };
  for (const [path, source] of Object.entries(kernel)) {
    const code = stripComments(source);
    assert.doesNotMatch(code, /from\s+['"]node:/, `${path} must stay Node-free`);
    assert.doesNotMatch(code, /\/adapters\//, `${path} must not reach an adapter`);
  }
});

// --- U03 selected Page-header boundary (UNO-WO-021 / R01) ----------------------

const PAGE_HEADER_SOURCES = Object.freeze([
  'src/core/efs/uno-page-header.ts',
  'src/application/resolve-uno-page-header.ts',
]);

test('the Page-header projector and use case are registered, scanned and pure', () => {
  // The pure kernel declares the projector; the use case is an application module.
  for (const path of PAGE_HEADER_SOURCES) {
    assert.equal(Object.keys(authoredSources()).includes(path), true, `${path} must be a scanned source`);
  }
  assert.equal(CORE_AUTHORED_FILES.includes('src/core/efs/uno-page-header.ts'), true);

  const scannerInput = {
    'src/core/efs/uno-page-header.ts': readFileSync(
      resolve(ROOT, 'src/core/efs/uno-page-header.ts'),
      'utf8',
    ),
    'src/application/resolve-uno-page-header.ts': readFileSync(
      resolve(ROOT, 'src/application/resolve-uno-page-header.ts'),
      'utf8',
    ),
  };
  assert.deepEqual(scanSources(scannerInput), []);

  // The projector composes the accepted pure contracts instead of restating them.
  const projector = stripComments(scannerInput['src/core/efs/uno-page-header.ts']);
  assert.match(projector, /decideSelectedPageVisibility/);
  assert.match(projector, /isPageRoutePath/);
  const useCase = stripComments(scannerInput['src/application/resolve-uno-page-header.ts']);
  assert.match(useCase, /projectUnoSelectedPageHeader/);
  assert.doesNotMatch(useCase, /loadUnoCandidateSource/);
});

test('the boundary scanner refuses Node I/O, framework, adapter and deployment imports in the new files', () => {
  const negativeCases = [
    ["import { readFileSync } from 'node:fs';", 'src/core Node I/O'],
    ["import Link from 'next/link';", 'src/core framework'],
    ["import { loadUnoCandidateSource } from '../adapters/efs/uno-confined-source-reader';", 'src/core adapter'],
  ];
  for (const [line, label] of negativeCases) {
    const violations = scanSources({ 'src/core/efs/uno-page-header.ts': `${line}\nexport const x = 1;\n` });
    assert.equal(violations.length, 1, `${label} must be refused in src/core`);
  }

  const applicationCases = [
    ["import { readFileSync } from 'node:fs';", 'src/application Node I/O'],
    ["import Link from 'next/link';", 'src/application framework'],
    ["import { loadUnoCandidateSource } from '../adapters/efs/uno-confined-source-reader';", 'src/application adapter'],
    ["import { m } from '../../deployment/efs/manifest.json';", 'src/application deployment'],
  ];
  for (const [line, label] of applicationCases) {
    const violations = scanSources({ 'src/application/resolve-uno-page-header.ts': `${line}\nexport const x = 1;\n` });
    assert.equal(violations.length, 1, `${label} must be refused in src/application`);
  }

  // A clean synthetic pair stays clean, so the scanner is not simply refusing everything.
  assert.deepEqual(
    scanSources({
      'src/core/efs/uno-page-header.ts': "import { isPageRoutePath } from '../page-route-path';\nexport const ok = isPageRoutePath;\n",
      'src/application/resolve-uno-page-header.ts':
        "import { projectUnoSelectedPageHeader } from '../core/efs/uno-page-header';\nexport const ok = projectUnoSelectedPageHeader;\n",
    }),
    [],
  );
});

// --- U03 discoverability-intent boundary (UNO-WO-022 / R01) ---------------------

const DISCOVERY_SOURCE = 'src/core/efs/uno-discovery-policy.ts';

test('the discoverability classifier is registered, pure and unreachable from the app layer', () => {
  assert.equal(Object.keys(authoredSources()).includes(DISCOVERY_SOURCE), true);
  assert.equal(CORE_AUTHORED_FILES.includes(DISCOVERY_SOURCE), true);

  const source = readFileSync(resolve(ROOT, DISCOVERY_SOURCE), 'utf8');
  assert.deepEqual(scanSources({ [DISCOVERY_SOURCE]: source }), []);

  // It must compose the accepted visibility policy rather than restate it.
  assert.match(stripComments(source), /decideSelectedPageVisibility/);

  // No runtime power: no Node, framework, adapter, provider or environment access in executable code.
  const executable = stripComments(source);
  for (const forbidden of ['node:', 'next/', 'react', '/adapters/', 'process.env', 'fetch(']) {
    assert.equal(executable.includes(forbidden), false, `the classifier must not gain ${forbidden}`);
  }

  // No current app-layer source may consume it in this order.
  for (const [path, body] of Object.entries(readTree('src/app', 'src/app'))) {
    assert.equal(body.includes('uno-discovery-policy'), false, `${path} must not import the classifier`);
  }
});

test('the scanner refuses injected Node, framework and adapter imports in the classifier', () => {
  const injected = [
    ["import { readFileSync } from 'node:fs';", 'Node I/O'],
    ["import Link from 'next/link';", 'framework'],
    ["import { useState } from 'react';", 'React'],
    ["import { loadUnoCandidateSource } from '../adapters/efs/uno-confined-source-reader';", 'adapter'],
  ];
  for (const [line, label] of injected) {
    const violations = scanSources({ [DISCOVERY_SOURCE]: `${line}\nexport const x = 1;\n` });
    assert.equal(violations.length, 1, `${label} must be refused inside ${DISCOVERY_SOURCE}`);
  }
  assert.deepEqual(
    scanSources({ [DISCOVERY_SOURCE]: "import { isPageRoutePath } from '../page-route-path';\nexport const ok = isPageRoutePath;\n" }),
    [],
  );
});

// --- U03 canonical base boundary (UNO-WO-023 / R01) -----------------------------

const CANONICAL_BASE_SOURCE = 'src/core/efs/uno-canonical-base.ts';

test('the canonical-base validator is registered, pure and unreachable from the app layer', () => {
  assert.equal(Object.keys(authoredSources()).includes(CANONICAL_BASE_SOURCE), true);
  assert.equal(CORE_AUTHORED_FILES.includes(CANONICAL_BASE_SOURCE), true);

  const source = readFileSync(resolve(ROOT, CANONICAL_BASE_SOURCE), 'utf8');
  assert.deepEqual(scanSources({ [CANONICAL_BASE_SOURCE]: source }), []);

  // It reuses the authored slug rule rather than inventing a second path grammar.
  assert.match(stripComments(source), /isContentSlug/);

  // No runtime power of its own: no Node, framework, adapter, provider, environment or network access.
  const executable = stripComments(source);
  for (const forbidden of ['node:', 'next/', 'react', '/adapters/', 'process.env', 'fetch(']) {
    assert.equal(executable.includes(forbidden), false, `the validator must not gain ${forbidden}`);
  }

  // Validating a base is not serving it: no app-layer source may consume it in this order.
  for (const [path, body] of Object.entries(readTree('src/app', 'src/app'))) {
    assert.equal(body.includes('uno-canonical-base'), false, `${path} must not import the validator`);
  }
});

test('the scanner refuses injected Node, framework, adapter and provider imports in the validator', () => {
  const injected = [
    ["import { readFileSync } from 'node:fs';", 'Node I/O'],
    ["import { headers } from 'next/headers';", 'framework'],
    ["import { createElement } from 'react';", 'React'],
    ["import { loadUnoCandidateSource } from '../adapters/efs/uno-confined-source-reader';", 'adapter'],
    ["import { send } from '@/adapters/providers/notification';", 'provider adapter'],
  ];
  for (const [line, label] of injected) {
    const violations = scanSources({ [CANONICAL_BASE_SOURCE]: `${line}\nexport const x = 1;\n` });
    assert.equal(violations.length, 1, `${label} must be refused inside ${CANONICAL_BASE_SOURCE}`);
  }
  assert.deepEqual(
    scanSources({ [CANONICAL_BASE_SOURCE]: "import { isContentSlug } from '../page-content';\nexport const ok = isContentSlug;\n" }),
    [],
  );
});
