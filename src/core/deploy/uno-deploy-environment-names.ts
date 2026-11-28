/**
 * Foundation Uno — the deployment environment contract (`U07`).
 *
 * WHAT THIS IS. The three environment names a deployment may state about itself, plus the one neutral placeholder
 * origin, as data. Nothing here reads the environment: this is the vocabulary an adapter reads by name and a
 * configuration layer judges by value, so both sides agree without either importing the other.
 *
 * WHY IT LIVES IN THE CORE. An adapter may not reach outward into configuration, and configuration may not perform
 * the read. The names themselves are part of the deployment contract, so the contract owns them and both layers
 * depend inward on it.
 */

/** The operator's explicit canonical origin. */
export const UNO_DEPLOY_ORIGIN_ENV = "UNO_CANONICAL_ORIGIN";

/** The platform's deployment environment (`production`, `preview`, `development`). */
export const UNO_VERCEL_ENV = "VERCEL_ENV";

/** The platform's own production host. */
export const UNO_VERCEL_PRODUCTION_URL = "VERCEL_PROJECT_PRODUCTION_URL";

/** The neutral placeholder origin a starter ships with, and the only value an operator statement may replace. */
export const UNO_NEUTRAL_BASE_CANONICAL = "https://uno-starter.example";

/** The three names in one frozen record, for a caller that iterates rather than names them. */
export const UNO_DEPLOY_ENVIRONMENT_NAMES = Object.freeze({
  operator: UNO_DEPLOY_ORIGIN_ENV,
  vercelEnv: UNO_VERCEL_ENV,
  vercelProductionUrl: UNO_VERCEL_PRODUCTION_URL,
} as const);
