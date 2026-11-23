/**
 * Foundation Uno — the prepared Page-delivery candidate (`UNO-WO-026 / R01`, U03).
 *
 * WHAT THIS IS. One pure application use case that gathers what the repository *already* knows about one
 * address — the committed Site and locale authority, the proposed canonical base, the exact matched
 * candidate, an already-confined source load, the projected Page header and the discoverability intent —
 * into a single, deeply frozen, **non-serving** candidate record.
 *
 * WHAT THIS IS NOT. It opens no file, network, clock, environment or provider; it creates no route, no
 * redirect, no HTTP response, no status, no rendered HTML, no `hreflang` tag, no sitemap entry and no metadata
 * emission. It never chooses a production origin: the base is the caller's *proposed* value, validated by the
 * accepted canonical-base contract, and the canonical URL it reports is labelled `ifServed` for exactly that
 * reason. Nothing here publishes a Site or a Page, and no flag it returns authorises publication.
 *
 * PROVENANCE. Original **Uno-owned** implementation, class **NEW**; the pinned read-only Foundation GEO-03
 * commit `c05c55ea61b5347cf5032211dd0bf37f2cc5083c` remains conceptual context only. No Foundation, Solo or
 * Connect code, media or brand is imported, and Apache-2.0 notices are unchanged.
 */
import { HOME_CONTENT_SLUG } from "../core/page-content";
import type { PageSourceKind, PageVisibility } from "../core/page-authoring-policy";
import {
  readUnoPageDocument,
  type UnoPageDocument,
  type UnoPageDocumentRefusal,
} from "../core/page-document";
import { matchUnoCandidateRoute, matchUnoSiteRouteCandidate, type UnoRouteCandidate } from "../core/efs/uno-route-address";
import { classifyUnoPageDiscoverability } from "../core/efs/uno-discovery-policy";
import { resolveUnoCommittedBase } from "./resolve-uno-committed-base";
import { resolveUnoCommittedLocales } from "./resolve-uno-committed-locales";
import { resolveUnoPageHeader } from "./resolve-uno-page-header";
import {
  validateUnoSitePublicationInputs,
  type UnoSitePublicationAccepted,
} from "./validate-uno-site-publication-inputs";

/**
 * The closed refusal vocabulary: one literal per failure family.
 *
 * Every reason is a fixed string this module owns, so a refusal can never echo a pathname, a host, a title,
 * a body, a header or an exception.
 */
export type UnoDeliveryRefusal =
  | "delivery:input-invalid"
  | "delivery:unreadable"
  | "delivery:committed-locales-invalid"
  | "delivery:site-inputs-invalid"
  | "delivery:route-invalid"
  | "delivery:load-refused"
  | "delivery:candidate-mismatch"
  | "delivery:header-invalid"
  | "delivery:document-invalid"
  | "delivery:discovery-invalid"
  | "delivery:canonical-too-long";

/** The same vocabulary as frozen data, so a caller can assert membership without copying literals. */
export const UNO_DELIVERY_REFUSAL_REASONS: readonly UnoDeliveryRefusal[] = Object.freeze([
  "delivery:input-invalid",
  "delivery:unreadable",
  "delivery:committed-locales-invalid",
  "delivery:site-inputs-invalid",
  "delivery:route-invalid",
  "delivery:load-refused",
  "delivery:candidate-mismatch",
  "delivery:header-invalid",
  "delivery:document-invalid",
  "delivery:discovery-invalid",
  "delivery:canonical-too-long",
] as const);

/** The five own-data keys the request may carry; anything else refuses rather than being ignored. */
export const UNO_DELIVERY_INPUT_KEYS: readonly string[] = Object.freeze([
  "manifest",
  "selection",
  "base",
  "pathname",
  "loadedSource",
] as const);

/**
 * The six own-data keys a **version-2, Site-qualified** request may carry (`UNO-WO-090 / R01`, P3).
 *
 * `site` names one qualified Site inside the already validated multi-Site address declaration and `host` is the exact
 * request Host to match against the configured bindings. Neither is a source of authority: the base and the locale
 * policy come from that binding's own declaration, and `host` can only ever select a binding that is already declared.
 */
