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

  // `UNO-WO-121 / R02`: the opt-in list Gallery declares one occurrence per authored item, in document order, with its own
  // locator; a repeated identity inside the list keeps its own occurrence, and the ordinary grid is planned identically.
  it("plans one ordered locator per list-Gallery item beside an ordinary grid", () => {
    const items = (count: number, path: string) =>
      Array.from({ length: count }, (_unused, index) => ({ asset: { zone: "page", path }, alt: `Plate ${index}` }));
    const document = {
      version: 1,
      title: "Galleries",
      sections: [
        { id: "grid", module: "media.gallery", props: { columns: 2, items: items(2, "grid.png") } },
        { id: "list", module: "media.gallery", props: { list: true, items: items(24, "list.png") } },
        {
          id: "repeat",
          module: "media.gallery",
          props: { list: true, items: [{ asset: { zone: "page", path: "one.png" }, alt: "A" }, { asset: { zone: "page", path: "one.png" }, alt: "B" }] },
        },
      ],
    };
    const planned = planUnoPageAssets(page(document, "/en-001/galleries"));
    expect(planned.status).toBe("planned");
    if (planned.status !== "planned") return;
    expect(planned.plan.occurrences).toHaveLength(2 + 24 + 2);
    expect(planned.plan.occurrences.map((occurrence) => occurrence.occurrence)).toEqual(
      Array.from({ length: 28 }, (_unused, index) => index),
    );
    expect(planned.plan.occurrences.map((occurrence) => occurrence.url)).toEqual(
      Array.from({ length: 28 }, (_unused, index) => unoMediaLocatorPath("en-001/galleries", index)),
    );
    const listItems = planned.plan.bySection.get("list")?.items ?? [];
    expect(listItems).toHaveLength(24);
    expect(listItems[0]).toBe(unoMediaLocatorPath("en-001/galleries", 2));
    expect(listItems[23]).toBe(unoMediaLocatorPath("en-001/galleries", 25));
    // A repeated identity is two occurrences of the same ref, never one shared locator.
    const repeated = planned.plan.occurrences.filter((occurrence) => occurrence.sectionId === "repeat");
    expect(repeated).toHaveLength(2);
    expect(repeated[0]?.ref).toEqual(repeated[1]?.ref);
    expect(repeated[0]?.url).not.toBe(repeated[1]?.url);
  });

  // The unchanged occurrence guard: a Page whose declared media exceed 512 occurrences is refused by the planner.
  it("refuses a Page whose declared occurrences exceed the 512 occurrence limit", () => {
    const galleries = Array.from({ length: 22 }, (_unused, index) => ({
      id: `g${index}`,
      module: "media.gallery",
      props: {
        list: true,
        items: Array.from({ length: 24 }, (_unusedItem, itemIndex) => ({
          asset: { zone: "page", path: `plate-${itemIndex}.png` },
          alt: `Plate ${itemIndex}`,
        })),
      },
    }));
    const document = { version: 1, title: "Too many", sections: galleries };
    const parsed = readUnoPageDocument(document);
    expect(parsed.accepted).toBe(true);
    if (!parsed.accepted) return;
    const planned = planUnoPageAssets(page(document, "/en-001/many"));
    expect(planned.status).toBe("refused");
    if (planned.status === "refused") expect(planned.reason).toBe("assets:too-many");
    // One gallery fewer stays inside the guard, so the limit is exactly where it was.
    const inside = planUnoPageAssets(page({ ...document, sections: galleries.slice(0, 21) }, "/en-001/many"));
    expect(inside.status).toBe("planned");
    if (inside.status === "planned") expect(inside.plan.occurrences).toHaveLength(21 * 24);
  });

});
