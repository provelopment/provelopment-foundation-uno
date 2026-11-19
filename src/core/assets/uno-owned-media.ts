/**
 * Foundation Uno — the owned-media contract (`UNO-WO-040 / R01`, U04).
 *
 * WHAT THIS IS. One pure, framework-free policy module that answers exactly three questions about an authored
 * media reference: *where* may an asset live, *what* kind of file may it be, and *how big* may it get. It owns the
 * closed `OwnedAssetRef` shape, the four established zones, the purpose-to-extension/MIME allowlists, the byte caps
 * and the magic-byte signatures. It reads no file, touches no filesystem, imports nothing and holds no state.
 *
 * WHAT IT IS NOT. A reference that passes here is an **authored declaration inside one selected Page**. It is not a
 * publication, an authorisation to serve, a rights clearance or a discovered asset: a syntactically perfect path can
 * still be absent, unreadable, the wrong bytes or owned by a different Page. Only the server adapter proves those, and
 * only the accepted published Page makes the occurrence addressable.
 *
 * SAFETY. Every rule refuses; nothing is truncated, repaired, lowercased or resolved. A path is a *relative,
 * case-sensitive, slash-separated* name with no root, dot segment, percent encoding, query, fragment, colon,
 * backslash, control character, trailing dot/space alias, Windows device name, Unicode-normalisation ambiguity,
 * traversal or symlink. `../`, `%2e%2e`, `C:\`, `a//b`, `a/./b` and `con.png` are all refused here, so no later layer
 * ever has to sanitise a path that arrived as "validated".
 *
 * PROVENANCE. Original **Uno-owned** implementation, class **NEW**. No Foundation, Solo or Connect source, schema,
 * asset or MIME table is copied; the zone roots are Uno's own deployment layout and the signatures are the published
 * container/format magic numbers. No third-party asset, font or binary is referenced.
 */

/** The four established owned-media zones, in canonical order. Adding a fifth requires a new Owner order. */
export const UNO_OWNED_MEDIA_ZONES = Object.freeze(["page", "theme", "platform", "generated"] as const);

/** One owned-media zone. A zone describes *ownership and location*, never publication. */
export type UnoOwnedMediaZone = (typeof UNO_OWNED_MEDIA_ZONES)[number];

/** The four closed media purposes this build can serve. */
export const UNO_OWNED_MEDIA_PURPOSES = Object.freeze(["image", "video", "poster", "captions"] as const);

/** One closed media purpose. `poster` is an image that accompanies a video; it is not a separate media family. */
export type UnoOwnedMediaPurpose = (typeof UNO_OWNED_MEDIA_PURPOSES)[number];

/**
 * The byte caps and lexical bounds of the media contract.
 *
 * Every value here **refuses**; none is a truncation point. The caps are the ones the work order fixes, so a reader,
 * a route and a test can never disagree about what "too large" means.
 */
export const UNO_OWNED_MEDIA_LIMITS = Object.freeze({
  imageBytes: 5 * 1024 * 1024,
  videoBytes: 25 * 1024 * 1024,
  captionsBytes: 64 * 1024,
  pathCharacters: 200,
  pathSegments: 8,
  /** The highest occurrence index a locator may name; a document can never declare more assets than this. */
  maxOccurrences: 512,
  /** How many bytes the adapter needs to identify a container signature. */
  signatureBytes: 16,
});

/** The closed refusal vocabulary of the media contract. One literal per failure family, never an echoed value. */
export type UnoOwnedMediaRefusal =
  | "media:ref-invalid"
  | "media:zone-unknown"
  | "media:path-unsafe"
  | "media:extension-unsupported"
  | "media:purpose-mismatch"
  | "media:integrity-required"
  | "media:integrity-forbidden"
  | "media:integrity-malformed"
  | "media:absent"
  | "media:unreadable"
  | "media:too-large"
  | "media:not-a-file"
  | "media:escape"
  | "media:owner-mismatch"
  | "media:signature-mismatch"
  | "media:integrity-mismatch";

