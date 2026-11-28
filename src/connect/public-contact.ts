/**
 * Foundation Uno — Connect public-contact projection.
 *
 * PROVENANCE. Adapted from the Owner-owned Connect module's `projectPublicContact` contract (Foundation
 * reference `modules/connect/src`), incorporated under Uno's main Apache-2.0 licence by Owner direction of
 * 2026-11-28. The decision shape is preserved exactly — `available` / `absent` / `unavailable` are three
 * outcomes and flattening them to a boolean would be the defect — while the Uno adaptation narrows the inputs to
 * what a single-Entity installation can prove. See `src/connect/PROVENANCE.md`.
 *
 * WHAT THIS DECIDES. Whether ONE Site may publish ONE of its own authored contact methods as a literal
 * `mailto:`/`tel:` destination, given (a) authority the runtime already verified and (b) the Site's own authored
 * declaration. It builds the destination here, once, so no caller assembles a second spelling of the rule.
 *
 * WHAT IT REFUSES. A declaration for another Site (by key or by embedded id), a declaration whose authorised
 * publication reference differs from the verified one, a publication that is not public, an identifier that is
 * not brandable, a method that is suppressed or revoked, a method that does not explicitly expose itself as
 * public contact, an address or number that does not match the closed shape, and a `mailto:` that could carry a
 * header, a parameter, a second recipient or a newline.
 *
 * WHAT IT IS NOT. It is not a transport, a directory, a form, a submission path or an address book. It never
 * sends, resolves, probes or caches anything; it returns a string a caller may render as an anchor.
 */
import {
  identifier,
  type AuthorizationIdentifier,
  type DeploymentIdentifier,
  type OwnerIdentifier,
  type PublisherIdentifier,
  type SiteIdentifier,
} from "./identifier";

/** The two channels a public contact fact can use. Nothing else is admissible. */
export const PUBLIC_CONTACT_CHANNELS = Object.freeze(["email", "telephone"] as const);
export type PublicContactChannel = (typeof PUBLIC_CONTACT_CHANNELS)[number];

/** The one exposure token: a fact reaches a public surface only when it names this token explicitly. */
export const PUBLIC_CONTACT_EXPOSURE = "publicContact" as const;

/** The closed bounds. Each is a limit, never a default. */
export const PUBLIC_CONTACT_LIMITS = Object.freeze({ methods: 4, labelLength: 80, valueLength: 254 });

/** One authored method of one Site. */
export interface PublicContactMethodDeclaration {
  readonly channel: PublicContactChannel;
  /** The authored address or number, exactly as the owner wrote it. */
  readonly value: string;
  /** An authored label; when absent the destination itself is the label. */
  readonly label?: string;
  /** Exposure tokens. Only `publicContact` is admissible, and it is required for the method to project. */
  readonly expose?: readonly string[];
  /** An explicit suppression: the fact exists but must not be published. */
  readonly suppressed?: boolean;
  /** An explicit revocation: the fact was published once and must not be published now. */
  readonly revoked?: boolean;
  /** Where the fact was authored, recorded as provenance and never rendered as an address. */
  readonly origin?: { readonly level: string; readonly id: string };
}

/** One Site's authored contact declaration. */
export interface PublicContactSiteDeclaration {
  /** The Site this declaration speaks for; must equal the verified Site. */
  readonly siteId: string;
  /** The publication reference the owner authorised; must equal the verified reference. */
  readonly authorizationRef: string;
  readonly methods: readonly PublicContactMethodDeclaration[];
}

/** The whole authored configuration, keyed by EFS Site id so a Site can only ever speak for itself. */
export interface PublicContactConfiguration {
  readonly sites: Readonly<Record<string, PublicContactSiteDeclaration>>;
}

/** The authority a render already holds. Every field is runtime-proved, never authored and never visitor-supplied. */
export interface PublicContactAuthority {
  readonly deploymentId: string;
  readonly ownerId: string;
  readonly siteId: string;
  readonly authorizationRef: string;
  readonly publisherRef?: string;
  /** True only when the publication being rendered is public. */
  readonly publicationPublic: boolean;
}

