/**
 * Foundation Uno — the Media family evidence (`UNO-WO-120 / R01`).
 *
 * WHY THIS IS A MODULE. The Media credit rests on seven different observations of the same facts: the donor-shaped section's
 * anchor, heading, Markdown lede and Markdown caption, its closed `position` and `surface`, the one owned image with its
 * authored alternative (or the explicit decorative form), and the projection that turns an owned reference into a served
 * `/uno-media/...` locator. Keeping the parsers and the four-case browser contract here means the gate orchestrates rather
 * than re-implements, the expectations come from the single fixture definition, and every comparison can be exercised alone.
 *
 * WHAT IT IS NOT. Nothing here is authority. No file is read or written, no Page is composed, no browser is launched, and
 * nothing here can raise the campaign score: the unchanged closure oracle still decides that from executed evidence.
 */

import { MEDIA_SOURCE, MEDIA_VARIANT_SOURCES } from "./family-fixture.mjs";

/** The served anchor id, and the ids the composed wrapper and its children must own. */
export const MEDIA_ID = "family-4-media";
export const MEDIA_FIGURE_ID = `${MEDIA_ID}-figure`;
export const MEDIA_TEXT_ID = `${MEDIA_ID}-text`;
export const MEDIA_HEADING_ID = `${MEDIA_ID}-heading`;
export const MEDIA_LEDE_ID = `${MEDIA_ID}-lede`;

/** The served rich section, exactly as authored, and the strings its Markdown fields must produce. */
export const MEDIA_EXPECTED = Object.freeze({
  heading: MEDIA_SOURCE.heading,
  lede: MEDIA_SOURCE.lede,
  ledeStrong: "bounded",
  caption: MEDIA_SOURCE.caption,
  captionStrong: "owned",
  captionLinkText: "the media notes",
  captionLinkHref: "https://example.org/media-notes",
  alt: MEDIA_SOURCE.image.alt,
  position: MEDIA_SOURCE.position,
  surface: MEDIA_SOURCE.surface,
  assetPath: MEDIA_SOURCE.image.src,
  /** The plate the gate generates for this fixture, so the intrinsic size is a known fact rather than a guess. */
  intrinsicWidth: 64,
  intrinsicHeight: 64,
  /** The served locator is owned by this Page's own zone/route and is never the donor identity. */
  servedLocator: /^\/uno-media\/[a-z]{2}-[0-9]{3}\/wo066-family-composition\/[0-9]+$/u,
});

/**
 * The six served Media variants, with the ids the temporary append gives them. `rich` is the committed section itself;
 * the other five are appended only for the browser transaction and removed again by its `finally`.
 *
 * `UNO-WO-120 / R02`: the set now separates an **authored** `plain` surface (index 2) from **no** surface at all (index 3), and
 * adds both **textless** positions (indices 4 and 5), so every adopted donor shape is executed rather than inferred.
 */
