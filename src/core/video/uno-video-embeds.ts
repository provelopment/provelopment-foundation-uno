/**
 * Foundation Uno — the governed external-video embed policy (`UNO-WO-041 / R01`, U04).
 *
 * WHAT THIS IS. One pure, framework-free, IO-free module that owns the **only** four external video providers this
 * build may embed — YouTube, Vimeo, Rumble, BitChute — each with an exact identifier grammar, one fixed HTTPS endpoint
 * constructor and one fixed origin. It answers exactly one question: "given an authored embed descriptor, what is the
 * single safe, public projection of it?" — and returns either that projection or one closed refusal literal.
 *
 * WHAT IT IS NOT. It is not a provider client. It performs no fetch, DNS lookup, redirect, oEmbed call, server-side
 * probe, media download, SDK load or credential use, and it never accepts an author-supplied URL, host, query, iframe,
 * HTML or permission list. A provider can only be named by one of four exact lowercase literals; anything else — a
 * near-spelling, a mixed case, a watch URL pasted into the ID, a protocol-relative or `javascript:` value — is refused
 * rather than repaired. Adding a fifth provider requires new Owner-reviewed code, origins and tests; there is no
 * runtime registration, no config list and no domain wildcard.
 *
 * WHY IT IS SEPARATE FROM OWNED MEDIA. An external embed is **not** an owned asset: it never resolves through
 * `OwnedAssetRef`, never routes through `/uno-media/...`, is never counted as a media zone and grants no publication
 * authority. It only produces a validated destination that a visitor may *choose* to connect to.
 *
 * PROVENANCE. Original **Uno-owned** implementation, class **NEW**. No provider source, SDK, embed markup, trademark
 * asset, thumbnail or third-party code is copied; the endpoint forms are the providers' own published embed URLs and
 * the `iframe` that consumes them is Uno-authored inert JSX.
 */

/** The only four providers this build may embed, in canonical order. */
export const UNO_VIDEO_PROVIDERS = Object.freeze(["youtube", "vimeo", "rumble", "bitchute"] as const);

/** One governed external video provider. */
export type UnoVideoProvider = (typeof UNO_VIDEO_PROVIDERS)[number];

/** The closed refusal vocabulary. One literal per failure family, never an echoed value. */
export type UnoVideoEmbedRefusal =
  | "video:shape-invalid"
  | "video:provider-unknown"
  | "video:id-invalid"
  | "video:hash-invalid"
  | "video:hash-forbidden";

/** The same vocabulary as frozen data, so a caller can assert membership without copying literals. */
export const UNO_VIDEO_EMBED_REFUSAL_REASONS: readonly UnoVideoEmbedRefusal[] = Object.freeze([
  "video:shape-invalid",
  "video:provider-unknown",
  "video:id-invalid",
  "video:hash-invalid",
  "video:hash-forbidden",
] as const);

/** The authored embed descriptor: a closed provider literal, its opaque ID, and Vimeo's optional privacy hash. */
export interface UnoVideoEmbedRef {
  readonly provider: UnoVideoProvider;
  readonly videoId: string;
  readonly vimeoHash?: string;
}

/**
 * The only thing that reaches a renderer: public, validated, constructed values.
 *
 * It carries no authored key, no account, no secret and no Page identity. The fallback link is the provider's own fixed
 * embed endpoint, so no watch-page slug is ever guessed.
 */
export interface UnoVideoEmbedProjection {
  readonly provider: UnoVideoProvider;
  readonly providerLabel: string;
  readonly embedUrl: string;
  readonly externalFallbackUrl: string;
}

/** The projection, or one closed refusal. */
export type UnoVideoEmbedResult =
  | { readonly ok: true; readonly projection: UnoVideoEmbedProjection }
  | { readonly ok: false; readonly reason: UnoVideoEmbedRefusal };

/** The display name of each provider, used for the consent control and the disclosure sentence. */
const PROVIDER_LABELS: Readonly<Record<UnoVideoProvider, string>> = Object.freeze({
  youtube: "YouTube",
  vimeo: "Vimeo",
  rumble: "Rumble",
  bitchute: "BitChute",
});

/** YouTube: exactly eleven ASCII `[A-Za-z0-9_-]` characters. */
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/u;

/** Vimeo: 1–20 ASCII decimal digits, first digit non-zero (no leading zero, no sign, no decimal point). */
const VIMEO_ID = /^[1-9][0-9]{0,19}$/u;

/** Vimeo privacy hash: 8–64 lowercase hexadecimal characters. */
const VIMEO_HASH = /^[0-9a-f]{8,64}$/u;

/** Rumble: 2–64 letters/digits, optionally one interior dot between two non-empty components. */
const RUMBLE_ID = /^[A-Za-z0-9]{1,32}(?:\.[A-Za-z0-9]{1,31})?$/u;

/** BitChute: 5–64 letters, digits, hyphen or underscore. */
const BITCHUTE_ID = /^[A-Za-z0-9_-]{5,64}$/u;

