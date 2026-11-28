/**
 * Foundation Uno — the operational health check (`U07`).
 *
 * WHAT THIS IS. One read-only endpoint an operator uses to answer *is this installation serving its published Pages, and if not, why?*
 * It reports the same decision the Site route makes, reduced to a closed vocabulary: whether the address is served, the authored address
 * it exercised, the canonical origin the installation publishes, and — when nothing is served — the refusal reason code.
 *
 * WHAT THIS IS NOT. It publishes no content, no file path, no environment value and no caller value; the canonical origin and one closed
 * reason code are already visible to a visitor in `robots.txt` and a canonical link. It is excluded from indexing, never cached, never
 * written to, and grants nothing: reporting that an address is served is not serving it.
 *
 * PROVENANCE. Original **Uno-owned** implementation, class **NEW**. No dependency, provider or credential is involved.
 */
import { NextResponse } from "next/server";

import { readUnoDeployEnvironment } from "../../../adapters/deploy/uno-deploy-environment";
import { resolveUnoServingRequest } from "../../../config/uno-serving";

export const dynamic = "force-dynamic";

/** The authored address the check exercises: the first published Page of the starter installation. */
const PROBE_PATHNAME = "/en-001";

export async function GET(): Promise<NextResponse> {
  const decision = await resolveUnoServingRequest({ host: "", pathname: PROBE_PATHNAME });
  const environment = readUnoDeployEnvironment();

  const body =
    decision.kind === "page"
      ? {
          status: "serving",
          address: PROBE_PATHNAME,
          locale: decision.page.identity.localeTag,
          canonical: decision.page.delivery.canonicalUrl,
          origin: environment.operator === null ? "declared" : "operator",
        }
      : {
          status: "refused",
          address: PROBE_PATHNAME,
          reason: decision.kind === "refused" ? decision.reason : "serving:redirect",
          origin: environment.operator === null ? "declared" : "operator",
        };

  return new NextResponse(JSON.stringify(body), {
    status: decision.kind === "page" ? 200 : 503,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": "noindex, nofollow",
    },
  });
}
