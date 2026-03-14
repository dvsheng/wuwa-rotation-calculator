import { existsSync } from 'node:fs';
import path from 'node:path';

import babel from '@rolldown/plugin-babel';
import tailwindcss from '@tailwindcss/vite';
import { devtools } from '@tanstack/devtools-vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact, { reactCompilerPreset } from '@vitejs/plugin-react';
import { nitro } from 'nitro/vite';
import { defineConfig } from 'vite';

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
    tsconfigPaths: true,
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
    tailwindcss(),
    tanstackStart({
      srcDirectory: 'src',
    }),
    viteReact(),
    // @ts-expect-error - RolldownBabelPreset is not assignable to PluginOptions due to incomplete types
    babel({ presets: [reactCompilerPreset()] }),
  ],
});

export default config;
