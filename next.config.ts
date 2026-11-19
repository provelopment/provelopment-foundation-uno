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
 *
 * `outputFileTracingIncludes` (`UNO-WO-033 / R01`) is the *bounded* half of the file-tracing fix. The
 * confined EFS reader now reads its authored content through a statically scoped prefix, so the build
 * no longer traces the whole repository into the server payload — but the two fixed declarations and the
 * authored content are then no longer discovered by static analysis either. They are therefore listed
 * here, explicitly and narrowly, for exactly the three server routes that read them at runtime. Nothing
 * else is included: no `.documents/`, no private ACTIVE, no `.temp/`, no test harness, no parent or
 * sibling path, and no wildcard that could reach them. `scripts/verify-u03-trace.mjs` refuses a build
 * where this list is missing, widened or ineffective.
 */
const UNO_DEPLOYMENT_INPUTS = [
  './deployment/efs/manifest.json',
  './deployment/uno.config.json',
  './deployment/efs/content/**/*.md',
  './deployment/efs/content/**/*.json',
];

/**
 * The four owned-media zone roots (`UNO-WO-040 / R01`). Each is a *named* root, not a wildcard over `deployment/**` or
 * `public/**`: the page route needs them to render an accepted JSON Page's media, and the media route needs them to read
 * one already-authorised occurrence. `scripts/verify-u03-trace.mjs` refuses a build where this list is missing, widened
 * or ineffective, so the bounded tracing stays provable rather than promised.
 */
const UNO_MEDIA_ZONE_INPUTS = [
  './deployment/efs/capsule/**/*',
  './deployment/content/assets/**/*',
  './public/platform/**/*',
  './public/_uno-generated/**/*',
];

const nextConfig: NextConfig = {
  devIndicators: false,
  experimental: {
    globalNotFound: true,
  },
  outputFileTracingIncludes: {
    '/[locale]/[[...segments]]': [...UNO_DEPLOYMENT_INPUTS, ...UNO_MEDIA_ZONE_INPUTS],
    '/sitemap.xml': UNO_DEPLOYMENT_INPUTS,
    '/robots.txt': UNO_DEPLOYMENT_INPUTS,
    '/uno-media/[...segments]': [...UNO_DEPLOYMENT_INPUTS, ...UNO_MEDIA_ZONE_INPUTS],
  },
};

export default nextConfig;
