import assert from 'node:assert/strict';
import test from 'node:test';

import {
  compareVersions,
  evaluateSecurityException,
  EXPECTED_GHSA_ID,
  EXPIRES_AT_ISO,
  EXPIRES_AT_MS,
  parseAuditReport,
  parseWorkspaceConfig,
} from '../../scripts/verify-u04-security-exception.mjs';

/**
 * Hermetic fixtures for the dependency-advisory exception.
 *
 * Nothing here touches the network, the registry or the real lockfile: the guard
 * exposes a pure decision function, and these cases prove that each individual
 * control refuses when it should. The evidence shape mirrors real
 * `pnpm audit --json` output captured for this repository.
 */

/** The exact blocking commands the workflow must keep running. */
const REQUIRED_COMMANDS = [
  'node scripts/verify-u04-security-exception.mjs',
  'node --test tests/deployment/u04-security-exception.test.mjs',
  'pnpm audit --prod --audit-level high',
  'pnpm audit --audit-level high',
];

/** Published picomatch versions: latest is 4.0.7, so no repair exists yet. */
const PUBLISHED_VERSIONS = ['2.3.2', '4.0.7'];

/** Build one audit advisory entry in the shape pnpm emits. */
function advisory({
  severity = 'high',
  ghsa = EXPECTED_GHSA_ID,
  moduleName = 'picomatch',
  dev = true,
  optional = false,
} = {}) {
  return {
    findings: [{ version: '4.0.7', paths: ['.>tooling>picomatch'], dev, optional, bundled: false }],
    severity,
    module_name: moduleName,
    github_advisory_id: ghsa,
    vulnerable_versions: '<=4.0.7',
    patched_versions: '>=4.0.8',
  };
}

/** Build a full audit report; `extra` adds advisories. */
function auditReport({ extra = {} } = {}) {
  const advisories = { '1001': advisory(), ...extra };
  const counts = { info: 0, low: 0, moderate: 0, high: 0, critical: 0 };
  for (const entry of Object.values(advisories)) {
    counts[entry.severity] = (counts[entry.severity] ?? 0) + 1;
  }
  return { advisories, metadata: { vulnerabilities: counts } };
}

/** A complete, passing evidence object; individual cases mutate one field. */
function validEvidence(overrides = {}) {
  return {
    now: EXPIRES_AT_MS - 60_000,
    workspace: {
      exists: true,
      packages: ['.'],
      ignoreGhsas: [EXPECTED_GHSA_ID],
      forbiddenKeys: [],
      declaredExpiryIso: EXPIRES_AT_ISO,
    },
    lockfile: { copyMatchesRepository: true },
    rawAudit: { exitCode: 1, parsed: parseAuditReport(auditReport()) },
    productionAudit: {
      exitCode: 0,
      parsed: parseAuditReport({
        advisories: {},
        metadata: { vulnerabilities: { info: 0, low: 0, moderate: 0, high: 0, critical: 0 } },
      }),
    },
    registry: { fetched: true, versions: PUBLISHED_VERSIONS },
    workflow: { exists: true, commands: REQUIRED_COMMANDS, mutedCommand: null },
    ...overrides,
  };
}


test('the authorised exception is accepted while every control agrees', () => {
  const verdict = evaluateSecurityException(validEvidence());
  assert.equal(verdict.ok, true, JSON.stringify(verdict.failures));
  assert.equal(verdict.summary.ghsa, EXPECTED_GHSA_ID);
  assert.equal(verdict.summary.publishedRepair, false);
  assert.equal(verdict.summary.rawCounts.high, 1);
});

test('the exception refuses at and after its expiry instant', () => {
  for (const now of [EXPIRES_AT_MS, EXPIRES_AT_MS + 1, EXPIRES_AT_MS + 86_400_000]) {
    const verdict = evaluateSecurityException(validEvidence({ now }));
    assert.equal(verdict.ok, false);
    assert.ok(verdict.failures.some((reason) => reason.includes('expired')), verdict.failures.join(' | '));
  }
});