export const UNO_DELIVERY_INPUT_KEYS_V2: readonly string[] = Object.freeze([
  "manifest",
  "selection",
  "site",
  "host",
  "pathname",
  "loadedSource",
] as const);

/** The exact keys an accepted confined-source loader result carries. */
export const UNO_DELIVERY_LOADED_SOURCE_KEYS: readonly string[] = Object.freeze([
  "accepted",
  "candidate",
  "kind",
  "text",
] as const);

/** A total cap on the hypothetical canonical URL. A limit, not a truncation: exceeding it refuses. */
export const UNO_DELIVERY_CANONICAL_URL_MAX_BYTES = 384;

/** The six existing eligibility flags this record copies unchanged from the discoverability policy. */
export interface UnoDeliveryEligibility {
  readonly navigation: boolean;
  readonly sitemap: boolean;
  readonly hreflang: boolean;
  readonly xDefault: boolean;
  readonly languageSwitch: boolean;
  readonly automaticLocaleRedirectTarget: boolean;
}

/** The address and authored identity of the candidate this record describes. */
export interface UnoDeliveryIdentity {
  readonly entityId: string;
  readonly facetId: string;
  readonly siteId: string;
  readonly pageId: string;
  readonly localeTag: string;
  readonly pathname: string;
}

/** The authored document as declared: a header, raw unrendered Markdown, and the validated JSON Page. */
export interface UnoDeliveryDocument {
  readonly kind: PageSourceKind;
  readonly title: string;
  readonly description?: string;
  readonly visibility: PageVisibility;
  readonly markdownBody?: string;
  /**
   * The accepted version-1 JSON Page document, present only when the selected JSON source also validated as a
   * Page document. A JSON Page without it is not renderable and must not be served.
   */
  readonly pageDocument?: UnoPageDocument;
  /**
   * Why a present JSON source is not a renderable Page document. Carried so the serving gate can refuse with the
   * exact closed reason instead of collapsing every document failure into one opaque message.
   */
  readonly pageDocumentRefusal?: UnoPageDocumentRefusal;
}

/** What a *future* server would be allowed to advertise, if the Owner ever published this Page. */
export interface UnoDeliveryIfServed {
  readonly canonicalUrl: string;
  readonly robots: "noindex,nofollow" | null;
  readonly eligibleIfPublished: UnoDeliveryEligibility;
}

/** The accepted, non-serving candidate record. */
export interface UnoDeliveryAccepted {
  readonly accepted: true;
  readonly identity: UnoDeliveryIdentity;
  readonly document: UnoDeliveryDocument;
  readonly ifServed: UnoDeliveryIfServed;
}

/** The refused read: one closed literal and no partial candidate. */
export type UnoDeliveryRefusalResult = {
  readonly accepted: false;
  readonly reason: UnoDeliveryRefusal;
};

/** Anything this use case returns. */
export type UnoDeliveryResult = UnoDeliveryAccepted | UnoDeliveryRefusalResult;

/** A plain own-data view of an untrusted object. */
type DataRecord = Readonly<Record<string, unknown>>;

/** Internal marker for structure that must not be read at all; never escapes this module. */
class HostileStructure extends Error {}

/** One bounded refusal, used for every early exit. */
function refuseDelivery(reason: UnoDeliveryRefusal): UnoDeliveryRefusalResult {
  return Object.freeze({ accepted: false, reason });
}

/**
 * Read an untrusted value as a plain record of own enumerable **data** properties.
 *
 * A non-object (including `null` and an array) answers `null`; a non-plain prototype, any symbol key or any
 * accessor throws `HostileStructure`, so no getter is invoked while the request is being classified.
 */
function readPlainData(value: unknown): DataRecord | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) throw new HostileStructure();
  if (Object.getOwnPropertySymbols(value).length > 0) throw new HostileStructure();
  const copy = Object.create(null) as Record<string, unknown>;
  for (const key of Object.keys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor === undefined || !("value" in descriptor)) throw new HostileStructure();
    copy[key] = descriptor.value;
  }
  return copy;
}

