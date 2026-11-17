/**
 * Foundation Uno — the locale-root layout of the published Site (`UNO-WO-029 / R01`, U03).
 *
 * WHAT THIS IS. The single `<html>` document of the `(site)` route group. Because `(site)` is a separate root, the
 * demonstration and a published Page no longer share one language attribute: this layout asks the server-only
 * composition for the **stored, validated** full locale tag of the requested path key and renders exactly that.
 *
 * AUTHORITY. The tag comes from the selected Site's own committed locale declaration — `de-de` maps back to the
 * authored `de-DE`, `en-001` to `en-001` — and never from a Host, a cookie, `Accept-Language`, an environment
 * variable or the raw path. An unknown, hostile or missing key is refused with the ordinary 404 instead of a guess.
 * An explicit stored short alias (for example `en`) resolves to its own declared target so the Page can issue one
 * temporary redirect; this layout never redirects, never adds a canonical or `hreflang`, and adds no analytics.
 */
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';

import { listUnoServingAddresses, resolveUnoServingLocaleTag } from '../../../config/uno-serving';
import '../../globals.css';

/** The one route parameter this document needs. */
interface LocaleLayoutParams {
  readonly locale?: string;
  readonly segments?: readonly string[];
}

/**
 * The locales this deployment generates. A dynamic segment's parameters are declared in the file that creates the
 * segment, so this layout enumerates the locales an address may start with — the full authored path keys plus any
 * explicit stored short alias — from the same gate the Page segment uses for its own segment shapes.
 */
export async function generateStaticParams(): Promise<LocaleLayoutParams[]> {
  const addresses = await listUnoServingAddresses();
  const locales: string[] = [];
  for (const address of addresses) {
    if (!locales.includes(address.locale)) locales.push(address.locale);
  }
  return locales.map((locale) => ({ locale }));
}

/** Only generated addresses are part of this deployment; the router refuses everything else. */
export const dynamicParams = false;

/** Render the document with the authored full locale tag, or refuse the address. */
export default async function SiteLocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<LocaleLayoutParams>;
}) {
  const resolved = await params;
  const locale = await resolveUnoServingLocaleTag(resolved.locale);
  if (locale.status === 'unknown') notFound();

  return (
    <html lang={locale.tag}>
      <body>{children}</body>
    </html>
  );
}
