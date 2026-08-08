import { builtinModules } from 'node:module';
import { defineConfig } from 'vite';

const nodeExternals = [
  'electron',
  ...builtinModules,
  ...builtinModules.map((m) => `node:${m}`),
];

/**
 * Vite's only job here is the Electron side: compile `electron/main.ts` and
 * `electron/preload.ts` from TypeScript into `dist-electron/`. The renderer is
 * built entirely by Next.js (`next build` → `out/`).
 *
 * Both entries emit CommonJS. Electron loads sandboxed preload scripts as CJS
 * and never as ESM, and keeping the main process on the same module format
 * avoids needing `"type": "module"` (which would then break the preload).
 */
export default defineConfig({
  // Vite copies `public/` into the output directory by default. Those assets are
  // already served from the Next.js export, so copying them here would ship a
  // second 1.2MB copy of the alert sound inside the installer.
  publicDir: false,
  build: {
    outDir: 'dist-electron',
    emptyOutDir: true,
    target: 'node22',
    minify: false,
    sourcemap: process.env.NODE_ENV === 'development' ? 'inline' : false,
    rollupOptions: {
      input: {
        main: 'electron/main.ts',
        preload: 'electron/preload.ts',
      },
      external: nodeExternals,
      output: {
        format: 'cjs',
        dir: 'dist-electron',
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name].js',
      },
    },
  },
});