/** Exactly the declared keys, no more and no fewer. */
function hasExactlyKeys(record: DataRecord, keys: readonly string[]): boolean {
  const own = Object.keys(record);
  if (own.length !== keys.length) return false;
  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(record, key)) return false;
  }
  return true;
}

/** A bounded, non-empty list of own-data entries, or `null` when the value is not one. */
function readEntryList(value: unknown, max: number): readonly DataRecord[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > max) return null;
  const entries: DataRecord[] = [];
  for (const entry of value) {
    const record = readPlainData(entry);
    if (record === null) return null;
    entries.push(record);
  }
  return entries;
}

/** Deep-freeze a freshly built structure so no caller can later rewrite an accepted candidate. */
function deepFreeze<T>(value: T): T {
  if (typeof value !== "object" || value === null) return value;
  for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  return Object.freeze(value);
}

/** True only for a string this module can prove is ASCII, so a character count is a byte count. */
function isAscii(value: string): boolean {
  for (const character of value) {
    const point = character.codePointAt(0);
    if (point === undefined || point > 0x7f) return false;
  }
  return true;
}


/**
 * Prepare the delivery candidate for one exact address of the one selected Site.
 *
 * The request must be exactly `{manifest, selection, base, pathname, loadedSource}`. The stored Site locale
 * authority is read first and its **stored** policy — never a caller-supplied one — is what the site-input
 * validator receives, so the same manifest, selection and proposed base must agree with each other before any
 * address is considered. The authoritative candidate then comes from the route matcher, and the supplied loader
 * result is accepted only if it describes that same candidate field for field, with the same declared sources in
 * the same order. Header and discoverability are then taken from their own accepted policies; this use case
 * copies their answers and re-implements neither.
 */
