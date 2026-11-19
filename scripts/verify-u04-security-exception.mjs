#!/usr/bin/env node
/**
 * Foundation Uno — unwaived dependency-advisory guard.
 *
 * Uno carries no dependency-advisory waiver. The former one-entry exception
 * (`GHSA-fc5q-39xc-vjpf`, `picomatch`, expiry 2026-12-18T00:00:00Z) was retired
 * by UNO-WO-046 / R01 after a fresh unfiltered full-graph audit reported zero
 * HIGH and zero critical findings. Retirement is not a repair claim: the
 * published advisory still describes every picomatch release through 4.0.7 and
 * no patched release exists, so the residual development-only code risk stays
 * disclosed in every report.
 *
 * Because no advisory is suppressed, `pnpm audit --audit-level high` is now the
 * whole truth; this guard additionally proves the posture cannot quietly decay:
 *
 *   1. `pnpm-workspace.yaml` declares exactly one root package, zero waiver
 *      entries, no forbidden alternative ignore key and no leftover expiry;
 *   2. the isolated audit copy of the lockfile is byte-identical;
 *   3. a raw unfiltered full-graph audit has zero HIGH and zero critical
 *      findings, and any reappearing HIGH/critical is blocking;
 *   4. a strict production audit exits zero with no HIGH/critical;
 *   5. the registry is still consulted, so a repaired release is reported
 *      truthfully instead of being mistaken for a fix that already landed.
 *
 * Every step fails closed. An audit error, unknown schema, registry outage or
 * missing evidence is never reinterpreted as an accepted posture.
 *
 * Pure Node, no new dependency, no network unless the registry check runs.
 */

import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

/** Single authorised advisory identifier. Never extend this list. */
export const EXPECTED_GHSA_ID = 'GHSA-fc5q-39xc-vjpf';

/** Package the advisory applies to. */
export const EXPECTED_PACKAGE = 'picomatch';

/** Highest published release known to be affected when the exception was granted. */
export const HIGHEST_KNOWN_AFFECTED_VERSION = '4.0.7';

/** Hard expiry, enforced by code. Exclusive bound. */
export const EXPIRES_AT_ISO = '2026-12-18T00:00:00Z';
export const EXPIRES_AT_MS = Date.parse(EXPIRES_AT_ISO);

/** pnpm version the exception wire format was validated against. */
export const EXPECTED_PNPM_VERSION = '11.6.0';

/** Blocking severities for the whole graph except the one named exception. */
export const BLOCKING_SEVERITIES = Object.freeze(['high', 'critical']);

/** Workspace configuration keys that would widen or bypass the exception. */
const FORBIDDEN_CONFIG_KEYS = Object.freeze([
  'ignoreCves',
  'ignorePackages',
  'ignoreDependencies',
]);

/** Isolated audit directory, relative to the repository root, never published. */
const ISOLATED_AUDIT_DIR = path.join('.temp', 'u04-security-exception-audit');

/** Two-host CI workflow that must keep every security step blocking. */
const WORKFLOW_PATH = path.join('.github', 'workflows', 'verify-u01.yml');

/** Required blocking workflow commands, all of which must remain present and uncommented. */
const REQUIRED_WORKFLOW_COMMANDS = Object.freeze([
  'node scripts/verify-u04-security-exception.mjs',
  'node --test tests/deployment/u04-security-exception.test.mjs',
  'pnpm audit --prod --audit-level high',
  'pnpm audit --audit-level high',
]);


/**
 * Compare two dot-separated numeric versions. Pre-release suffixes are ignored,
 * which is deliberately conservative: a `4.0.8-canary.0` still reads as 4.0.8.
 *
 * @param {string} a
 * @param {string} b
 * @returns {number} negative when a < b, zero when equal, positive when a > b
 */
