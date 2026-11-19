import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  evaluateSecurityException,
  EXPECTED_GHSA_ID,
  parseAuditReport,
  parseWorkspaceConfig,
} from '../../scripts/verify-u04-security-exception.mjs';

/**
 * Hermetic guards for the unwaived dependency-advisory posture (UNO-WO-046 / R01).
 *
 * Nothing here touches the network, the registry or the real lockfile: the guard exposes a pure decision function and
 * these cases prove each control refuses when it should. Fixtures mirror the shape of real `pnpm audit --json` output
 * captured for this repository, where the unfiltered full graph reports one development-only MODERATE advisory and the
 * strict production graph reports nothing at all.
 */

/** The exact blocking commands the two-host workflow must keep running. */
const REQUIRED_COMMANDS = [
  'node scripts/verify-u04-security-exception.mjs',
  'node --test tests/deployment/u04-security-exception.test.mjs',
  'pnpm audit --prod --audit-level high',
  'pnpm audit --audit-level high',
];

/** Published picomatch versions: latest is still 4.0.7, so the advisory has no repair. */
const PUBLISHED_VERSIONS = ['2.3.2', '4.0.7'];

/** Build one audit advisory entry in the shape pnpm emits. */
function advisory({ severity = 'moderate', ghsa = EXPECTED_GHSA_ID, moduleName = 'picomatch' } = {}) {
  return {
    findings: [{ version: '4.0.7', paths: ['.>tooling>picomatch'], dev: true, optional: false, bundled: false }],
    severity,
    module_name: moduleName,
    github_advisory_id: ghsa,
    vulnerable_versions: '<=4.0.7',
    patched_versions: '>=4.0.8',
  };
}

/** Build a full audit report; pass `seed: null` for a completely clean graph. */
function auditReport({ extra = {}, seed = advisory() } = {}) {
  const advisories = seed === null ? { ...extra } : { '1001': seed, ...extra };
  const counts = { info: 0, low: 0, moderate: 0, high: 0, critical: 0 };
  for (const entry of Object.values(advisories)) {
    counts[entry.severity] = (counts[entry.severity] ?? 0) + 1;
  }
  return { advisories, metadata: { vulnerabilities: counts } };
}

/** A clean production report: no advisories of any severity. */
const CLEAN_PRODUCTION = {
  advisories: {},
  metadata: { vulnerabilities: { info: 0, low: 0, moderate: 0, high: 0, critical: 0 } },
};

/** A workspace declaration with no waiver at all. */
function unwaivedWorkspace(overrides = {}) {
  return { exists: true, packages: ['.'], ignoreGhsas: [], forbiddenKeys: [], declaredExpiryIso: null, ...overrides };
}

/** A complete, passing evidence object; individual cases mutate one field. */
function validEvidence(overrides = {}) {
  return {
    workspace: unwaivedWorkspace(),
    lockfile: { copyMatchesRepository: true },
    rawAudit: { exitCode: 1, parsed: parseAuditReport(auditReport()) },
    productionAudit: { exitCode: 0, parsed: parseAuditReport(CLEAN_PRODUCTION) },
    registry: { fetched: true, versions: PUBLISHED_VERSIONS },
    workflow: { exists: true, commands: REQUIRED_COMMANDS, mutedCommand: null },
    ...overrides,
  };
}

test('the unwaived posture is accepted when every control agrees', () => {
  const verdict = evaluateSecurityException(validEvidence());
  assert.equal(verdict.ok, true, JSON.stringify(verdict.failures));
  assert.equal(verdict.summary.waiver, 'retired');
  assert.equal(verdict.summary.rawCounts.high, 0);
  assert.equal(verdict.summary.rawCounts.critical, 0);
  assert.equal(verdict.summary.publishedRepair, false, 'the advisory still has no published repair');
});

test('a fully clean graph is also accepted, because nothing is suppressed', () => {
  const verdict = evaluateSecurityException(
    validEvidence({ rawAudit: { exitCode: 0, parsed: parseAuditReport(auditReport({ seed: null })) } }),
  );
  assert.equal(verdict.ok, true, JSON.stringify(verdict.failures));
});

test('the shipped workspace declaration genuinely declares no waiver', () => {
  const parsed = parseWorkspaceConfig(readFileSync('pnpm-workspace.yaml', 'utf8'));
  assert.deepEqual(parsed.packages, ['.'], 'exactly one root package');
  assert.deepEqual(parsed.ignoreGhsas, [], 'no advisory waiver is declared');
  assert.deepEqual(parsed.forbiddenKeys, [], 'no alternative ignore key is declared');
  assert.equal(parsed.declaredExpiryIso, null, 'no stale waiver expiry is documented');
});

test('a re-introduced waiver entry is refused', () => {
  const verdict = evaluateSecurityException(
    validEvidence({ workspace: unwaivedWorkspace({ ignoreGhsas: [EXPECTED_GHSA_ID] }) }),
  );
  assert.equal(verdict.ok, false);
  assert.ok(verdict.failures.some((reason) => reason.includes('no advisory waiver')), verdict.failures.join(' | '));
});

test('a substituted waiver identifier is refused', () => {
  const verdict = evaluateSecurityException(
    validEvidence({ workspace: unwaivedWorkspace({ ignoreGhsas: ['GHSA-aaaa-bbbb-cccc'] }) }),
  );
  assert.equal(verdict.ok, false);
  assert.ok(verdict.failures.some((reason) => reason.includes('no advisory waiver')));
});