test('the exception refuses without a trustworthy clock', () => {
  const verdict = evaluateSecurityException(validEvidence({ now: Number.NaN }));
  assert.equal(verdict.ok, false);
  assert.ok(verdict.failures.some((reason) => reason.includes('clock')));
});

test('a second allowlist identifier is refused', () => {
  const verdict = evaluateSecurityException(
    validEvidence({
      workspace: {
        exists: true,
        packages: ['.'],
        ignoreGhsas: [EXPECTED_GHSA_ID, 'GHSA-0000-0000-0000'],
        forbiddenKeys: [],
        declaredExpiryIso: EXPIRES_AT_ISO,
      },
    }),
  );
  assert.equal(verdict.ok, false);
  assert.ok(verdict.failures.some((reason) => reason.includes('exactly')));
});

test('a substituted identifier is refused', () => {
  const verdict = evaluateSecurityException(
    validEvidence({
      workspace: {
        exists: true,
        packages: ['.'],
        ignoreGhsas: ['GHSA-aaaa-bbbb-cccc'],
        forbiddenKeys: [],
        declaredExpiryIso: EXPIRES_AT_ISO,
      },
    }),
  );
  assert.equal(verdict.ok, false);
  assert.ok(verdict.failures.some((reason) => reason.includes(EXPECTED_GHSA_ID)));
});

test('a missing workspace declaration is refused', () => {
  const verdict = evaluateSecurityException(
    validEvidence({ workspace: { exists: false, packages: [], ignoreGhsas: [] } }),
  );
  assert.equal(verdict.ok, false);
  assert.ok(verdict.failures.some((reason) => reason.includes('pnpm-workspace.yaml')));
});

test('a drifted documented expiry is refused', () => {
  const verdict = evaluateSecurityException(
    validEvidence({
      workspace: {
        exists: true,
        packages: ['.'],
        ignoreGhsas: [EXPECTED_GHSA_ID],
        forbiddenKeys: [],
        declaredExpiryIso: '2027-01-01T00:00:00Z',
      },
    }),
  );
  assert.equal(verdict.ok, false);
  assert.ok(verdict.failures.some((reason) => reason.includes('does not match')));
});

test('an extra forbidden ignore key is refused', () => {
  const verdict = evaluateSecurityException(
    validEvidence({
      workspace: {
        exists: true,
        packages: ['.'],
        ignoreGhsas: [EXPECTED_GHSA_ID],
        forbiddenKeys: ['ignoreCves'],
        declaredExpiryIso: EXPIRES_AT_ISO,
      },
    }),
  );
  assert.equal(verdict.ok, false);
  assert.ok(verdict.failures.some((reason) => reason.includes('forbidden')));
});

test('a declared root package other than "." is refused', () => {
  const verdict = evaluateSecurityException(
    validEvidence({
      workspace: {
        exists: true,
        packages: ['.', 'packages/other'],
        ignoreGhsas: [EXPECTED_GHSA_ID],
        forbiddenKeys: [],
        declaredExpiryIso: EXPIRES_AT_ISO,
      },
    }),
  );
  assert.equal(verdict.ok, false);
  assert.ok(verdict.failures.some((reason) => reason.includes('root package')));
});

test('an unfiltered audit that finds nothing forces exception removal', () => {
  const verdict = evaluateSecurityException(
    validEvidence({
      rawAudit: {
        exitCode: 0,
        parsed: parseAuditReport({
          advisories: {},
          metadata: { vulnerabilities: { info: 0, low: 0, moderate: 0, high: 0, critical: 0 } },
        }),
      },
    }),
  );
  assert.equal(verdict.ok, false);
  assert.ok(verdict.failures.some((reason) => reason.includes('remove the exception')));
});

test('a second high advisory is refused even while the first is approved', () => {
  const verdict = evaluateSecurityException(
    validEvidence({
      rawAudit: {
        exitCode: 1,
        parsed: parseAuditReport(
          auditReport({
            extra: {
              '1002': advisory({ ghsa: 'GHSA-1111-2222-3333', moduleName: 'some-other-package' }),
            },
          }),
        ),
      },
    }),
  );
  assert.equal(verdict.ok, false);
  assert.ok(verdict.failures.some((reason) => reason.includes('expected exactly one')));
});