/** The same vocabulary as frozen data, so a caller can assert membership without copying literals. */
export const UNO_OWNED_MEDIA_REFUSAL_REASONS: readonly UnoOwnedMediaRefusal[] = Object.freeze([
  "media:ref-invalid",
  "media:zone-unknown",
  "media:path-unsafe",
  "media:extension-unsupported",
  "media:purpose-mismatch",
  "media:integrity-required",
  "media:integrity-forbidden",
  "media:integrity-malformed",
  "media:absent",
  "media:unreadable",
  "media:too-large",
  "media:not-a-file",
  "media:escape",
  "media:owner-mismatch",
  "media:signature-mismatch",
  "media:integrity-mismatch",
] as const);

/** The closed authored asset reference. Exactly these three keys; `integrity` is zone-dependent. */
export interface UnoOwnedAssetRef {
  readonly zone: UnoOwnedMediaZone;
  readonly path: string;
  readonly integrity?: string;
}

/** One accepted reference: the authored ref plus the MIME type its extension fixes. */
export interface UnoOwnedAssetDecision {
  readonly ref: UnoOwnedAssetRef;
  readonly extension: string;
  readonly mime: string;
  readonly purpose: UnoOwnedMediaPurpose;
}

/**
 * The closed extension-to-MIME allowlist, per purpose.
 *
 * SVG is deliberately absent: an authored `svg` is active markup with scripting and external-reference surfaces, so
 * it is refused for authored media here rather than parsed. Every mapping is one fixed lowercase extension, so a
 * `.PNG` or `.JpG` file is *not* the same asset as its lowercase form.
 */
const UNO_MIME_BY_PURPOSE: Readonly<Record<UnoOwnedMediaPurpose, Readonly<Record<string, string>>>> = Object.freeze({
  image: Object.freeze({
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    avif: "image/avif",
  }),
  poster: Object.freeze({
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    avif: "image/avif",
  }),
  video: Object.freeze({
    mp4: "video/mp4",
    webm: "video/webm",
  }),
  captions: Object.freeze({
    vtt: "text/vtt",
  }),
});

/** The purpose of each accepted MIME type, used when a reader has bytes but no authored purpose. */
const UNO_PURPOSE_BY_MIME: Readonly<Record<string, UnoOwnedMediaPurpose>> = Object.freeze({
  "image/png": "image",
  "image/jpeg": "image",
  "image/webp": "image",
  "image/avif": "image",
  "video/mp4": "video",
  "video/webm": "video",
  "text/vtt": "captions",
});

/**
 * The repository-relative root components of each zone.
 *
 * These are constants, so the adapter's reads are statically scoped and no request value can select a root. The
 * `page` zone is only a *prefix*: the accepted Page's own `{entity,facet,site}` identity supplies the next three
 * segments, which is why an asset can never be borrowed from another Entity, facet or Site.
 */
const UNO_ZONE_ROOT_COMPONENTS: Readonly<Record<UnoOwnedMediaZone, readonly string[]>> = Object.freeze({
  page: Object.freeze(["deployment", "efs", "capsule"]),
  theme: Object.freeze(["deployment", "content", "assets"]),
  platform: Object.freeze(["public", "platform"]),
  generated: Object.freeze(["public", "_uno-generated"]),
});

/** The repository-relative root path of one zone, always slash-separated. */
export function unoOwnedMediaZoneRoot(zone: UnoOwnedMediaZone): string {
  return UNO_ZONE_ROOT_COMPONENTS[zone].join("/");
}

/** True when `value` is exactly one established zone. */
export function isUnoOwnedMediaZone(value: unknown): value is UnoOwnedMediaZone {
  return typeof value === "string" && (UNO_OWNED_MEDIA_ZONES as readonly string[]).includes(value);
}

/** True when `value` is exactly one closed purpose. */
export function isUnoOwnedMediaPurpose(value: unknown): value is UnoOwnedMediaPurpose {
  return typeof value === "string" && (UNO_OWNED_MEDIA_PURPOSES as readonly string[]).includes(value);
}

