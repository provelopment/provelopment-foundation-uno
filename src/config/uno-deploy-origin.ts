/**
 * Foundation Uno — the deployment-specific canonical origin resolver (`U07`).
 *
 * WHAT THIS IS. One pure resolver that answers a single question: *has this deployment declared the origin it is
 * actually served on, and is that declaration acceptable?* It exists because the neutral distribution ships a
 * reserved example origin (`https://uno-starter.example`), and a real installation served on any other origin is
 * refused by the publication decision — correctly. A deployment therefore states its own origin, and this module
 * decides which statement wins.
 *
 * PRECEDENCE, strongest first. An operator's explicit `UNO_CANONICAL_ORIGIN`, then a committed deployment profile
 * (`deployment/uno.deploy.json`, absent from the distributable artefact), then — only on a Vercel **production**
 * deployment — the platform's own `VERCEL_PROJECT_PRODUCTION_URL`. With none of them the neutral declaration stands.
 *
 * WHAT THIS IS NOT. It never reads a request, a `Host` header, `X-Forwarded-Host`, a cookie or a referrer: an
 * origin is a deployment fact, not something an incoming request can assert. It never widens validation — every
 * candidate is judged by `validateUnoCanonicalBase`, the same authority that judges the committed base, so the two
 * cannot drift. It never falls back silently: a declaration that is present and invalid refuses, because serving
 * the neutral example origin instead would publish untruthful canonical metadata.
 *
 * PROVENANCE. Original **Uno-owned** implementation, class **NEW**. No provider SDK, no dependency and no copied
 * code are involved; reading an environment record is the caller's job.
 */
import { validateUnoCanonicalBase } from "../core/efs/uno-canonical-base";

/** The declared absolute path of the optional, non-distributable deployment profile. */
export const UNO_DEPLOY_PROFILE_PATH = "deployment/uno.deploy.json";

/** The operator's explicit origin, and the two platform facts the resolver may consult. */
export const UNO_DEPLOY_ORIGIN_ENV = "UNO_CANONICAL_ORIGIN";
export const UNO_VERCEL_ENV = "VERCEL_ENV";
export const UNO_VERCEL_PRODUCTION_URL = "VERCEL_PROJECT_PRODUCTION_URL";

/** The facts a deployment may state about itself, as plain values. The adapter reads them; this module only judges them. */
export interface UnoDeployStatement {
  readonly operator: string | null;
  readonly hosted: boolean;
  readonly vercelEnv: string | null;
  readonly vercelProductionUrl: string | null;
}

/** Where an accepted origin came from, so a test and an operator can tell them apart. */
export type UnoDeployOriginSource = "operator" | "profile" | "platform";

/** The closed answer: the neutral declaration stands, one origin was accepted, or one declaration was refused. */
export type UnoDeployOrigin =
  | { readonly mode: "neutral" }
  | { readonly mode: "declared"; readonly origin: string; readonly source: UnoDeployOriginSource }
  | { readonly mode: "refused"; readonly reason: "deploy-origin:invalid" };

/** The deployment profile's only keys. Anything else refuses rather than being ignored. */
export const UNO_DEPLOY_PROFILE_KEYS: readonly string[] = Object.freeze(["version", "canonical"] as const);

/** The one profile version this build understands. */
export const UNO_DEPLOY_PROFILE_VERSION = 1;

/**
 * The reserved, non-routable example origin the neutral distribution ships.
 *
 * It is the one value a deployment statement may replace. A committed base that states any other origin is a deliberate
 * declaration by the adopter, and a hosting profile must never quietly overwrite it.
 */
export const UNO_NEUTRAL_BASE_CANONICAL = "https://uno-starter.example";

/**
 * Accept one candidate origin, or `null`.
 *
 * The candidate is handed to the canonical-base validator unchanged. A bare hostname (the platform's form) is
 * promoted to `https://` first, because the platform states the host it is served on and never states a scheme; that
 * promotion is the only transformation this module performs, and it can only ever *add* the scheme the validator
 * then requires.
 */
function accept(candidate: string, source: UnoDeployOriginSource, hostOnly = false): UnoDeployOrigin | null {
  const trimmed = candidate.trim();
  if (trimmed.length === 0) return null;
  const url = hostOnly ? `https://${trimmed}` : trimmed;
  const validated = validateUnoCanonicalBase({ canonical: url, aliases: [] });
  if (!validated.accepted) return null;
  // The validator states an origin and a path prefix separately. A deployment origin is an origin with no prefix, and the
  // validator is the authority for that shape, so a non-empty prefix is refused rather than trimmed.
  if (validated.canonical.pathPrefix.length > 0) return null;
  return { mode: "declared", origin: validated.canonical.origin, source };
}

/** One untrusted profile record: whether it is present, and its `canonical` when it is exactly the expected shape. */
function profileCanonical(profile: unknown): { readonly present: boolean; readonly canonical: string | null } {
  if (profile === null || profile === undefined) return { present: false, canonical: null };
  if (typeof profile !== "object" || Array.isArray(profile)) return { present: true, canonical: null };
  const record = profile as Record<string, unknown>;
  if (Object.keys(record).some((key) => !UNO_DEPLOY_PROFILE_KEYS.includes(key))) return { present: true, canonical: null };
  if (record.version !== UNO_DEPLOY_PROFILE_VERSION) return { present: true, canonical: null };
  if (typeof record.canonical !== "string") return { present: true, canonical: null };
  return { present: true, canonical: record.canonical };
}

/**
 * Resolve the origin this deployment is served on.
 *
 * A present-but-invalid statement always refuses at its own strength: the operator's first, the profile's next, the
 * platform's last. An absent statement simply yields to the next one, and when every statement is absent the neutral
 * committed declaration stands unchanged.
 */
export function resolveUnoDeployOrigin(input: {
  readonly statement: UnoDeployStatement;
  readonly committedCanonical: string;
  readonly profile?: unknown;
}): UnoDeployOrigin {
  const { statement } = input;

  // An operator's explicit statement is deliberate and always wins.
  if (statement.operator !== null) {
    return accept(statement.operator, "operator") ?? { mode: "refused", reason: "deploy-origin:invalid" };
  }

  // A committed base that states a real origin is the adopter's own declaration. It is honoured, and no hosting profile or
  // platform fact may replace it.
  if (input.committedCanonical.trim() !== UNO_NEUTRAL_BASE_CANONICAL) return { mode: "neutral" };

  // The profile describes a **hosted** deployment, so it applies only where one is identified as such. A development checkout or a
  // test run keeps the neutral declaration and never inherits the hosting repository's origin.
  if (!statement.hosted) return { mode: "neutral" };

  const profile = profileCanonical(input.profile);
  if (profile.present) {
    if (profile.canonical === null) return { mode: "refused", reason: "deploy-origin:invalid" };
    return accept(profile.canonical, "profile") ?? { mode: "refused", reason: "deploy-origin:invalid" };
  }

  // The platform states the host a **production** deployment is served on. A preview keeps the neutral declaration: a preview must
  // never claim the production canonical address.
  if (statement.vercelEnv === "production" && statement.vercelProductionUrl !== null) {
    return accept(statement.vercelProductionUrl, "platform", true) ?? { mode: "refused", reason: "deploy-origin:invalid" };
  }

  return { mode: "neutral" };
}