test('a critical advisory is refused outright', () => {
  const verdict = evaluateSecurityException(
    validEvidence({
      rawAudit: {
        exitCode: 1,
        parsed: parseAuditReport(
          auditReport({ extra: { '1003': advisory({ severity: 'critical', ghsa: 'GHSA-9999-8888-7777' }) } }),
        ),
      },
    }),
  );
  assert.equal(verdict.ok, false);
  assert.ok(verdict.failures.some((reason) => reason.includes('critical')));
});

test('the excluded advisory reaching production is refused', () => {
  const verdict = evaluateSecurityException(
    validEvidence({
      rawAudit: { exitCode: 1, parsed: parseAuditReport(auditReport({ extra: {} })) },
    }),
  );
  assert.equal(verdict.ok, true, JSON.stringify(verdict.failures));

  const reachable = parseAuditReport({
    advisories: { '1001': advisory({ dev: false }) },
    metadata: { vulnerabilities: { info: 0, low: 0, moderate: 0, high: 1, critical: 0 } },
  });
  const refused = evaluateSecurityException(validEvidence({ rawAudit: { exitCode: 1, parsed: reachable } }));
  assert.equal(refused.ok, false);
  assert.ok(refused.failures.some((reason) => reason.includes('non-development')));
});

test('a production audit with any high or critical is refused', () => {
  const verdict = evaluateSecurityException(
    validEvidence({
      productionAudit: {
        exitCode: 1,
        parsed: parseAuditReport({
          advisories: { '2001': advisory({ moduleName: 'prod-package' }) },
          metadata: { vulnerabilities: { info: 0, low: 0, moderate: 0, high: 1, critical: 0 } },
        }),
      },
    }),
  );
  assert.equal(verdict.ok, false);
  assert.ok(verdict.failures.some((reason) => reason.includes('production')));
});

test('a nonzero production audit exit is refused even with a clean report', () => {
  const verdict = evaluateSecurityException(
    validEvidence({
      productionAudit: { exitCode: 2, parsed: parseAuditReport({ advisories: {}, metadata: { vulnerabilities: { info: 0, low: 0, moderate: 0, high: 0, critical: 0 } } }) },
    }),
  );
  assert.equal(verdict.ok, false);
  assert.ok(verdict.failures.some((reason) => reason.includes('did not exit zero')));
});

test('a tampered isolated lockfile copy is refused', () => {
  const verdict = evaluateSecurityException(validEvidence({ lockfile: { copyMatchesRepository: false } }));
  assert.equal(verdict.ok, false);
  assert.ok(verdict.failures.some((reason) => reason.includes('byte-identical')));
});

test('a newly published repaired release forces exception removal', () => {
  const verdict = evaluateSecurityException(
    validEvidence({ registry: { fetched: true, versions: [...PUBLISHED_VERSIONS, '4.0.8'] } }),
  );
  assert.equal(verdict.ok, false);
  assert.equal(verdict.summary.publishedRepair, true);
  assert.ok(verdict.failures.some((reason) => reason.includes('repaired')));
});

test('an unavailable registry fails closed instead of passing', () => {
  for (const registry of [
    { fetched: false, reason: 'registry responded 503' },
    { fetched: false, reason: 'registry request failed: timeout' },
  ]) {
    const verdict = evaluateSecurityException(validEvidence({ registry }));
    assert.equal(verdict.ok, false);
    assert.ok(verdict.failures.some((reason) => reason.includes('failed closed')));
  }
});

test('an empty registry version list is refused', () => {
  const verdict = evaluateSecurityException(validEvidence({ registry: { fetched: true, versions: [] } }));
  assert.equal(verdict.ok, false);
  assert.ok(verdict.failures.some((reason) => reason.includes('no versions')));
});

