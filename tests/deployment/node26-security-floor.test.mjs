import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';

/**
 * Foundation Uno — Node 26 and dependency security-floor gate (UNO-WO-014 / R01).
 *
 * Node-native and dependency-free: it reads committed text and makes no network, provider or
 * environment call. Each refusal is proven by a SYNTHETIC negative fixture, so a scanner that
 * always passed could not satisfy this file.
 */

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const read = (relative) => readFileSync(`${ROOT}/${relative}`, 'utf8');

const NODE26_ENGINE = '26.x';
const APPROVED_ANALYTICS = Object.freeze({ name: '@vercel/analytics', version: '2.0.1' });

/**
 * Minimum resolved versions that carry the documented security fixes. A resolution below its
 * floor is refused; these are the advisories that actually touch Uno's dependency graph.
 */
const SECURITY_FLOORS = Object.freeze({
  sharp: '0.35.5',
  'source-map-js': '1.2.2',
  'brace-expansion': '1.1.22',
});

/** Workflow text that would silently disable a gate. */
const BYPASS_MARKERS = Object.freeze(['continue-on-error', '|| true', '--passWithNoTests', 'set +e']);

/** Parse `major.minor.patch` and compare numerically. */
function compareVersions(left, right) {
  const parse = (value) => value.split('.').map((part) => Number.parseInt(part, 10));
  const a = parse(left);
  const b = parse(right);
  for (let index = 0; index < 3; index += 1) {
    if ((a[index] ?? 0) !== (b[index] ?? 0)) return (a[index] ?? 0) - (b[index] ?? 0);
  }
  return 0;
}

/** Every distinct `name@version` resolution of one package in the lockfile. */
function lockVersions(lockText, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`${escaped}@(\\d+\\.\\d+\\.\\d+)`, 'g');
  return [...new Set([...lockText.matchAll(pattern)].map((match) => match[1]))];
}

/** Inspect a project snapshot. Returns one message per violation; empty means clean. */
export function inspectProject(snapshot) {
  const violations = [];
  let pkg = null;
  try {
    pkg = JSON.parse(snapshot.packageJson);
  } catch {
    return ['package.json must be valid JSON'];
  }

  // --- Node 26 runtime pin -----------------------------------------------------------
  if (pkg?.engines?.node !== NODE26_ENGINE) {
    violations.push(`package.json: engines.node must be exactly "${NODE26_ENGINE}"`);
  }
  const typesVersion = pkg?.devDependencies?.['@types/node'];
  if (typeof typesVersion !== 'string' || !/^26\.\d+\.\d+$/.test(typesVersion)) {
    violations.push('package.json: @types/node must be an exact 26.x release');
  }

  // --- One approved provider, exactly pinned -----------------------------------------
  const analyticsVersion = pkg?.dependencies?.[APPROVED_ANALYTICS.name];
  if (analyticsVersion !== APPROVED_ANALYTICS.version) {
    violations.push(
      `package.json: ${APPROVED_ANALYTICS.name} must be exactly ${APPROVED_ANALYTICS.version}`,
    );
  }
  const declared = { ...(pkg?.dependencies ?? {}), ...(pkg?.devDependencies ?? {}) };
  for (const name of Object.keys(declared)) {
    if (name.startsWith('@vercel/') && name !== APPROVED_ANALYTICS.name) {
      violations.push(`package.json: unapproved provider package "${name}"`);
    }
  }
  if (Object.prototype.hasOwnProperty.call(pkg?.scripts ?? {}, 'postinstall')) {
    violations.push('package.json: a postinstall script is not permitted');
  }

  // --- Both workflows: Node 26 only, no bypass, floors and audit present -------------
  for (const [name, text] of [
    ['verify-bootstrap.yml', snapshot.bootstrapWorkflow],
    ['verify-u01.yml', snapshot.u01Workflow],
  ]) {
    if (/node-version:\s*'?24'?/.test(text)) violations.push(`${name}: must not run Node 24`);
    if (!/node-version:\s*'26'/.test(text)) violations.push(`${name}: must pin node-version to '26'`);
    for (const marker of BYPASS_MARKERS) {
      if (text.includes(marker)) violations.push(`${name}: bypass marker "${marker}" is not permitted`);
    }
  }
  if (!snapshot.u01Workflow.includes('tests/deployment/node26-security-floor.test.mjs')) {
    violations.push('verify-u01.yml: must run this security-floor gate');
  }
  if (!/pnpm audit --audit-level high/.test(snapshot.u01Workflow)) {
    violations.push('verify-u01.yml: must run a blocking high/critical audit gate');
  }

  // --- Lockfile: approved provider present, floors respected -------------------------
  const lock = snapshot.lockfile;
  if (!lock.includes(`${APPROVED_ANALYTICS.name}@${APPROVED_ANALYTICS.version}`)) {
    violations.push(`pnpm-lock.yaml: must resolve ${APPROVED_ANALYTICS.name}@${APPROVED_ANALYTICS.version}`);
  }
  const otherVercel = [
    ...new Set([...lock.matchAll(/@vercel\/([a-z0-9-]+)@/g)].map((match) => match[1])),
  ].filter((name) => name !== 'analytics');
  if (otherVercel.length > 0) {
    violations.push(`pnpm-lock.yaml: unapproved provider resolution "${otherVercel.join(', ')}"`);
  }
  for (const [name, floor] of Object.entries(SECURITY_FLOORS)) {
    for (const version of lockVersions(lock, name)) {
      if (compareVersions(version, floor) < 0) {
        violations.push(`pnpm-lock.yaml: ${name}@${version} is below the security floor ${floor}`);
      }
    }
  }

  // --- Root layout: exactly one approved placement -----------------------------------
  const layoutImports = [...snapshot.layout.matchAll(/from\s*['"](@vercel\/[^'"]+)['"]/g)].map(
    (match) => match[1],
  );
  if (layoutImports.length !== 1 || layoutImports[0] !== '@vercel/analytics/next') {
    violations.push("src/app/(demo)/layout.tsx: must import only '@vercel/analytics/next'");
  }
  const renders = snapshot.layout.split('<Analytics').length - 1;
  if (renders !== 1) {
    violations.push(`src/app/(demo)/layout.tsx: <Analytics /> must be rendered exactly once, found ${renders}`);
  }

  return violations;
}

