/**
 * Foundation Uno — Connect identity brands.
 *
 * PROVENANCE. Adapted from the Owner-owned Connect module (`modules/connect/src` in the Foundation reference),
 * incorporated into Foundation Uno under Uno's main Apache-2.0 licence with the Owner's express direction of
 * 2026-11-28. The adaptation is deliberately narrower than the upstream module: it keeps the brand-by-factory
 * discipline and the declared bound, and drops everything Uno has no use for (no Hub/Spoke publisher registry, no
 * runtime container, no filesystem, no network). See `src/connect/PROVENANCE.md` and `NOTICE.md`.
 *
 * WHAT THIS IS. Five nominal identifier brands. A brand is produced only by its own factory, so an arbitrary
 * string cannot be passed where a verified identity is required — the compiler enforces it and the factory still
 * bounds the runtime value.
 *
 * WHAT IT IS NOT. A factory performs **no validation beyond a bound**: it never checks that an identifier
 * exists, is published, is authorised or belongs to the caller. Upstream documents the same rule ("never call
 * these with visitor input"). Callers pass values the runtime has already proved, and must bound them before
 * branding.
 */

/** The declared identifier bound: a limit, never a default. */
export const MAX_IDENTIFIER_LENGTH = 120;

/** An identifier the runtime proved for one deployment (Uno: the verified request host). */
export type DeploymentIdentifier = string & { readonly __connect: "deployment" };

/** An identifier the runtime proved for the owning Entity. */
export type OwnerIdentifier = string & { readonly __connect: "owner" };

/** An identifier the runtime proved for the publishing Site. */
export type SiteIdentifier = string & { readonly __connect: "site" };

/** The runtime-proved reference that authorised one publication. */
export type AuthorizationIdentifier = string & { readonly __connect: "authorization" };

/** The runtime-proved reference of the publisher, when the installation identifies one. */
export type PublisherIdentifier = string & { readonly __connect: "publisher" };

/** True when a value could be branded at all: a non-empty bounded string of ordinary identifier characters. */
export function isBrandableIdentifier(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= MAX_IDENTIFIER_LENGTH &&
    /^[A-Za-z0-9._:+/-]+$/u.test(value)
  );
}

/** Brand a bounded string, or refuse it. No validation beyond the bound and the character class. */
function brand<T extends string>(value: unknown): T | null {
  return isBrandableIdentifier(value) ? (value as T) : null;
}

/**
 * The five factories, one per brand.
 *
 * Each returns `null` rather than throwing, so a caller keeps the fail-closed shape: an impossible identity
 * produces no output at all instead of an error that might confirm the identity exists.
 */
export const identifier = Object.freeze({
  deployment: (value: unknown): DeploymentIdentifier | null => brand<DeploymentIdentifier>(value),
  owner: (value: unknown): OwnerIdentifier | null => brand<OwnerIdentifier>(value),
  site: (value: unknown): SiteIdentifier | null => brand<SiteIdentifier>(value),
  authorization: (value: unknown): AuthorizationIdentifier | null => brand<AuthorizationIdentifier>(value),
  publisher: (value: unknown): PublisherIdentifier | null => brand<PublisherIdentifier>(value),
});
