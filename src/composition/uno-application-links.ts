/**
 * Foundation Uno — the application-link resolvers this build composes.
 *
 * WHAT THIS IS. The one place that maps an **application key** to a capability. Today the only composed capability is
 * the Site's authorised public contact destination, which comes from the Connect module; the mapping lives here, in
 * composition, so neither the generic renderer nor the Connect module knows the other exists.
 *
 * WHY HERE. The renderer receives `linkId` → destination and nothing else. It has no table of keys, no knowledge that
 * `public-contact-email` exists, and no way to reach a Site it did not render. Connect receives a verified authority and
 * an authored declaration; it never learns which page asked. Composition is the only layer allowed to know both.
 */
import type { PublicContactProjection } from "../connect/public-contact";
import type { UnoApplicationLinkResolver } from "../core/links/uno-application-link";

/** The application keys this build answers. Each is a product capability, not an author's declaration id. */
export const UNO_APPLICATION_KEYS = Object.freeze({
  publicContactEmail: "public-contact-email",
} as const);

/**
 * Build the resolver list for one rendered Page.
 *
 * The projection is already scoped to this Site, this publication and this render, so the resolver cannot answer for
 * another Site: there is nothing else in it to answer with. A projection that is not `available` produces a resolver
 * that answers nothing, which is exactly what the renderer's inert fallback already expects.
 */
export function createUnoApplicationLinkResolvers(input: {
  readonly publicContact: PublicContactProjection;
}): readonly UnoApplicationLinkResolver[] {
  const email =
    input.publicContact.kind === "available"
      ? input.publicContact.methods.find((method) => method.channel === "email")
      : undefined;

  return Object.freeze([
    (key: string): { readonly key: string; readonly href: string } | null =>
      key === UNO_APPLICATION_KEYS.publicContactEmail && email !== undefined
        ? { key, href: email.href }
        : null,
  ]);
}
