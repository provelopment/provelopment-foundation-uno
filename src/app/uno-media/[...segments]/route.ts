/**
 * Foundation Uno — the owned-media serving route (`UNO-WO-040 / R01`, U04).
 *
 * WHAT THIS IS. One narrow, same-origin HTTP route for owned media. Its path is a **locator**, not a storage path: the
 * final segment is an occurrence index and everything before it is a Page's own public address. The route re-derives the
 * address, asks the serving composition to re-run the full publication and media preflight, and only then returns the
 * bytes of the one occurrence that address declares.
 *
 * WHAT IT CANNOT DO. It cannot read an arbitrary file: there is no filesystem call here, no path parameter, no query, no
 * glob and no directory listing. A locator naming an unpublished Page, an unlisted Page other than at its own exact
 * address, an out-of-range occurrence, a wrong Site or locale, an unowned asset or invalid bytes is a real **404** with
 * no body and no path in the response. Discovery is untouched: this route adds no sitemap entry, navigation link or
 * locale alias, so it cannot make an unlisted Page findable.
 *
 * HEADERS. The response carries the asset's true MIME type, `nosniff`, a `no-referrer` policy and a restrictive
 * `default-src 'none'; sandbox` policy, so a served image or caption track can never execute script or reach the network.
 *
 * NATIVE VIDEO (`UNO-WO-048 / R01`). An authorised `video/mp4` or `video/webm` occurrence advertises
 * `accept-ranges: bytes` and honours exactly one bounded `Range: bytes=…` request with a `206` slice, or answers `416`
 * naming only the total size in `content-range` with no body when the range cannot be satisfied. `HEAD` runs the identical
 * authorisation and media preflight and returns the full authorised metadata with no body. Range never grants
 * publication: an unauthorised locator is a real `404` decided *before* any range or size is inspected, and nothing
 * from the request is ever reflected into a response or a log. Non-video resources ignore a range and serve the full
 * authorised `200`; `HEAD` ignores a range; an `If-Range` without a supported validator is ignored, because this route
 * publishes no ETag and no modification time.
 */
import { readUnoServingMedia } from "../../../config/uno-serving";

/** Every request is authorised and read fresh; nothing about a locator is cached at build time. */
export const dynamic = "force-dynamic";

/** One closed refusal: status only, no path, no reason, no content. */
function notFound(): Response {
  return new Response(null, { status: 404, headers: { "cache-control": "no-store" } });
}

/** The security envelope every served byte carries, independent of status or range. */
function servedHeaders(mime: string, length: number): Record<string, string> {
  return {
    "content-type": mime,
    "content-length": String(length),
    "x-content-type-options": "nosniff",
    "referrer-policy": "no-referrer",
    "content-security-policy": "default-src 'none'; sandbox",
  };
}

/** A native video resource is the only kind that may advertise or satisfy a byte range. */
function isRangedVideo(mime: string): boolean {
  return mime === "video/mp4" || mime === "video/webm";
}


/** One parsed request range, or a refusal describing why it cannot be satisfied. */
type RangeOutcome =
  | { readonly status: "none" }
  | { readonly status: "ignore" }
  | { readonly status: "unsatisfiable" }
  | { readonly status: "partial"; readonly start: number; readonly end: number };

const SINGLE_RANGE = /^bytes=(\d{0,12})-(\d{0,12})$/u;

/**
 * Parse exactly one `bytes=` range.
 *
 * `none` means the request asked for no range at all; `ignore` means a range was present but this route will
 * deliberately serve the whole authorised body; `unsatisfiable` covers malformed, reversed, zero-length, overflowing
 * and unreachable forms, which answer `416` for an authorised video; `partial` carries an inclusive, bounded slice.
 */