export function prepareUnoPageDeliveryCandidate(input: unknown): UnoDeliveryResult {
  try {
    const request = readPlainData(input);
    if (request === null) return refuseDelivery("delivery:input-invalid");

    const loadedSource = request["loadedSource"];
    // The presence of `site` alone selects the version-2, Site-qualified path (`UNO-WO-090 / R01`, P3), so a legacy
    // request is never reinterpreted and a multi-Site declaration is never read as a legacy selection.
    const qualified = Object.prototype.hasOwnProperty.call(request, "site");

    let siteInputs: UnoSitePublicationAccepted;
    let candidate: UnoRouteCandidate;

    if (qualified) {
      if (!hasExactlyKeys(request, UNO_DELIVERY_INPUT_KEYS_V2)) {
        return refuseDelivery("delivery:input-invalid");
      }
      const manifest = request["manifest"];
      const selection = request["selection"];
      const site = request["site"];
      const host = request["host"];
      const pathname = request["pathname"];
      for (const value of [manifest, selection, site, loadedSource]) {
        if (typeof value !== "object" || value === null || Array.isArray(value)) {
          return refuseDelivery("delivery:input-invalid");
        }
      }
      if (typeof host !== "string" || typeof pathname !== "string") {
        return refuseDelivery("delivery:input-invalid");
      }

      // Both the base and the locale policy are read from the named binding's own declaration; `host` is only ever
      // compared against configured bindings, so a request header can neither grant nor move an identity.
      const declaredBase = resolveUnoCommittedBase({ manifest, selection, site });
      if (!declaredBase.accepted) return refuseDelivery("delivery:site-inputs-invalid");

      const siteLocales = resolveUnoCommittedLocales({ manifest, selection, site });
      if (!siteLocales.accepted) return refuseDelivery("delivery:committed-locales-invalid");

      const qualifiedInputs = validateUnoSitePublicationInputs({
        manifest,
        selection,
        site,
        base: { canonical: declaredBase.base.canonical, aliases: [...declaredBase.base.aliases] },
        localePolicy: siteLocales.localePolicy,
      });
      if (!qualifiedInputs.accepted) return refuseDelivery("delivery:site-inputs-invalid");

      const qualifiedMatch = matchUnoSiteRouteCandidate(host, pathname, manifest, selection);
      if (!qualifiedMatch.accepted) return refuseDelivery("delivery:route-invalid");
      if (
        qualifiedMatch.candidate.facetId !== qualifiedInputs.site.facetId ||
        qualifiedMatch.candidate.siteId !== qualifiedInputs.site.siteId
      ) {
        return refuseDelivery("delivery:route-invalid");
      }

      siteInputs = qualifiedInputs;
      candidate = qualifiedMatch.candidate;
    } else {
      if (!hasExactlyKeys(request, UNO_DELIVERY_INPUT_KEYS)) {
        return refuseDelivery("delivery:input-invalid");
      }

      const manifest = request["manifest"];
      const selection = request["selection"];
      const base = request["base"];
      const pathname = request["pathname"];
      for (const value of [manifest, selection, base, loadedSource]) {
        if (typeof value !== "object" || value === null || Array.isArray(value)) {
          return refuseDelivery("delivery:input-invalid");
        }
      }

      const stored = resolveUnoCommittedLocales({ manifest, selection });
      if (!stored.accepted) return refuseDelivery("delivery:committed-locales-invalid");

      const legacyInputs = validateUnoSitePublicationInputs({
        manifest,
        selection,
        base,
        localePolicy: stored.localePolicy,
      });
      if (!legacyInputs.accepted) return refuseDelivery("delivery:site-inputs-invalid");
      if (
        legacyInputs.site.entityId !== stored.site.entityId ||
        legacyInputs.site.facetId !== stored.site.facetId ||
        legacyInputs.site.siteId !== stored.site.siteId
      ) {
        return refuseDelivery("delivery:site-inputs-invalid");
      }

      const matched = matchUnoCandidateRoute(pathname, manifest, selection);
      if (!matched.accepted) return refuseDelivery("delivery:route-invalid");

      siteInputs = legacyInputs;
      candidate = matched.candidate;
    }

    const load = readPlainData(loadedSource);
    if (load === null) return refuseDelivery("delivery:load-refused");
    if (!Object.prototype.hasOwnProperty.call(load, "accepted") || load["accepted"] !== true) {
      return refuseDelivery("delivery:load-refused");
    }
    if (!hasExactlyKeys(load, UNO_DELIVERY_LOADED_SOURCE_KEYS)) return refuseDelivery("delivery:load-refused");


    const loadedCandidate = readPlainData(load["candidate"]);
    if (loadedCandidate === null) return refuseDelivery("delivery:candidate-mismatch");
    for (const field of [
      "entityId",
      "facetId",
      "siteId",
      "pageId",
      "localeTag",
      "localePathKey",
      "routePath",
      "pathname",
    ] as const) {
      if (loadedCandidate[field] !== candidate[field]) return refuseDelivery("delivery:candidate-mismatch");
    }

    const loadedSources = readEntryList(loadedCandidate["sources"], candidate.sources.length);
    if (loadedSources === null || loadedSources.length !== candidate.sources.length) {
      return refuseDelivery("delivery:candidate-mismatch");
    }
    for (let index = 0; index < loadedSources.length; index += 1) {
      const declared = candidate.sources[index];
      const supplied = loadedSources[index];
      if (declared === undefined || supplied === undefined) return refuseDelivery("delivery:candidate-mismatch");
      if (supplied["kind"] !== declared.kind || supplied["path"] !== declared.path) {
        return refuseDelivery("delivery:candidate-mismatch");
      }
    }

    const loadedKind = load["kind"];
    const loadedText = load["text"];
    if ((loadedKind !== "json" && loadedKind !== "markdown") || typeof loadedText !== "string") {
      return refuseDelivery("delivery:candidate-mismatch");
    }

    // Only this rebuilt, fully checked loader shape reaches the header projector: no caller reference and no
    // undeclared field can travel with it.
    const forwardedCandidate = {
      entityId: candidate.entityId,
      facetId: candidate.facetId,
      siteId: candidate.siteId,
      pageId: candidate.pageId,
      localeTag: candidate.localeTag,
      localePathKey: candidate.localePathKey,
      routePath: candidate.routePath,
      pathname: candidate.pathname,
      sources: candidate.sources.map((source) => ({ kind: source.kind, path: source.path })),
    };
    const header = resolveUnoPageHeader({
      accepted: true,
      candidate: forwardedCandidate,
      kind: loadedKind,
      text: loadedText,
    });
    if (!header.accepted) return refuseDelivery("delivery:header-invalid");
    if (header.kind !== loadedKind) return refuseDelivery("delivery:header-invalid");

    // A selected JSON source must also be a complete version-1 Page document. The header projection above only
    // reads three bounded keys, so this is the step that decides whether a JSON Page has any renderable body at
    // all. A refusal is carried as a closed reason rather than thrown: publication authority (the manifest
    // `publication` gate) and renderability are separate decisions, and the serving gate is what refuses to emit
    // an unrenderable Page.
    let jsonDocument: UnoPageDocument | undefined;
    let jsonRefusal: UnoPageDocumentRefusal | undefined;
    if (loadedKind === "json") {
      const validated = readUnoPageDocument(loadedText, {
        reservedHome: candidate.pageId === HOME_CONTENT_SLUG,
      });
      if (!validated.accepted) {
        jsonRefusal = validated.reason;
      } else if (
        validated.document.title !== header.title ||
        validated.document.visibility !== header.visibility ||
        validated.document.description !== header.description
      ) {
        // The document and the accepted header are two projections of the same bytes; if they disagree, the
        // bytes are not one authority and the Page is refused instead of silently preferring one projection.
        return refuseDelivery("delivery:document-invalid");
      } else {
        jsonDocument = validated.document;
      }
    }

    const discovery = classifyUnoPageDiscoverability({
      kind: header.kind,
      routePath: candidate.pageId === HOME_CONTENT_SLUG ? HOME_CONTENT_SLUG : candidate.routePath,
      visibility: header.visibility,
    });
    if (!discovery.accepted) return refuseDelivery("delivery:discovery-invalid");


    const canonicalUrl = `${siteInputs.canonicalBase.origin}${siteInputs.canonicalBase.pathPrefix}${candidate.pathname}`;
    if (!isAscii(canonicalUrl) || canonicalUrl.length > UNO_DELIVERY_CANONICAL_URL_MAX_BYTES) {
      return refuseDelivery("delivery:canonical-too-long");
    }

    const document: {
      kind: PageSourceKind;
      title: string;
      description?: string;
      visibility: PageVisibility;
      markdownBody?: string;
      pageDocument?: UnoPageDocument;
      pageDocumentRefusal?: UnoPageDocumentRefusal;
    } = { kind: header.kind, title: header.title, visibility: header.visibility };
    if (header.description !== undefined) document.description = header.description;
    if (header.markdownBody !== undefined) document.markdownBody = header.markdownBody;
    if (jsonDocument !== undefined) document.pageDocument = jsonDocument;
    if (jsonRefusal !== undefined) document.pageDocumentRefusal = jsonRefusal;

    const eligibility = discovery.eligibleIfPublished;
    return deepFreeze({
      accepted: true as const,
      identity: {
        entityId: candidate.entityId,
        facetId: candidate.facetId,
        siteId: candidate.siteId,
        pageId: candidate.pageId,
        localeTag: candidate.localeTag,
        pathname: candidate.pathname,
      },
      document,
      ifServed: {
        canonicalUrl,
        robots: discovery.robotsIfDirectlyServed,
        eligibleIfPublished: {
          navigation: eligibility.navigation,
          sitemap: eligibility.sitemap,
          hreflang: eligibility.hreflang,
          xDefault: eligibility.xDefault,
          languageSwitch: eligibility.languageSwitch,
          automaticLocaleRedirectTarget: eligibility.automaticLocaleRedirectTarget,
        },
      },
    });
  } catch (error) {
    if (error instanceof HostileStructure) return refuseDelivery("delivery:input-invalid");
    return refuseDelivery("delivery:unreadable");
  }
}
