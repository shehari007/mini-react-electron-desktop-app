import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypeScript from 'eslint-config-next/typescript';

/**
 * eslint-config-next 16 ships native flat configs, so these are spread directly
 * rather than wrapped in FlatCompat (which would pull in @eslint/eslintrc for
 * nothing).
 *
 * ESLint is pinned to 9.x in package.json: the bundled eslint-plugin-react
 * (7.37) peers at `^9.7` and crashes on ESLint 10's changed rule context.
 */
const config = [
  ...nextCoreWebVitals,
  ...nextTypeScript,
  {
    ignores: [
      'out/**',
      '.next/**',
      'dist-electron/**',
      'release/**',
      'public/sw.js',
      'next-env.d.ts',
      // Throwaway directory used for ad-hoc verification scripts.
      '.tmpcheck/**',
    ],
  },
  {
    rules: {
      /**
       * Downgraded to a warning, deliberately.
       *
       * This app is a static export, so anything that differs between the
       * prerender and the browser — the current time, crypto randomness, a
       * localStorage read, a fetched forecast — legally cannot be computed during
       * render without a hydration mismatch. Initialising it from an effect is
       * the correct mechanism, and the rule cannot distinguish that case from an
       * accidental cascading render.
       *
       * It stays enabled as a warning so genuinely avoidable cases still get
       * flagged; the hooks in `src/lib/hooks.ts` use `useSyncExternalStore`
       * wherever a real subscription exists.
       */
      'react-hooks/set-state-in-effect': 'warn',

      // Tool pages render only serialised JSON-LD through dangerouslySetInnerHTML,
      // never user input.
      'react/no-danger': 'off',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
];

export default config;
