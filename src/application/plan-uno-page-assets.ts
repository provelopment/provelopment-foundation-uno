/**
 * Foundation Uno — the published-Page-bound owned-media plan (`UNO-WO-040 / R01`, U04).
 *
 * WHAT THIS IS. One pure, inward application function that turns an **already accepted** published Page into the
 * exact, ordered ledger of owned-media occurrences that Page declares: which section owns which asset, for which
 * purpose, at which slot, and the one same-origin locator that addresses it. The renderer and the media route both
 * read this ledger, so the URL a Page emits and the URL the route accepts can never disagree.
 *
 * WHAT IT IS NOT. It does not read a file, resolve a path, sniff bytes, publish anything or discover an asset. It
 * knows no host, no request, no filesystem and no provider: the locator is a *relative, bounded, occurrence-indexed*
 * path derived from the Page's own already-validated address, so it carries no owner field, no storage path and no
 * authority an attacker could supply. Whether the referenced bytes exist and are valid is the server adapter's
 * question, asked per request — and an occurrence is only addressable while its Page is the one accepted published
 * Page for that address.
 *
 * PROVENANCE. Original **Uno-owned** implementation, class **NEW**. No Foundation, Solo or Connect source, schema or
 * routing table is copied; the zone vocabulary and the occurrence numbering are Uno's own contract.
 */
import type { UnoPublishedPageAccepted } from "./plan-uno-published-page";
import type { UnoOwnedAssetRef, UnoOwnedMediaPurpose } from "../core/assets/uno-owned-media";
import { UNO_OWNED_MEDIA_LIMITS } from "../core/assets/uno-owned-media";
import type { UnoSectionNode } from "../core/page-document";
import { isUnoExternalVideoProps, isUnoLayoutGridCards } from "../core/page-document";

/** The closed refusal vocabulary of this plan. One literal per failure family. */
export type UnoPageAssetRefusal =
  | "assets:input-invalid"
  | "assets:page-not-json"
  | "assets:document-missing"
  | "assets:too-many";

/** The same vocabulary as frozen data, so a caller can assert membership without copying literals. */
export const UNO_PAGE_ASSET_REFUSAL_REASONS: readonly UnoPageAssetRefusal[] = Object.freeze([
  "assets:input-invalid",
  "assets:page-not-json",
  "assets:document-missing",
  "assets:too-many",
] as const);

/** The slot a module uses one asset for. `image` also covers a gallery or carousel item. */
export type UnoMediaSlot = "image" | "video" | "poster" | "captions";

/** One declared media occurrence of one Page. `occurrence` is its position in document order, from zero. */
export interface UnoPageAssetOccurrence {
  readonly occurrence: number;
  readonly sectionId: string;
  readonly slot: UnoMediaSlot;
  readonly purpose: UnoOwnedMediaPurpose;
  readonly itemIndex: number;
  readonly ref: UnoOwnedAssetRef;
  readonly url: string;
}

/** The resolved locators one section needs, ready to be handed to a server renderer. */
export interface UnoSectionAssets {
  readonly image?: string;
  readonly video?: string;
  readonly poster?: string;
  readonly captions?: string;
  readonly items?: readonly string[];
}

/** The accepted asset plan of one Page. */
export interface UnoPageAssetPlan {
  readonly pagePath: string;
  readonly occurrences: readonly UnoPageAssetOccurrence[];
  readonly bySection: ReadonlyMap<string, UnoSectionAssets>;
}

/** The plan, or one closed refusal. */
export type UnoPageAssetOutcome =
  | { readonly status: "planned"; readonly plan: UnoPageAssetPlan }
  | { readonly status: "refused"; readonly reason: UnoPageAssetRefusal };

/** The public media route's first path segment. A static segment, so no locale can shadow it. */
export const UNO_MEDIA_ROUTE_PREFIX = "uno-media";

/**
 * The one locator of an occurrence: the Page's own public address, plus its occurrence index.
 *
 * Nothing else is encoded. There is no zone, no storage path, no owner and no module name in the URL, so a locator can
 * never be edited into a different asset — only into a different *occurrence of the same Page*, which the route then
 * re-authorises against the accepted published Page before any byte is read.
 */
export function unoMediaLocatorPath(pagePath: string, occurrence: number): string {
  return `/${UNO_MEDIA_ROUTE_PREFIX}/${pagePath}/${occurrence}`;
}

