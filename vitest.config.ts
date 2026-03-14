import { fileURLToPath } from 'node:url';

import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, process.cwd(), '');
  process.env = { ...process.env, ...environment };
  return {
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('src', import.meta.url)),
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./vitest.setup.ts'],
      exclude: ['**/node_modules/**', '**/dist/**'],
    },
  };
});
