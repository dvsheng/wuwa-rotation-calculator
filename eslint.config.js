// @ts-check
import { tanstackConfig } from '@tanstack/eslint-config';
import prettier from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';
import reactCompiler from 'eslint-plugin-react-compiler';
import reactHooks from 'eslint-plugin-react-hooks';
import simpleImportSort from 'eslint-plugin-simple-import-sort';

export default [
  {
    ignores: ['.output/**', 'node_modules/**', 'dist/**', '.tanstack/**'],
  },

  ...tanstackConfig,
  {
    plugins: {
      'react-compiler': reactCompiler,
      'react-hooks': reactHooks,
      'simple-import-sort': simpleImportSort,
      prettier: prettierPlugin,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'prettier/prettier': 'error',
      'react-compiler/react-compiler': 'error',
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
    rules: {
      'import/no-relative-parent-imports': 'error',
    },
  },
  prettier,
];
