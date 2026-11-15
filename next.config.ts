import type { NextConfig } from 'next';

/**
 * Foundation Uno — minimal U01 Next.js configuration.
 *
 * Intentionally tiny. No external loader, no environment publishing, no Connect hook,
 * no analytics and no redirect/rewrite rules: this baseline serves one non-indexable
 * technical placeholder and nothing else.
 */
const nextConfig: NextConfig = {
  devIndicators: false,
};

export default nextConfig;