export const MEDIA_VARIANTS = Object.freeze(
  [MEDIA_SOURCE, ...MEDIA_VARIANT_SOURCES].map((source, index) =>
    Object.freeze({
      index,
      id: index === 0 ? MEDIA_ID : `family-${16 + index}-media`,
      position: source.position ?? null,
      surface: source.surface ?? null,
      heading: source.heading ?? null,
      lede: source.lede ?? null,
      /** The alternative the served image must carry; the adapter normalizes an omitted donor `alt` to the native empty one. */
      alt: source.image.alt ?? "",
      /**
       * True when the donor omitted `alt` entirely — the optional source form. `UNO-WO-120 / R03`: the omission is the
       * **adapter's** to normalize; the native reader requires an explicit alternative, so this flag describes donor input
       * and never a native node, and the served figure must still carry `alt: ""`.
       */
      altOmitted: !Object.prototype.hasOwnProperty.call(source.image, "alt"),
      decorative: source.image.decorative === true,
      /** True when the section authors a position but no heading and no lede: one figure, placed by the position alone. */
      textless: source.position !== undefined && source.heading === undefined && source.lede === undefined,
      caption: source.caption ?? null,
      markdownCaption: typeof source.caption === "string" && /[*_`\[]/u.test(source.caption),
    }),
  ),
);

/**
 * The four independently executed browser cases. `UNO-WO-120 / R01` requires all four — 390 and 1280 in light/normal motion
 * and in dark/reduced motion — so a missing, failed, duplicated or mislabelled case can never complete `browser`.
 */
export const MEDIA_CASES = Object.freeze([
  Object.freeze({ key: "light:390", width: 390, scheme: "light", motion: "no-preference" }),
  Object.freeze({ key: "light:1280", width: 1280, scheme: "light", motion: "no-preference" }),
  Object.freeze({ key: "dark:390", width: 390, scheme: "dark", motion: "reduce" }),
  Object.freeze({ key: "dark:1280", width: 1280, scheme: "dark", motion: "reduce" }),
]);

/**
 * The documented pixel tolerance for the two equal tracks: `repeat(2, minmax(0, 1fr))` splits the free space into halves and
 * the browser rounds each track to a whole CSS pixel, so the two can differ by a pixel or two at any container width.
 */
export const MEDIA_TRACK_TOLERANCE_PX = 2;

/** The figure of one composed section, whether the section is the bare figure or a wrapper stack. */
export function mediaFigureOf(section) {
  if (section === undefined || section === null) return null;
  if (section.module === "media.image") return section;
  if (section.module !== "layout.stack") return null;
  const find = (children) => {
    for (const child of children ?? []) {
      if (child.module === "media.image") return child;
      if (child.module === "layout.stack") {
        const nested = find(child.children);
        if (nested !== null) return nested;
      }
    }
    return null;
  };
  return find(section.children);
}

/** The rendered region of a served Page, between this family's anchor and the next top-level section. */
export function mediaRegionOf(html) {
  const start = html.indexOf(`id="${MEDIA_ID}"`);
  if (start < 0) return "";
  const openTag = html.lastIndexOf("<div", start);
  const next = html.indexOf('id="family-5-gallery"', start);
  const end = next < 0 ? html.length : html.lastIndexOf("<div", next);
  return openTag < 0 || end <= openTag ? "" : html.slice(openTag, end);
}

/** The region of one further variant on the temporary page: from its anchor to the close of its own figure. */
export function mediaVariantRegionOf(html, id) {
  const start = html.indexOf(`id="${id}"`);
  if (start < 0) return "";
  // A variant is either a stack (`<div`) or, in the bare case, the figure itself (`<figure`), so the nearest enclosing open
  // tag of either kind is where its region starts.
  const openTag = Math.max(html.lastIndexOf("<div", start), html.lastIndexOf("<figure", start));
  if (openTag < 0) return "";
  // The variant owns exactly one figure, so its close tag is the honest end of the region: it keeps the section wrapper, any
  // authored text that precedes the figure and the figure itself, and it never runs on into the next section.
  const figureClose = html.indexOf("</figure>", start);
  const nextAnchor = MEDIA_VARIANTS.map((variant) => html.indexOf(`id="${variant.id}"`, start + id.length + 2)).filter(
    (offset) => offset > start,
  );
  const candidates = [figureClose < 0 ? Number.POSITIVE_INFINITY : figureClose + "</figure>".length];
  if (nextAnchor.length > 0) candidates.push(Math.min(...nextAnchor));
  const end = Math.min(...candidates);
  return end === Number.POSITIVE_INFINITY ? html.slice(openTag) : html.slice(openTag, end);
}

/** The plain text a Markdown caption must render to: emphasis and link syntax removed, link text kept. */
export function plainCaptionOf(source) {
  return source
    .replace(/\*\*([^*]+)\*\*/gu, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/gu, "$1");
}

/** Every `img` element of one served region, as its authored attributes. */
export function mediaImagesOf(region) {
  return [...region.matchAll(/<img\b[^>]*>/gu)].map((match) => {
    const tag = match[0];
    const attribute = (name) => {
      const found = new RegExp(`${name}="([^"]*)"`, "u").exec(tag);
      return found === null ? null : found[1];
    };
    return {
      alt: attribute("alt"),
      src: attribute("src"),
      width: attribute("width"),
      height: attribute("height"),
      ariaHidden: attribute("aria-hidden"),
      ariaLabel: attribute("aria-label"),
      title: attribute("title"),
    };
  });
}

