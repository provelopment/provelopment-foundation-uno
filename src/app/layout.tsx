import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

/**
 * Root layout for the U01 technical baseline.
 *
 * The static `lang="en"` here belongs to this NON-PUBLISHED technical placeholder only.
 * It is not an EFS locale representation and must never be read as `en → en-001` logic:
 * no Entity, Site, Facet, Page or representation is configured or implied.
 */
export const metadata: Metadata = {
  title: 'Foundation Uno',
  description: 'U01 technical baseline — the authored public Site is not configured.',
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
