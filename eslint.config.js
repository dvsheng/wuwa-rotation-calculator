// @ts-check
import { tanstackConfig } from '@tanstack/eslint-config';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import tailwindcss from 'eslint-plugin-tailwindcss';
import eslintPluginUnicorn from 'eslint-plugin-unicorn';

// Reuse the same import plugin instance tanstack registered to satisfy per-config-object
// plugin validation without triggering "cannot redefine plugin" errors.
const importPlugin = tanstackConfig.find((c) => c.plugins?.import)?.plugins?.import;

export default [
  {
    ignores: [
      '.output/**',
      'node_modules/**',
      'dist/**',
      '.tanstack/**',
      'src/routeTree.gen.ts',
      'src/lib/utils.ts',
      'src/components/ui/**',
      'eslint.config.js',
      'prettier.config.js',
      'infra/node_modules/**',
      'infra/cdk.out',
    ],
  },
  ...tanstackConfig,
  eslintPluginUnicorn.configs.recommended,
  {
    plugins: {
      import: importPlugin,
      'react-hooks': reactHooks,
      'simple-import-sort': simpleImportSort,
      tailwindcss,
    },
    settings: {
      tailwindcss: {
        config: false,
        callees: ['cn', 'clsx', 'cva'],
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'tailwindcss/no-arbitrary-value': 'error',
      'tailwindcss/no-unnecessary-arbitrary-value': 'error',
      'tailwindcss/suggest-canonical-classes': 'off',
      'import/order': [
        'error',
        {
          groups: [
            'builtin', // Node.js built-ins: fs, path
            'external', // npm packages: react, lodash
            'internal', // internal aliases: @/utils
            'parent', // ../relative imports
            'sibling', // ./relative imports
            'index', // ./current folder imports: index.js
          ],
          pathGroups: [
            {
              pattern: '@/**',
              group: 'internal',
            },
          ],
          pathGroupsExcludedImportTypes: ['builtin'],
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
          'newlines-between': 'always', // add blank lines between groups
        },
      ],
    },
  },

  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      import: importPlugin,
    },
    rules: {
      'import/no-relative-parent-imports': 'error',
      'unicorn/no-array-reduce': 'off',
      'unicorn/filename-case': [
        'error',
        {
          cases: {
            kebabCase: true,
            pascalCase: true,
            camelCase: true,
          },
        },
      ],
    },
  },
  {
    files: ['infra/**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: './infra/tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  prettier,
];
