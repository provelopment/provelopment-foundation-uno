/**
 * Foundation Uno — the trusted published-Page planner (`UNO-WO-028 / R01`, U03).
 *
 * WHAT THIS IS. The one place that decides whether a **specific address** of the selected Site may be
 * served as a published Page, and what that Page would be. It composes — and repeats none of — the
 * accepted contracts: the manifest graph (including the Page's own `publication` declaration), the
 * stored Site locale authority, the selected Site, the proposed canonical base, the accepted route
 * matcher, the confined source load, the projected Page header and the discoverability intent.
 *
 * THE PUBLICATION GATE. Authoring existence, a `public` property, a matched route, a selected Site, a
 * valid base or an accepted delivery candidate is **not** publication. Only the candidate's own validated
 * manifest Page declaring `publication: "published"` — after every other contract has already accepted —
 * lets this planner return an accepted record, and even that record publishes nothing.
 *
 * WHAT THIS IS NOT. No file, environment, clock, network, adapter, provider, React or Next.js import; no
 * route, response, status, redirect, `hreflang` tag, sitemap entry or deployment decision. The base is a
 * caller **proposal** validated by the canonical-base contract, never a chosen production origin, and a
 * returned `delivery` block describes what a future server *could* advertise for an accepted Page.
 *
 * PROVENANCE. Original **Uno-owned** implementation, class **NEW**; the pinned read-only Foundation
 * GEO-03 commit `c05c55ea61b5347cf5032211dd0bf37f2cc5083c` is conceptual context only. No Foundation,
 * Solo or Connect code, media, brand or fixture is imported, and Apache-2.0 notices are unchanged.
 */
import type { PageSourceKind, PageVisibility } from "../core/page-authoring-policy";
import type { UnoPageDocument, UnoPageDocumentRefusal } from "../core/page-document";
import { validateUnoManifestGraph } from "../core/efs/manifest-graph";
import { matchUnoCandidateRoute } from "../core/efs/uno-route-address";
import { validateUnoCanonicalBase } from "../core/efs/uno-canonical-base";
import { validateUnoSiteSelection } from "../core/efs/uno-config";
import { resolveUnoCommittedLocales } from "./resolve-uno-committed-locales";
import {
  prepareUnoPageDeliveryCandidate,
  type UnoDeliveryEligibility,
  type UnoDeliveryRefusal,
} from "./prepare-uno-page-delivery-candidate";

/**
 * The closed refusal vocabulary: one literal per failure family.
 *
 * Every member is a fixed string this module owns, so no refusal can echo a pathname, a host, a title, a
 * body, an authored identifier or an exception.
 */
export type UnoPublicationRefusal =
  | "publication:input-invalid"
  | "publication:unreadable"
  | "publication:manifest-invalid"
  | "publication:selection-invalid"
  | "publication:base-invalid"
  | "publication:committed-locales-invalid"
  | "publication:site-inputs-invalid"
  | "publication:route-invalid"
  | "publication:source-refused"
  | "publication:header-invalid"
  | "publication:document-invalid"
  | "publication:discovery-invalid"
  | "publication:canonical-too-long"
  | "publication:page-missing"
  | "publication:not-published";

/** The same vocabulary as frozen data, so a caller can assert membership without copying literals. */
export const UNO_PUBLICATION_REFUSAL_REASONS: readonly UnoPublicationRefusal[] = Object.freeze([
  "publication:input-invalid",
  "publication:unreadable",
  "publication:manifest-invalid",
  "publication:selection-invalid",
  "publication:base-invalid",
  "publication:committed-locales-invalid",
  "publication:site-inputs-invalid",
  "publication:route-invalid",
  "publication:source-refused",
  "publication:header-invalid",
  "publication:document-invalid",
  "publication:discovery-invalid",
  "publication:canonical-too-long",
  "publication:page-missing",
  "publication:not-published",
] as const);

/** The five own-data keys the request may carry; anything else refuses rather than being ignored. */
export const UNO_PUBLICATION_INPUT_KEYS: readonly string[] = Object.freeze([
  "manifest",
  "selection",
  "base",
  "pathname",
  "loadedSource",
] as const);

/** The address and authored identity of the planned Page. */
export interface UnoPublishedPageIdentity {
  readonly entityId: string;
  readonly facetId: string;
  readonly siteId: string;
  readonly pageId: string;
  readonly localeTag: string;
  readonly localePathKey: string;
  readonly routePath: string;
  readonly pathname: string;
}