/** The single `figcaption` inner markup of one served region, or `null` when the figure owns no caption. */
export function mediaCaptionOf(region) {
  const found = /<figcaption[^>]*>([\s\S]*?)<\/figcaption>/u.exec(region);
  return found === null ? null : found[1];
}


const near = (left, right, tolerance = MEDIA_TRACK_TOLERANCE_PX) => Math.abs(left - right) <= tolerance;

/** A surface sample with no effect at all: nothing painted, no border and no padding. */
const noSurfaceEffect = (style) =>
  style !== undefined
  && /rgba\(0, 0, 0, 0\)|transparent/u.test(style.backgroundColor ?? "")
  && style.borderWidth === "0px"
  && (style.padding ?? "").split(" ").every((side) => Number.parseFloat(side) === 0);

/** The authored caption markup must be *inside* the figure that owns the image, never a sibling or a page-level caption. */
const captionOwned = (figure) =>
  figure.captionIsChild === true && figure.imgIsChild === true && /<figcaption/u.test(figure.html ?? "");

/**
 * The verdict for one executed case: the actual media settings, the six served variants, the loaded image with its intrinsic
 * size, its alternative (or explicit decorative form), the caption the figure owns, the closed position's two equal tracks at
 * a wide viewport and one column in authored order at a narrow one, the closed surface's computed presentation in this
 * scheme, and the keyboard access the gate exercised on the real Markdown caption link.
 */
