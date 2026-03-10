import { existsSync } from 'node:fs';
import path from 'node:path';

import tailwindcss from '@tailwindcss/vite';
import { devtools } from '@tanstack/devtools-vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { nitro } from 'nitro/vite';
import { defineConfig } from 'vite';
import viteTsConfigPaths from 'vite-tsconfig-paths';

// Force Vite/Nitro to resolve @noble/ciphers from the better-auth copy (v2.x), which exports managedNonce
const betterAuthNobleCiphersPath = path.resolve(
  __dirname,
  'node_modules/better-auth/node_modules/@noble/ciphers',
);
const defaultNobleCiphersPath = path.resolve(__dirname, 'node_modules/@noble/ciphers');

const nobleCiphersPath = existsSync(betterAuthNobleCiphersPath)
  ? betterAuthNobleCiphersPath
  : defaultNobleCiphersPath;

const config = defineConfig({
  resolve: {
    alias: {
      '@noble/ciphers': nobleCiphersPath,
    },
  },
  plugins: [
    devtools(),
    nitro({
      awsLambda: { streaming: true },
      preset: 'aws-lambda',
    }),
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    tanstackStart({
      srcDirectory: 'src',
    }),
    viteReact({
      babel: {
        plugins: [['babel-plugin-react-compiler', {}]],
      },
    }),
  ],
});

export default config;
