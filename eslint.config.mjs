import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

/**
 * Foundation Uno — U01 baseline lint configuration.
 *
 * Deliberately minimal: the Next.js core-web-vitals and TypeScript presets, plus the
 * generated directories this repository never lints. No rule is disabled to make a
 * failing check pass, and no ignore exception is granted to authored source.
 */
export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  globalIgnores([
    '.next/**',
    'node_modules/**',
    '.temp/**',
    'next-env.d.ts',
    '*.tsbuildinfo',
  ]),
]);