export function compareVersions(a, b) {
  const parse = (value) =>
    String(value)
      .split('-')[0]
      .split('.')
      .map((part) => {
        const parsed = Number.parseInt(part, 10);
        return Number.isFinite(parsed) ? parsed : 0;
      });
  const left = parse(a);
  const right = parse(b);
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    const difference = (left[index] ?? 0) - (right[index] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
}

/**
 * Parse the deliberately small subset of `pnpm-workspace.yaml` this repository
 * uses. Purpose-built rather than a general YAML parser so that no dependency is
 * added, and strictly fail-closed: anything unexpected yields no evidence.
 *
 * @param {string} text
 */
export function parseWorkspaceConfig(text) {
  const lines = String(text ?? '').split(/\r?\n/);
  const packages = [];
  const ignoreGhsas = [];
  const forbiddenKeys = [];
  let section = null;

  for (const rawLine of lines) {
    const line = rawLine.replace(/\t/g, '  ');
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) continue;

    const indent = line.length - line.trimStart().length;
    if (indent === 0) {
      if (trimmed === 'packages:') {
        section = 'packages';
        continue;
      }
      if (trimmed === 'auditConfig:') {
        section = 'auditConfig';
        continue;
      }
      section = null;
      if (FORBIDDEN_CONFIG_KEYS.some((key) => trimmed.startsWith(`${key}:`))) {
        forbiddenKeys.push(trimmed.replace(/:.*$/, ''));
      }
      continue;
    }

    if (trimmed.startsWith('- ')) {
      const value = trimmed.slice(2).trim().replace(/^['"]|['"]$/g, '');
      if (section === 'packages') packages.push(value);
      if (section === 'auditConfig' || section === 'auditGhsas') ignoreGhsas.push(value);
      continue;
    }

    if (trimmed === 'ignoreGhsas:') {
      section = 'auditGhsas';
      continue;
    }

    const key = trimmed.replace(/:.*$/, '');
    if (FORBIDDEN_CONFIG_KEYS.includes(key)) {
      forbiddenKeys.push(key);
    }
  }

  const declaredExpiry = /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)/.exec(String(text ?? ''));

  return {
    packages,
    ignoreGhsas,
    forbiddenKeys,
    declaredExpiryIso: declaredExpiry ? declaredExpiry[1] : null,
  };
}

/**
 * Validate the shape of `pnpm audit --json` output. Unknown shapes are refused
 * rather than inspected leniently, because a scanner we cannot read is not
 * evidence of safety.
 *
 * @param {unknown} value
 */
export function parseAuditReport(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false, reason: 'audit report is not a JSON object' };
  }
  const report = value;
  if (report.error) {
    return { ok: false, reason: 'audit report contains a registry error' };
  }
  if (typeof report.advisories !== 'object' || report.advisories === null) {
    return { ok: false, reason: 'audit report has no advisories object' };
  }
  const metadata = report.metadata;
  if (metadata === null || typeof metadata !== 'object') {
    return { ok: false, reason: 'audit report has no metadata object' };
  }
  const vulnerabilities = metadata.vulnerabilities;
  if (vulnerabilities === null || typeof vulnerabilities !== 'object') {
    return { ok: false, reason: 'audit report has no vulnerability metadata' };
  }

  const counts = {};
  for (const severity of ['info', 'low', 'moderate', 'high', 'critical']) {
    const count = vulnerabilities[severity];
    if (typeof count !== 'number' || !Number.isInteger(count) || count < 0) {
      return { ok: false, reason: `audit report has an invalid ${severity} count` };
    }
    counts[severity] = count;
  }

  const advisories = [];
  for (const [key, entry] of Object.entries(report.advisories)) {
    if (entry === null || typeof entry !== 'object') {
      return { ok: false, reason: `advisory ${key} is not an object` };
    }
    if (typeof entry.severity !== 'string') {
      return { ok: false, reason: `advisory ${key} has no severity` };
    }
    if (!Array.isArray(entry.findings)) {
      return { ok: false, reason: `advisory ${key} has no findings array` };
    }
    advisories.push({
      key,
      severity: entry.severity,
      moduleName: entry.module_name,
      githubAdvisoryId: entry.github_advisory_id,
      vulnerableVersions: entry.vulnerable_versions,
      patchedVersions: entry.patched_versions,
      findings: entry.findings,
    });
  }

  return { ok: true, advisories, counts };
}

/**
 * Pure decision function. Every input is supplied and nothing is read or
 * executed, so refusal behaviour is deterministic and offline-testable.
 *
 * @param {object} evidence
 */
