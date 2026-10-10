import { useSyncExternalStore } from 'react';

export type Theme = 'system' | 'light' | 'dark';

export interface Settings {
  theme: Theme;
  /** Off until the user turns it on in Settings. */
  location: boolean;
  onboarded: boolean;
  /** Development builds only. */
  demo: boolean;
}

const KEY = 'wildlens.settings';
const DEFAULTS: Settings = { theme: 'system', location: false, onboarded: false, demo: false };

function read(): Settings {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return { ...DEFAULTS };
  }
}

let current = read();
const listeners = new Set<() => void>();

export function updateSettings(patch: Partial<Settings>) {
  current = { ...current, ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    /* private mode: settings last for this session only */
  }
  applyTheme(current.theme);
  listeners.forEach((l) => l());
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'system') delete root.dataset.theme;
  else root.dataset.theme = theme;
  const dark = theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#1B241F' : '#F7F5EF');
}

export function useSettings(): Settings {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => current,
  );
}