/** The authored document: a header, raw unrendered Markdown, and the validated JSON Page where present. */
export interface UnoPublishedPageDocument {
  readonly kind: PageSourceKind;
  readonly title: string;
  readonly description?: string;
  readonly visibility: PageVisibility;
  readonly markdownBody?: string;
  /** The accepted version-1 JSON Page document; its presence is what makes a JSON Page renderable. */
  readonly pageDocument?: UnoPageDocument;
  /** The closed reason a present JSON source is not a renderable Page document. */
  readonly pageDocumentRefusal?: UnoPageDocumentRefusal;
}

/** What a server may advertise for this accepted Page — still not a publication of anything. */
export interface UnoPublishedPageDelivery {
  readonly canonicalUrl: string;
  readonly robots: "noindex,nofollow" | null;
  readonly public: boolean;
  readonly unlisted: boolean;
  readonly indexable: boolean;
  readonly eligible: UnoDeliveryEligibility;
  readonly supportedLocales: readonly string[];
  readonly defaultLocale: string;
  readonly languagePreferences: Readonly<Record<string, string>>;
}

/** The accepted, non-serving published-Page record. */
export interface UnoPublishedPageAccepted {
  readonly accepted: true;
  readonly identity: UnoPublishedPageIdentity;
  readonly document: UnoPublishedPageDocument;
  readonly delivery: UnoPublishedPageDelivery;
}

/** The refused plan: one closed literal and no partial record. */
export type UnoPublishedPageRefused = {
  readonly accepted: false;
  readonly reason: UnoPublicationRefusal;
};

/** Anything this planner returns. */
export type UnoPublishedPageResult = UnoPublishedPageAccepted | UnoPublishedPageRefused;

/** The exact translation of every accepted delivery refusal onto this planner's closed vocabulary. */
const DELIVERY_REFUSAL_MAP: Readonly<Record<UnoDeliveryRefusal, UnoPublicationRefusal>> = Object.freeze({
  "delivery:input-invalid": "publication:input-invalid",
  "delivery:unreadable": "publication:unreadable",
  "delivery:committed-locales-invalid": "publication:committed-locales-invalid",
  "delivery:site-inputs-invalid": "publication:site-inputs-invalid",
  "delivery:route-invalid": "publication:route-invalid",
  "delivery:load-refused": "publication:source-refused",
  "delivery:candidate-mismatch": "publication:source-refused",
  "delivery:header-invalid": "publication:header-invalid",
  "delivery:document-invalid": "publication:document-invalid",
  "delivery:discovery-invalid": "publication:discovery-invalid",
  "delivery:canonical-too-long": "publication:canonical-too-long",
});

/** A plain own-data view of an untrusted object. */
type DataRecord = Readonly<Record<string, unknown>>;

/** Internal marker for structure that must not be read at all; never escapes this module. */
class HostileStructure extends Error {}

/** One bounded refusal, used for every early exit. */
function refusePublication(reason: UnoPublicationRefusal): UnoPublishedPageRefused {
  return Object.freeze({ accepted: false, reason });
}

/** Read an untrusted value as a plain record of own enumerable data properties, or `null`. */
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

/** Deep-freeze a freshly built structure so no caller can later rewrite an accepted plan. */
function deepFreeze<T>(value: T): T {
  if (typeof value !== "object" || value === null) return value;
  for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  return Object.freeze(value);
}

/**
 * Plan one published Page decision for one exact address of the one selected Site.
 *
 * The request must be exactly `{manifest, selection, base, pathname, loadedSource}`. The manifest, the
 * selection, the proposed base, the stored locale authority and the route match are all resolved before the
 * accepted delivery candidate is asked to compose them, so `publication:route-invalid` always means the
 * address itself is unusable rather than that some later rule failed. The candidate's own **validated**
 * manifest Page is then located in the validated graph and its `publication` declaration is the only thing
 * that can turn an otherwise accepted candidate into an accepted plan.
 */
