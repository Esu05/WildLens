import type { Observation } from '../domain/types';

/**
 * Minimal IndexedDB wrapper. Everything the user creates lives here, on the device.
 *  - observations: the field journal (photo Blob + metadata)
 *  - meta: small cached values such as the species text embeddings
 */
const DB_NAME = 'wildlens';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function open(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('observations')) {
          db.createObjectStore('observations', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta');
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => {
        dbPromise = null;
        reject(req.error);
      };
    });
  }
  return dbPromise;
}

async function run<T>(
  store: 'observations' | 'meta',
  mode: IDBTransactionMode,
  fn: (s: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await open();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(store, mode);
    const req = fn(tx.objectStore(store));
    tx.oncomplete = () => resolve(req.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function listObservations(): Promise<Observation[]> {
  const all = await run<Observation[]>('observations', 'readonly', (s) => s.getAll());
  return all.sort((a, b) => b.createdAt - a.createdAt);
}

export const getObservation = (id: string) =>
  run<Observation | undefined>('observations', 'readonly', (s) => s.get(id));

export const saveObservation = (o: Observation) => run('observations', 'readwrite', (s) => s.put(o));

export const deleteObservation = (id: string) => run('observations', 'readwrite', (s) => s.delete(id));

export const clearObservations = () => run('observations', 'readwrite', (s) => s.clear());

export const getMeta = <T>(key: string) => run<T | undefined>('meta', 'readonly', (s) => s.get(key));

export const setMeta = (key: string, value: unknown) => run('meta', 'readwrite', (s) => s.put(value, key));

/** Bytes used by this origin (photos, journal, model cache), if the browser reports it. */
export async function storageUsage(): Promise<number | null> {
  try {
    const est = await navigator.storage?.estimate?.();
    return est?.usage ?? null;
  } catch {
    return null;
  }
}

/** Ask the browser not to evict the journal or the model under storage pressure. */
export async function requestPersistence(): Promise<void> {
  try {
    await navigator.storage?.persist?.();
  } catch {
    /* best effort */
  }
}
