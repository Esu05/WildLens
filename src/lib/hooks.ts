import { useEffect, useState, useSyncExternalStore } from 'react';
import { isModelCached } from '../ai/modelInfo';

export function useOnline(): boolean {
  return useSyncExternalStore(
    (cb) => {
      addEventListener('online', cb);
      addEventListener('offline', cb);
      return () => {
        removeEventListener('online', cb);
        removeEventListener('offline', cb);
      };
    },
    () => navigator.onLine,
  );
}

/** Object URL for a Blob that is revoked automatically. */
export function useObjectUrl(blob: Blob | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!blob) {
      setUrl(null);
      return;
    }
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);
  return url;
}

const MODEL_EVENT = 'wildlens:model-changed';
export const announceModelChange = () => dispatchEvent(new Event(MODEL_EVENT));

/** Whether the model is stored on this device (null while checking). */
export function useModelDownloaded(): boolean | null {
  const [state, setState] = useState<boolean | null>(null);
  useEffect(() => {
    let alive = true;
    const check = () => isModelCached().then((v) => alive && setState(v));
    check();
    addEventListener(MODEL_EVENT, check);
    return () => {
      alive = false;
      removeEventListener(MODEL_EVENT, check);
    };
  }, []);
  return state;
}
