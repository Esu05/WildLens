/**
 * Scale a photo down (longest side ≤ max) and re-encode as JPEG.
 * Keeps the journal small and gives the model a consistent input.
 * Uses createImageBitmap so EXIF orientation from phone cameras is respected.
 */
export async function normalizePhoto(source: Blob, max = 1280, quality = 0.88): Promise<Blob> {
  const bitmap = await createImageBitmap(source, { imageOrientation: 'from-image' });
  try {
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');
    ctx.drawImage(bitmap, 0, 0, w, h);
    return await new Promise<Blob>((res, rej) =>
      canvas.toBlob((b) => (b ? res(b) : rej(new Error('Could not encode image'))), 'image/jpeg', quality),
    );
  } finally {
    bitmap.close();
  }
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = () => rej(r.error);
    r.readAsDataURL(blob);
  });
}