/** One projected, renderable method. `href` is a finished literal destination. */
export interface PublicContactMethod {
  readonly channel: PublicContactChannel;
  readonly href: string;
  readonly label: string;
  readonly origin?: { readonly level: string; readonly id: string };
}

/** Why a projection is not available. Closed, and never derived from an authored value. */
export type PublicContactUnavailableReason =
  | "not-declared"
  | "nothing-exposed"
  | "scope-mismatch"
  | "publication-mismatch"
  | "unauthorized"
  | "malformed";

/** The three outcomes. They are not interchangeable. */
export type PublicContactProjection =
  | { readonly kind: "available"; readonly methods: readonly PublicContactMethod[] }
  | { readonly kind: "absent"; readonly reason: "not-declared" | "nothing-exposed" }
  | {
      readonly kind: "unavailable";
      readonly reason: Exclude<PublicContactUnavailableReason, "not-declared" | "nothing-exposed">;
    };

/**
 * A conservative public mailbox: a dot-atom local part and a dotted domain.
 *
 * Narrow on purpose. It must never admit a character a `mailto:` could read as a header separator
 * (`?`, `&`, `=`, `,`, `;`), a percent escape, whitespace or a quote — so a public destination cannot be turned
 * into a second recipient or an injected header by authoring.
 */
const EMAIL_PATTERN =
  /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/u;

/** The characters that would let a public address carry anything but itself. */
const MAILTO_FORBIDDEN = /[?&=,;\s"'<>()[\]\\%\u0000-\u001f\u007f]/u;

/** A public telephone number in international form: `+`, then grouped digits. */
const TELEPHONE_PATTERN = /^\+[0-9]{1,3}(?:[ -]?[0-9]{2,4}){2,6}$/u;

/** True when one authored value is exactly one publishable public mailbox. */
export function isPublicMailbox(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= PUBLIC_CONTACT_LIMITS.valueLength &&
    !MAILTO_FORBIDDEN.test(value) &&
    EMAIL_PATTERN.test(value)
  );
}

/** True when one authored value is exactly one publishable international number. */
export function isPublicTelephone(value: unknown): value is string {
  if (typeof value !== "string" || value.length === 0 || value.length > 32) return false;
  if (!TELEPHONE_PATTERN.test(value)) return false;
  const digits = value.replace(/[^0-9]/gu, "");
  return digits.length >= 7 && digits.length <= 20;
}

/** Build the finished destination for one validated value. Nothing is appended, encoded or rewritten. */
function destinationFor(channel: PublicContactChannel, value: string): string {
  return channel === "email" ? `mailto:${value}` : `tel:${value.replace(/[ -]/gu, "")}`;
}

/** True when a method explicitly exposes itself as public contact. */
function exposesPublicContact(method: PublicContactMethodDeclaration): boolean {
  return Array.isArray(method.expose) && method.expose.includes(PUBLIC_CONTACT_EXPOSURE);
}

/** One read attempt: a method, a deliberate skip, or a malformed refusal. */
type MethodRead =
  | { readonly ok: true; readonly method: PublicContactMethod }
  | { readonly ok: false; readonly skip: true }
  | { readonly ok: false; readonly skip: false };

