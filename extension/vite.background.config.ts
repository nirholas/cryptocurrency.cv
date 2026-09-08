import { defineConfig } from 'vite';
import { resolve } from 'node:path';

/**
 * Builds the MV3 service worker as one self-contained ES module at
 * dist/background.js. Runs after the page build, so it must not empty dist/
 * and must not re-copy public/.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@shared': resolve(__dirname, 'src/shared'),
    },
  },
  publicDir: false,
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    target: 'es2022',
    lib: {
      entry: resolve(__dirname, 'src/background/index.ts'),
      formats: ['es'],
      fileName: () => 'background.js',
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
