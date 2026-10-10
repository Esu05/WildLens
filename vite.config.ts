import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Fills the service worker with the list of built files so the whole app shell is
 * cached on first visit (needed for offline start-up). The large ONNX Runtime wasm
 * files are not part of it: they are cached when the model is downloaded.
 */
function precacheShell(): Plugin {
  let outDir = 'dist';
  return {
    name: 'wildlens-precache',
    apply: 'build',
    configResolved(c) {
      outDir = c.build.outDir;
    },
    writeBundle(_, bundle) {
      const files = Object.keys(bundle)
        .filter((f) => !f.endsWith('.map') && !f.endsWith('.wasm'))
        // Only Latin font subsets: the rest are fetched (and cached) on demand.
        .filter((f) => !/-(cyrillic|cyrillic-ext|greek|greek-ext|vietnamese|math|symbols)-/.test(f))
        // Older font formats are only used by very old browsers.
        .filter((f) => !f.endsWith('.woff'))
        .map((f) => `/${f}`);
      const extra = ['/manifest.webmanifest', '/icon.svg', '/icons/icon-192.png', '/icons/icon-512.png'];
      const swPath = join(outDir, 'sw.js');
      const id = Date.now().toString(36);
      const sw = readFileSync(swPath, 'utf8')
        .replace('__BUILD_ID__', id)
        .replace('self.__PRECACHE__ || []', JSON.stringify([...new Set([...files, ...extra])]));
      writeFileSync(swPath, sw);
    },
  };
}

export default defineConfig({
  plugins: [react(), precacheShell()],
  worker: { format: 'es' },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },

  preview: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  build: { target: 'es2022', chunkSizeWarningLimit: 1200 },
});