export function planUnoPublishedPage(input: unknown): UnoPublishedPageResult {
  try {
    const request = readPlainData(input);
    if (request === null) return refusePublication("publication:input-invalid");
    if (!hasExactlyKeys(request, UNO_PUBLICATION_INPUT_KEYS)) {
      return refusePublication("publication:input-invalid");
    }

    const manifest = request["manifest"];
    const selection = request["selection"];
    const base = request["base"];
    const pathname = request["pathname"];
    const loadedSource = request["loadedSource"];
    for (const value of [manifest, selection, base, loadedSource]) {
      if (typeof value !== "object" || value === null || Array.isArray(value)) {
        return refusePublication("publication:input-invalid");
      }
    }
    if (typeof pathname !== "string") return refusePublication("publication:input-invalid");

    const graph = validateUnoManifestGraph(manifest);
    if (!graph.accepted) {
      return refusePublication(
        graph.reason === "input:unreadable" ? "publication:unreadable" : "publication:manifest-invalid",
      );
    }

    const selected = validateUnoSiteSelection(selection, manifest);
    if (!selected.accepted) {
      return refusePublication(
        selected.reason === "config:unreadable"
          ? "publication:unreadable"
          : "publication:selection-invalid",
      );
    }

    const canonical = validateUnoCanonicalBase(base);
    if (!canonical.accepted) {
      return refusePublication(
        canonical.reason === "base:unreadable" ? "publication:unreadable" : "publication:base-invalid",
      );
    }

    const stored = resolveUnoCommittedLocales({ manifest, selection });
    if (!stored.accepted) return refusePublication("publication:committed-locales-invalid");

    const matched = matchUnoCandidateRoute(pathname, manifest, selection);
    if (!matched.accepted) return refusePublication("publication:route-invalid");


    const candidate = prepareUnoPageDeliveryCandidate({ manifest, selection, base, pathname, loadedSource });
    if (!candidate.accepted) return refusePublication(DELIVERY_REFUSAL_MAP[candidate.reason]);
    if (
      candidate.identity.pageId !== matched.candidate.pageId ||
      candidate.identity.localeTag !== matched.candidate.localeTag ||
      candidate.identity.pathname !== matched.candidate.pathname
    ) {
      return refusePublication("publication:route-invalid");
    }

    // The publication authority: the candidate's own Page, taken from the validated graph by identity.
    const entity = graph.graph.entities[0];
    if (entity === undefined) return refusePublication("publication:manifest-invalid");
    const facet = entity.facets.find((entry) => entry.id === matched.candidate.facetId);
    if (facet === undefined) return refusePublication("publication:selection-invalid");
    const site = facet.sites.find((entry) => entry.id === matched.candidate.siteId);
    if (site === undefined) return refusePublication("publication:selection-invalid");
    const page = site.pages.find((entry) => entry.id === matched.candidate.pageId);
    if (page === undefined) return refusePublication("publication:page-missing");
    if (page.publication !== "published") return refusePublication("publication:not-published");


    const document: {
      kind: PageSourceKind;
      title: string;
      description?: string;
      visibility: PageVisibility;
      markdownBody?: string;
      pageDocument?: UnoPageDocument;
      pageDocumentRefusal?: UnoPageDocumentRefusal;
    } = {
      kind: candidate.document.kind,
      title: candidate.document.title,
      visibility: candidate.document.visibility,
    };
    if (candidate.document.description !== undefined) document.description = candidate.document.description;
    if (candidate.document.markdownBody !== undefined) document.markdownBody = candidate.document.markdownBody;
    if (candidate.document.pageDocument !== undefined) document.pageDocument = candidate.document.pageDocument;
    if (candidate.document.pageDocumentRefusal !== undefined) {
      document.pageDocumentRefusal = candidate.document.pageDocumentRefusal;
    }

    const languagePreferences = Object.create(null) as Record<string, string>;
    for (const key of Object.keys(stored.localePolicy.languagePreferences).sort()) {
      languagePreferences[key] = stored.localePolicy.languagePreferences[key] as string;
    }

    return deepFreeze({
      accepted: true as const,
      identity: {
        entityId: matched.candidate.entityId,
        facetId: matched.candidate.facetId,
        siteId: matched.candidate.siteId,
        pageId: matched.candidate.pageId,
        localeTag: matched.candidate.localeTag,
        localePathKey: matched.candidate.localePathKey,
        routePath: matched.candidate.routePath,
        pathname: matched.candidate.pathname,
      },
      document,
      delivery: {
        canonicalUrl: candidate.ifServed.canonicalUrl,
        robots: candidate.ifServed.robots,
        public: candidate.document.visibility === "public",
        unlisted: candidate.document.visibility === "unlisted",
        indexable: candidate.ifServed.robots === null,
        eligible: {
          navigation: candidate.ifServed.eligibleIfPublished.navigation,
          sitemap: candidate.ifServed.eligibleIfPublished.sitemap,
          hreflang: candidate.ifServed.eligibleIfPublished.hreflang,
          xDefault: candidate.ifServed.eligibleIfPublished.xDefault,
          languageSwitch: candidate.ifServed.eligibleIfPublished.languageSwitch,
          automaticLocaleRedirectTarget:
            candidate.ifServed.eligibleIfPublished.automaticLocaleRedirectTarget,
        },
        supportedLocales: [...stored.localePolicy.supportedLocales],
        defaultLocale: stored.localePolicy.defaultLocale,
        languagePreferences,
      },
    });
  } catch (error) {
    if (error instanceof HostileStructure) return refusePublication("publication:input-invalid");
    return refusePublication("publication:unreadable");
  }
}