export function evaluateSecurityException(evidence) {
  const failures = [];
  const fail = (reason) => failures.push(reason);

  const workspace = evidence.workspace ?? {};
  if (!workspace.exists) {
    fail('pnpm-workspace.yaml is missing, so the unwaived posture is unverifiable');
  } else {
    const ghsas = Array.isArray(workspace.ignoreGhsas) ? workspace.ignoreGhsas : null;
    if (ghsas === null) {
      fail('the workspace waiver list is unreadable');
    } else if (ghsas.length !== 0) {
      fail(
        `the workspace must declare no advisory waiver — the ${EXPECTED_GHSA_ID} exception was retired; found [${ghsas.join(', ')}]`,
      );
    }
    const packages = Array.isArray(workspace.packages) ? workspace.packages : null;
    if (packages === null || packages.length !== 1 || packages[0] !== '.') {
      fail('the workspace must declare exactly one root package, "."');
    }
    if (Array.isArray(workspace.forbiddenKeys) && workspace.forbiddenKeys.length > 0) {
      fail(`the workspace config carries a forbidden ignore key: ${workspace.forbiddenKeys.join(', ')}`);
    }
    if (workspace.declaredExpiryIso) {
      fail(
        `a waiver expiry ${workspace.declaredExpiryIso} is still documented although no waiver exists; the ${EXPECTED_GHSA_ID} exception was retired`,
      );
    }
  }

  const lockfile = evidence.lockfile ?? {};
  if (!lockfile.copyMatchesRepository) {
    fail('the isolated audit copy of the lockfile is not byte-identical to the repository lockfile');
  }

  const raw = evidence.rawAudit ?? {};
  if (raw.exitCode === null || raw.exitCode === undefined) {
    fail('the unfiltered full-graph audit produced no exit status');
  }
  if (!raw.parsed || raw.parsed.ok !== true) {
    fail(`the unfiltered full-graph audit is not usable evidence: ${raw.parsed?.reason ?? 'no parsed report'}`);
  } else {
    const { advisories, counts } = raw.parsed;
    if (counts.critical !== 0) {
      fail(`the unfiltered full-graph audit reports ${counts.critical} critical advisories; any critical is blocking`);
    }
    if (counts.high !== 0) {
      fail(`the unfiltered full-graph audit reports ${counts.high} high advisories; any high is blocking`);
    }
    const blocking = advisories.filter((advisory) => BLOCKING_SEVERITIES.includes(advisory.severity));
    if (blocking.length !== 0) {
      fail(
        `the unfiltered full-graph audit reports ${blocking.length} high/critical advisories (${blocking
          .map((advisory) => `${advisory.githubAdvisoryId}/${advisory.moduleName}`)
          .join(', ')}); no waiver exists, so this is blocking`,
      );
    }
  }

  const production = evidence.productionAudit ?? {};
  if (production.exitCode !== 0) {
    fail(`the strict production audit did not exit zero (exit ${production.exitCode})`);
  } else if (!production.parsed || production.parsed.ok !== true) {
    fail('the production audit exited zero without a readable report');
  }
  if (production.parsed && production.parsed.ok === true) {
    if (production.parsed.counts.high !== 0 || production.parsed.counts.critical !== 0) {
      fail(
        `the production graph reports ${production.parsed.counts.high} high and ${production.parsed.counts.critical} critical advisories`,
      );
    }
  }

  const registry = evidence.registry ?? {};
  if (!registry.fetched) {
    fail(`the registry check failed closed: ${registry.reason ?? 'no registry evidence'}`);
  } else {
    const versions = Array.isArray(registry.versions) ? registry.versions : [];
    if (versions.length === 0) {
      fail('the registry returned no versions for the affected package');
    }
    const repaired = versions.filter(
      (version) => compareVersions(version, HIGHEST_KNOWN_AFFECTED_VERSION) > 0,
    );
    // A repaired release is welcome news, not a failure: no waiver remains that could be prolonged. Its absence is
    // disclosed in the summary, because zero current audit detection does not prove the advisory is fixed.
    void repaired;
  }

  const workflow = evidence.workflow ?? {};
  if (!workflow.exists) {
    fail('the two-host CI workflow is missing');
  } else {
    for (const command of REQUIRED_WORKFLOW_COMMANDS) {
      const present =
        Array.isArray(workflow.commands) && workflow.commands.some((line) => line.includes(command));
      if (!present) {
        fail(`the CI workflow no longer runs the blocking command: ${command}`);
      }
    }
    if (workflow.mutedCommand) {
      fail(`the CI workflow weakens a blocking command: ${workflow.mutedCommand}`);
    }
  }

  const publishedRepair =
    registry.fetched && Array.isArray(registry.versions)
      ? registry.versions.some((version) => compareVersions(version, HIGHEST_KNOWN_AFFECTED_VERSION) > 0)
      : null;

  const summary = {
    ghsa: EXPECTED_GHSA_ID,
    package: EXPECTED_PACKAGE,
    waiver: 'retired',
    rawCounts: raw.parsed?.ok === true ? raw.parsed.counts : null,
    productionCounts: production.parsed?.ok === true ? production.parsed.counts : null,
    publishedRepair,
  };

  return { ok: failures.length === 0, failures, summary };
}