/** A complete, honest snapshot of this repository. */
export function realSnapshot() {
  return {
    packageJson: read('package.json'),
    lockfile: read('pnpm-lock.yaml'),
    bootstrapWorkflow: read('.github/workflows/verify-bootstrap.yml'),
    u01Workflow: read('.github/workflows/verify-u01.yml'),
    layout: read('src/app/(demo)/layout.tsx'),
  };
}

const withChange = (key, mutate) => {
  const snapshot = realSnapshot();
  snapshot[key] = mutate(snapshot[key]);
  return snapshot;
};

// --- Positive proof over the real repository -----------------------------------------

test('the committed project satisfies every Node 26 and security-floor rule', () => {
  assert.deepEqual(inspectProject(realSnapshot()), []);
});

test('package.json pins the Node 26 runtime and no Node 24 engine survives', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.engines.node, '26.x');
  assert.equal(JSON.stringify(pkg).includes('"24.x"'), false);
  assert.equal(pkg.packageManager, 'pnpm@11.6.0');
});

test('@types/node is an exact Node 26 typings release', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.match(pkg.devDependencies['@types/node'], /^26\.\d+\.\d+$/);
});

test('the single analytics dependency is the exact approved release', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.dependencies['@vercel/analytics'], '2.0.1');
  assert.equal(read('pnpm-lock.yaml').includes('@vercel/analytics@2.0.1'), true);
});

test('no other Vercel or analytics provider is declared or resolved', () => {
  const pkg = JSON.parse(read('package.json'));
  const declared = { ...pkg.dependencies, ...pkg.devDependencies };
  assert.deepEqual(
    Object.keys(declared).filter(
      (name) => name.startsWith('@vercel/') && name !== '@vercel/analytics',
    ),
    [],
  );
  const lockNames = [
    ...new Set([...read('pnpm-lock.yaml').matchAll(/@vercel\/([a-z0-9-]+)@/g)].map((m) => m[1])),
  ];
  assert.deepEqual(lockNames, ['analytics']);
});

test('the root layout imports only the approved entry and renders it once', () => {
  const layout = read('src/app/(demo)/layout.tsx');
  const imports = [...layout.matchAll(/from\s*['"](@vercel\/[^'"]+)['"]/g)].map((m) => m[1]);
  assert.deepEqual(imports, ['@vercel/analytics/next']);
  assert.equal(layout.split('<Analytics').length - 1, 1);
  assert.match(layout, /index:\s*false/);
});