/** The MIME type an accepted extension fixes for a purpose, or `undefined` when the pair is not allowlisted. */
export function unoOwnedMediaMime(extension: string, purpose: UnoOwnedMediaPurpose): string | undefined {
  return UNO_MIME_BY_PURPOSE[purpose][extension];
}

/** The media purpose a MIME type belongs to, or `undefined` for anything outside the allowlist. */
export function unoOwnedMediaPurposeForMime(mime: unknown): UnoOwnedMediaPurpose | undefined {
  if (typeof mime !== "string") return undefined;
  return UNO_PURPOSE_BY_MIME[mime];
}

/** True when `mime` is one of the seven allowlisted types this contract can serve. */
export function isUnoOwnedMediaMime(value: unknown): value is string {
  return unoOwnedMediaPurposeForMime(value) !== undefined;
}

/** The byte cap of one purpose. */
export function unoOwnedMediaByteCap(purpose: UnoOwnedMediaPurpose): number {
  return purpose === "video" ? UNO_OWNED_MEDIA_LIMITS.videoBytes : purpose === "captions" ? UNO_OWNED_MEDIA_LIMITS.captionsBytes : UNO_OWNED_MEDIA_LIMITS.imageBytes;
}

/** Windows reserved device names, refused in any case and with or without an extension. */
const RESERVED_SEGMENT = /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$/iu;

/** A safe path segment: alphanumeric first character, then alphanumerics, dot, underscore or hyphen. */
const SAFE_SEGMENT = /^[A-Za-z0-9][A-Za-z0-9._-]*$/u;

/** A lowercase 64-hex SHA-256 digest. */
const SHA256_HEX = /^[0-9a-f]{64}$/u;

/**
 * Validate one authored asset path.
 *
 * Returns the path unchanged when it is a bounded, relative, case-stable, slash-separated name; otherwise `null`.
 * The check is structural and total: no filesystem, no `path` module and no normalisation, so a caller can never be
 * handed a *different* string than the one it authored.
 */
export function readUnoOwnedMediaPath(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (value.length === 0 || value.length > UNO_OWNED_MEDIA_LIMITS.pathCharacters) return null;
  // No root, drive, colon, backslash, percent, query, fragment or whitespace of any kind.
  if (/[\u0000-\u001f\u007f\\:%?#\s]/u.test(value)) return null;
  if (value.startsWith("/")) return null;
  // Normalisation ambiguity is refused rather than folded: the authored bytes are the identity.
  if (value.normalize("NFC") !== value) return null;
  const segments = value.split("/");
  if (segments.length === 0 || segments.length > UNO_OWNED_MEDIA_LIMITS.pathSegments) return null;
  for (const segment of segments) {
    if (!SAFE_SEGMENT.test(segment)) return null;
    // `.` and `..` cannot match SAFE_SEGMENT, but a trailing dot or space is a Windows alias for the same file.
    if (segment.endsWith(".") || segment.endsWith(" ")) return null;
    if (RESERVED_SEGMENT.test(segment)) return null;
  }
  return value;
}

/** The lowercase extension of a validated path, or `null` when it has none. */
export function unoOwnedMediaExtension(path: string): string | null {
  const lastSegment = path.slice(path.lastIndexOf("/") + 1);
  const dot = lastSegment.lastIndexOf(".");
  if (dot <= 0 || dot === lastSegment.length - 1) return null;
  return lastSegment.slice(dot + 1);
}

/** A plain own-data view of an untrusted object, or `null` for anything with a prototype, accessor or symbol key. */
function readOwnPlainRecord(value: unknown): Readonly<Record<string, unknown>> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const keys = Object.getOwnPropertyNames(value);
  if (Object.getOwnPropertySymbols(value).length !== 0) return null;
  const prototype = Object.getPrototypeOf(value) as object | null;
  if (prototype !== Object.prototype && prototype !== null) return null;
  for (const key of keys) {
    if (key === "__proto__" || key === "constructor" || key === "prototype") return null;
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor === undefined || !("value" in descriptor)) return null;
  }
  return value as Readonly<Record<string, unknown>>;
}

