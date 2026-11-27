/**
 * Foundation Uno — the composed Cards owned-image proof (`UNO-WO-124 / R05`).
 *
 * WHAT THIS IS. The donor Cards section, authored as donor data with explicit migration bindings, composed by the **real** adapter
 * (`composeUnoFoundationSubset`), serialized as the served Page, and then proved over production HTTP and Chromium: authored order,
 * per-card ownership and alternatives, image-first placement, the omitted card, distinct occurrence locators at the same origin,
 * loaded intrinsic sizes, and real byte-for-byte equality against each installed plate.
 *
 * WHAT IT IS NOT. No hand-built native substitute, no credit, no durable Page. The transaction restores the original Page bytes and
 * proves a fresh original response; the plates belong to the caller (the mandatory gate installs and removes them) and are only read.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { nativeCardsListOf, nativeCardsRegionOf, readNativeCardsCase } from "./cards-native-evidence.mjs";
import {
  COMPOSED_CARDS_ALT,
  COMPOSED_CARDS_CARDS,
  FAMILY_PLATE,
  FAMILY_PLATE_ALT,
  FAMILY_PLATE_ALT_SIZE,
  FAMILY_PLATE_SIZE,
  composedCardsBindings,
  composedCardsSource,
  composedCardsUnboundBindings,
} from "./family-fixture.mjs";

/** The composed section's authored heading, surface and column intent. */
export const COMPOSED_CARDS_HEADING = "Composed cards";
export const COMPOSED_CARDS_SURFACE = "muted";
export const COMPOSED_CARDS_COLUMNS = 2;

/** The widths the composed Page is read at, with the tracks an authored `2` must actually resolve. */
export const COMPOSED_CARDS_CASES = Object.freeze([
  Object.freeze({ key: "light:390", width: 390, scheme: "light", motion: "no-preference", tracks: 1 }),
  Object.freeze({ key: "light:768", width: 768, scheme: "light", motion: "no-preference", tracks: 2 }),
  Object.freeze({ key: "light:1280", width: 1280, scheme: "light", motion: "no-preference", tracks: 2 }),
]);

/**
 * Judge one browser reading of the composed Page at one width: the authored tracks, one cell per card, every card's own text, its
 * own figure loaded at the installed plate's intrinsic size with its own alternative, no figure on the omitted card, and silence —
 * no overflow, no console error and no foreign request.
 */
export function composedCardsCaseVerdict(reading, testCase) {
  const problems = [];
  const expect = (ok, label) => {
    if (!ok) problems.push(label);
  };
  const section = (Array.isArray(reading.sections) ? reading.sections : [])[0] ?? null;
  const expected = [
    { size: FAMILY_PLATE_SIZE, alt: COMPOSED_CARDS_ALT.described },
    null,
    { size: FAMILY_PLATE_SIZE, alt: "" },
    { size: FAMILY_PLATE_ALT_SIZE, alt: COMPOSED_CARDS_ALT.second },
  ];
  expect(reading.case === testCase.key, `case:${reading.case}`);
  expect(reading.width === testCase.width, `width:${reading.width}`);
  expect(section !== null, "missing-section");
  if (section === null) return { ok: false, detail: `${testCase.key} ${problems.join(" ")}`, problems };
  expect(section.listCount === 1, `lists=${section.listCount}`);
  expect(section.itemCount === expected.length, `items=${section.itemCount}`);
  expect(section.trackCount === testCase.tracks, `tracks=${section.trackCount}!=${testCase.tracks}`);
  expect(section.tracksPositive === true, "tracks-not-positive");
  expect(section.tracksEqual === true, "tracks-unequal");
  expect(section.rowOrder === true, "row-order");
  expect(section.distinctCells === true, "cells-share-a-cell");
  expect(section.surface === COMPOSED_CARDS_SURFACE, `surface:${section.surface}`);
  expect(section.overflow === false, "overflow");
  const titles = COMPOSED_CARDS_CARDS.map((card) => card.title);
  expect(JSON.stringify(section.titles) === JSON.stringify(titles), `titles:${JSON.stringify(section.titles)}`);
  const images = Array.isArray(section.images) ? section.images : [];
  expect(images.length === expected.length, `images=${images.length}`);
  expected.forEach((want, index) => {
    const got = images[index];
    if (want === null) {
      expect(got?.count === 0, `card${index}:unexpected-image`);
      return;
    }
    expect(got?.count === 1, `card${index}:image-count=${got?.count}`);
    expect(got?.first === true, `card${index}:image-not-first`);
    expect(got?.alt === want.alt, `card${index}:alt=${JSON.stringify(got?.alt)}`);
    expect(got?.complete === true, `card${index}:image-not-loaded`);
    expect(
      got?.naturalWidth === want.size.width && got?.naturalHeight === want.size.height,
      `card${index}:natural=${got?.naturalWidth}x${got?.naturalHeight}`,
    );
  });
  expect(reading.errors === 0, `errors:${reading.errors}`);
  expect(reading.foreignRequests === 0, `foreign:${reading.foreignRequests}`);
  return {
    ok: problems.length === 0,
    detail: problems.length === 0 ? `${testCase.key} composed cards ok` : `${testCase.key} ${problems.join(" ")}`,
    problems,
  };
}

