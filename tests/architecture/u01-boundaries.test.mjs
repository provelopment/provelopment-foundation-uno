import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
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
  placement: 'src/app/(demo)/layout.tsx',
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
  'src/core/page-document.ts',
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
    'src/app/(demo)/layout.tsx':
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
      'src/app/(demo)/layout.tsx':
        "import { Analytics } from '@vercel/analytics/next';\nimport { Analytics as Again } from '@vercel/analytics/next';\n<Analytics />\n",
    }).length,
    1,
  );
  assert.equal(
    scanAnalyticsUsage({
      'src/app/(demo)/layout.tsx': "import { Analytics } from '@vercel/analytics/next';\nexport { Analytics };\n",
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
  assert.equal(parsed.dependencies.next, '16.4.6');
  assert.equal(parsed.dependencies.react, '19.2.9');
  assert.equal(parsed.dependencies['react-dom'], '19.2.9');
  assert.equal(parsed.dependencies[APPROVED_ANALYTICS.packageName], APPROVED_ANALYTICS.version);
  assert.match(parsed.devDependencies['@types/node'], /^26\.\d+\.\d+$/);
});

test('the lint toolchain is direct, pinned and free of the vulnerable resolver chain', () => {
  const parsed = JSON.parse(packageJson());
  const declared = { ...parsed.dependencies, ...parsed.devDependencies };

  // The meta-package that pulled `eslint-import-resolver-typescript → tinyglobby → fdir →
  // picomatch@4.0.7` must never come back, and nothing may mask the graph directly.
  assert.equal('eslint-config-next' in declared, false);
  for (const masked of ['picomatch', 'tinyglobby', 'fdir']) {
    assert.equal(masked in declared, false, `${masked} must not be a direct dependency`);
  }

  // Every replacement is an exact pin, not a range.
  for (const name of [
    '@next/eslint-plugin-next',
    'typescript-eslint',
    '@typescript-eslint/parser',
    'eslint-plugin-react',
    'eslint-plugin-react-hooks',
    'eslint-plugin-jsx-a11y',
    'eslint-plugin-import',
    'eslint-import-resolver-node',
    'globals',
  ]) {
    assert.match(declared[name] ?? '', /^\d+\.\d+\.\d+$/, `${name} must be an exact pin`);
  }
});

test('a Node 24 or unpinned engine is refused even when everything else is exact', () => {
  assert.match(nodeEngineIssue({ engines: { node: '24.x' } }), /26\.x/);
  assert.match(nodeEngineIssue({ engines: { node: '>=26' } }), /26\.x/);
  assert.match(nodeEngineIssue({}), /26\.x/);
  assert.equal(nodeEngineIssue({ engines: { node: '26.x' } }), null);
});

test('the real root layout carries exactly the one approved provider integration', () => {
  const layoutSource = doc('src/app/(demo)/layout.tsx');
  assert.ok(layoutSource.includes(`from '${APPROVED_ANALYTICS.specifier}'`));
  assert.deepEqual(scanAnalyticsUsage({ 'src/app/(demo)/layout.tsx': layoutSource }), []);
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

// --- U03 publication-inputs composition (UNO-WO-024 / R01) ---------------------

const PUBLICATION_INPUTS_SOURCE = 'src/application/validate-uno-site-publication-inputs.ts';

test('the publication-inputs composition is registered, pure and unreachable from the app layer', () => {
  assert.equal(Object.keys(authoredSources()).includes(PUBLICATION_INPUTS_SOURCE), true);

  const source = readFileSync(resolve(ROOT, PUBLICATION_INPUTS_SOURCE), 'utf8');
  assert.deepEqual(scanSources({ [PUBLICATION_INPUTS_SOURCE]: source }), []);

  // It composes the existing authorities instead of restating any one of them.
  const executable = stripComments(source);
  for (const authority of [
    'validateUnoManifestGraph',
    'validateUnoSiteSelection',
    'validateUnoCanonicalBase',
    'localePolicyIssue',
    'buildUnoCandidateRouteIndex',
  ]) {
    assert.match(executable, new RegExp(authority), `the composition must reuse ${authority}`);
  }
  // No runtime power and no published-Page claim of its own.
  for (const forbidden of ['node:', '/adapters/', 'process.env', 'fetch(', 'deployment/']) {
    assert.equal(executable.includes(forbidden), false, `the composition must not gain ${forbidden}`);
  }

  // Serving nothing in this order: no app-layer source may consume the composition yet.
  for (const [path, body] of Object.entries(readTree('src/app', 'src/app'))) {
    assert.equal(body.includes('validate-uno-site-publication-inputs'), false, `${path} must not consume it`);
  }
  // And the pure kernel must never depend upwards on an application module.
  for (const [path, body] of Object.entries(readTree('src/core', 'src/core'))) {
    assert.equal(
      body.includes('validate-uno-site-publication-inputs'),
      false,
      `${path} must not depend on an application use case`,
    );
  }
});

test('the boundary scanner refuses Node, framework, adapter, deployment and provider imports in the composition', () => {
  const negativeCases = [
    ["import { readFileSync } from 'node:fs';", 'Node I/O'],
    ["import Link from 'next/link';", 'framework'],
    ["import { headers } from 'next/headers';", 'request headers'],
    ["import { createElement } from 'react';", 'React'],
    ["import { loadUnoCandidateSource } from '../adapters/efs/uno-confined-source-reader';", 'adapter'],
    ["import { send } from '@/adapters/providers/notification';", 'provider adapter'],
    ["import { m } from '../../deployment/efs/manifest.json';", 'deployment data'],
  ];
  for (const [line, label] of negativeCases) {
    const violations = scanSources({ [PUBLICATION_INPUTS_SOURCE]: `${line}\nexport const x = 1;\n` });
    assert.equal(violations.length, 1, `${label} must be refused in ${PUBLICATION_INPUTS_SOURCE}`);
  }

  // An approved core-only import stays clean, so the scanner is not simply refusing everything.
  assert.deepEqual(
    scanSources({
      [PUBLICATION_INPUTS_SOURCE]:
        "import { validateUnoCanonicalBase } from '../core/efs/uno-canonical-base';\nexport const ok = validateUnoCanonicalBase;\n",
    }),
    [],
  );
});

// --- U03 stored Site-locale policy (UNO-WO-025 / R01) --------------------------

const COMMITTED_LOCALES_SOURCE = 'src/application/resolve-uno-committed-locales.ts';

test('the committed-locale reader is registered, pure and composes the accepted authorities', () => {
  assert.equal(Object.keys(authoredSources()).includes(COMMITTED_LOCALES_SOURCE), true);

  const source = readFileSync(resolve(ROOT, COMMITTED_LOCALES_SOURCE), 'utf8');
  assert.deepEqual(scanSources({ [COMMITTED_LOCALES_SOURCE]: source }), []);

  const executable = stripComments(source);
  for (const authority of [
    'validateUnoManifestGraph',
    'validateUnoSiteSelection',
    'localePolicyIssue',
  ]) {
    assert.match(executable, new RegExp(authority), `the reader must reuse ${authority}`);
  }
  for (const forbidden of ['node:', '/adapters/', 'process.env', 'fetch(', 'deployment/']) {
    assert.equal(executable.includes(forbidden), false, `the reader must not gain ${forbidden}`);
  }

  // Serving nothing in this order: no app-layer source consumes it, and the pure kernel never depends on it.
  for (const [path, body] of Object.entries(readTree('src/app', 'src/app'))) {
    assert.equal(body.includes('resolve-uno-committed-locales'), false, `${path} must not consume it`);
  }
  for (const [path, body] of Object.entries(readTree('src/core', 'src/core'))) {
    assert.equal(
      body.includes('resolve-uno-committed-locales'),
      false,
      `${path} must not depend on an application use case`,
    );
  }
});

test('the scanner refuses forbidden imports in the committed-locale reader', () => {
  const negativeCases = [
    ["import { readFileSync } from 'node:fs';", 'Node I/O'],
    ["import Link from 'next/link';", 'framework'],
    ["import { headers } from 'next/headers';", 'request headers'],
    ["import { createElement } from 'react';", 'React'],
    ["import { loadUnoCandidateSource } from '../adapters/efs/uno-confined-source-reader';", 'adapter'],
    ["import { send } from '@/adapters/providers/notification';", 'provider adapter'],
    ["import { m } from '../../deployment/efs/manifest.json';", 'deployment data'],
  ];
  for (const [line, label] of negativeCases) {
    const violations = scanSources({ [COMMITTED_LOCALES_SOURCE]: `${line}\nexport const x = 1;\n` });
    assert.equal(violations.length, 1, `${label} must be refused in ${COMMITTED_LOCALES_SOURCE}`);
  }

  // An approved core-only import stays clean, so the scanner is not simply refusing everything.
  assert.deepEqual(
    scanSources({
      [COMMITTED_LOCALES_SOURCE]:
        "import { localePolicyIssue } from '../core/efs/uno-locales';\nexport const ok = localePolicyIssue;\n",
    }),
    [],
  );
});

// --- U03 prepared Page-delivery candidate (UNO-WO-026 / R01) -------------------

const DELIVERY_CANDIDATE_SOURCE = 'src/application/prepare-uno-page-delivery-candidate.ts';

test('the delivery-candidate use case is registered, pure and composes accepted policies', () => {
  assert.equal(Object.keys(authoredSources()).includes(DELIVERY_CANDIDATE_SOURCE), true);

  const source = readFileSync(resolve(ROOT, DELIVERY_CANDIDATE_SOURCE), 'utf8');
  assert.deepEqual(scanSources({ [DELIVERY_CANDIDATE_SOURCE]: source }), []);

  const executable = stripComments(source);
  for (const reuse of [
    'resolveUnoCommittedLocales',
    'validateUnoSitePublicationInputs',
    'matchUnoCandidateRoute',
    'resolveUnoPageHeader',
    'classifyUnoPageDiscoverability',
  ]) {
    assert.match(executable, new RegExp(reuse), `the use case must reuse ${reuse}`);
  }
  for (const forbidden of ['node:', '/adapters/', 'process.env', 'fetch(', 'deployment/', 'next/']) {
    assert.equal(executable.includes(forbidden), false, `the use case must not gain ${forbidden}`);
  }

  // Serving nothing in this order: no app-layer source consumes it, and the pure kernel never depends on it.
  for (const [path, body] of Object.entries(readTree('src/app', 'src/app'))) {
    assert.equal(body.includes('prepare-uno-page-delivery-candidate'), false, `${path} must not consume it`);
  }
  for (const [path, body] of Object.entries(readTree('src/core', 'src/core'))) {
    assert.equal(
      body.includes('prepare-uno-page-delivery-candidate'),
      false,
      `${path} must not depend on an application use case`,
    );
  }
});

test('the scanner refuses forbidden imports in the delivery-candidate use case', () => {
  const negativeCases = [
    ["import { readFileSync } from 'node:fs';", 'Node I/O'],
    ["import { headers } from 'next/headers';", 'request headers'],
    ["import { NextResponse } from 'next/server';", 'framework response'],
    ["import { createElement } from 'react';", 'React'],
    ["import { loadUnoCandidateSource } from '../adapters/efs/uno-confined-source-reader';", 'adapter'],
    ["import { m } from '../../deployment/efs/manifest.json';", 'deployment data'],
  ];
  for (const [line, label] of negativeCases) {
    const violations = scanSources({ [DELIVERY_CANDIDATE_SOURCE]: `${line}\nexport const x = 1;\n` });
    assert.equal(violations.length, 1, `${label} must be refused in ${DELIVERY_CANDIDATE_SOURCE}`);
  }

  // An approved core-only import stays clean, so the scanner is not simply refusing everything.
  assert.deepEqual(
    scanSources({
      [DELIVERY_CANDIDATE_SOURCE]:
        "import { matchUnoCandidateRoute } from '../core/efs/uno-route-address';\nexport const ok = matchUnoCandidateRoute;\n",
    }),
    [],
  );
});

// --- U03 committed canonical base (UNO-WO-027 / R02) ---------------------------

const COMMITTED_BASE_SOURCE = 'src/application/resolve-uno-committed-base.ts';

test('the committed-base reader is scanned, pure and depends inward only', () => {
  assert.equal(Object.keys(authoredSources()).includes(COMMITTED_BASE_SOURCE), true);

  const source = readFileSync(resolve(ROOT, COMMITTED_BASE_SOURCE), 'utf8');
  assert.deepEqual(scanSources({ [COMMITTED_BASE_SOURCE]: source }), []);

  const executable = stripComments(source);
  assert.match(executable, /validateUnoSiteSelection/, 'the reader must delegate to the selection validator');

  // The reader's whole import surface is one inward core contract: no third-party or provider package exists.
  const specifiers = [...executable.matchAll(/from\s+"([^"]+)"/gu)].map((match) => match[1]);
  assert.deepEqual(specifiers, ['../core/efs/uno-config']);

  for (const forbidden of [
    'node:',
    '/adapters/',
    'process.env',
    'fetch(',
    'deployment/',
    'next/',
    'react',
    'readFileSync',
  ]) {
    assert.equal(executable.includes(forbidden), false, `the reader must not gain ${forbidden}`);
  }

  for (const [path, body] of Object.entries(readTree('src/core', 'src/core'))) {
    assert.equal(
      body.includes('resolve-uno-committed-base'),
      false,
      `${path} must not depend on an application use case`,
    );
  }
});

test('the scanner refuses outside imports in the committed-base reader, and the app layer ignores it', () => {
  const negativeCases = [
    ["import { readFileSync } from 'node:fs';", 'Node I/O'],
    ["import { headers } from 'next/headers';", 'request headers'],
    ["import { createElement } from 'react';", 'React'],
    ["import { loadUnoCandidateSource } from '../adapters/efs/uno-confined-source-reader';", 'adapter'],
    ["import { m } from '../../deployment/uno.config.json';", 'deployment data'],
    ["import { layout } from '../../src/app/layout';", 'app/router layer'],
  ];
  for (const [line, label] of negativeCases) {
    const violations = scanSources({ [COMMITTED_BASE_SOURCE]: `${line}\nexport const x = 1;\n` });
    assert.equal(violations.length, 1, `${label} must be refused in ${COMMITTED_BASE_SOURCE}`);
  }

  assert.deepEqual(
    scanSources({
      [COMMITTED_BASE_SOURCE]:
        "import { validateUnoSiteSelection } from '../core/efs/uno-config';\nexport const ok = validateUnoSiteSelection;\n",
    }),
    [],
  );

  // Still no publication surface: the app/router layer must not consume the reader.
  for (const [path, body] of Object.entries(readTree('src/app', 'src/app'))) {
    assert.equal(body.includes('resolve-uno-committed-base'), false, `${path} must not consume the reader`);
  }
});

test('the config validator delegates every base rule to the accepted canonical-base policy', () => {
  const configSource = stripComments(readFileSync(resolve(ROOT, 'src/core/efs/uno-config.ts'), 'utf8'));

  // One imported policy, called from one place: no lexical URL, prefix, alias or overlap rule is restated.
  assert.equal((configSource.match(/validateUnoCanonicalBase/gu) ?? []).length, 2);
  assert.match(configSource, /config:invalid-base/u);
  for (const restated of [
    'new URL(',
    'maxAliases',
    'maxPrefixSegments',
    'alias-overlap',
    'alias-duplicate',
    'canonical-url',
    'startsWith("http',
    'startsWith("https',
  ]) {
    assert.equal(configSource.includes(restated), false, `uno-config must not restate ${restated}`);
  }
});
// --- U03 publication, serving and discovery (UNO-WO-028 / R01) -------------------

const U03_APPLICATION = [
  'src/application/plan-uno-published-page.ts',
  'src/application/plan-uno-public-discovery.ts',
];

test('the U03 planners are scanned, inward-only and free of IO or framework imports', () => {
  const authored = Object.keys(authoredSources());
  for (const path of U03_APPLICATION) {
    assert.equal(authored.includes(path), true, `${path} must be authored and scanned`);
    const source = readFileSync(resolve(ROOT, path), 'utf8');
    assert.deepEqual(scanSources({ [path]: source }), [], `${path} must have no forbidden import`);

    const executable = stripComments(source);
    const specifiers = [...executable.matchAll(/from\s+"([^"]+)"/gu)].map((match) => match[1]);
    for (const specifier of specifiers) {
      // Only inward, relative modules: a sibling use case or a core contract. Never an adapter, app,
      // config, deployment or bare package specifier.
      assert.match(specifier, /^\.{1,2}\//u, `${path} imports ${specifier}`);
      for (const forbidden of ['adapters', '/app/', 'config/', 'deployment/']) {
        assert.equal(specifier.includes(forbidden), false, `${path} imports ${specifier}`);
      }
    }
    for (const forbidden of ['process.env', 'process.cwd', 'node:', 'deployment/', 'next/', 'react']) {
      assert.equal(executable.includes(forbidden), false, `${path} must not gain ${forbidden}`);
    }
  }
});

test('one server-only composition owns the fixed root and the file read', () => {
  const config = stripComments(readFileSync(resolve(ROOT, 'src/config/uno-serving.ts'), 'utf8'));

  // Exactly one `process.cwd()`: the fixed deployment root, never a request value.
  assert.equal((config.match(/process\.cwd\(\)/gu) ?? []).length, 1);
  for (const forbidden of ['process.env', 'headers(', 'cookies(', 'next/headers', 'x-forwarded', 'host']) {
    assert.equal(config.includes(forbidden), false, `the composition must not read ${forbidden}`);
  }
  for (const forbidden of ["from 'react'", 'from "react"', "from 'next", 'from "next']) {
    assert.equal(config.includes(forbidden), false, `the composition must not import ${forbidden}`);
  }

  // Nothing inside the pure kernel or the application layer reads a file or the working directory.
  for (const [path, body] of Object.entries({
    ...readTree('src/core', 'src/core'),
    ...readTree('src/application', 'src/application'),
  })) {
    const executable = stripComments(body);
    for (const forbidden of ['process.cwd', 'node:fs', 'readFileSync']) {
      assert.equal(executable.includes(forbidden), false, `${path} must not contain ${forbidden}`);
    }
  }
});

test('the locale, robots and sitemap surfaces consume only the server composition', () => {
  const surfaces = [
    'src/app/(site)/[locale]/[[...segments]]/page.tsx',
    'src/app/robots.txt/route.ts',
    'src/app/sitemap.xml/route.ts',
  ];
  for (const path of surfaces) {
    const source = readFileSync(resolve(ROOT, path), 'utf8');
    const executable = stripComments(source);

    assert.match(executable, /config\/uno-serving/u, `${path} must use the server composition`);
    for (const forbidden of [
      'process.env',
      'next/headers',
      'cookies(',
      'x-forwarded',
      'searchParams',
      'notFound() && redirect',
    ]) {
      assert.equal(executable.includes(forbidden), false, `${path} must not read ${forbidden}`);
    }
    for (const forbidden of ['node:fs', 'node:child_process', 'readFileSync', 'fetch(']) {
      assert.equal(executable.includes(forbidden), false, `${path} must not perform ${forbidden}`);
    }
  }

  // The frozen demonstration keeps its single static page and document: no locale wiring was smuggled in. The two
  // published-Site files are the deliberate boundary and are asserted separately below.
  for (const path of [
    'src/app/(demo)/page.tsx',
    'src/app/(demo)/layout.tsx',
    'src/app/global-not-found.tsx',
    'src/app/not-found.tsx',
  ]) {
    const source = stripComments(readFileSync(resolve(ROOT, path), 'utf8'));
    for (const forbidden of ['uno-serving', 'plan-uno-', 'hreflang', 'rel="canonical"', 'redirect(']) {
      assert.equal(source.includes(forbidden), false, `${path} must not gain ${forbidden}`);
    }
  }

  // The locale-root layout owns the document language and nothing else: no canonical, no analytics, no redirect.
  const localeLayout = stripComments(readFileSync(resolve(ROOT, 'src/app/(site)/[locale]/layout.tsx'), 'utf8'));
  assert.match(localeLayout, /resolveUnoServingLocaleTag/u);
  assert.match(localeLayout, /<html lang=\{/u);
  for (const forbidden of ['<Analytics', 'rel="canonical"', 'hreflang', 'redirect(', 'process.env', 'Accept-Language']) {
    assert.equal(localeLayout.includes(forbidden), false, `the locale layout must not contain ${forbidden}`);
  }

  // The global 404 document carries the approved copy, one h1 and no advertising or analytics of any kind.
  const globalNotFound = stripComments(readFileSync(resolve(ROOT, 'src/app/global-not-found.tsx'), 'utf8'));
  assert.match(globalNotFound, /<html lang="en">/u);
  assert.match(globalNotFound, /Page not found/u);
  assert.match(globalNotFound, /Go to the Foundation Uno homepage/u);
  for (const forbidden of ['<Analytics', 'canonical', 'hreflang', 'noindex, follow', 'dangerouslySetInnerHTML']) {
    assert.equal(globalNotFound.includes(forbidden), false, `the global 404 must not contain ${forbidden}`);
  }
});

test('the Markdown renderer never interprets authored input as markup', () => {
  const source = stripComments(
    readFileSync(resolve(ROOT, 'src/components/uno-safe-markdown-page.tsx'), 'utf8'),
  );
  for (const forbidden of [
    'dangerouslySetInnerHTML',
    'use client',
    'eval(',
    'new Function',
    'innerHTML',
    'href={',
    'src={',
  ]) {
    assert.equal(source.includes(forbidden), false, `the renderer must not use ${forbidden}`);
  }
  assert.match(source, /parseUnoSafeMarkdown/u);
  assert.match(source, /UNO_SAFE_MARKDOWN_LIMITS/u);
});

/**
 * The publication-fixture transaction is test-only tooling (`UNO-WO-030 / R01`). It may be imported by the sanctioned
 * positive HTTP gate and by its own fault-injection suite, and by nothing else: no route, no core rule and no
 * application use case may reach a module that rewrites the committed deployment declarations.
 */
test('the U03 fixture transaction is used only by the sanctioned test runner', () => {
  const transactionPath = 'scripts/uno-u03-fixture-transaction.mjs';
  const moduleName = 'uno-u03-fixture-transaction';
  assert.equal(existsSync(resolve(ROOT, transactionPath)), true, 'the helper exists');

  // Its own dependency surface is Node built-ins and relative sibling modules only.
  const transactionSource = stripComments(readFileSync(resolve(ROOT, transactionPath), 'utf8'));
  const specifiers = [...transactionSource.matchAll(/from\s+["']([^"']+)["']/gu)].map((match) => match[1]);
  assert.ok(specifiers.length > 0);
  for (const specifier of specifiers) {
    assert.equal(
      specifier.startsWith('node:') || specifier.startsWith('./'),
      true,
      `${transactionPath} may import only node built-ins or siblings, found ${specifier}`,
    );
  }

  // Exactly the two sanctioned importers, and no product layer. This checker file names the module only to police it,
  // so it is excluded — it imports nothing from the helper.
  const scanned = { ...readTree('src', 'src'), ...readTree('scripts', 'scripts'), ...readTree('tests', 'tests') };
  const CHECKER = 'tests/architecture/u01-boundaries.test.mjs';
  const importers = Object.entries(scanned)
    .filter(([path]) => path.split('\\').join('/') !== CHECKER)
    .filter(([, content]) => stripComments(content).includes(moduleName))
    .map(([path]) => path.split('\\').join('/'))
    .sort();
  assert.deepEqual(importers, [
    'scripts/verify-u03-published-http.mjs',
    'scripts/verify-u04-json-slice.mjs',
    'tests/deployment/u03-fixture-transaction.test.mjs',
    'tests/deployment/u04-json-slice.test.mjs',
  ]);

  // The product layers cannot reach it, directly or by name.
  for (const layer of ['src/app', 'src/core', 'src/application']) {
    for (const [path, content] of Object.entries(readTree(layer, layer))) {
      assert.equal(
        stripComments(content).includes(moduleName),
        false,
        `${path} must not reference the fixture transaction`,
      );
    }
  }

  // The positive HTTP runner delegates every fixture mutation to the sanctioned transaction: no route, no second
  // destructive helper and no independent setup/cleanup logic may reappear in it.
  const runner = stripComments(doc('scripts/verify-u03-published-http.mjs'));
  assert.match(runner, /from "\.\/uno-u03-fixture-transaction\.mjs"/u);
  assert.match(runner, /prepareUnoU03FixtureTransaction\(/u);
  assert.match(runner, /await transaction\.install\(\)/u);
  assert.match(runner, /await transaction\.restore\(\)/u);
  for (const forbidden of ['writeFileSync(resolve(ROOT', 'mkdirSync(resolve(ROOT, relativePath', 'rmSync(resolve(ROOT, relativePath']) {
    assert.equal(runner.includes(forbidden), false, `the runner must not mutate fixtures itself: ${forbidden}`);
  }

  // The transaction is absent from every runtime import: only the runner and its own suite may reference it.
  assert.equal(runner.includes('deployment/efs'), true, 'the runner does name the fixture paths it plans');
  for (const layer of ['src/app', 'src/core', 'src/application', 'src/adapters']) {
    for (const [path, content] of Object.entries(readTree(layer, layer))) {
      assert.equal(
        stripComments(content).includes(moduleName),
        false,
        `${path} must not reference the fixture transaction`,
      );
    }
  }

  // The real-browser helper is test-only too: the publication runner drives it through exactly one bounded entry point,
  // the runner never imports the browser package itself, and no runtime module may name either.
  const browserHelper = 'verify-u03-browser.mjs';
  assert.match(runner, /from "\.\/verify-u03-browser\.mjs"/u);
  assert.match(runner, /verifyUnoU03Browser\(/u);
  assert.equal(
    /from\s+"playwright"/u.test(runner),
    false,
    'the runner must reach the browser only through the sanctioned test-only helper',
  );
  const helperSource = stripComments(doc('scripts/verify-u03-browser.mjs'));
  assert.match(helperSource, /export async function verifyUnoU03Browser\(/u);
  assert.match(helperSource, /chromium\.launch\(\{ headless: true/u);
  assert.equal(
    /node_modules|process\.cwd\(\)|deployment\/efs/u.test(helperSource),
    false,
    'the browser helper must receive its loopback base and expectations, never resolve repository paths itself',
  );
  for (const layer of ['src/app', 'src/core', 'src/application', 'src/adapters']) {
    for (const [path, content] of Object.entries(readTree(layer, layer))) {
      const source = stripComments(content);
      assert.equal(source.includes(browserHelper), false, `${path} must not reference the browser helper`);
      assert.equal(/from\s+"playwright"/u.test(source), false, `${path} must not import the browser package`);
    }
  }

  // The existing provider boundary is unchanged: the approved analytics import stays the single sanctioned exception,
  // already policed by `scanAnalyticsUsage`, and no route names a deployment path of its own.
  const serving = stripComments(doc('src/config/uno-serving.ts'));
  assert.match(serving, /process\.cwd\(\)/u);
  const appSources = readTree('src/app', 'src/app');
  for (const [path, content] of Object.entries(appSources)) {
    const source = stripComments(content);
    assert.equal(source.includes('deployment/efs'), false, `${path} must not name a deployment path`);
  }

  // The build-visible tracing boundary (UNO-WO-033 / R01). The confined reader must spell its content-root prefix
  // literally: a runtime-split prefix hides the scope from the bundler, and the build then traced the whole
  // repository into the server payload. The literal and the declaration are pinned together by the unit test.
  const readerSource = stripComments(doc('src/adapters/efs/uno-confined-source-reader.ts'));
  assert.match(readerSource, /join\(root\.root, "deployment", "efs", "content"/u);
  assert.equal(
    readerSource.includes('UNO_CONTENT_ROOT.split("/")'),
    false,
    'the reader must not build its tracing prefix at runtime',
  );
  assert.match(readerSource, /export const UNO_CONTENT_ROOT_COMPONENTS/u);

  // Runtime filesystem access is confined to the two sanctioned modules: the reader and the server-only serving
  // composition. No route, and no other config module, may open a file of its own.
  const fsModules = new Set();
  for (const layer of ['src/app', 'src/config', 'src/core', 'src/application', 'src/adapters']) {
    for (const [path, content] of Object.entries(readTree(layer, layer))) {
      if (/(?:from|import)\s*\(?\s*["']node:fs["']/u.test(stripComments(content))) fsModules.add(path.replaceAll('\\', '/'));
    }
  }
  assert.deepEqual(
    [...fsModules].sort(),
    ['src/adapters/efs/uno-confined-source-reader.ts', 'src/config/uno-serving.ts'],
    'only the confined reader and the fixed-declaration serving composition may touch the filesystem',
  );
  for (const [path, content] of Object.entries(appSources)) {
    assert.equal(
      /node:fs/u.test(stripComments(content)),
      false,
      `${path} must not touch the filesystem directly; it must use the confined reader`,
    );
  }
  for (const [path, content] of Object.entries(readTree('src/config', 'src/config'))) {
    if (path.replaceAll('\\', '/') === 'src/config/uno-serving.ts') continue;
    assert.equal(/node:fs/u.test(stripComments(content)), false, `${path} must not touch the filesystem directly`);
  }
});

// --- U04 JSON Page slice (UNO-WO-035 / R01, extended by UNO-WO-037 / R01 and UNO-WO-038 / R01) -----------------
// The slice must stay exactly what the orders authorised: eleven renderable IDs from the immutable 22, one pure
// contract, one server renderer, no new client island and no framework or filesystem reach inside `src/core`.

test("the U04 slice declares exactly the eleven renderable IDs and implements each one", () => {
  const contract = stripComments(doc("src/core/page-document.ts"));
  const renderer = stripComments(doc("src/components/uno-page-sections.tsx"));

  const block = /UNO_RENDERABLE_MODULES = Object\.freeze\(\[([\s\S]*?)\] as const\)/u.exec(contract)?.[1] ?? "";
  const ids = [...block.matchAll(/"([a-z]+\.[a-z]+)"/gu)].map((match) => match[1]);
  // Independently enumerated — never a threshold — so a silent addition or removal of a renderable ID fails here.
  assert.deepEqual(ids, [
    "layout.stack",
    "layout.grid",
    "layout.bento",
    "content.heading",
    "content.prose",
    "content.actions",
    "content.hero",
    "content.stats",
    "content.testimonials",
    "content.pricing",
    "content.timeline",
  ]);

  for (const id of ids) {
    assert.ok(renderer.includes(`case "${id}":`), `${id} has no renderer case`);
  }
  assert.equal((renderer.match(/case "[a-z]+\.[a-z]+":/gu) ?? []).length, 11, "the renderer must cover exactly eleven IDs");

  // Every one of the 22 registry IDs stays immutable and the eleven unimplemented ones stay unrenderable.
  const registry = stripComments(doc("src/core/modules/capability-registry.ts"));
  const registryIds = [...registry.matchAll(/_CAPABILITY_IDS = Object\.freeze\(\[([\s\S]*?)\] as const\)/gu)].flatMap(
    (blockMatch) => [...blockMatch[1].matchAll(/"([a-z]+\.[a-z]+)"/gu)].map((match) => match[1]),
  );
  assert.equal(registryIds.length, 22, "the immutable registry must still hold exactly 22 IDs");
  const unrenderable = registryIds.filter((id) => !ids.includes(id));
  assert.equal(unrenderable.length, 11, "exactly eleven registered IDs must remain unrenderable");
  // The retained `renderer-unavailable` negative fixture must still name a registered but unimplemented ID.
  assert.ok(unrenderable.includes("media.image"), "media.image must stay registered and unrenderable");
  for (const id of ids) {
    assert.ok(registryIds.includes(id), `${id} is not an immutable registry ID`);
  }
});

test('the U04 contract stays framework-free and the renderer stays a server component', () => {
  const contract = stripComments(doc('src/core/page-document.ts'));
  for (const forbidden of ['next/', 'react', 'node:', 'https://', 'fetch(']) {
    assert.equal(contract.includes(forbidden), false, `src/core/page-document.ts must not reference ${forbidden}`);
  }
  assert.ok(contract.includes('isCapabilityId'), 'the contract must reuse the immutable registry predicate');

  const renderer = stripComments(doc('src/components/uno-page-sections.tsx'));
  for (const forbidden of ['"use client"', 'dangerouslySetInnerHTML', 'useState', 'useEffect', 'fetch(']) {
    assert.equal(renderer.includes(forbidden), false, `the renderer must not contain ${forbidden}`);
  }
  assert.equal(renderer.includes('<main'), false, 'the App Router page owns the single main landmark');
  assert.equal(/<h1[\s>]/u.test(renderer), false, 'a document may never author the Page h1');
});

test('no new client island was added with the U04 slice', () => {
  const components = Object.entries(readTree('src/components', 'src/components'));
  const clientComponents = components
    .filter(([, content]) => stripComments(content).includes('"use client"'))
    .map(([path]) => path.replaceAll('\\', '/'));
  assert.deepEqual(clientComponents, [], 'the JSON slice must not introduce a client component');
});

test('only the localized Page segment imports the JSON section renderer', () => {
  const importers = Object.entries(readTree('src', 'src'))
    .filter(([path, content]) =>
      path.replaceAll('\\', '/') !== 'src/components/uno-page-sections.tsx' &&
      /components\/uno-page-sections/u.test(content),
    )
    .map(([path]) => path.replaceAll('\\', '/'));
  assert.deepEqual(importers, ['src/app/(site)/[locale]/[[...segments]]/page.tsx']);
});
