import '@fontsource-variable/inter';
import '@fontsource/lora/400.css';
import '@fontsource/lora/400-italic.css';
import '@fontsource/lora/600.css';
import './index.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { applyTheme, updateSettings } from './state/settings';

applyTheme(JSON.parse(localStorage.getItem('wildlens.settings') || '{"theme":"system"}').theme ?? 'system');

// Dev convenience: ?demo=1 turns on demo mode (ignored in production builds).
if (import.meta.env.DEV && new URLSearchParams(location.search).get('demo') === '1') updateSettings({ demo: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Offline support: cache the app shell so WildLens opens with no connection.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((e) => console.warn('Service worker not registered', e));
  });
}
