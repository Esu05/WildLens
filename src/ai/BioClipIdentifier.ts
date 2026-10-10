import * as ort from 'onnxruntime-web';
import { getSpecies } from '../domain/species';
import type { IdentificationResult } from '../domain/types';
import { CACHE_NAME, MODEL_ID, MODEL_LABEL, MODEL_SIZE_MB, MODEL_URLS, isModelCached } from './modelInfo';
import { IdentifierError, type ModelProgress, type NatureIdentifier } from './NatureIdentifier';
import { LOGIT_SCALE, buildResult, softmax, type LabelMeta } from './scoring';

/**
 * BioCLIP (MIT licence, Imageomics Institute): a CLIP ViT-B/16 trained on biodiversity images.
 * Species are "just text", embedded offline, so the app only runs the image encoder.
 */

// Serve ONNX Runtime's wasm from our own origin.
const safariMajor = Number(/Version\/(\d+).*Safari/.exec(navigator.userAgent)?.[1] ?? NaN);
const oldSafari =
  /Safari/.test(navigator.userAgent) &&
  !/Chrom(e|ium)|Android/.test(navigator.userAgent) &&
  safariMajor < 26 &&
  !('gpu' in navigator);
const ortFile = `/ort/ort-wasm-simd-threaded${oldSafari ? '' : '.asyncify'}`;
let ortConfigured = false;

/**
 * Vite's dev server refuses import() of files in /public, so load ONNX Runtime's
 * loader through a blob URL (what Transformers.js did for us before).
 * Must run before InferenceSession.create. Do not set wasmPaths anywhere else.
 */
async function configureOrt() {
  if (ortConfigured) return;
  const res = await fetch(`${ortFile}.mjs`);
  // A missing file returns index.html with status 200 in dev, so check the type too.
  if (!res.ok || /html/.test(res.headers.get('Content-Type') ?? '')) {
    throw new Error(`fetch failed: ${ortFile}.mjs is not in public/ort`);
  }
  const blobUrl = URL.createObjectURL(new Blob([await res.text()], { type: 'text/javascript' }));
  ort.env.wasm.wasmPaths = { mjs: blobUrl, wasm: `${ortFile}.wasm` };
  ort.env.wasm.numThreads = 1; // multi-threading needs cross-origin isolation; add later if you want it
  ortConfigured = true;
}

const SIZE = 224;
const MEAN = [0.48145466, 0.4578275, 0.40821073];
const STD = [0.26862954, 0.26130258, 0.27577711];

interface LabelsFile {
  dim: number;
  species: LabelMeta[];
  distractors: string[];
}

function normalize(v: ArrayLike<number>): Float32Array {
  const out = new Float32Array(v.length);
  let norm = 0;
  for (let i = 0; i < v.length; i++) norm += v[i] ** 2;
  norm = Math.sqrt(norm) || 1;
  for (let i = 0; i < v.length; i++) out[i] = v[i] / norm;
  return out;
}

/** Stream a file into the Cache API with progress. Nothing is stored unless the download finishes. */
async function downloadToCache(url: string, onProgress?: (loaded: number, total: number) => void) {
  const cache = await caches.open(CACHE_NAME);
  if (await cache.match(url)) return;

  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`fetch failed ${res.status} ${url}`);
  const total = Number(res.headers.get('Content-Length')) || MODEL_SIZE_MB * 1e6;
  const reader = res.body.getReader();
  let loaded = 0;

  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        controller.close();
        return;
      }
      loaded += value.byteLength;
      onProgress?.(loaded, total);
      controller.enqueue(value);
    },
    cancel: (reason) => reader.cancel(reason),
  });

  // Only Content-Type is copied: fetch already decoded any gzip, so a stale Content-Encoding would corrupt the read.
  await cache.put(
    url,
    new Response(stream, {
      headers: { 'Content-Type': res.headers.get('Content-Type') ?? 'application/octet-stream' },
    }),
  );
}

async function readCached(url: string): Promise<Response> {
  const cache = await caches.open(CACHE_NAME);
  const hit = await cache.match(url);
  if (!hit) throw new IdentifierError('model-missing', `${url} is not downloaded`);
  return hit;
}

async function toTensor(image: Blob | ImageData): Promise<ort.Tensor> {
  let source: CanvasImageSource;
  let w: number;
  let h: number;
  let bitmap: ImageBitmap | null = null;

  if (image instanceof Blob) {
    bitmap = await createImageBitmap(image);
    source = bitmap;
    w = bitmap.width;
    h = bitmap.height;
  } else {
    const c = document.createElement('canvas');
    c.width = image.width;
    c.height = image.height;
    c.getContext('2d')!.putImageData(image, 0, 0);
    source = c;
    w = c.width;
    h = c.height;
  }

  // Same as the model's own preprocessing: centre square crop, scaled to 224.
  const s = Math.min(w, h);
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, (w - s) / 2, (h - s) / 2, s, s, 0, 0, SIZE, SIZE);
  bitmap?.close();

  const { data } = ctx.getImageData(0, 0, SIZE, SIZE);
  const px = SIZE * SIZE;
  const out = new Float32Array(3 * px);
  for (let i = 0; i < px; i++) {
    for (let c = 0; c < 3; c++) out[c * px + i] = (data[i * 4 + c] / 255 - MEAN[c]) / STD[c];
  }
  return new ort.Tensor('float32', out, [1, 3, SIZE, SIZE]);
}