test('both workflows pin Node 26 and assert it at runtime', () => {
  for (const file of ['.github/workflows/verify-bootstrap.yml', '.github/workflows/verify-u01.yml']) {
    const text = read(file);
    assert.match(text, /node-version:\s*'26'/, file);
    assert.match(text, /Assert Node 26 runtime/, file);
    assert.equal(/node-version:\s*'?24'?/.test(text), false, file);
  }
});

test('the U01 workflow runs the security-floor gate and a blocking audit', () => {
  const text = read('.github/workflows/verify-u01.yml');
  assert.equal(text.includes('node --test tests/deployment/node26-security-floor.test.mjs'), true);
  assert.match(text, /pnpm audit --audit-level high/);
  assert.equal(text.includes('continue-on-error'), false);
  assert.equal(text.includes('|| true'), false);
});

test('resolved security floors are at or above the advisory minimums', () => {
  const lock = read('pnpm-lock.yaml');
  for (const [name, floor] of Object.entries(SECURITY_FLOORS)) {
    const versions = lockVersions(lock, name);
    assert.equal(versions.length > 0, true, `${name} must be resolved`);
    for (const version of versions) {
      assert.equal(compareVersions(version, floor) >= 0, true, `${name}@${version} >= ${floor}`);
    }
  }
});

test('no postinstall script or gate-bypass marker exists anywhere', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(Object.prototype.hasOwnProperty.call(pkg.scripts, 'postinstall'), false);
  for (const file of ['.github/workflows/verify-bootstrap.yml', '.github/workflows/verify-u01.yml']) {
    for (const marker of BYPASS_MARKERS) {
      assert.equal(read(file).includes(marker), false, `${file} must not contain ${marker}`);
    }
  }
});


// --- Synthetic negatives: each named regression must be refused ----------------------

test('negative fixture: a Node 24 engine is refused by name', () => {
  const snapshot = withChange('packageJson', (text) =>
    text.replace('"node": "26.x"', '"node": "24.x"'),
  );
  const violations = inspectProject(snapshot);
  assert.equal(violations.some((line) => line.includes('engines.node must be exactly "26.x"')), true);
});

test('negative fixture: a drifted analytics pin is refused by name', () => {
  const snapshot = withChange('packageJson', (text) =>
    text.replace('"@vercel/analytics": "2.0.1"', '"@vercel/analytics": "1.6.1"'),
  );
  const violations = inspectProject(snapshot);
  assert.equal(
    violations.some((line) => line.includes('@vercel/analytics must be exactly 2.0.1')),
    true,
  );
});

test('negative fixture: a workflow downgraded to Node 24 is refused by name', () => {
  const snapshot = withChange('u01Workflow', (text) =>
    text.replace("node-version: '26'", "node-version: '24'"),
  );
  const violations = inspectProject(snapshot);
  assert.equal(violations.some((line) => line.includes('must not run Node 24')), true);
  assert.equal(violations.some((line) => line.includes("must pin node-version to '26'")), true);
});

test('negative fixture: a success-forcing bypass in the workflow is refused by name', () => {
  const snapshot = withChange('u01Workflow', (text) =>
    text.replace('pnpm audit --audit-level high', 'pnpm audit --audit-level high || true'),
  );
  const violations = inspectProject(snapshot);
  assert.equal(violations.some((line) => line.includes('bypass marker "|| true"')), true);
});

test('negative fixture: a lockfile below the security floor is refused by name', () => {
  const snapshot = withChange('lockfile', (text) => `${text}\n  sharp@0.34.4:\n`);
  const violations = inspectProject(snapshot);
  assert.equal(
    violations.some((line) => line.includes('sharp@0.34.4 is below the security floor 0.35.5')),
    true,
  );
});

test('negative fixture: a duplicated analytics render is refused by name', () => {
  const snapshot = withChange('layout', (text) =>
    text.replace('<Analytics />', '<Analytics /><Analytics />'),
  );
  const violations = inspectProject(snapshot);
  assert.equal(
    violations.some((line) => line.includes('<Analytics /> must be rendered exactly once, found 2')),
    true,
  );
});
