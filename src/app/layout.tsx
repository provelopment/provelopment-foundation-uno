import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';

/**
 * Root layout for the English informational demonstration.
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

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