/** True when `value` is exactly one governed provider literal, with no case folding and no trim. */
export function isUnoVideoProvider(value: unknown): value is UnoVideoProvider {
  return typeof value === "string" && (UNO_VIDEO_PROVIDERS as readonly string[]).includes(value);
}

/** The display label of one provider. */
export function unoVideoProviderLabel(provider: UnoVideoProvider): string {
  return PROVIDER_LABELS[provider];
}

/** Refuse with one closed literal. */
function refuse(reason: UnoVideoEmbedRefusal): UnoVideoEmbedResult {
  return { ok: false, reason };
}

/** A plain own-data view of an untrusted object, or `null` for anything with a prototype, accessor or symbol key. */
function readOwnPlain(value: unknown): Readonly<Record<string, unknown>> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  if (Object.getOwnPropertySymbols(value).length !== 0) return null;
  const prototype = Object.getPrototypeOf(value) as object | null;
  if (prototype !== Object.prototype && prototype !== null) return null;
  for (const key of Object.getOwnPropertyNames(value)) {
    if (key === "__proto__" || key === "constructor" || key === "prototype") return null;
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor === undefined || !("value" in descriptor)) return null;
  }
  return value as Readonly<Record<string, unknown>>;
}

/**
 * Validate one authored embed descriptor and construct its fixed projection.
 *
 * The provider is matched exactly first, so `YouTube`, `youtube ` or `youtube2` are unknown providers rather than
 * repaired IDs. The identifier must then satisfy that provider's own grammar in full: the value is never trimmed,
 * decoded, case-folded or normalised, so a percent-encoded slash, a homograph, an HTML entity or a control character
 * can never survive into a constructed URL. `vimeoHash` exists for Vimeo alone and is forbidden everywhere else.
 */
export function readUnoVideoEmbed(value: unknown): UnoVideoEmbedResult {
  const record = readOwnPlain(value);
  if (record === null) return refuse("video:shape-invalid");

  const allowed = ["provider", "videoId", "vimeoHash"];
  for (const key of Object.getOwnPropertyNames(record)) {
    if (!allowed.includes(key)) return refuse("video:shape-invalid");
  }
  if (!Object.prototype.hasOwnProperty.call(record, "provider")) return refuse("video:shape-invalid");
  if (!Object.prototype.hasOwnProperty.call(record, "videoId")) return refuse("video:shape-invalid");

  const provider = record["provider"];
  if (!isUnoVideoProvider(provider)) return refuse("video:provider-unknown");

  const videoId = record["videoId"];
  if (typeof videoId !== "string") return refuse("video:id-invalid");

  const rawHash = record["vimeoHash"];
  if (rawHash !== undefined && provider !== "vimeo") return refuse("video:hash-forbidden");

  let embedUrl: string;
  if (provider === "youtube") {
    if (!YOUTUBE_ID.test(videoId)) return refuse("video:id-invalid");
    embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}`;
  } else if (provider === "vimeo") {
    if (!VIMEO_ID.test(videoId)) return refuse("video:id-invalid");
    if (rawHash === undefined) {
      embedUrl = `https://player.vimeo.com/video/${videoId}?dnt=1`;
    } else {
      if (typeof rawHash !== "string" || !VIMEO_HASH.test(rawHash)) return refuse("video:hash-invalid");
      embedUrl = `https://player.vimeo.com/video/${videoId}?dnt=1&h=${rawHash}`;
    }
  } else if (provider === "rumble") {
    if (!RUMBLE_ID.test(videoId) || videoId.length < 2 || videoId.length > 64) return refuse("video:id-invalid");
    embedUrl = `https://rumble.com/embed/${videoId}/`;
  } else {
    if (!BITCHUTE_ID.test(videoId)) return refuse("video:id-invalid");
    embedUrl = `https://www.bitchute.com/embed/${videoId}/`;
  }

  return {
    ok: true,
    projection: Object.freeze({
      provider,
      providerLabel: PROVIDER_LABELS[provider],
      embedUrl,
      // The provider's own fixed embed endpoint is the honest outbound fallback: no watch-page slug is invented.
      externalFallbackUrl: embedUrl,
    }),
  };
}

/** The fixed HTTPS origins this build may frame, in canonical order. Used by the readiness and runner proofs. */
export const UNO_VIDEO_EMBED_ORIGINS: readonly string[] = Object.freeze([
  "https://www.youtube-nocookie.com",
  "https://player.vimeo.com",
  "https://rumble.com",
  "https://www.bitchute.com",
]);

/** The exact prefix each constructed embed URL must start with, one per provider. */
export const UNO_VIDEO_EMBED_PREFIXES: Readonly<Record<UnoVideoProvider, string>> = Object.freeze({
  youtube: "https://www.youtube-nocookie.com/embed/",
  vimeo: "https://player.vimeo.com/video/",
  rumble: "https://rumble.com/embed/",
  bitchute: "https://www.bitchute.com/embed/",
});

