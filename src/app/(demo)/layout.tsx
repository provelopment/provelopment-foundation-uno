import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Analytics } from '@vercel/analytics/next';
import '../globals.css';

/**
 * Root layout of the `(demo)` route group, which serves the English informational demonstration at `/`.
 *
 * `(demo)` is a route group, so this file is a **root layout**: it owns `<html>` and `<body>` for the
 * demonstration and for nothing else. The published EFS Site lives in the separate `(site)` group, whose own
 * locale-root layout owns a truthful `<html lang>` for an authored locale. Moving this file into the group
 * changed no copy, no metadata and no analytics placement.
 *
 * The static `lang="en"` describes this NON-PUBLISHED informational page. It is not an EFS locale
 * representation, it is not the authored locale identifier `en-001`, and it must never be read as
 * `en → en-001` logic: no Entity, Site, Facet, Page or representation is configured by it.
 *
 * Metadata stays deliberately minimal and truthful: the pre-publication `noindex, nofollow` policy
 * is preserved, and no canonical, alternate/hreflang or sitemap tag is invented here.
 *
 * ANALYTICS. Exactly one provider integration is approved for Uno: the official
 * `@vercel/analytics` package (MIT), pinned to `2.0.1`, imported through its Next.js App Router
 * entry and rendered once here. It is a source-level capability only. Whether Uno's Vercel project
 * collects Web Analytics is a separate provider setting the Owner controls, and this file makes no
 * claim about it. No other provider, tag manager, custom event, cookie, secret, external script or
 * relaxed metadata is introduced, and the page itself stays unchanged.
 */
export const metadata: Metadata = {
  title: 'Foundation Uno | One organisation. One connected digital presence.',
  description:
    'Foundation Uno by Provelopment will give organisations clear ownership, structured content, reliable publishing and intentionally authored regional editions. Explore the live single-page example.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

/**
 * `U05` — one analytics policy across the product: nothing is measured unless an operator asks for it.
 *
 * The approved `@vercel/analytics` integration remains the demonstration route's only collector, and it now renders **only** when
 * `UNO_DEMO_ANALYTICS` is exactly `1`. Unset — which is the shipped state and the state every gate builds in — the component is
 * not rendered at all, so the route loads no measurement script and records nothing. The flag is server-only, is read at request
 * time, and cannot be set by authored copy, a Page, a property or a published Site.
 *
 * The published Site has its own opt-in declaration (`analytics.enabled`) and forwards to an operator-configured same-origin
 * collector; neither mechanism can switch the other on.
 */
export const dynamic = "force-dynamic";

/** True only when an operator explicitly opted the demonstration route into its approved collector. */
const demoAnalyticsEnabled = (): boolean => process.env.UNO_DEMO_ANALYTICS === "1";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        {demoAnalyticsEnabled() ? <Analytics /> : null}
      </body>
    </html>
  );
}