/** Normalize one composed card to the ownership facts the adapter must have emitted, ignoring any absent optional key. */
function cardOwnership(card) {
  const asset = card?.asset;
  return {
    asset: asset === undefined || asset === null ? null : { zone: asset.zone, path: asset.path },
    alt: card?.alt ?? null,
    decorative: card?.decorative === true,
  };
}

/** The ownership every composed card must carry, in card order: two identities, one omission and one repetition. */
function expectedOwnership() {
  return [
    { asset: { zone: "page", path: FAMILY_PLATE }, alt: COMPOSED_CARDS_ALT.described, decorative: false },
    { asset: null, alt: null, decorative: false },
    { asset: { zone: "page", path: FAMILY_PLATE }, alt: "", decorative: true },
    { asset: { zone: "page", path: FAMILY_PLATE_ALT }, alt: COMPOSED_CARDS_ALT.second, decorative: false },
  ];
}

/**
 * The one composed Cards transaction: compose the bounded donor section through the real adapter, serve the serialized composition
 * over production HTTP, read it in Chromium at three widths, and restore the original Page bytes in `finally` with a fresh original
 * response. The two synthetic plates belong to the caller and are only read here, so no asset can outlive the run.
 */
export async function runComposedCardsTransaction({
  familyUrl,
  fixturePath,
  mediaRoot,
  digestOf,
  check,
  tab = null,
  prefix = "U04_COMPOSED_CARDS",
  originalMarker = null,
}) {
  const owned = tab === null;
  const { chromium } = owned ? await import("playwright") : { chromium: null };
  const browser = owned ? await chromium.launch() : null;
  const page = owned ? await browser.newPage() : tab;
  const original = readFileSync(fixturePath);
  const originalDigest = digestOf();
  const plates = {
    first: { bytes: readFileSync(resolve(mediaRoot, FAMILY_PLATE)), size: FAMILY_PLATE_SIZE },
    second: { bytes: readFileSync(resolve(mediaRoot, FAMILY_PLATE_ALT)), size: FAMILY_PLATE_ALT_SIZE },
  };

  const errors = [];
  const foreign = [];
  const onConsole = (message) => {
    if (message.type() === "error") errors.push(message.text());
  };
  const onPageError = (error) => errors.push(String(error));
  const onRequest = (request) => {
    const url = request.url();
    if (/^https?:\/\//u.test(url) && !/^https?:\/\/127\.0\.0\.1[:/]/u.test(url)) foreign.push(url);
  };
  page.on("console", onConsole);
  page.on("pageerror", onPageError);
  page.on("request", onRequest);

  let passed = 0;
  let failed = 0;
  const assert = (label, ok, detail = "") => {
    const result = check(label, ok, detail);
    if (result === true) passed += 1;
    else failed += 1;
    return result === true;
  };
  const restore = () => {
    writeFileSync(fixturePath, original);
    return digestOf() === originalDigest;
  };

  try {
    const { composeUnoFoundationSubset } = await import("../../src/application/compose-uno-foundation-families.ts");
    // (a) The real adapter composes the bounded donor Cards section, and the accepted Page carries exactly the authored ownership.
    const outcome = composeUnoFoundationSubset(composedCardsSource(), composedCardsBindings());
    const document = outcome.status === "composed" ? outcome.document : null;
    const section = document?.sections?.[0] ?? null;
    const cards = Array.isArray(section?.props?.cards) ? section.props.cards : [];
    const expected = expectedOwnership();
    assert(
      `${prefix}_COMPOSE the real adapter composes one bounded Cards section whose four cards carry the described, omitted, decorative and second-identity ownership exactly`,
      outcome.status === "composed"
        && section !== null
        && section.module === "layout.grid"
        && cards.length === expected.length
        && expected.every((want, index) => JSON.stringify(cardOwnership(cards[index])) === JSON.stringify(want)),
      `${outcome.status} ${JSON.stringify(cards.map(cardOwnership))}`,
    );

    // (b) An unowned donor identity refuses the whole Page, before anything is served.
    const refused = composeUnoFoundationSubset(composedCardsSource(), composedCardsUnboundBindings());
    assert(
      `${prefix}_REFUSAL a donor card image with no owned binding refuses the whole composition with a closed family reason`,
      refused.status === "refused" && typeof refused.reason === "string" && refused.reason.startsWith("family:"),
      `status=${refused.status} reason=${refused.reason ?? ""}`,
    );

    // The original response is captured **before** the swap, so restoration is compared with the state actually found.
    const originalResponse = await fetch(`${familyUrl}?wo124r05=original`, { redirect: "manual" });
    writeFileSync(fixturePath, `${JSON.stringify(document, null, 2)}\n`, "utf8");
    const response = await fetch(`${familyUrl}?wo124r05=composed`, { redirect: "manual" });
    const html = response.status === 200 ? await response.text() : "";
    const sectionId = section?.id ?? "";
    const facts = nativeCardsListOf(nativeCardsRegionOf(html, sectionId));

    assert(
      `${prefix}_HTTP the serialized composition serves one cards list with the authored heading, four cards in order, the authored column intent and surface`,
      response.status === 200
        && facts.listCount === 1
        && facts.itemCount === expected.length
        && facts.heading === COMPOSED_CARDS_HEADING
        && facts.columns === String(COMPOSED_CARDS_COLUMNS)
        && facts.surface === COMPOSED_CARDS_SURFACE
        && facts.hasControls === false
        && JSON.stringify(facts.titles) === JSON.stringify(COMPOSED_CARDS_CARDS.map((card) => card.title)),
      `${response.status} ${facts.itemCount}/${facts.columns}/${facts.surface} ${JSON.stringify(facts.titles)}`,
    );

    // (c) Per-card ownership in the served markup: authored alternatives, image-first placement, nothing on the omitted card.
    const expectedImages = [
      { alt: COMPOSED_CARDS_ALT.described },
      null,
      { alt: "" },
      { alt: COMPOSED_CARDS_ALT.second },
    ];
    assert(
      `${prefix}_MARKUP every served card carries its own figure first with its authored alternative, and the omitted card carries none`,
      facts.images.length === expectedImages.length
        && expectedImages.every((want, index) => {
          const got = facts.images[index];
          if (want === null) return got?.count === 0;
          return got?.count === 1
            && got.firstInItem === true
            && got.alt === want.alt
            && (got.className ?? "").split(/\s+/u).includes("uno-json-card-image")
            && typeof got.src === "string";
        }),
      JSON.stringify(facts.images.map((image) => [image.count, image.alt, image.firstInItem])),
    );

    // (c2) `UNO-WO-124 / R07`: the card's own single action is served as one ordinary anchor — its classified destination as the
    // href, its closed variant as a presentation attribute, its label as the anchor's own text, and no button or handler.
    assert(
      `${prefix}_ACTION the served card carries one static action anchor with its classified destination, closed variant and own label`,
      html.includes('class="uno-json-card-action"')
        && html.includes('href="https://example.org/wo124-card"')
        && html.includes('data-uno-variant="secondary"')
        && html.includes("Read the plate")
        && !/javascript:/iu.test(html)
        && !/<button[^>]*uno-json-card-action/iu.test(html),
      `anchor=${html.includes('class="uno-json-card-action"')} href=${html.includes('href="https://example.org/wo124-card"')} variant=${html.includes('data-uno-variant="secondary"')}`,
    );

    // (d) Real delivery: same-origin authoritative locators, distinct per occurrence, served bytes **byte-for-byte** equal to each
    // installed plate, and that plate's own intrinsic dimensions read from the response it returned.
    const firstSource = facts.images[0]?.src;
    const repeatSource = facts.images[2]?.src;
    const secondSource = facts.images[3]?.src;
    const origin = new URL(familyUrl).origin;
    const sameOrigin = [firstSource, repeatSource, secondSource].every(
      (src) => typeof src === "string" && src.length > 0 && new URL(src, familyUrl).origin === origin,
    );
    const occurrenceDistinct = firstSource !== repeatSource && firstSource !== secondSource && repeatSource !== secondSource;
    const fetched = [];
    for (const src of new Set([firstSource, repeatSource, secondSource])) {
      if (typeof src !== "string" || src.length === 0) continue;
      const asset = await fetch(new URL(src, familyUrl), { redirect: "manual" });
      const bytes = Buffer.from(await asset.arrayBuffer());
      fetched.push({
        src,
        status: asset.status,
        type: asset.headers.get("content-type") ?? "",
        bytes,
        width: bytes.length > 24 ? bytes.readUInt32BE(16) : 0,
        height: bytes.length > 24 ? bytes.readUInt32BE(20) : 0,
      });
    }
    const matchesPlate = (src, plate) => {
      const got = fetched.find((entry) => entry.src === src);
      return got !== undefined
        && got.status === 200
        && got.type.toLowerCase().startsWith("image/png")
        && got.bytes.equals(plate.bytes)
        && got.width === plate.size.width
        && got.height === plate.size.height;
    };
    assert(
      `${prefix}_DELIVERY both identities are delivered from the Page origin at distinct occurrence locators, with 200 image/png bytes byte-for-byte equal to the installed plates and their intrinsic dimensions`,
      sameOrigin
        && occurrenceDistinct
        && matchesPlate(firstSource, plates.first)
        && matchesPlate(repeatSource, plates.first)
        && matchesPlate(secondSource, plates.second),
      JSON.stringify({
        sameOrigin,
        occurrenceDistinct,
        fetched: fetched.map((entry) => [entry.src, entry.status, entry.type, entry.bytes.length, `${entry.width}x${entry.height}`]),
        plates: [plates.first.bytes.length, plates.second.bytes.length],
      }),
    );

    // (e) Chromium at 390, 768 and 1280.
    for (const testCase of COMPOSED_CARDS_CASES) {
      await page.setViewportSize({ width: testCase.width, height: 900 });
      await page.emulateMedia({ colorScheme: testCase.scheme, reducedMotion: testCase.motion });
      const errorsBefore = errors.length;
      const foreignBefore = foreign.length;
      await page.goto(`${familyUrl}?wo124r05=${testCase.key}`, { waitUntil: "networkidle" });
      const reading = await page.evaluate(readNativeCardsCase, { case: testCase.key, ids: [sectionId] });
      reading.foreignRequests = foreign.length - foreignBefore;
      reading.errors = errors.length - errorsBefore;
      const verdict = composedCardsCaseVerdict(reading, testCase);
      assert(
        `${prefix}_BROWSER ${testCase.key} the composed Page resolves the authored tracks, keeps authored order, and loads every card's own figure at its own intrinsic size with its own alternative`,
        verdict.ok,
        verdict.detail,
      );
    }

    // (f) Restoration: the original bytes, the original digest, and a fresh response serving the original document again.
    const restoredNow = restore();
    const fresh = await fetch(`${familyUrl}?wo124r05=restored`, { redirect: "manual" });
    const freshHtml = fresh.status === 200 ? await fresh.text() : "";
    assert(
      `${prefix}_RESTORE the fixture bytes and digest are restored and a fresh response serves the original document with none of the composed anchors`,
      restoredNow
        && fresh.status === originalResponse.status
        && (originalMarker === null || freshHtml.includes(originalMarker))
        && !freshHtml.includes(`id="${sectionId}"`),
      `digest=${restoredNow} status=${fresh.status}/${originalResponse.status} marker=${originalMarker === null ? "n/a" : freshHtml.includes(originalMarker)}`,
    );
  } finally {
    restore();
    page.off("console", onConsole);
    page.off("pageerror", onPageError);
    page.off("request", onRequest);
    if (browser !== null) await browser.close();
  }

  return { passed, failed };
}