export function mediaCaseVerdict(reading, testCase) {
  if (reading === undefined || reading === null) return { ok: false, detail: "{\"reading\":\"missing\"}" };
  if (!MEDIA_CASES.some((entry) => entry.key === testCase?.key)) {
    return { ok: false, detail: JSON.stringify({ unknownCase: testCase?.key }) };
  }
  const reasons = [];
  const expect = (condition, reason) => {
    if (!condition) reasons.push(reason);
  };
  expect(reading.case === testCase.key, `case:${reading.case}`);
  expect(reading.width === testCase.width, `width:${reading.width}`);
  expect(reading.dark === (testCase.scheme === "dark"), `dark:${reading.dark}`);
  expect(reading.reduce === (testCase.motion === "reduce"), `reduce:${reading.reduce}`);
  expect(reading.forced === false, `forced:${reading.forced}`);

  const byId = new Map((reading.variants ?? []).map((variant) => [variant.id, variant]));
  expect(
    JSON.stringify((reading.variants ?? []).map((variant) => variant.id))
      === JSON.stringify(MEDIA_VARIANTS.map((variant) => variant.id)),
    "variants",
  );

  for (const authored of MEDIA_VARIANTS) {
    const found = byId.get(authored.id);
    if (found === undefined) continue;
    const tag = authored.id;
    // The closed attributes are exactly what was authored: no manufactured default, no neighbour's value.
    expect(found.position === authored.position, `position:${tag}:${found.position}`);
    expect(found.surface === authored.surface, `surface:${tag}:${found.surface}`);
    // The image really loaded, at its intrinsic size, from this Page's own owned locator — never the donor identity.
    expect(found.image?.complete === true, `loaded:${tag}`);
    expect(found.image?.naturalWidth === MEDIA_EXPECTED.intrinsicWidth, `natural-width:${tag}:${found.image?.naturalWidth}`);
    expect(found.image?.naturalHeight === MEDIA_EXPECTED.intrinsicHeight, `natural-height:${tag}:${found.image?.naturalHeight}`);
    expect(
      MEDIA_EXPECTED.servedLocator.test(found.image?.src ?? ""),
      `src:${tag}:${found.image?.src}`,
    );
    expect(found.image?.width === String(MEDIA_EXPECTED.intrinsicWidth), `attr-width:${tag}:${found.image?.width}`);
    expect(found.image?.height === String(MEDIA_EXPECTED.intrinsicHeight), `attr-height:${tag}:${found.image?.height}`);
    // The authored alternative, or the explicit decorative form: empty alt, no accessible name, no conflicting label.
    expect(found.image?.alt === authored.alt, `alt:${tag}:${found.image?.alt}`);
    if (authored.decorative) {
      expect(found.image?.alt === "", `decorative-alt:${tag}`);
      expect(found.image?.accessibleName === "", `decorative-name:${tag}:${found.image?.accessibleName}`);
      expect(found.image?.ariaLabel === null && found.image?.title === null, `decorative-label:${tag}`);
    } else {
      expect(found.image?.accessibleName === authored.alt, `name:${tag}:${found.image?.accessibleName}`);
    }
    // The caption belongs to this figure, and carries exactly the authored meaning.
    if (authored.caption === null) {
      expect(found.caption === null, `caption-absent:${tag}`);
    } else {
      expect(captionOwned(found.figure ?? {}), `caption-owned:${tag}`);
      if (authored.markdownCaption) {
        // A Markdown caption renders to its meaning, never to its syntax: the emphasis, the link and the plain text are all exact.
        expect(found.captionStrong === "owned", `caption-strong:${tag}`);
        expect(found.captionLinkHref === MEDIA_EXPECTED.captionLinkHref, `caption-href:${tag}`);
        expect(found.captionLinkText === MEDIA_EXPECTED.captionLinkText, `caption-link:${tag}`);
        expect(found.captionHasRawSyntax === false, `caption-syntax:${tag}`);
        expect(found.caption === plainCaptionOf(authored.caption), `caption-text:${tag}:${found.caption}`);
      } else {
        // A plain caption stays one escaped string: no Markdown construct survives as markup, and the text is exact.
        expect(found.caption === authored.caption, `caption-plain-text:${tag}:${found.caption}`);
        expect(found.captionStrong === null && found.captionLinkHref === null, `caption-plain:${tag}`);
      }
    }
    // No variant may overflow the viewport in either width.
    expect(found.overflow === 0, `overflow:${tag}:${found.overflow}`);
  }
  // --- The closed position: two equal tracks at a wide viewport, one column in authored order at a narrow one ---------------
  const variantAt = (index) => byId.get(MEDIA_VARIANTS[index].id);
  const rich = variantAt(0);
  const endVariant = variantAt(1);
  const decorative = variantAt(2);
  const bare = variantAt(3);
  const textlessStart = variantAt(4);
  const textlessEnd = variantAt(5);
  /** The two resolved grid tracks in CSS pixels, or an empty list when the stack is not a grid. */
  const tracksOf = (variant) =>
    variant === undefined || variant.gridColumns == null
      ? []
      : variant.gridColumns
          .split(" ")
          .map((track) => Number.parseFloat(track))
          .filter((next) => Number.isFinite(next));
  if (testCase.width >= 1000) {
    for (const [variant, order] of [
      [rich, ["figure", "text"]],
      [endVariant, ["text", "figure"]],
    ]) {
      if (variant === undefined) continue;
      expect(variant.display === "grid", `display:${variant.id}:${variant.display}`);
      const tracks = tracksOf(variant);
      expect(tracks.length === 2, `tracks:${variant.id}:${variant.gridTracks}`);
      expect(
        tracks.length === 2 && tracks.every((width) => width > 0) && near(tracks[0], tracks[1]),
        `equal-tracks:${variant.id}:${JSON.stringify(tracks)}`,
      );
      expect(
        variant.trackWidths?.length === 2 && variant.trackWidths.every((width) => width > 0)
          && near(variant.trackWidths[0], variant.trackWidths[1]),
        `equal-columns:${variant.id}:${JSON.stringify(variant.trackWidths)}`,
      );
      // Both children sit on one row: the figure and its text are side by side, not stacked.
      expect(variant.childTops?.length === 2 && near(variant.childTops[0], variant.childTops[1]), `row:${variant.id}`);
      // The DOM order is the authored order, which is what a screen reader and a narrow viewport both follow.
      expect(JSON.stringify(variant.order) === JSON.stringify(order), `order:${variant.id}:${JSON.stringify(variant.order)}`);
    }
    // `UNO-WO-120 / R02`: a textless position keeps the donor's placement — the same two equal tracks, one authored figure and
    // no invented text — with `start` in the first track and `end` in the second.
    for (const [variant, trackIndex, label] of [
      [textlessStart, 0, "textless-start"],
      [textlessEnd, 1, "textless-end"],
    ]) {
      if (variant === undefined) continue;
      expect(variant.display === "grid", `${label}-display:${variant.display}`);
      const tracks = tracksOf(variant);
      expect(tracks.length === 2, `${label}-tracks:${variant.gridTracks}`);
      expect(
        tracks.length === 2 && tracks.every((width) => width > 0) && near(tracks[0], tracks[1]),
        `${label}-equal-tracks:${JSON.stringify(tracks)}`,
      );
      // Exactly one child, and it is the figure: no heading, no lede, no duplicate image and no emptied text stack.
      expect(JSON.stringify(variant.order) === JSON.stringify(["figure"]), `${label}-order:${JSON.stringify(variant.order)}`);
      expect(variant.trackWidths?.length === 1, `${label}-children:${JSON.stringify(variant.trackWidths)}`);
      expect(variant.heading === null && variant.lede === null, `${label}-invented-text:${variant.heading}/${variant.lede}`);
      // The figure fills its own track and really begins where that track begins.
      expect(
        tracks.length === 2 && variant.trackWidths?.[0] !== undefined && near(variant.trackWidths[0], tracks[trackIndex]),
        `${label}-column:${JSON.stringify(variant.trackWidths)}/${JSON.stringify(tracks)}`,
      );
      const expectedLeft = trackIndex === 0
        ? (variant.contentLeft ?? 0)
        : (variant.contentLeft ?? 0) + tracks[0] + (variant.columnGap ?? 0);
      expect(
        variant.childLefts?.length === 1 && near(variant.childLefts[0], expectedLeft),
        `${label}-placement:${JSON.stringify(variant.childLefts)}/${expectedLeft}`,
      );
    }
    // An absent position is the ordinary vertical stack at every width.
    for (const variant of [decorative, bare]) {
      if (variant === undefined) continue;
      expect(variant.display !== "grid", `no-grid:${variant.id}:${variant.display}`);
    }
  } else {
    for (const variant of [rich, endVariant, decorative, bare, textlessStart, textlessEnd]) {
      if (variant === undefined) continue;
      // One column: every child is as wide as the section, and the children keep the authored order top to bottom.
      expect(variant.display !== "grid", `narrow-display:${variant.id}:${variant.display}`);
      expect(
        variant.trackWidths?.length > 0
          && variant.trackWidths.every((width) => width > 0 && near(width, variant.contentWidth ?? variant.rootWidth)),
        `narrow-column:${variant.id}:${JSON.stringify(variant.trackWidths)}/${variant.contentWidth ?? variant.rootWidth}`,
      );
      expect(
        variant.childTops?.length > 0
          && variant.childTops.every((top, index) => index === 0 || top > variant.childTops[index - 1]),
        `narrow-order:${variant.id}:${JSON.stringify(variant.childTops)}`,
      );
      // A textless position is still one column at this width, flush with the section's own content edge.
      if (variant === textlessStart || variant === textlessEnd) {
        expect(
          variant.childLefts?.length === 1 && near(variant.childLefts[0], variant.contentLeft ?? 0),
          `narrow-placement:${variant.id}:${JSON.stringify(variant.childLefts)}`,
        );
      }
    }
    expect(JSON.stringify(rich?.order) === JSON.stringify(["figure", "text"]), `narrow-rich-order:${JSON.stringify(rich?.order)}`);
    expect(
      JSON.stringify(endVariant?.order) === JSON.stringify(["text", "figure"]),
      `narrow-end-order:${JSON.stringify(endVariant?.order)}`,
    );
  }
  // --- The closed surface: the emphasised values are real effects, plain and absent are no effect at all -------------------
  // `UNO-WO-120 / R02`: `plain` is now a **genuinely authored** value (the decorative variant authors `surface: "plain"`), so the
  // comparison proves the closed literal against the donor's own absence instead of comparing two unauthored stacks.
  expect(decorative?.surface === "plain", `plain-authored:${decorative?.surface}`);
  expect(bare?.surface === null, `absent-unauthored:${bare?.surface}`);
  const surfaces = {
    muted: rich?.surfaceStyle,
    bordered: endVariant?.surfaceStyle,
    plain: decorative?.surfaceStyle,
    absent: bare?.surfaceStyle,
  };
  expect(noSurfaceEffect(surfaces.plain), `plain:${JSON.stringify(surfaces.plain)}`);
  expect(noSurfaceEffect(surfaces.absent), `absent:${JSON.stringify(surfaces.absent)}`);
  for (const [name, style] of [["muted", surfaces.muted], ["bordered", surfaces.bordered]]) {
    expect(style !== undefined && !/rgba\(0, 0, 0, 0\)|transparent/u.test(style.backgroundColor ?? ""), `${name}-bg:${style?.backgroundColor}`);
    expect((style?.padding ?? "").split(" ").every((side) => Number.parseFloat(side) === 0) === false, `${name}-padding:${style?.padding}`);
    expect(style?.borderRadius !== "0px", `${name}-radius:${style?.borderRadius}`);
  }
  expect(surfaces.muted?.backgroundColor !== surfaces.bordered?.backgroundColor, "muted-vs-bordered-bg");
  expect(surfaces.bordered?.borderWidth === "1px" && surfaces.muted?.borderWidth === "0px", "surface-border");

  // --- Keyboard: the real Markdown caption link is reachable, leaves focus and never navigates -----------------------------
  const keyboard = reading.keyboard ?? {};
  // The destination is this family's alone, so a reached link is unambiguously the media caption's.
  expect(reading.captionLinkCount === 1, `caption-link-unique:${reading.captionLinkCount}`);
  expect(keyboard.reached === true, `keyboard-reached:${keyboard.reached}`);
  expect(keyboard.href === MEDIA_EXPECTED.captionLinkHref, `keyboard-href:${keyboard.href}`);
  expect(keyboard.visible === true, `keyboard-visible:${keyboard.visible}`);
  expect(keyboard.leftAfterTab === true, `keyboard-left:${keyboard.leftAfterTab}`);
  expect(keyboard.pageUrlAfter === keyboard.pageUrlBefore, `keyboard-url:${keyboard.pageUrlBefore}->${keyboard.pageUrlAfter}`);
  expect(keyboard.foreignRequests === 0, `keyboard-foreign:${keyboard.foreignRequests}`);

  return {
    ok: reasons.length === 0,
    detail: JSON.stringify({
      case: testCase.key,
      reasons,
      tracks: [rich?.trackWidths, endVariant?.trackWidths],
      surfaces: ["muted", "bordered", "plain"].map((name) => [name, surfaces[name]?.backgroundColor]),
      keyboard: keyboard.presses,
    }),
  };
}

