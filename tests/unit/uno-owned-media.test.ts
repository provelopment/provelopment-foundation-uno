/**
 * Foundation Uno — the owned-media policy contract (`UNO-WO-040 / R01`, U04).
 *
 * These tests prove the *pure* half of the media contract: the closed asset shape, the lexical path rules, the
 * extension/MIME allowlists, the zone roots, the byte caps, the container signatures and the intrinsic-size reader.
 * They touch no filesystem, so they are identical on every host.
 */
import { describe, expect, it } from "vitest";

import {
  UNO_MEDIA_NOMINAL_SIZE,
  UNO_OWNED_MEDIA_LIMITS,
  isUnoOwnedMediaMime,
  isUnoOwnedMediaPurpose,
  isUnoOwnedMediaZone,
  readUnoOwnedAssetRef,
  readUnoOwnedMediaPath,
  unoOwnedMediaByteCap,
  unoOwnedMediaExtension,
  unoOwnedMediaImageSize,
  unoOwnedMediaMime,
  unoOwnedMediaPurposeForMime,
  unoOwnedMediaSignatureIssue,
  unoOwnedMediaZoneRoot,
} from "../../src/core/assets/uno-owned-media";

/** A structurally valid PNG header for the given pixel size; the trailing IDAT/CRC bytes are irrelevant to policy. */
function png(width: number, height: number): Uint8Array {
  const bytes = new Uint8Array(33);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  const view = new DataView(bytes.buffer);
  view.setUint32(8, 13);
  bytes.set([0x49, 0x48, 0x44, 0x52], 12);
  view.setUint32(16, width);
  view.setUint32(20, height);
  bytes.set([8, 6, 0, 0, 0], 24);
  return bytes;
}

/** A minimal JPEG: SOI, then an APP0 segment, then a baseline SOF0 carrying the size. */
function jpeg(width: number, height: number): Uint8Array {
  const bytes = new Uint8Array(2 + 4 + 2 + 9);
  bytes.set([0xff, 0xd8], 0);
  bytes.set([0xff, 0xe0, 0x00, 0x02], 2);
  bytes.set([0xff, 0xc0, 0x00, 0x11, 0x08], 6);
  bytes[11] = (height >> 8) & 0xff;
  bytes[12] = height & 0xff;
  bytes[13] = (width >> 8) & 0xff;
  bytes[14] = width & 0xff;
  return bytes;
}

/** A WebVTT caption file body. */
function vtt(text = "WEBVTT\n\n00:00.000 --> 00:01.000\nHello\n"): Uint8Array {
  return new TextEncoder().encode(text);
}

/** An MP4 `ftyp` box header with a given major brand. */
function mp4(brand = "isom"): Uint8Array {
  const bytes = new Uint8Array(16);
  new DataView(bytes.buffer).setUint32(0, 16);
  bytes.set([0x66, 0x74, 0x79, 0x70], 4);
  bytes.set([...brand].map((character) => character.charCodeAt(0)), 8);
  return bytes;
}

describe("the closed zone, purpose and MIME vocabularies", () => {
  it("names exactly the four established zone roots", () => {
    expect(unoOwnedMediaZoneRoot("page")).toBe("deployment/efs/capsule");
    expect(unoOwnedMediaZoneRoot("theme")).toBe("deployment/content/assets");
    expect(unoOwnedMediaZoneRoot("platform")).toBe("public/platform");
    expect(unoOwnedMediaZoneRoot("generated")).toBe("public/_uno-generated");
    expect(isUnoOwnedMediaZone("page")).toBe(true);
    expect(isUnoOwnedMediaZone("Page")).toBe(false);
    expect(isUnoOwnedMediaZone("__proto__")).toBe(false);
  });

  it("maps only the allowlisted extensions and never SVG", () => {
    expect(unoOwnedMediaMime("png", "image")).toBe("image/png");
    expect(unoOwnedMediaMime("jpeg", "poster")).toBe("image/jpeg");
    expect(unoOwnedMediaMime("webm", "video")).toBe("video/webm");
    expect(unoOwnedMediaMime("vtt", "captions")).toBe("text/vtt");
    expect(unoOwnedMediaMime("svg", "image")).toBeUndefined();
    expect(unoOwnedMediaMime("mp4", "image")).toBeUndefined();
    expect(unoOwnedMediaPurposeForMime("image/avif")).toBe("image");
    expect(unoOwnedMediaPurposeForMime("text/html")).toBeUndefined();
    expect(isUnoOwnedMediaMime("video/mp4")).toBe(true);
    expect(isUnoOwnedMediaPurpose("poster")).toBe(true);
    expect(isUnoOwnedMediaPurpose("thumbnail")).toBe(false);
  });

  it("caps each purpose at the documented size", () => {
    expect(unoOwnedMediaByteCap("image")).toBe(5 * 1024 * 1024);
    expect(unoOwnedMediaByteCap("poster")).toBe(5 * 1024 * 1024);
    expect(unoOwnedMediaByteCap("video")).toBe(25 * 1024 * 1024);
    expect(unoOwnedMediaByteCap("captions")).toBe(64 * 1024);
    expect(UNO_OWNED_MEDIA_LIMITS.signatureBytes).toBeGreaterThanOrEqual(12);
    expect(UNO_MEDIA_NOMINAL_SIZE.width).toBeGreaterThan(0);
  });
});

