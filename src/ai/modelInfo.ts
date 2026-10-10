const HOST =
  (import.meta.env.VITE_MODEL_HOST as string | undefined)?.replace(/\/$/, '') ?? '/models';

export const MODEL_ID = 'bioclip-vit-b16';
export const MODEL_LABEL = 'BioCLIP (ViT-B/16)';
/** Approximate download size, used for progress when the server sends no Content-Length. */
export const MODEL_SIZE_MB = 330;
export const CACHE_NAME = 'wildlens-model-v1';

export const MODEL_URLS = {
  labels: `${HOST}/labels.json`,
  embeddings: `${HOST}/text_embeddings.bin`,
  model: `${HOST}/bioclip_image.onnx`,
} as const;

export async function isModelCached(): Promise<boolean> {
  try {
    const cache = await caches.open(CACHE_NAME);
    const hits = await Promise.all(Object.values(MODEL_URLS).map((u) => cache.match(u)));
    return hits.every(Boolean);
  } catch {
    return false;
  }
}

export async function deleteModelCache(): Promise<void> {
  await caches.delete(CACHE_NAME);
  await caches.delete('transformers-cache'); // frees the old CLIP files on returning devices
}