/** @param {string} value */
function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

/**
 * Run pnpm and capture a structured outcome. A nonzero exit is not thrown: an
 * audit that still finds the excluded advisory is expected to exit nonzero.
 *
 * @param {string[]} args
 * @param {string} cwd
 */
function runPnpm(args, cwd) {
  // On Windows pnpm resolves to a `.cmd` shim that requires a shell. The command
  // is therefore passed as a single pre-joined string containing only static
  // literals, which is the documented safe form and avoids DEP0190.
  const command = ['pnpm', ...args].join(' ');
  const result = spawnSync(command, {
    cwd,
    encoding: 'utf8',
    shell: true,
    env: { ...process.env, CI: '1', NO_COLOR: '1' },
    maxBuffer: 64 * 1024 * 1024,
  });
  return { exitCode: result.status, stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
}

/** Extract the JSON payload from pnpm output, which may carry leading log lines. */
function extractJson(text) {
  const trimmed = String(text ?? '').trim();
  if (trimmed === '') return null;
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) return null;
  try {
    return JSON.parse(trimmed.slice(start, end + 1));
  } catch {
    return null;
  }
}

/**
 * Read-only registry probe: is a repaired release published?
 * Fails closed on any network, status or shape problem.
 */
async function probeRegistry() {
  try {
    const response = await fetch(`https://registry.npmjs.org/${EXPECTED_PACKAGE}`, {
      headers: { accept: 'application/json' },
    });
    if (!response.ok) {
      return { fetched: false, reason: `registry responded ${response.status}` };
    }
    const payload = await response.json();
    if (payload === null || typeof payload !== 'object' || typeof payload.versions !== 'object') {
      return { fetched: false, reason: 'registry payload has no versions map' };
    }
    return { fetched: true, versions: Object.keys(payload.versions) };
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'unknown';
    return { fetched: false, reason: `registry request failed: ${detail}` };
  }
}

/** Collect every piece of evidence the pure evaluator needs. */
async function gatherEvidence(root) {
  const workspacePath = path.join(root, 'pnpm-workspace.yaml');
  const workspaceExists = existsSync(workspacePath);
  const workspaceText = workspaceExists ? await readFile(workspacePath, 'utf8') : '';
  const parsedWorkspace = parseWorkspaceConfig(workspaceText);

  const manifestText = await readFile(path.join(root, 'package.json'), 'utf8');
  const lockfileText = await readFile(path.join(root, 'pnpm-lock.yaml'), 'utf8');

  const pnpmVersion = runPnpm(['--version'], root).stdout.trim();

  const isolatedDir = path.join(root, ISOLATED_AUDIT_DIR);
  await rm(isolatedDir, { recursive: true, force: true });
  await mkdir(isolatedDir, { recursive: true });
  await writeFile(path.join(isolatedDir, 'package.json'), manifestText, 'utf8');
  await writeFile(path.join(isolatedDir, 'pnpm-lock.yaml'), lockfileText, 'utf8');
  // An ignore-free workspace file in the isolated directory is what stops the
  // parent configuration from being inherited, so the raw audit stays raw.
  await writeFile(path.join(isolatedDir, 'pnpm-workspace.yaml'), 'packages:\n  - "."\n', 'utf8');

  const copiedLockfile = await readFile(path.join(isolatedDir, 'pnpm-lock.yaml'), 'utf8');
  const copyMatchesRepository = sha256(copiedLockfile) === sha256(lockfileText);

  const rawResult = runPnpm(['audit', '--audit-level', 'high', '--json'], isolatedDir);
  const rawJson = extractJson(rawResult.stdout) ?? extractJson(rawResult.stderr);

  const productionResult = runPnpm(['audit', '--prod', '--audit-level', 'high', '--json'], isolatedDir);
  const productionJson = extractJson(productionResult.stdout) ?? extractJson(productionResult.stderr);

  const filteredResult = runPnpm(['audit', '--audit-level', 'high', '--json'], root);
  const filteredJson = extractJson(filteredResult.stdout) ?? extractJson(filteredResult.stderr);

  const workflowFile = path.join(root, WORKFLOW_PATH);
  const workflowExists = existsSync(workflowFile);
  const workflowText = workflowExists ? await readFile(workflowFile, 'utf8') : '';
  const activeLines = workflowText.split(/\r?\n/).filter((line) => !line.trim().startsWith('#'));
  const commands = activeLines.map((line) => line.trim()).filter((line) => line !== '');
  let mutedCommand = null;
  for (const required of REQUIRED_WORKFLOW_COMMANDS) {
    const line = activeLines.find((candidate) => candidate.includes(required));
    if (line && (line.includes('continue-on-error') || line.includes('|| true'))) {
      mutedCommand = required;
    }
  }

  const registry = await probeRegistry();

  await rm(isolatedDir, { recursive: true, force: true });

  return {
    pnpmVersion,
    evidence: {
      now: Date.now(),
      workspace: {
        exists: workspaceExists,
        packages: parsedWorkspace.packages,
        ignoreGhsas: parsedWorkspace.ignoreGhsas,
        forbiddenKeys: parsedWorkspace.forbiddenKeys,
        declaredExpiryIso: parsedWorkspace.declaredExpiryIso,
      },
      lockfile: { copyMatchesRepository },
      rawAudit: {
        exitCode: rawResult.exitCode,
        parsed: rawJson === null ? { ok: false, reason: 'no JSON payload' } : parseAuditReport(rawJson),
      },
      productionAudit: {
        exitCode: productionResult.exitCode,
        parsed:
          productionJson === null ? { ok: false, reason: 'no JSON payload' } : parseAuditReport(productionJson),
      },
      filteredAudit: {
        exitCode: filteredResult.exitCode,
        parsed: filteredJson === null ? null : parseAuditReport(filteredJson),
      },
      registry,
      workflow: { exists: workflowExists, commands, mutedCommand },
    },
  };
}

