/**
 * Foundation Uno — the deployment environment adapter (`U07`).
 *
 * WHAT THIS IS. The one place that reads the environment facts a deployment may state about itself: an operator's explicit
 * `UNO_CANONICAL_ORIGIN`, whether this process is a hosted Vercel deployment, and the platform's own production host. It reads
 * three named variables and nothing else — no request, no header, no file, no network, no clock.
 *
 * WHY AN ADAPTER. Environment access is outside-world access, and outside-world access belongs in an adapter; the configuration
 * layer that composes a serving decision must stay free of it. This module also makes the read inspectable: the composition
 * receives plain values and the pure resolver judges them, so no decision can depend on an ambient variable that a caller
 * cannot see.
 *
 * PROVENANCE. Original **Uno-owned** implementation, class **NEW**. No provider SDK and no dependency.
 */
import {
  UNO_DEPLOY_ORIGIN_ENV,
  UNO_VERCEL_ENV,
  UNO_VERCEL_PRODUCTION_URL,
} from "../../core/deploy/uno-deploy-environment-names";

/** The environment facts a deployment may state, as plain strings with absent values made explicit. */
export interface UnoDeployEnvironment {
  /** The operator's explicit origin, or `null` when none was set. */
  readonly operator: string | null;
  /** The platform's deployment environment (`production`, `preview`, `development`), or `null` off-platform. */
  readonly vercelEnv: string | null;
  /** The platform's production host, or `null` when the platform states none. */
  readonly vercelProductionUrl: string | null;
  /** Whether this process runs as a hosted Vercel deployment at all. */
  readonly hosted: boolean;
}

/** Read the three named variables, treating a blank value as absent. */
export function readUnoDeployEnvironment(env: Record<string, string | undefined> = process.env): UnoDeployEnvironment {
  const value = (name: string): string | null => {
    const raw = env[name];
    return typeof raw === "string" && raw.trim().length > 0 ? raw : null;
  };
  const hosted = value("VERCEL") !== null || value(UNO_VERCEL_ENV) !== null;
  return Object.freeze({
    operator: value(UNO_DEPLOY_ORIGIN_ENV),
    vercelEnv: value(UNO_VERCEL_ENV),
    vercelProductionUrl: value(UNO_VERCEL_PRODUCTION_URL),
    hosted,
  });
}
