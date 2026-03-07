import tailwindcss from '@tailwindcss/vite';
import viteReact from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
import viteTsConfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, process.cwd(), '');
  process.env = { ...process.env, ...environment };
  return {
    plugins: [
      viteTsConfigPaths({
        projects: ['./tsconfig.json'],
      }),
      tailwindcss(),
      viteReact({
        babel: {
          plugins: [['babel-plugin-react-compiler', {}]],
        },
      }),
    ],
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./vitest.setup.ts'],
      exclude: ['**/node_modules/**', '**/dist/**'],
    },
  };
});
