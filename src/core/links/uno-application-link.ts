/**
 * Foundation Uno — generic application-link resolution (`U05`).
 *
 * WHAT THIS IS. The generic boundary between an authored reference and a governed destination. A page document
 * declares `links: { "<id>": { reference: "applicationLink", key: "<application key>" } }`, and an item points at the
 * declaration with `linkId`. This module resolves the declaration's **application key** through injected resolvers and
 * returns the destination, or nothing.
 *
 * WHY THE TWO IDENTIFIERS ARE SEPARATE. The declaration id is the author's local name for a reference inside one Page;
 * the application key is the product capability the reference asks for. A renderer must never recognise a particular
 * declaration id — that would hard-code one author's vocabulary into the generic path — and a resolver must never see a
 * declaration id, because it would then be able to address a Page it does not own.
 *
 * WHAT IT REFUSES. A key no resolver knows, a resolver that answers `null`, a destination that is not an admissible
 * absolute `mailto:` or `https:` URL, and a destination containing credentials or a control character. A refused
 * reference is simply absent from the table, so the renderer keeps its inert text: no fallback destination is invented
 * and no error page confirms that a capability exists.
 *
 * WHAT IT IS NOT. It is not a router, a redirect, a prefetch or a probe. It performs no I/O and reads no request; the
 * caller supplies resolvers that were composed from infrastructure it already trusts.
 */
import { classifyAuthorDestination } from "../safe-author-url";

/** One resolved reference: the application key that answered, and the destination it authorised. */
export interface UnoApplicationLinkResolution {
  readonly key: string;
  readonly href: string;
}

/** A resolver answers for the application keys it owns, or nothing at all. */
export type UnoApplicationLinkResolver = (key: string) => UnoApplicationLinkResolution | null;

/** True when a resolved destination is admissible for a generic application link. */
export function isAdmissibleApplicationHref(href: unknown): href is string {
  if (typeof href !== "string") return false;
  const verdict = classifyAuthorDestination(href);
  // Only the two categories the established authoring contract admits: a mailbox and a public `https` URL. `tel:` is
  // deliberately excluded here, exactly as it is excluded from every other authored destination.
  if (!verdict.accepted || (verdict.category !== "mailto" && verdict.category !== "https")) return false;
  if (/[\r\n\u0000-\u001f\u007f]/u.test(href)) return false;
  if (verdict.category === "mailto") {
    // A mailbox and nothing else. The classifier admits the `mailto` scheme; this boundary additionally refuses a
    // `?`, `&`, `,`, `;`, `%`, quote or space in the address, so the destination cannot carry a second recipient, a
    // subject or an injected header.
    const address = href.slice("mailto:".length);
    if (/[?&=,;%\s"'<>()[\]\\]/u.test(address)) return false;
    if (!/^[^@]+@[^@.]+(?:\.[^@.]+)+$/u.test(address)) return false;
  }
  if (verdict.category === "https") {
    try {
      const url = new URL(href);
      if (url.username !== "" || url.password !== "") return false;
    } catch {
      return false;
    }
  }
  return true;
}

/** The declarations one Page carries: id → application key. Only the key crosses into a resolver. */
export type UnoApplicationLinkDeclarations = Readonly<Record<string, { readonly key: string }>>;

/**
 * Resolve every declared reference once, through the resolver that claims its key.
 *
 * The returned table is keyed by **declaration id**, which is what the renderer holds, and each value is the
 * destination the resolver authorised. A declaration whose key nobody claims, or whose answer is inadmissible, is
 * absent — never mapped to an empty string, so a renderer test for `has()` is meaningful.
 */
export function resolveUnoApplicationLinks(
  declarations: UnoApplicationLinkDeclarations | undefined,
  resolvers: readonly UnoApplicationLinkResolver[],
): ReadonlyMap<string, string> {
  const resolved = new Map<string, string>();
  if (declarations === undefined) return resolved;

  for (const [id, declaration] of Object.entries(declarations)) {
    const key = declaration?.key;
    if (typeof key !== "string" || key.length === 0) continue;
    for (const resolver of resolvers) {
      const answer = resolver(key);
      if (answer === null) continue;
      // A resolver may only answer for the key it was asked about, and only with an admissible destination.
      if (answer.key !== key || !isAdmissibleApplicationHref(answer.href)) break;
      resolved.set(id, answer.href);
      break;
    }
  }

  return resolved;
}
