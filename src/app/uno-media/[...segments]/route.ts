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
 */
import { readUnoServingMedia } from "../../../config/uno-serving";

/** Every request is authorised and read fresh; nothing about a locator is cached at build time. */
export const dynamic = "force-dynamic";

/** One closed refusal: status only, no path, no reason, no content. */
function notFound(): Response {
  return new Response(null, { status: 404, headers: { "cache-control": "no-store" } });
}

/** Serve one authorised occurrence, or answer a real 404. */
export async function GET(
  _request: Request,
  context: { params: Promise<{ segments: readonly string[] }> },
): Promise<Response> {
  const { segments } = await context.params;
  const outcome = await readUnoServingMedia(segments);
  if (outcome.status !== "resolved") return notFound();

  const body = new Uint8Array(outcome.bytes);
  return new Response(body, {
    status: 200,
    headers: {
      "content-type": outcome.mime,
      "content-length": String(body.byteLength),
      "x-content-type-options": "nosniff",
      "cache-control": "public, max-age=0, must-revalidate",
      "referrer-policy": "no-referrer",
      "content-security-policy": "default-src 'none'; sandbox",
    },
  });
}