export class BioClipIdentifier implements NatureIdentifier {
  readonly modelId = MODEL_ID;
  readonly modelLabel = `${MODEL_LABEL} (ONNX)`;
  readonly license = 'MIT';
  readonly runsLocally = true;

  private session: ort.InferenceSession | null = null;
  private labels: LabelMeta[] = [];
  private rows: Float32Array[] = []; // species first, then distractors
  private loading: Promise<void> | null = null;

  isReady() {
    return this.session !== null && this.rows.length > 0;
  }

  isDownloaded = isModelCached;

  initialize(onProgress?: (p: ModelProgress) => void): Promise<void> {
    if (this.isReady()) return Promise.resolve();
    if (!this.loading) {
      this.loading = this.load(onProgress).catch((e) => {
        this.loading = null; // allow retry
        throw this.toError(e);
      });
    }
    return this.loading;
  }

  private toError(e: unknown): IdentifierError {
    if (e instanceof IdentifierError) return e;
    const msg = String((e as Error)?.message ?? e);
    if (/memory|allocation|OOM/i.test(msg)) return new IdentifierError('out-of-memory', msg, { cause: e });
    if (!navigator.onLine) return new IdentifierError('model-missing', msg, { cause: e });
    if (/fetch|network|load failed|failed to load|404|403/i.test(msg)) {
      return new IdentifierError('download-failed', msg, { cause: e });
    }
    return new IdentifierError('unknown', msg, { cause: e });
  }

  private async load(onProgress?: (p: ModelProgress) => void) {
    if (!(await isModelCached()) && !navigator.onLine) throw new IdentifierError('model-missing');

    onProgress?.({ fraction: 0, label: 'Preparing' });
    await downloadToCache(MODEL_URLS.labels);
    await downloadToCache(MODEL_URLS.embeddings);
    await downloadToCache(MODEL_URLS.model, (loaded, total) =>
      onProgress?.({
        fraction: Math.min(0.9, (loaded / total) * 0.9),
        label: 'Downloading the nature model',
      }),
    );

    onProgress?.({ fraction: 0.92, label: 'Reading the species list' });
    const file = (await (await readCached(MODEL_URLS.labels)).json()) as LabelsFile;
    const flat = new Float32Array(await (await readCached(MODEL_URLS.embeddings)).arrayBuffer());
    const { dim } = file;
    if (flat.length !== (file.species.length + file.distractors.length) * dim) {
      throw new IdentifierError('unknown', 'labels.json and text_embeddings.bin are out of sync. Rerun the Colab cell.');
    }

    // Skip ids the app no longer knows, keeping rows aligned with labels.
    const labels: LabelMeta[] = [];
    const rows: Float32Array[] = [];
    file.species.forEach((l, i) => {
      if (!getSpecies(l.id)) return;
      labels.push(l);
      rows.push(flat.subarray(i * dim, (i + 1) * dim));
    });
    for (let j = 0; j < file.distractors.length; j++) {
      const i = file.species.length + j;
      rows.push(flat.subarray(i * dim, (i + 1) * dim));
    }

    onProgress?.({ fraction: 0.96, label: 'Starting the model' });
    await configureOrt();
    const bytes = new Uint8Array(await (await readCached(MODEL_URLS.model)).arrayBuffer());
    this.session = await ort.InferenceSession.create(bytes, { executionProviders: ['wasm'] });
    this.labels = labels;
    this.rows = rows;

    onProgress?.({ fraction: 1, label: 'Ready' });
  }

  async identify(image: Blob | ImageData): Promise<IdentificationResult> {
    if (!this.isReady()) await this.initialize();

    let input: ort.Tensor;
    try {
      input = await toTensor(image);
    } catch (e) {
      throw new IdentifierError('bad-image', 'The image could not be read', { cause: e });
    }

    try {
      const session = this.session!;
      const out = await session.run({ [session.inputNames[0]]: input });
      const img = normalize(out[session.outputNames[0]].data as Float32Array);

      const logits = new Float32Array(this.rows.length);
      let topCosine = -1;
      this.rows.forEach((row, r) => {
        let dot = 0;
        for (let i = 0; i < img.length; i++) dot += img[i] * row[i];
        logits[r] = dot * LOGIT_SCALE;
        if (r < this.labels.length && dot > topCosine) topCosine = dot;
      });

      return buildResult(softmax(logits), 'local-clip', MODEL_ID, this.labels, topCosine);
    } catch (e) {
      throw this.toError(e);
    }
  }
}