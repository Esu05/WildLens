import { useEffect, useState } from 'react';
import { DEMO_AVAILABLE, deleteModelCache, getIdentifier, MODEL_SIZE_MB, MODEL_ID, type ModelProgress } from '../ai';
import { Button, ProgressBar, Rule } from '../components/ui';
import { announceModelChange, useModelDownloaded, useOnline } from '../lib/hooks';
import { formatBytes } from '../lib/format';
import { getApproxLocation } from '../lib/geo';
import { exportJournal } from '../lib/journal';
import { clearObservations, requestPersistence, storageUsage } from '../storage/db';
import { updateSettings, useSettings, type Theme } from '../state/settings';
import pkg from '../../package.json';

// Set this to your repository URL to show a project link under About.
const REPO_URL = '';

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 py-6">
      <h2 className="text-xl">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-soft">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

export function Settings({ onJournalChanged }: { onJournalChanged: () => void }) {
  const s = useSettings();
  const online = useOnline();
  const downloaded = useModelDownloaded();
  const [usage, setUsage] = useState<number | null>(null);
  const [progress, setProgress] = useState<ModelProgress | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    void storageUsage().then(setUsage);
  }, [downloaded, progress === null]);

  async function download() {
    setMessage(null);
    setProgress({ fraction: 0, label: 'Preparing' });
    try {
      const id = await getIdentifier(false);
      await id.initialize(setProgress);
      await requestPersistence();
      announceModelChange();
    } catch (e) {
      console.error(e);
      setMessage('The download didn’t finish. Check your connection and try again.');
    } finally {
      setProgress(null);
    }
  }

  async function removeModel() {
    await deleteModelCache();
    announceModelChange();
    setMessage('Model removed. Download it again before you next go offline.');
  }

  async function toggleLocation() {
    if (s.location) return updateSettings({ location: false });
    const pos = await getApproxLocation();
    if (pos) updateSettings({ location: true });
    else setMessage('Location wasn’t shared, so it stays off. You can allow it in your browser settings.');
  }

  async function doExport() {
    const blob = await exportJournal();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'wildlens-journal.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }

  async function doClear() {
    await clearObservations();
    onJournalChanged();
    setConfirmClear(false);
    setMessage('Your field journal has been cleared from this device.');
  }

  const themes: { id: Theme; label: string }[] = [
    { id: 'system', label: 'System' },
    { id: 'light', label: 'Light' },
    { id: 'dark', label: 'Dark' },
  ];

  return (
    <main className="safe-t px-5 pb-8">
      <h1 className="pt-4 font-serif text-3xl">Settings</h1>
      {message && <p role="status" className="mt-4 rounded-2xl bg-sand p-4">{message}</p>}

      <Group title="Appearance">
        <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-2">
          {themes.map((t) => (
            <button
              key={t.id}
              role="radio"
              aria-checked={s.theme === t.id}
              onClick={() => updateSettings({ theme: t.id })}
              className={`press min-h-14 rounded-2xl border-2 font-semibold ${s.theme === t.id ? 'border-moss bg-sand' : 'border-line'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </Group>
      <Rule />

      <Group title="Model">
        <dl className="space-y-2">
          <Row label="Status" value={downloaded ? 'Downloaded · works offline' : downloaded === false ? 'Not downloaded' : 'Checking…'} />
          <Row label="Model" value="CLIP ViT-B/32 (8-bit)" />
          <Row label="Version" value={MODEL_ID.split('/')[1]} />
          <Row label="Storage used by WildLens" value={formatBytes(usage)} />
        </dl>
        {progress ? (
          <div role="status" className="space-y-2">
            <ProgressBar value={progress.fraction} label="Model download" />
            <p className="text-soft">{progress.label} · {Math.round(progress.fraction * 100)}%</p>
          </div>
        ) : downloaded ? (
          <Button variant="secondary" onClick={removeModel} className="w-full">Remove model</Button>
        ) : (
          <>
            <Button icon="download" onClick={download} disabled={!online || downloaded === null} className="w-full">
              Download model (about {MODEL_SIZE_MB} MB)
            </Button>
            {!online && <p className="text-soft">Connect to the internet once to download the model.</p>}
          </>
        )}
        {DEMO_AVAILABLE && (
          <label className="flex min-h-14 items-center justify-between gap-4 rounded-2xl border-2 border-dashed border-clay px-4">
            <span><span className="font-semibold">Demo mode</span><span className="block text-soft">Development only. Fake, deterministic results.</span></span>
            <input type="checkbox" checked={s.demo} onChange={(e) => updateSettings({ demo: e.target.checked })} className="h-6 w-6 accent-[rgb(var(--moss))]" />
          </label>
        )}
      </Group>
      <Rule />

      <Group title="Privacy">
        <p className="text-soft">Photos and journal entries are stored only in this browser on this device. Identification runs here too.</p>
        <label className="flex min-h-14 items-center justify-between gap-4">
          <span><span className="font-semibold">Save approximate location</span><span className="block text-soft">Off by default. Rounded to about 1 km.</span></span>
          <input type="checkbox" checked={s.location} onChange={toggleLocation} className="h-6 w-6 accent-[rgb(var(--moss))]" />
        </label>
        <Button variant="secondary" onClick={doExport} className="w-full">Export journal</Button>
        {confirmClear ? (
          <div className="space-y-2">
            <p className="font-medium">Delete every observation and photo from this device?</p>
            <Button variant="danger" onClick={doClear} className="w-full">Yes, clear everything</Button>
            <Button variant="quiet" onClick={() => setConfirmClear(false)} className="w-full">Cancel</Button>
          </div>
        ) : (
          <Button variant="danger" onClick={() => setConfirmClear(true)} className="w-full">Clear local observations</Button>
        )}
      </Group>
      <Rule />

      <Group title="About">
        <p>
          WildLens identifies nature with <strong>OpenAI CLIP ViT-B/32</strong>, an open-weight model (MIT licence), run on your device
          through ONNX Runtime Web and Transformers.js (Apache-2.0 / MIT).
        </p>
        <p className="text-soft">
          CLIP was trained on public image–text pairs from the internet; WildLens doesn’t ship or upload any training data. The
          species notes in this app were written for WildLens. Fonts: Inter and Lora (SIL Open Font License).
        </p>
        <p className="text-soft">
          Identifications are predictions, not authoritative. Never touch, eat or approach anything based on this app alone.
        </p>
        {REPO_URL && <a href={REPO_URL} className="font-medium underline underline-offset-4">Project on GitHub</a>}
        <p className="text-soft">Version {pkg.version}</p>
      </Group>
    </main>
  );
}
