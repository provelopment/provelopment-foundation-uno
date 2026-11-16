import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

/**
 * Root layout for the English informational demonstration.
 *
 * The static `lang="en"` describes this NON-PUBLISHED informational page. It is not an EFS locale
 * representation, it is not the authored locale identifier `en-001`, and it must never be read as
 * `en → en-001` logic: no Entity, Site, Facet, Page or representation is configured by it.
 *
 * Metadata stays deliberately minimal and truthful: the pre-publication `noindex, nofollow` policy
 * is preserved, and no canonical, alternate/hreflang, sitemap or analytics tag is invented here.
 */
export const metadata: Metadata = {
  title: 'Foundation Uno — a single-Entity website foundation',
  description:
    'English demonstration of Foundation Uno, an independent Apache-2.0 Next.js and TypeScript website foundation built for one Entity. Full authored Site publication is not yet enabled.',
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
      <body>{children}</body>
    </html>
  );
}