function parseRange(value: string | null, total: number): RangeOutcome {
  if (value === null || value.trim().length === 0) return { status: "none" };
  const match = SINGLE_RANGE.exec(value.trim());
  if (match === null) return { status: "unsatisfiable" };
  const [, rawFirst = "", rawLast = ""] = match;
  if (rawFirst.length === 0 && rawLast.length === 0) return { status: "unsatisfiable" };

  if (rawFirst.length === 0) {
    const suffix = Number(rawLast);
    if (!Number.isSafeInteger(suffix) || suffix <= 0) return { status: "unsatisfiable" };
    if (total === 0) return { status: "unsatisfiable" };
    return { status: "partial", start: Math.max(0, total - suffix), end: total - 1 };
  }

  const first = Number(rawFirst);
  if (!Number.isSafeInteger(first)) return { status: "unsatisfiable" };
  const last = rawLast.length === 0 ? total - 1 : Number(rawLast);
  if (!Number.isSafeInteger(last)) return { status: "unsatisfiable" };
  if (last < first) return { status: "unsatisfiable" };
  if (first >= total) return { status: "unsatisfiable" };
  return { status: "partial", start: first, end: Math.min(last, total - 1) };
}

/** An authorised video whose declared range cannot be satisfied: metadata only, never media. */
function rangeNotSatisfiable(mime: string, total: number): Response {
  return new Response(null, {
    status: 416,
    headers: {
      ...servedHeaders(mime, 0),
      "content-range": `bytes */${total}`,
      "accept-ranges": "bytes",
      "cache-control": "public, max-age=0, must-revalidate",
    },
  });
}

/** Serve one authorised occurrence, or answer a real 404. */
export async function GET(
  request: Request,
  context: { params: Promise<{ segments: readonly string[] }> },
): Promise<Response> {
  const { segments } = await context.params;
  const outcome = await readUnoServingMedia(segments, request.headers.get("host") ?? "");
  if (outcome.status !== "resolved") return notFound();

  const body = new Uint8Array(outcome.bytes);
  const total = body.byteLength;
  const cacheControl = "public, max-age=0, must-revalidate";

  if (!isRangedVideo(outcome.mime)) {
    return new Response(body, {
      status: 200,
      headers: { ...servedHeaders(outcome.mime, total), "cache-control": cacheControl },
    });
  }

  const range =
    request.headers.get("if-range") === null
      ? parseRange(request.headers.get("range"), total)
      : ({ status: "ignore" } as const);

  if (range.status === "unsatisfiable") return rangeNotSatisfiable(outcome.mime, total);

  if (range.status === "partial") {
    const slice = body.subarray(range.start, range.end + 1);
    return new Response(slice, {
      status: 206,
      headers: {
        ...servedHeaders(outcome.mime, slice.byteLength),
        "content-range": `bytes ${range.start}-${range.end}/${total}`,
        "accept-ranges": "bytes",
        "cache-control": cacheControl,
      },
    });
  }

  return new Response(body, {
    status: 200,
    headers: { ...servedHeaders(outcome.mime, total), "accept-ranges": "bytes", "cache-control": cacheControl },
  });
}

/**
 * Answer a `HEAD` from the identical authorisation and media preflight, with no response body.
 *
 * `Content-Length` is the authorised full length, never a slice: a range header is ignored here, and this route
 * publishes no ETag and no modification time. Every refusal is the same closed `404`.
 */
export async function HEAD(
  _request: Request,
  context: { params: Promise<{ segments: readonly string[] }> },
): Promise<Response> {
  const { segments } = await context.params;
  const outcome = await readUnoServingMedia(segments, _request.headers.get("host") ?? "");
  if (outcome.status !== "resolved") return notFound();

  const total = new Uint8Array(outcome.bytes).byteLength;
  const headers: Record<string, string> = {
    ...servedHeaders(outcome.mime, total),
    "cache-control": "public, max-age=0, must-revalidate",
  };
  if (isRangedVideo(outcome.mime)) headers["accept-ranges"] = "bytes";

  return new Response(null, { status: 200, headers });
}


