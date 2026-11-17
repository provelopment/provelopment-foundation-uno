import type { NextConfig } from 'next';

/**
 * Foundation Uno — minimal U01 Next.js configuration.
 *
 * Intentionally tiny. No external loader, no environment publishing, no Connect hook,
 * no analytics and no redirect/rewrite/proxy rules: this baseline serves one non-indexable
 * technical placeholder and nothing else.
 *
 * `experimental.globalNotFound` (Next 16, supported) is the one addition of `UNO-WO-029 / R01`. The
 * App Router now has two root layouts — the `(demo)` demonstration and the `(site)` published Page —
 * so an address that matches no route needs one explicit global 404 document rather than a root
 * layout. It changes no routing: nothing is rewritten, redirected, exported or resolved from the
 * environment, and an unknown address stays a real status 404.
 */
const nextConfig: NextConfig = {
  devIndicators: false,
  experimental: {
    globalNotFound: true,
  },
};

export default nextConfig;