/** The Page's own relative public path, which is the locator prefix. Never derived from a request. */
function pagePathOf(page: UnoPublishedPageAccepted): string | null {
  const pathname = page.identity.pathname;
  if (typeof pathname !== "string" || !pathname.startsWith("/") || pathname.length < 2) return null;
  const relative = pathname.slice(1);
  if (/[?#%\\:\s]/u.test(relative)) return null;
  return relative;
}

/** One mutable occurrence under construction, before its index and locator are assigned. */
interface PendingOccurrence {
  readonly sectionId: string;
  readonly slot: UnoMediaSlot;
  readonly purpose: UnoOwnedMediaPurpose;
  readonly itemIndex: number;
  readonly ref: UnoOwnedAssetRef;
}

/** Collect every declared occurrence of one node list in document order, recursing through child-bearing modules. */
function collect(nodes: readonly UnoSectionNode[], out: PendingOccurrence[]): void {
  for (const node of nodes) {
    if (node.module === "media.image") {
      out.push({ sectionId: node.id, slot: "image", purpose: "image", itemIndex: -1, ref: node.props.asset });
      continue;
    }
    if (node.module === "media.video") {
      // An external embed declares no owned bytes at all: it owns no zone, is never served from `/uno-media/...` and so
      // contributes no occurrence to this ledger. Only native mode produces video/poster/captions occurrences.
      if (isUnoExternalVideoProps(node.props)) continue;
      out.push({ sectionId: node.id, slot: "video", purpose: "video", itemIndex: -1, ref: node.props.asset });
      if (node.props.poster !== undefined) {
        out.push({ sectionId: node.id, slot: "poster", purpose: "poster", itemIndex: -1, ref: node.props.poster });
      }
      out.push({ sectionId: node.id, slot: "captions", purpose: "captions", itemIndex: -1, ref: node.props.captions });
      continue;
    }
    if (node.module === "media.gallery" || node.module === "media.carousel") {
      node.props.items.forEach((item, itemIndex) => {
        out.push({ sectionId: node.id, slot: "image", purpose: "image", itemIndex, ref: item.asset });
      });
      continue;
    }
    // `UNO-WO-124 / R01`: a native cards grid contributes one image occurrence per card that authored an owned image, indexed by
    // the card's own position so the projection can never shift an image onto a neighbouring card. A card without an image
    // contributes nothing at all, so an unauthored card never becomes a hole that silently consumed someone else's asset.
    if (node.module === "layout.grid" && isUnoLayoutGridCards(node.props)) {
      node.props.cards.forEach((card, itemIndex) => {
        if (card.asset === undefined) return;
        out.push({ sectionId: node.id, slot: "image", purpose: "image", itemIndex, ref: card.asset });
      });
      continue;
    }
    // The remaining child-bearing modules contribute their children's occurrences, never their own.
    if ("children" in node) collect(node.children, out);
  }
}

/** One refusal, never a partial plan. */
function refuseAssets(reason: UnoPageAssetRefusal): UnoPageAssetOutcome {
  return Object.freeze({ status: "refused", reason });
}

/**
 * Plan the owned-media occurrences of one accepted published Page.
 *
 * The Page must already be an accepted, renderable JSON Page: a Markdown Page declares no asset, and an accepted Page
 * whose document failed validation is refused rather than scanned for "whatever looks like media". Occurrence order is
 * document order — depth-first, children after their parent's own slots — so the same document always produces the
 * same numbering on every host.
 */
export function planUnoPageAssets(page: UnoPublishedPageAccepted): UnoPageAssetOutcome {
  if (typeof page !== "object" || page === null || page.accepted !== true) return refuseAssets("assets:input-invalid");
  if (page.document.kind !== "json") return refuseAssets("assets:page-not-json");
  const document = page.document.pageDocument;
  if (document === undefined) return refuseAssets("assets:document-missing");

  const pagePath = pagePathOf(page);
  if (pagePath === null) return refuseAssets("assets:input-invalid");

  const pending: PendingOccurrence[] = [];
  collect(document.sections, pending);
  if (pending.length > UNO_OWNED_MEDIA_LIMITS.maxOccurrences) return refuseAssets("assets:too-many");

  const occurrences: UnoPageAssetOccurrence[] = [];
  const bySection = new Map<string, { image?: string; video?: string; poster?: string; captions?: string; items?: string[] }>();

  pending.forEach((item, occurrence) => {
    const url = unoMediaLocatorPath(pagePath, occurrence);
    occurrences.push(
      Object.freeze({
        occurrence,
        sectionId: item.sectionId,
        slot: item.slot,
        purpose: item.purpose,
        itemIndex: item.itemIndex,
        ref: item.ref,
        url,
      }),
    );

    const current = bySection.get(item.sectionId) ?? {};
    if (item.slot === "image" && item.itemIndex >= 0) {
      const items = current.items ?? [];
      items[item.itemIndex] = url;
      current.items = items;
    } else if (item.slot === "image") {
      current.image = url;
    } else if (item.slot === "video") {
      current.video = url;
    } else if (item.slot === "poster") {
      current.poster = url;
    } else {
      current.captions = url;
    }
    bySection.set(item.sectionId, current);
  });

  return Object.freeze({
    status: "planned" as const,
    plan: Object.freeze({
      pagePath,
      occurrences: Object.freeze(occurrences),
      bySection: bySection as ReadonlyMap<string, UnoSectionAssets>,
    }),
  });
}

/** The occurrence a locator names, or `undefined` when the Page declares no such asset. */
export function readUnoPageAssetOccurrence(
  plan: UnoPageAssetPlan,
  occurrence: unknown,
): UnoPageAssetOccurrence | undefined {
  if (typeof occurrence !== "number" || !Number.isInteger(occurrence)) return undefined;
  if (occurrence < 0 || occurrence >= plan.occurrences.length) return undefined;
  return plan.occurrences[occurrence];
}