/** True when `record` carries exactly `required` plus some subset of `optional` and nothing else. */
function hasAllowedKeys(
  record: Readonly<Record<string, unknown>>,
  required: readonly string[],
  optional: readonly string[],
): boolean {
  for (const key of Object.getOwnPropertyNames(record)) {
    if (!required.includes(key) && !optional.includes(key)) return false;
  }
  return required.every((key) => Object.prototype.hasOwnProperty.call(record, key));
}

/**
 * Validate one authored `OwnedAssetRef` for one purpose.
 *
 * The purpose is supplied by the *module* that declares the reference — an image slot, a video, a poster or a caption
 * track — never by the authored object, so an asset cannot promote itself from caption text to video bytes. `integrity`
 * is required exactly for the `generated` zone and forbidden everywhere else, because a generated file is the only one
 * whose bytes this repository itself could have changed.
 */
export function readUnoOwnedAssetRef(
  value: unknown,
  purpose: UnoOwnedMediaPurpose,
):
  | { readonly ok: true; readonly decision: UnoOwnedAssetDecision }
  | { readonly ok: false; readonly reason: UnoOwnedMediaRefusal } {
  const record = readOwnPlainRecord(value);
  if (record === null) return { ok: false, reason: "media:ref-invalid" };
  if (!hasAllowedKeys(record, ["zone", "path"], ["integrity"])) return { ok: false, reason: "media:ref-invalid" };

  const rawZone = record["zone"];
  if (!isUnoOwnedMediaZone(rawZone)) return { ok: false, reason: "media:zone-unknown" };

  const path = readUnoOwnedMediaPath(record["path"]);
  if (path === null) return { ok: false, reason: "media:path-unsafe" };

  const extension = unoOwnedMediaExtension(path);
  if (extension === null) return { ok: false, reason: "media:extension-unsupported" };
  const mime = unoOwnedMediaMime(extension, purpose);
  if (mime === undefined) {
    // Distinguish "this purpose cannot use that media family at all" from "this file type is not allowlisted".
    const knownElsewhere = (UNO_OWNED_MEDIA_PURPOSES as readonly UnoOwnedMediaPurpose[]).some(
      (other) => unoOwnedMediaMime(extension, other) !== undefined,
    );
    return { ok: false, reason: knownElsewhere ? "media:purpose-mismatch" : "media:extension-unsupported" };
  }

  const rawIntegrity = record["integrity"];
  if (rawZone === "generated") {
    if (rawIntegrity === undefined) return { ok: false, reason: "media:integrity-required" };
    if (typeof rawIntegrity !== "string" || !SHA256_HEX.test(rawIntegrity)) {
      return { ok: false, reason: "media:integrity-malformed" };
    }
  } else if (rawIntegrity !== undefined) {
    return { ok: false, reason: "media:integrity-forbidden" };
  }

  const ref: UnoOwnedAssetRef =
    rawIntegrity === undefined ? { zone: rawZone, path } : { zone: rawZone, path, integrity: rawIntegrity };
  return { ok: true, decision: Object.freeze({ ref: Object.freeze(ref), extension, mime, purpose }) };
}

/** True when the first `length` bytes of `bytes` equal `signature`. */
function startsWithBytes(bytes: Uint8Array, signature: readonly number[], offset = 0): boolean {
  if (bytes.length < offset + signature.length) return false;
  for (let index = 0; index < signature.length; index += 1) {
    if (bytes[offset + index] !== signature[index]) return false;
  }
  return true;
}

/** The ASCII text of a bounded byte range, used for the container and caption signatures. */
function asciiAt(bytes: Uint8Array, offset: number, length: number): string {
  let text = "";
  for (let index = 0; index < length; index += 1) {
    const byte = bytes[offset + index];
    if (byte === undefined) return "";
    text += String.fromCharCode(byte);
  }
  return text;
}

