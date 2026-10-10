import { listObservations } from '../storage/db';
import { blobToDataUrl } from './image';

/** A single JSON file containing the whole journal, photos included. */
export async function exportJournal(): Promise<Blob> {
  const all = await listObservations();
  const entries = [];
  for (const o of all) {
    const { photo, ...rest } = o;
    entries.push({ ...rest, photo: await blobToDataUrl(photo) });
  }
  return new Blob([JSON.stringify({ app: 'WildLens', exportedAt: new Date().toISOString(), entries }, null, 2)], {
    type: 'application/json',
  });
}
