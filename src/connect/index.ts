/**
 * Foundation Uno — the Connect module entry point.
 *
 * PROVENANCE. This directory is adapted from the Owner-owned Connect module reached through the Foundation
 * reference (`modules/connect/src`), incorporated into Foundation Uno under Uno's main Apache-2.0 licence by
 * Owner direction of 2026-11-28. Attribution is retained and third-party notices are unchanged; see
 * `src/connect/PROVENANCE.md` and `NOTICE.md`.
 *
 * WHAT THIS MODULE IS. Two things, both pure: nominal identity brands (`./identifier`) and the public-contact
 * projection (`./public-contact`). It owns the rule that decides whether one Site may publish one of its own
 * contact methods, and it builds the destination itself.
 *
 * WHAT THIS MODULE IS NOT. It has no runtime, no container, no filesystem, no network, no React, no configuration
 * reader and no dependency on an externally maintained Connect service. Uno does not depend on upstream Connect
 * at build or run time: the adapted source here IS the module.
 */
export {
  MAX_IDENTIFIER_LENGTH,
  identifier,
  isBrandableIdentifier,
  type AuthorizationIdentifier,
  type DeploymentIdentifier,
  type OwnerIdentifier,
  type PublisherIdentifier,
  type SiteIdentifier,
} from "./identifier";
export {
  PUBLIC_CONTACT_CHANNELS,
  PUBLIC_CONTACT_EXPOSURE,
  PUBLIC_CONTACT_LIMITS,
  isPublicMailbox,
  isPublicTelephone,
  primaryPublicContactHref,
  projectPublicContact,
  type PublicContactAuthority,
  type PublicContactChannel,
  type PublicContactConfiguration,
  type PublicContactMethod,
  type PublicContactMethodDeclaration,
  type PublicContactProjection,
  type PublicContactSiteDeclaration,
  type PublicContactUnavailableReason,
} from "./public-contact";