/** Read one authored method. Suppressed, revoked and unexposed facts are skipped; anything else malformed refuses. */
function readMethod(candidate: unknown): MethodRead {
  if (typeof candidate !== "object" || candidate === null) return { ok: false, skip: false };
  const method = candidate as PublicContactMethodDeclaration;
  if (method.suppressed === true || method.revoked === true) return { ok: false, skip: true };
  if (!exposesPublicContact(method)) return { ok: false, skip: true };
  if (method.channel !== "email" && method.channel !== "telephone") return { ok: false, skip: false };

  const valid = method.channel === "email" ? isPublicMailbox(method.value) : isPublicTelephone(method.value);
  if (!valid || typeof method.value !== "string") return { ok: false, skip: false };

  const label =
    typeof method.label === "string" &&
    method.label.trim().length > 0 &&
    method.label.length <= PUBLIC_CONTACT_LIMITS.labelLength
      ? method.label
      : method.value;
  const destination = destinationFor(method.channel, method.value);
  if (method.channel === "email" && MAILTO_FORBIDDEN.test(destination.slice("mailto:".length))) {
    return { ok: false, skip: false };
  }

  return {
    ok: true,
    method: Object.freeze({
      channel: method.channel,
      href: destination,
      label,
      ...(method.origin === undefined
        ? {}
        : { origin: Object.freeze({ level: String(method.origin.level), id: String(method.origin.id) }) }),
    }),
  };
}
/**
 * Project one Site's public contact methods.
 *
 * Order of proof: brand the verified identity, find the Site's own declaration, check the scope and the
 * authorised publication, check that the publication is public, read each method, and only then answer. A
 * malformed method makes the projection `unavailable` rather than silently dropping it, so an owner learns their
 * declaration is broken instead of wondering why nothing renders.
 */
export function projectPublicContact(input: {
  readonly authority: PublicContactAuthority;
  readonly configuration: PublicContactConfiguration | undefined;
}): PublicContactProjection {
  const deploymentId: DeploymentIdentifier | null = identifier.deployment(input.authority.deploymentId);
  const ownerId: OwnerIdentifier | null = identifier.owner(input.authority.ownerId);
  const siteId: SiteIdentifier | null = identifier.site(input.authority.siteId);
  const authorizationRef: AuthorizationIdentifier | null = identifier.authorization(input.authority.authorizationRef);
  if (deploymentId === null || ownerId === null || siteId === null || authorizationRef === null) {
    return { kind: "unavailable", reason: "malformed" };
  }
  if (input.authority.publisherRef !== undefined) {
    const branded: PublisherIdentifier | null = identifier.publisher(input.authority.publisherRef);
    if (branded === null) return { kind: "unavailable", reason: "malformed" };
  }

  const configuration = input.configuration;
  if (configuration === undefined || typeof configuration !== "object" || configuration.sites === undefined) {
    return { kind: "absent", reason: "not-declared" };
  }

  let declared: PublicContactSiteDeclaration | undefined;
  try {
    declared = Object.prototype.hasOwnProperty.call(configuration.sites, siteId)
      ? configuration.sites[siteId]
      : undefined;
  } catch {
    return { kind: "unavailable", reason: "malformed" };
  }
  if (declared === undefined) return { kind: "absent", reason: "not-declared" };

  if (declared.siteId !== siteId) return { kind: "unavailable", reason: "scope-mismatch" };
  if (declared.authorizationRef !== authorizationRef) return { kind: "unavailable", reason: "publication-mismatch" };
  if (input.authority.publicationPublic !== true) return { kind: "unavailable", reason: "unauthorized" };

  const declaredMethods = Array.isArray(declared.methods) ? declared.methods : null;
  if (declaredMethods === null || declaredMethods.length > PUBLIC_CONTACT_LIMITS.methods) {
    return { kind: "unavailable", reason: "malformed" };
  }

  const methods: PublicContactMethod[] = [];
  for (const candidate of declaredMethods) {
    const read = readMethod(candidate);
    if (!read.ok) {
      if (read.skip) continue;
      return { kind: "unavailable", reason: "malformed" };
    }
    // One destination per channel: a second address of the same channel is a duplicate, not a choice.
    if (methods.some((method) => method.channel === read.method.channel)) continue;
    methods.push(read.method);
  }

  if (methods.length === 0) return { kind: "absent", reason: "nothing-exposed" };
  return { kind: "available", methods: Object.freeze(methods) };
}

/**
 * The single link a page document can ask for: the Site's primary public destination for one channel.
 *
 * Authored order is the owner's order, so the first available method of that channel is the primary one. A page
 * has one link slot here, so choosing silently would be worse than choosing first.
 */
export function primaryPublicContactHref(
  projection: PublicContactProjection,
  channel: PublicContactChannel = "email",
): string | null {
  if (projection.kind !== "available") return null;
  for (const method of projection.methods) {
    if (method.channel === channel) return method.href;
  }
  return null;
}

