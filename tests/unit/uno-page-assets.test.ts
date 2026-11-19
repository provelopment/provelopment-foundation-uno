/**
 * Foundation Uno — the published-Page-bound owned-media plan (`UNO-WO-040 / R01`, U04).
 *
 * These tests pin the occurrence ledger: which section owns which asset, in which order, at which slot, and the one
 * locator that addresses it. The plan is pure, so the same document must produce identical output on every host.
 */
import { describe, expect, it } from "vitest";

import {
  planUnoPageAssets,
  readUnoPageAssetOccurrence,
  unoMediaLocatorPath,
} from "../../src/application/plan-uno-page-assets";
import type { UnoPublishedPageAccepted } from "../../src/application/plan-uno-published-page";
import { readUnoPageDocument } from "../../src/core/page-document";

/** One accepted page wrapper, with only the fields this plan actually reads set. */
function page(document: unknown, pathname = "/en-001"): UnoPublishedPageAccepted {
  const parsed = readUnoPageDocument(document);
  if (!parsed.accepted) throw new Error("the fixture document must be accepted");
  return {
    accepted: true,
    identity: {
      entityId: "e_1",
      facetId: "foundation",
      siteId: "main",
      pageId: "home",
      localeTag: "en-001",
      localePathKey: "en-001",
      routePath: "",
      pathname,
    },
    document: { kind: "json", title: "Fixture", visibility: "public", pageDocument: parsed.document },
  } as unknown as UnoPublishedPageAccepted;
}

/** One document exercising an image, a video with poster and captions, and a two-item gallery. */
function mediaDocument(): unknown {
  return {
    version: 1,
    title: "Media",
    sections: [
      { id: "img", module: "media.image", props: { asset: { zone: "page", path: "hero.png" }, alt: "A hero" } },
      {
        id: "clip",
        module: "media.video",
        props: {
          asset: { zone: "page", path: "clip.mp4" },
          captions: { zone: "page", path: "clip.vtt" },
          title: "A clip",
          poster: { zone: "page", path: "poster.png" },
        },
      },
      {
        id: "gal",
        module: "media.gallery",
        props: {
          columns: 2,
          items: [
            { asset: { zone: "page", path: "g-one.png" }, alt: "One" },
            { asset: { zone: "page", path: "g-two.png" }, alt: "Two" },
          ],
        },
      },
    ],
  };
}

describe("planUnoPageAssets", () => {
  it("numbers occurrences in document order and records each slot", () => {
    const planned = planUnoPageAssets(page(mediaDocument()));
    expect(planned.status).toBe("planned");
    if (planned.status !== "planned") return;

    expect(planned.plan.pagePath).toBe("en-001");
    expect(
      planned.plan.occurrences.map((occurrence) => [
        occurrence.sectionId,
        occurrence.slot,
        occurrence.itemIndex,
      ]),
    ).toEqual([
      ["img", "image", -1],
      ["clip", "video", -1],
      ["clip", "poster", -1],
      ["clip", "captions", -1],
      ["gal", "image", 0],
      ["gal", "image", 1],
    ]);
    expect(planned.plan.occurrences.map((occurrence) => occurrence.url)).toEqual([
      "/uno-media/en-001/0",
      "/uno-media/en-001/1",
      "/uno-media/en-001/2",
      "/uno-media/en-001/3",
      "/uno-media/en-001/4",
      "/uno-media/en-001/5",
    ]);
  });

  it("projects the locators a section needs, without exposing a storage path", () => {
    const planned = planUnoPageAssets(page(mediaDocument()));
    if (planned.status !== "planned") return;

    expect(planned.plan.bySection.get("img")).toEqual({ image: "/uno-media/en-001/0" });
    expect(planned.plan.bySection.get("clip")).toEqual({
      video: "/uno-media/en-001/1",
      poster: "/uno-media/en-001/2",
      captions: "/uno-media/en-001/3",
    });
    expect(planned.plan.bySection.get("gal")).toEqual({
      items: ["/uno-media/en-001/4", "/uno-media/en-001/5"],
    });
    // No projection may ever carry a zone, a filesystem path or an owner field.
    const serialized = JSON.stringify([...planned.plan.bySection.values()]);
    expect(serialized.includes("deployment/")).toBe(false);
    expect(serialized.includes(".png")).toBe(false);
  });

  it("uses the Page's own address as the locator prefix", () => {
    const planned = planUnoPageAssets(page(mediaDocument(), "/en-001/about"));
    if (planned.status !== "planned") return;
    expect(planned.plan.pagePath).toBe("en-001/about");
    expect(planned.plan.occurrences[0]?.url).toBe("/uno-media/en-001/about/0");
    expect(unoMediaLocatorPath("en-001/about", 7)).toBe("/uno-media/en-001/about/7");
  });

  it("refuses a Markdown page, an unrenderable page and a hostile address", () => {
    const markdown = {
      ...page(mediaDocument()),
      document: { kind: "markdown", title: "T", visibility: "public" },
    };
    expect(planUnoPageAssets(markdown as unknown as UnoPublishedPageAccepted).status).toBe("refused");

    const missing = { ...page(mediaDocument()), document: { kind: "json", title: "T", visibility: "public" } };
    const refused = planUnoPageAssets(missing as unknown as UnoPublishedPageAccepted);
    expect(refused.status).toBe("refused");
    if (refused.status === "refused") expect(refused.reason).toBe("assets:document-missing");

    expect(planUnoPageAssets(page(mediaDocument(), "/en-001/x?y")).status).toBe("refused");
  });

  it("bounds the occurrence index and refuses an out-of-range lookup", () => {
    const planned = planUnoPageAssets(page(mediaDocument()));
    if (planned.status !== "planned") return;
    expect(readUnoPageAssetOccurrence(planned.plan, 0)?.sectionId).toBe("img");
    expect(readUnoPageAssetOccurrence(planned.plan, 5)?.sectionId).toBe("gal");
    expect(readUnoPageAssetOccurrence(planned.plan, 6)).toBeUndefined();
    expect(readUnoPageAssetOccurrence(planned.plan, -1)).toBeUndefined();
    expect(readUnoPageAssetOccurrence(planned.plan, "0")).toBeUndefined();
    expect(readUnoPageAssetOccurrence(planned.plan, 1.5)).toBeUndefined();
  });

  it("plans no occurrence at all for a document without media", () => {
    const plain = {
      version: 1,
      title: "Plain",
      sections: [{ id: "text", module: "content.prose", props: { text: "Body" } }],
    };
    const planned = planUnoPageAssets(page(plain));
    expect(planned.status).toBe("planned");
    if (planned.status !== "planned") return;
    expect(planned.plan.occurrences).toHaveLength(0);
    expect(planned.plan.bySection.size).toBe(0);
  });

});