async function main() {
  const root = process.cwd();
  const { pnpmVersion, evidence } = await gatherEvidence(root);

  const failures = [];
  if (pnpmVersion !== EXPECTED_PNPM_VERSION) {
    failures.push(`pnpm ${pnpmVersion} is not the pinned ${EXPECTED_PNPM_VERSION}`);
  }

  const verdict = evaluateSecurityException(evidence);
  const rawCounts = evidence.rawAudit.parsed?.ok === true ? evidence.rawAudit.parsed.counts : null;
  const filteredCounts =
    evidence.filteredAudit.parsed?.ok === true ? evidence.filteredAudit.parsed.counts : null;
  const productionCounts =
    evidence.productionAudit.parsed?.ok === true ? evidence.productionAudit.parsed.counts : null;

  const lines = [
    'U04 dependency-advisory exception guard',
    `  pnpm: ${pnpmVersion}`,
    `  waiver: none — the ${EXPECTED_GHSA_ID} (${EXPECTED_PACKAGE}) exception was retired by UNO-WO-046 / R01`,
    `  workspace waivers: [${evidence.workspace.ignoreGhsas.join(', ')}]`,
    `  unfiltered full-graph audit (no exemption): exit ${evidence.rawAudit.exitCode} counts=${JSON.stringify(rawCounts)}`,
    `  isolated-directory full-graph audit: exit ${evidence.filteredAudit.exitCode} counts=${JSON.stringify(filteredCounts)}`,
    `  strict production audit (no exemption): exit ${evidence.productionAudit.exitCode} counts=${JSON.stringify(productionCounts)}`,
    `  registry repair available: ${verdict.summary.publishedRepair === null ? 'UNVERIFIED' : verdict.summary.publishedRepair}`,
  ];

  if (evidence.rawAudit.parsed?.ok === true) {
    for (const advisory of evidence.rawAudit.parsed.advisories) {
      const devOnly = advisory.findings.every((finding) => finding && finding.dev === true);
      lines.push(
        `  advisory ${advisory.githubAdvisoryId} ${advisory.moduleName} severity=${advisory.severity} devOnly=${devOnly} occurrences=${advisory.findings.length}`,
      );
    }
  }

  if (failures.length > 0 || !verdict.ok) {
    console.error(lines.join('\n'));
    for (const failure of [...failures, ...verdict.failures]) {
      console.error(`  REFUSED: ${failure}`);
    }
    console.error('  result: REFUSED');
    process.exitCode = 1;
    return;
  }

  console.log(lines.join('\n'));
  console.log('  result: ACCEPTED (unwaived posture: no waiver, zero HIGH/critical, clean strict production audit)');
}

const invokedDirectly =
  process.argv[1] !== undefined && process.argv[1].endsWith('verify-u04-security-exception.mjs');
if (invokedDirectly) {
  await main();
}