test('an unreadable waiver list is refused', () => {
  const verdict = evaluateSecurityException(validEvidence({ workspace: unwaivedWorkspace({ ignoreGhsas: null }) }));
  assert.equal(verdict.ok, false);
  assert.ok(verdict.failures.some((reason) => reason.includes('unreadable')));
});

test('a missing workspace declaration is refused', () => {
  const verdict = evaluateSecurityException(validEvidence({ workspace: { exists: false } }));
  assert.equal(verdict.ok, false);
  assert.ok(verdict.failures.some((reason) => reason.includes('pnpm-workspace.yaml')));
});

test('an alternative ignore key is refused', () => {
  const verdict = evaluateSecurityException(
    validEvidence({ workspace: unwaivedWorkspace({ forbiddenKeys: ['ignoreCves'] }) }),
  );
  assert.equal(verdict.ok, false);
  assert.ok(verdict.failures.some((reason) => reason.includes('forbidden')));
});

test('a declared root package other than "." is refused', () => {
  const verdict = evaluateSecurityException(
    validEvidence({ workspace: unwaivedWorkspace({ packages: ['.', 'packages/other'] }) }),
  );
  assert.equal(verdict.ok, false);
  assert.ok(verdict.failures.some((reason) => reason.includes('root package')));
});

test('a leftover documented waiver expiry is refused', () => {
  const verdict = evaluateSecurityException(
    validEvidence({ workspace: unwaivedWorkspace({ declaredExpiryIso: '2026-12-18T00:00:00Z' }) }),
  );
  assert.equal(verdict.ok, false);
  assert.ok(verdict.failures.some((reason) => reason.includes('still documented')));
});

test('a resurgent HIGH advisory is blocking', () => {
  const verdict = evaluateSecurityException(
    validEvidence({
      rawAudit: { exitCode: 1, parsed: parseAuditReport(auditReport({ seed: advisory({ severity: 'high' }) })) },
    }),
  );
  assert.equal(verdict.ok, false);
  assert.ok(verdict.failures.some((reason) => reason.includes('1 high advisories')), verdict.failures.join(' | '));
});

test('a resurgent CRITICAL advisory is blocking', () => {
  const verdict = evaluateSecurityException(
    validEvidence({
      rawAudit: { exitCode: 1, parsed: parseAuditReport(auditReport({ seed: advisory({ severity: 'critical' }) })) },
    }),
  );
  assert.equal(verdict.ok, false);
  assert.ok(verdict.failures.some((reason) => reason.includes('critical')));
});

test('an unreadable raw audit is refused', () => {
  const verdict = evaluateSecurityException(
    validEvidence({ rawAudit: { exitCode: 1, parsed: { ok: false, reason: 'malformed payload' } } }),
  );
  assert.equal(verdict.ok, false);
  assert.ok(verdict.failures.some((reason) => reason.includes('not usable evidence')));
});

test('a raw audit with no exit status is refused', () => {
  const verdict = evaluateSecurityException(
    validEvidence({ rawAudit: { exitCode: null, parsed: parseAuditReport(auditReport()) } }),
  );
  assert.equal(verdict.ok, false);
  assert.ok(verdict.failures.some((reason) => reason.includes('no exit status')));
});

test('a failing strict production audit is refused', () => {
  const verdict = evaluateSecurityException(
    validEvidence({ productionAudit: { exitCode: 1, parsed: parseAuditReport(CLEAN_PRODUCTION) } }),
  );
  assert.equal(verdict.ok, false);
  assert.ok(verdict.failures.some((reason) => reason.includes('production audit did not exit zero')));
});

test('a production graph HIGH is refused even when the audit exits zero', () => {
  const verdict = evaluateSecurityException(
    validEvidence({
      productionAudit: {
        exitCode: 0,
        parsed: parseAuditReport({
          advisories: { '2002': advisory({ severity: 'high' }) },
          metadata: { vulnerabilities: { info: 0, low: 0, moderate: 0, high: 1, critical: 0 } },
        }),
      },
    }),
  );
  assert.equal(verdict.ok, false);
  assert.ok(verdict.failures.some((reason) => reason.includes('production graph reports')));
});

test('an unreachable registry fails closed', () => {
  const verdict = evaluateSecurityException(validEvidence({ registry: { fetched: false, reason: 'offline' } }));
  assert.equal(verdict.ok, false);
  assert.ok(verdict.failures.some((reason) => reason.includes('registry check failed closed')));
});

test('a mismatched lockfile copy is refused', () => {
  const verdict = evaluateSecurityException(validEvidence({ lockfile: { copyMatchesRepository: false } }));
  assert.equal(verdict.ok, false);
  assert.ok(verdict.failures.some((reason) => reason.includes('byte-identical')));
});

test('a removed blocking CI command is refused', () => {
  const verdict = evaluateSecurityException(
    validEvidence({ workflow: { exists: true, commands: REQUIRED_COMMANDS.slice(0, 2), mutedCommand: null } }),
  );
  assert.equal(verdict.ok, false);
  assert.ok(verdict.failures.some((reason) => reason.includes('no longer runs the blocking command')));
});

test('a muted blocking CI command is refused', () => {
  const verdict = evaluateSecurityException(
    validEvidence({ workflow: { exists: true, commands: REQUIRED_COMMANDS, mutedCommand: '|| true' } }),
  );
  assert.equal(verdict.ok, false);
  assert.ok(verdict.failures.some((reason) => reason.includes('weakens a blocking command')));
});

test('a missing CI workflow is refused', () => {
  const verdict = evaluateSecurityException(validEvidence({ workflow: { exists: false } }));
  assert.equal(verdict.ok, false);
  assert.ok(verdict.failures.some((reason) => reason.includes('workflow is missing')));
});