/** PNG: the eight-byte signature, including the CRLF/EOF pair that catches a text-mode transfer. */
const PNG_SIGNATURE = Object.freeze([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** JPEG: the start-of-image marker. */
const JPEG_SIGNATURE = Object.freeze([0xff, 0xd8, 0xff]);

/** WebM/Matroska: the EBML header. */
const EBML_SIGNATURE = Object.freeze([0x1a, 0x45, 0xdf, 0xa3]);

/** The UTF-8 byte-order mark a validator may legitimately emit before `WEBVTT`. */
const UTF8_BOM = Object.freeze([0xef, 0xbb, 0xbf]);

/** The four-letter MP4/AVIF major brands this contract accepts, so a stray `ftyp` box is not enough on its own. */
const MP4_BRANDS = /^(?:isom|iso2|iso4|iso5|iso6|mp41|mp42|avc1|dash|mmp4|M4V |MSNV)$/u;

/**
 * Check that `bytes` really are the media family that the extension and purpose claim.
 *
 * The extension and the container must *both* agree: a `.webm` file whose bytes are an MP4 box is refused, and an
 * `.mp4` whose bytes are HTML is refused. Captions are the one text family, so they are checked for the mandatory
 * `WEBVTT` signature at the start of the file rather than for a binary magic number.
 */
export function unoOwnedMediaSignatureIssue(
  bytes: Uint8Array,
  purpose: UnoOwnedMediaPurpose,
  extension: string,
): UnoOwnedMediaRefusal | null {
  if (purpose === "captions") {
    const offset = startsWithBytes(bytes, UTF8_BOM) ? UTF8_BOM.length : 0;
    return asciiAt(bytes, offset, 6) === "WEBVTT" ? null : "media:signature-mismatch";
  }

  if (purpose === "video") {
    if (extension === "webm") return startsWithBytes(bytes, EBML_SIGNATURE) ? null : "media:signature-mismatch";
    // MP4: a `ftyp` box at offset 4 with a plausible major brand.
    if (asciiAt(bytes, 4, 4) !== "ftyp") return "media:signature-mismatch";
    return MP4_BRANDS.test(asciiAt(bytes, 8, 4)) ? null : "media:signature-mismatch";
  }

  if (extension === "png") return startsWithBytes(bytes, PNG_SIGNATURE) ? null : "media:signature-mismatch";
  if (extension === "jpg" || extension === "jpeg") {
    return startsWithBytes(bytes, JPEG_SIGNATURE) ? null : "media:signature-mismatch";
  }
  if (extension === "webp") {
    return asciiAt(bytes, 0, 4) === "RIFF" && asciiAt(bytes, 8, 4) === "WEBP" ? null : "media:signature-mismatch";
  }
  if (extension === "avif") {
    if (asciiAt(bytes, 4, 4) !== "ftyp") return "media:signature-mismatch";
    const brand = asciiAt(bytes, 8, 4);
    return brand === "avif" || brand === "avis" ? null : "media:signature-mismatch";
  }
  return "media:signature-mismatch";
}

/** Read a big-endian 16-bit value, or `null` when the bytes are not there. */
function uint16be(bytes: Uint8Array, offset: number): number | null {
  const high = bytes[offset];
  const low = bytes[offset + 1];
  if (high === undefined || low === undefined) return null;
  return (high << 8) | low;
}

/** Read a big-endian 24-bit value, or `null` when the bytes are not there. */
function uint24le(bytes: Uint8Array, offset: number): number | null {
  const a = bytes[offset];
  const b = bytes[offset + 1];
  const c = bytes[offset + 2];
  if (a === undefined || b === undefined || c === undefined) return null;
  return a | (b << 8) | (c << 16);
}

/** Read a big-endian 32-bit value, or `null` when the bytes are not there. */
function uint32be(bytes: Uint8Array, offset: number): number | null {
  const a = bytes[offset];
  const b = bytes[offset + 1];
  const c = bytes[offset + 2];
  const d = bytes[offset + 3];
  if (a === undefined || b === undefined || c === undefined || d === undefined) return null;
  return a * 0x1000000 + (b << 16) + (c << 8) + d;
}

/** One resolved media locator and its exact MIME type, so a `<source>` never has to guess. */
export interface UnoResolvedMedia {
  readonly src: string;
  readonly type: string;
}

/** One resolved image, with an intrinsic pixel box the renderer can lay out before the bytes arrive. */
export interface UnoResolvedImage extends UnoResolvedMedia {
  readonly width: number;
  readonly height: number;
}

/** The resolved media a single section needs. Absent fields mean the module declared nothing there. */
export interface UnoSectionMedia {
  readonly image?: UnoResolvedImage;
  readonly video?: UnoResolvedMedia;
  readonly poster?: UnoResolvedImage;
  readonly captions?: UnoResolvedMedia;
  readonly items?: readonly UnoResolvedImage[];
}

/** The per-section media projections of one Page, keyed by section id. Server-built, server-consumed. */
export type UnoPageMedia = ReadonlyMap<string, UnoSectionMedia>;

/**
 * The layout box used when an image's intrinsic size cannot be read from its own header.
 *
 * This is a *layout intent* for reserving space, never a claim about the file: the rendered image keeps its natural
 * aspect ratio through CSS, so a wrong nominal box can shift layout but can never distort the picture.
 */
export const UNO_MEDIA_NOMINAL_SIZE = Object.freeze({ width: 1600, height: 1000 });


/**
 * The intrinsic pixel size of an image, read from its own header.
 *
 * PNG, JPEG and WebP are read exactly; AVIF and any container this function does not parse return `null` rather than a
 * guess, so a caller must treat "unknown" as unknown instead of inventing a ratio. Only the bytes already read are
 * inspected; nothing here trusts the extension the file arrived with.
 */
export function unoOwnedMediaImageSize(
  bytes: Uint8Array,
  extension: string,
): { readonly width: number; readonly height: number } | null {
  if (extension === "png") {
    // The IHDR chunk follows the 8-byte signature and its own 8-byte header, so width/height are 32-bit at 16 and 20.
    if (asciiAt(bytes, 12, 4) !== "IHDR") return null;
    const width = uint32be(bytes, 16);
    const height = uint32be(bytes, 20);
    if (width === null || height === null || width === 0 || height === 0) return null;
    return { width, height };
  }

  if (extension === "webp") {
    // Only the extended `VP8X` container carries a plain 24-bit canvas size; a lossy/lossless bitstream is not parsed
    // here, so the caller falls back to its nominal box rather than guessing a ratio.
    if (asciiAt(bytes, 12, 4) !== "VP8X") return null;
    const width = uint24le(bytes, 24);
    const height = uint24le(bytes, 27);
    if (width === null || height === null) return null;
    return { width: width + 1, height: height + 1 };
  }

  if (extension === "jpg" || extension === "jpeg") {
    let offset = 2;
    while (offset + 9 < bytes.length) {
      const marker = uint16be(bytes, offset);
      if (marker === null) return null;
      if (marker === 0xffd8 || (marker >= 0xffd0 && marker <= 0xffd7)) {
        offset += 2;
        continue;
      }
      const length = uint16be(bytes, offset + 2);
      if (length === null || length < 2) return null;
      const isStartOfFrame =
        marker !== null &&
        marker >= 0xffc0 &&
        marker <= 0xffcf &&
        marker !== 0xffc4 &&
        marker !== 0xffc8 &&
        marker !== 0xffcc;
      if (isStartOfFrame) {
        const height = uint16be(bytes, offset + 5);
        const width = uint16be(bytes, offset + 7);
        if (width === null || height === null || width === 0 || height === 0) return null;
        return { width, height };
      }
      offset += 2 + length;
    }
    return null;
  }

  return null;
}




