/**
 * Foundation Uno — the shared contact authorization policy (`U05`, strengthened).
 *
 * WHAT THIS IS. ONE decision, used by the renderer and by the submission handler, that answers whether a contact
 * form may be shown and whether one submission may be attempted. Render and submit therefore cannot disagree:
 * they are the same function over the same facts.
 *
 * THE AUTHORITY IS THE SERVER'S. A submission carries a claimed form reference and a claimed page path, and
 * neither is trusted. The handler re-establishes the publication for the Page it actually served, reads the form
 * reference from that Page's own validated document, and refuses a claim that differs. A client cannot post to a
 * disabled Site, a Page it never received, another Site's form, or a path it invented.
 *
 * WHAT IT IS NOT. It is not a transport, a limiter, a validator of field content, or an identity system. It reads
 * no request, no clock, no environment and no filesystem; the caller supplies every fact and keeps every side
 * effect.
 */

/** Why a form or a submission is not allowed. Closed, and safe to answer with. */
export type UnoContactRefusalReason =
  | "contact:publication-unproven"
  | "contact:form-undeclared"
  | "contact:form-mismatch"
  | "contact:page-mismatch"
  | "contact:site-disabled"
  | "contact:form-disabled"
  | "contact:transport-unavailable";

/** The closed vocabulary as data, so a caller can enumerate it without copying literals. */
export const UNO_CONTACT_REFUSAL_REASONS: readonly UnoContactRefusalReason[] = Object.freeze([
  "contact:publication-unproven",
  "contact:form-undeclared",
  "contact:form-mismatch",
  "contact:page-mismatch",
  "contact:site-disabled",
  "contact:form-disabled",
  "contact:transport-unavailable",
] as const);

/** The public outcome of a refusal: `off` is a deliberate configuration, `unavailable` an operator problem. */
export type UnoContactRefusalOutcome = "off" | "unavailable" | "unauthorized";

/** The publication facts the server established for the request it served. Never from the client. */
export interface UnoContactPublicationFacts {
  /** True only when the Page itself was planned and served for this request. */
  readonly served: boolean;
  /** True only when that Page is public. */
  readonly public: boolean;
  readonly siteId: string;
  readonly facetId: string;
  /** The Page's own route path, as the planner proved it. */
  readonly routePath: string;
  readonly localeTag: string;
}

/** The form declaration read from the served Page's validated document. */
export interface UnoContactFormDeclaration {
  /** True only when the served Page declared exactly one contact form. */
  readonly declared: boolean;
  /** The stable form reference authored for that Page, or `null` when none was declared. */
  readonly formRef: string | null;
}

/** The authored enablement of the Site and the form, plus the transport an operator configured. */
export interface UnoContactEnablement {
  readonly site: "enabled" | "disabled" | "undeclared";
  readonly form: "enabled" | "disabled" | "undeclared";
  /** `none` means no transport is configured, so the honest answer is `unavailable`, never a fake success. */
  readonly transport: "offline" | "provider" | "none";
}

/** The identity one authorised submission is bound to. Every field came from the server. */
export interface UnoContactFormIdentity {
  readonly siteId: string;
  readonly facetId: string;
  readonly formRef: string;
  readonly routePath: string;
  readonly localeTag: string;
  readonly transport: "offline" | "provider";
}

/** The decision: allowed with a bound identity, or refused with a closed outcome and reason. */
export type UnoContactAuthorization =
  | { readonly kind: "allowed"; readonly identity: UnoContactFormIdentity }
  | { readonly kind: "refused"; readonly outcome: UnoContactRefusalOutcome; readonly reason: UnoContactRefusalReason };

/** Build one refusal. */
function refuse(outcome: UnoContactRefusalOutcome, reason: UnoContactRefusalReason): UnoContactAuthorization {
  return Object.freeze({ kind: "refused", outcome, reason });
}

/** The identity one allowed decision binds, built from server facts only. */
function allowed(input: {
  readonly publication: UnoContactPublicationFacts;
  readonly declaration: UnoContactFormDeclaration;
  readonly enablement: UnoContactEnablement;
}): UnoContactAuthorization {
  const formRef = input.declaration.formRef;
  const transport = input.enablement.transport;
  if (formRef === null) return refuse("off", "contact:form-undeclared");
  if (transport === "none") return refuse("unavailable", "contact:transport-unavailable");
  return Object.freeze({
    kind: "allowed",
    identity: Object.freeze({
      siteId: input.publication.siteId,
      facetId: input.publication.facetId,
      formRef,
      routePath: input.publication.routePath,
      localeTag: input.publication.localeTag,
      transport,
    }),
  });
}

/**
 * Decide whether the contact surface is available at all, for a render that has no submission.
 *
 * This is the renderer's question, and it is the same policy: an unproven publication, an undeclared form, a
 * disabled Site or form, and a missing transport all hide the live form. The renderer shows the honest notice
 * instead, so "delivery is off" stays a structural fact rather than a client-side assumption.
 */
export function authorizeUnoContactRender(input: {
  readonly publication: UnoContactPublicationFacts;
  readonly declaration: UnoContactFormDeclaration;
  readonly enablement: UnoContactEnablement;
}): UnoContactAuthorization {
  const { publication, declaration, enablement } = input;
  if (publication.served !== true) return refuse("unauthorized", "contact:publication-unproven");
  if (declaration.declared !== true) return refuse("off", "contact:form-undeclared");
  if (enablement.site !== "enabled") return refuse("off", "contact:site-disabled");
  if (enablement.form !== "enabled") return refuse("off", "contact:form-disabled");
  return allowed({ publication, declaration, enablement });
}

/**
 * Decide whether one submission may be attempted.
 *
 * The order is deliberate: prove the publication, then the declaration, then the two client claims, then the
 * authored enablement, then the transport. A refusal names the first failed step only, so the answer can never be
 * used to probe a later one.
 */
export function authorizeUnoContactSubmission(input: {
  readonly publication: UnoContactPublicationFacts;
  readonly declaration: UnoContactFormDeclaration;
  readonly enablement: UnoContactEnablement;
  readonly submission: {
    readonly formRef: string | null;
    readonly page: string | null;
    readonly siteId: string | null;
  };
}): UnoContactAuthorization {
  const { publication, declaration, enablement, submission } = input;
  if (publication.served !== true || publication.public !== true) {
    return refuse("unauthorized", "contact:publication-unproven");
  }
  if (declaration.declared !== true) return refuse("off", "contact:form-undeclared");
  if (submission.formRef === null || submission.formRef !== declaration.formRef) {
    return refuse("unauthorized", "contact:form-mismatch");
  }
  if (submission.page === null || submission.page !== publication.routePath) {
    return refuse("unauthorized", "contact:page-mismatch");
  }
  // The Site is never taken from the submission; when a client names one it must agree with the served Page.
  if (submission.siteId !== null && submission.siteId !== publication.siteId) {
    return refuse("unauthorized", "contact:publication-unproven");
  }
  if (enablement.site !== "enabled") return refuse("off", "contact:site-disabled");
  if (enablement.form !== "enabled") return refuse("off", "contact:form-disabled");
  return allowed({ publication, declaration, enablement });
}