describe("the lexical path contract", () => {
  it("accepts a bounded relative name and reports its extension", () => {
    expect(readUnoOwnedMediaPath("hero.png")).toBe("hero.png");
    expect(readUnoOwnedMediaPath("nested/deep/hero-2.webp")).toBe("nested/deep/hero-2.webp");
    expect(unoOwnedMediaExtension("nested/deep/hero-2.webp")).toBe("webp");
    expect(unoOwnedMediaExtension("no-extension")).toBeNull();
    expect(unoOwnedMediaExtension(".hidden")).toBeNull();
  });

  it("refuses every escaping, ambiguous or aliased path", () => {
    const hostile = [
      "",
      "/rooted.png",
      "../up.png",
      "a/../../b.png",
      "./a.png",
      "a/./b.png",
      "a//b.png",
      "a\\\\b.png",
      "C:/x.png",
      "a%20b.png",
      "a.png?q",
      "a.png#f",
      "a b.png",
      "con.png",
      "LPT1.png",
      "a\u0000b.png",
      "\u00e9.png",
    ];
    for (const candidate of hostile) {
      expect(readUnoOwnedMediaPath(candidate)).toBeNull();
    }
  });
});

describe("the closed asset reference", () => {
  it("accepts an allowlisted image and fixes its MIME type", () => {
    const result = readUnoOwnedAssetRef({ zone: "page", path: "hero.png" }, "image");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.decision.mime).toBe("image/png");
  });

  it("refuses an unknown key, an unknown zone and a wrong purpose", () => {
    expect(readUnoOwnedAssetRef({ zone: "page", path: "hero.png", alt: "x" }, "image").ok).toBe(false);
    expect(readUnoOwnedAssetRef({ zone: "cdn", path: "hero.png" }, "image").ok).toBe(false);
    expect(readUnoOwnedAssetRef({ zone: "page", path: "clip.mp4" }, "image").ok).toBe(false);
    expect(readUnoOwnedAssetRef({ zone: "page", path: "logo.svg" }, "image").ok).toBe(false);
    expect(readUnoOwnedAssetRef(null, "image").ok).toBe(false);
    // The path keeps its case and the extension table is case-sensitive, so `.PNG` is a different, unlisted type.
    expect(readUnoOwnedMediaPath("hero.PNG")).toBe("hero.PNG");
    expect(readUnoOwnedAssetRef({ zone: "page", path: "hero.PNG" }, "image").ok).toBe(false);
  });

  it("requires integrity exactly for generated assets", () => {
    const digest = "b".repeat(64);
    expect(readUnoOwnedAssetRef({ zone: "generated", path: "g.png" }, "image").ok).toBe(false);
    expect(readUnoOwnedAssetRef({ zone: "generated", path: "g.png", integrity: "B".repeat(64) }, "image").ok).toBe(
      false,
    );
    expect(readUnoOwnedAssetRef({ zone: "generated", path: "g.png", integrity: digest }, "image").ok).toBe(true);
    expect(readUnoOwnedAssetRef({ zone: "platform", path: "g.png", integrity: digest }, "image").ok).toBe(false);
  });
});

describe("container signatures", () => {
  it("accepts a real header and its declared kind", () => {
    expect(unoOwnedMediaSignatureIssue(png(1200, 800), "image", "png")).toBeNull();
    expect(unoOwnedMediaSignatureIssue(png(1200, 800), "poster", "png")).toBeNull();
    expect(unoOwnedMediaSignatureIssue(jpeg(640, 480), "image", "jpeg")).toBeNull();
    expect(unoOwnedMediaSignatureIssue(vtt(), "captions", "vtt")).toBeNull();
    expect(unoOwnedMediaSignatureIssue(mp4("isom"), "video", "mp4")).toBeNull();
  });

  it("refuses a container that does not match the declared kind", () => {
    // A PNG renamed to WebP, a text file posing as an image, an MP4 claiming WebM, and a caption without its marker.
    expect(unoOwnedMediaSignatureIssue(png(4, 4), "image", "webp")).toBe("media:signature-mismatch");
    expect(unoOwnedMediaSignatureIssue(vtt(), "image", "png")).toBe("media:signature-mismatch");
    expect(unoOwnedMediaSignatureIssue(mp4("isom"), "video", "webm")).toBe("media:signature-mismatch");
    expect(unoOwnedMediaSignatureIssue(vtt("not a caption"), "captions", "vtt")).toBe("media:signature-mismatch");
    expect(unoOwnedMediaSignatureIssue(new Uint8Array(0), "image", "png")).toBe("media:signature-mismatch");
    // An `ftyp` box with an unbranded major brand is not a playable MP4 this contract accepts.
    expect(unoOwnedMediaSignatureIssue(mp4("zzzz"), "video", "mp4")).toBe("media:signature-mismatch");
  });
});

describe("intrinsic image size", () => {
  it("reads the real pixel box from the file header", () => {
    expect(unoOwnedMediaImageSize(png(1200, 800), "png")).toEqual({ width: 1200, height: 800 });
    expect(unoOwnedMediaImageSize(png(1, 1), "png")).toEqual({ width: 1, height: 1 });
    expect(unoOwnedMediaImageSize(png(4000, 3000), "png")).toEqual({ width: 4000, height: 3000 });
    expect(unoOwnedMediaImageSize(jpeg(640, 480), "jpeg")).toEqual({ width: 640, height: 480 });
  });

  it("reports unknown rather than guessing", () => {
    // AVIF is not parsed here, so the caller must fall back to its nominal box instead of inventing a ratio.
    expect(unoOwnedMediaImageSize(mp4("avif"), "avif")).toBeNull();
    expect(unoOwnedMediaImageSize(new Uint8Array(4), "png")).toBeNull();
    expect(unoOwnedMediaImageSize(vtt(), "webp")).toBeNull();
  });
});