/**
 * The refusal probes the gate executes. Each is one mutation of the rich Media source with its closed literal reason, so the
 * `refusal` dimension proves the whole Page refuses — never a partial document, a substituted path or a silent degradation.
 * Every probe is applied to a fresh deep copy; nothing here mutates the fixture.
 */
export const MEDIA_REFUSAL_CASES = Object.freeze([
  Object.freeze({
    label: "unbound owned source",
    expected: "family:unsupported-feature",
    mutate: (section) => {
      section.image.src = "/assets/wo120-unbound.png";
    },
  }),
  Object.freeze({
    label: "remote URL source",
    expected: "family:unsupported-feature",
    mutate: (section) => {
      section.image.src = "https://cdn.example.org/plate.png";
    },
  }),
  Object.freeze({
    label: "decorative with a nonempty alt",
    expected: "family:target-refused",
    mutate: (section) => {
      section.image.decorative = true;
    },
  }),
  Object.freeze({
    label: "empty alt without the decorative flag",
    expected: "family:target-refused",
    mutate: (section) => {
      section.image.alt = "";
    },
  }),
  Object.freeze({
    label: "missing alt without the decorative flag",
    expected: "family:target-refused",
    mutate: (section) => {
      delete section.image.alt;
    },
  }),
  Object.freeze({
    label: "non-boolean decorative value",
    expected: "family:unsupported-feature",
    mutate: (section) => {
      section.image.decorative = "true";
    },
  }),
  Object.freeze({
    label: "malformed Unicode plain caption",
    expected: "family:unsupported-feature",
    mutate: (section) => {
      // A lone high surrogate is not text: the shared decision refuses it in the unflagged caption form too.
      section.caption = "A caption with a lone high surrogate \ud800 in it.";
    },
  }),
  Object.freeze({
    label: "malformed Unicode Markdown caption",
    expected: "family:unsupported-feature",
    mutate: (section) => {
      section.caption = "A **caption** with a lone low surrogate \udc00 in it.";
    },
  }),
  Object.freeze({
    label: "unsafe Markdown caption destination",
    expected: "family:unsupported-feature",
    mutate: (section) => {
      section.caption = "Read [the notes](javascript:alert(1)).";
    },
  }),
  Object.freeze({
    label: "malformed Markdown caption",
    expected: "family:unsupported-feature",
    mutate: (section) => {
      section.caption = "An **unbalanced caption.";
    },
  }),
  Object.freeze({
    label: "caption beyond the donor bound",
    expected: "family:target-refused",
    mutate: (section) => {
      section.caption = "c".repeat(4001);
    },
  }),
  Object.freeze({
    label: "unknown position",
    expected: "family:unsupported-feature",
    mutate: (section) => {
      section.position = "middle";
    },
  }),
  Object.freeze({
    label: "unknown surface",
    expected: "family:unsupported-feature",
    mutate: (section) => {
      section.surface = "raised";
    },
  }),
  Object.freeze({
    label: "unknown image field",
    expected: "family:unsupported-feature",
    mutate: (section) => {
      section.image.loading = "eager";
    },
  }),
]);

export function mediaBrowserReport(readings) {
  const list = Array.isArray(readings) ? readings : [];
  const seen = new Map();
  for (const reading of list) {
    const key = reading?.case;
    if (typeof key !== "string") return { ok: false, detail: "{\"case\":\"missing\"}" };
    if (seen.has(key)) return { ok: false, detail: JSON.stringify({ duplicate: key }) };
    seen.set(key, reading);
  }
  const verdicts = MEDIA_CASES.map((testCase) => {
    const reading = seen.get(testCase.key);
    return reading === undefined
      ? { key: testCase.key, ok: false, detail: JSON.stringify({ missing: testCase.key }) }
      : { key: testCase.key, ...mediaCaseVerdict(reading, testCase) };
  });
  return {
    ok: verdicts.length === MEDIA_CASES.length && verdicts.every((verdict) => verdict.ok),
    detail: JSON.stringify(verdicts.map((verdict) => [verdict.key, verdict.ok, verdict.detail])),
  };
}

