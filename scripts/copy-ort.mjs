// Copies the ONNX Runtime WebAssembly files into public/ort so the app can load
// them from its own origin. Without this, Transformers.js fetches them from a CDN,
// which would break offline use.
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// fileURLToPath (not URL.pathname) so this also works on Windows paths like F:\wildlens.
const root = fileURLToPath(new URL('..', import.meta.url));

// onnxruntime-web is a dependency of @huggingface/transformers; it is usually hoisted
// to the top level but may be nested, so check both locations.
const candidates = [
  join(root, 'node_modules', 'onnxruntime-web', 'dist'),
  join(root, 'node_modules', '@huggingface', 'transformers', 'node_modules', 'onnxruntime-web', 'dist'),
];
const ortDist = candidates.find((p) => existsSync(p));
if (!ortDist) {
  console.error('[copy-ort] onnxruntime-web not found. Run `npm install` first.');
  process.exit(1);
}

const out = join(root, 'public', 'ort');
mkdirSync(out, { recursive: true });
// asyncify = default for modern browsers, plain = fallback for older Safari.
for (const f of [
  'ort-wasm-simd-threaded.asyncify.mjs',
  'ort-wasm-simd-threaded.asyncify.wasm',
  'ort-wasm-simd-threaded.mjs',
  'ort-wasm-simd-threaded.wasm',
]) {
  cpSync(join(ortDist, f), join(out, f));
}
console.log('[copy-ort] copied ONNX Runtime wasm to public/ort');