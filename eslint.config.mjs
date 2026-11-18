import nextPlugin from '@next/eslint-plugin-next';
import { defineConfig, globalIgnores } from 'eslint/config';
import importPlugin from 'eslint-plugin-import';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * Foundation Uno — U01 baseline lint configuration.
 *
 * The former `eslint-config-next` meta-package pulled a development-only
 * `picomatch` advisory path through `eslint-import-resolver-typescript →
 * tinyglobby → fdir`. This file reconstitutes that meta-package's *effective*
 * ruleset from the individual plugins it re-exported, at the same or stricter
 * severity, so that the vulnerable resolver chain is gone while every Next
 * core-web-vitals, React, React-hooks, TypeScript, accessibility and import rule
 * that previously ran still runs.
 *
 * Parity is not asserted here, it is measured: `--print-config` output from
 * before and after the migration is compared rule key by rule key, and an
 * architecture gate fails if any previously active rule disappears or is
 * demoted.
 *
 * No rule is disabled to make a failing check pass, and no ignore exception is
 * granted to authored source.
 */

/** Severity and membership of the accessibility rules Next's preset enabled. */
const A11Y_RULES = {
  'jsx-a11y/alt-text': 'warn',
  'jsx-a11y/aria-props': 'warn',
  'jsx-a11y/aria-proptypes': 'warn',
  'jsx-a11y/aria-unsupported-elements': 'warn',
  'jsx-a11y/role-has-required-aria-props': 'warn',
  'jsx-a11y/role-supports-aria-props': 'warn',
};

/** Normalise a preset that may be exposed as one config object or an array. */
const asList = (preset) => (Array.isArray(preset) ? preset : [preset]);

export default defineConfig([
  // `@next/eslint-plugin-next` exposes flat configs directly on `configs`.
  ...asList(nextPlugin.configs['core-web-vitals']),
  ...asList(tseslint.configs.recommended),
  ...asList(react.configs.flat.recommended),
  ...asList(reactHooks.configs.flat.recommended),
  {
    plugins: {
      'jsx-a11y': jsxA11y,
      import: importPlugin,
    },
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    settings: {
      react: { version: 'detect' },
      'import/parsers': { '@typescript-eslint/parser': ['.ts', '.tsx'] },
      'import/resolver': {
        node: { extensions: ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'] },
      },
    },
    rules: {
      ...A11Y_RULES,
      'import/no-anonymous-default-export': 'warn',
      // React 17+ App Router code uses the automatic JSX runtime, so requiring a
      // `React` binding is obsolete. This rule was NOT part of the inherited
      // effective ruleset (see the measured `--print-config` parity gate), so
      // turning it off restores exact parity rather than demoting an active rule.
      // The three beneficial React additions that the inherited preset lacked
      // (jsx-no-target-blank, no-unknown-property, prop-types) stay enabled.
      'react/react-in-jsx-scope': 'off',
    },
  },
  globalIgnores([
    '.next/**',
    'node_modules/**',
    '.temp/**',
    'next-env.d.ts',
    '*.tsbuildinfo',
  ]),
]);