test('an unreadable audit report is never treated as evidence of safety', () => {
  for (const parsed of [
    { ok: false, reason: 'audit report is not a JSON object' },
    { ok: false, reason: 'audit report contains a registry error' },
    { ok: false, reason: 'no JSON payload' },
  ]) {
    const verdict = evaluateSecurityException(validEvidence({ rawAudit: { exitCode: 1, parsed } }));
    assert.equal(verdict.ok, false);
    assert.ok(verdict.failures.some((reason) => reason.includes('not usable evidence')));
  }
});

test('a missing audit exit status is refused', () => {
  const verdict = evaluateSecurityException(validEvidence({ rawAudit: { exitCode: null, parsed: null } }));
  assert.equal(verdict.ok, false);
  assert.ok(verdict.failures.some((reason) => reason.includes('no exit status')));
});

test('a removed or muted workflow command is refused', () => {
  const removed = evaluateSecurityException(
    validEvidence({
      workflow: {
        exists: true,
        commands: REQUIRED_COMMANDS.filter((command) => !command.startsWith('node scripts/verify-u04')),
        mutedCommand: null,
      },
    }),
  );
  assert.equal(removed.ok, false);
  assert.ok(removed.failures.some((reason) => reason.includes('no longer runs')));

  const muted = evaluateSecurityException(
    validEvidence({ workflow: { exists: true, commands: REQUIRED_COMMANDS, mutedCommand: 'pnpm audit --audit-level high' } }),
  );
  assert.equal(muted.ok, false);
  assert.ok(muted.failures.some((reason) => reason.includes('weakens')));

  const missingWorkflow = evaluateSecurityException(
    validEvidence({ workflow: { exists: false, commands: [], mutedCommand: null } }),
  );
  assert.equal(missingWorkflow.ok, false);
  assert.ok(missingWorkflow.failures.some((reason) => reason.includes('workflow is missing')));
});

test('the workspace parser reads exactly one allowlisted identifier', () => {
  const parsed = parseWorkspaceConfig(
    ['# comment', 'packages:', '  - "."', '', 'auditConfig:', '  ignoreGhsas:', `    - ${EXPECTED_GHSA_ID}`, ''].join(
      '\n',
    ),
  );
  assert.deepEqual(parsed.packages, ['.']);
  assert.deepEqual(parsed.ignoreGhsas, [EXPECTED_GHSA_ID]);
  assert.deepEqual(parsed.forbiddenKeys, []);
  assert.equal(parsed.declaredExpiryIso, null);
});

test('the workspace parser surfaces a second identifier and forbidden keys', () => {
  const parsed = parseWorkspaceConfig(
    ['packages:', '  - "."', 'auditConfig:', '  ignoreGhsas:', `    - ${EXPECTED_GHSA_ID}`, '    - GHSA-0000-0000-0000', 'ignoreCves:', '  - CVE-2020-0001', ''].join('\n'),
  );
  assert.equal(parsed.ignoreGhsas.length, 2);
  assert.deepEqual(parsed.forbiddenKeys, ['ignoreCves']);
});

test('the audit parser refuses unknown and malformed shapes', () => {
  assert.equal(parseAuditReport(null).ok, false);
  assert.equal(parseAuditReport([]).ok, false);
  assert.equal(parseAuditReport({}).ok, false);
  assert.equal(parseAuditReport({ advisories: {} }).ok, false);
  assert.equal(parseAuditReport({ advisories: {}, metadata: {} }).ok, false);
  assert.equal(
    parseAuditReport({ advisories: {}, metadata: { vulnerabilities: { high: 'one' } } }).ok,
    false,
  );
  assert.equal(parseAuditReport({ error: { code: 'ENOTFOUND' } }).ok, false);
  const good = parseAuditReport(auditReport());
  assert.equal(good.ok, true);
  assert.equal(good.counts.high, 1);
});

test('version comparison orders numeric segments correctly', () => {
  assert.ok(compareVersions('4.0.8', '4.0.7') > 0);
  assert.ok(compareVersions('4.0.7', '4.0.7') === 0);
  assert.ok(compareVersions('2.3.2', '4.0.7') < 0);
  assert.ok(compareVersions('4.0.8-canary.0', '4.0.7') > 0);
  assert.ok(compareVersions('10.0.0', '9.9.9') > 0);
});
