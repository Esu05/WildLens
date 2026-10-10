import { useCallback, useEffect, useRef, useState } from 'react';
import { IdentifierError, getIdentifier, type ModelProgress } from '../ai';
import { MODEL_SIZE_MB } from '../ai/modelInfo';
import { BackButton, Button, Notice, Photo, ProgressBar, StatusPill } from '../components/ui';
import { announceModelChange, useOnline } from '../lib/hooks';
import { useSettings } from '../state/settings';
import type { IdentificationResult } from '../domain/types';

type Phase =
  | { kind: 'working'; loadingModel: boolean }
  | { kind: 'needs-model' }
  | { kind: 'downloading'; progress: ModelProgress }
  | { kind: 'no-subject' }
  | { kind: 'error'; code: IdentifierError['code'] };

const ERRORS: Record<IdentifierError['code'], { title: string; body: string; action: 'download' | 'retry' | 'retake' }> = {
  'model-missing': {
    title: 'The nature model isn’t ready yet.',
    body: 'Download the model once while you’re online. After that, identification can work offline.',
    action: 'download',
  },
  'download-failed': {
    title: 'The download didn’t finish.',
    body: 'Check your connection and try again. Nothing is lost; it picks up where it can.',
    action: 'download',
  },
  'out-of-memory': {
    title: 'This device is short on memory.',
    body: 'Close other apps or browser tabs, then try again.',
    action: 'retry',
  },
  'bad-image': {
    title: 'I can’t read this photo.',
    body: 'Try taking it again, or choose a different image.',
    action: 'retake',
  },
  unknown: {
    title: 'Something went wrong.',
    body: 'Please try again. If it keeps happening, restart the app.',
    action: 'retry',
  },
};

export function Analyze({ photo, onResult, onRetake, onBack }: {
  photo: Blob;
  onResult: (r: IdentificationResult) => void;
  onRetake: () => void;
  onBack: () => void;
}) {
  const { demo } = useSettings();
  const online = useOnline();
  const [phase, setPhase] = useState<Phase>({ kind: 'working', loadingModel: false });
  const run = useRef(0);

  const start = useCallback(
    async (allowDownload: boolean) => {
      const me = ++run.current;
      const alive = () => run.current === me;
      try {
        setPhase({ kind: 'working', loadingModel: false });
        const id = await getIdentifier(demo);
        if (!id.isReady()) {
          const have = await id.isDownloaded();
          if (!alive()) return;
          if (!have && !allowDownload) {
            setPhase({ kind: 'needs-model' });
            return;
          }
          setPhase(have ? { kind: 'working', loadingModel: true } : { kind: 'downloading', progress: { fraction: 0, label: 'Preparing' } });
          await id.initialize((progress) => alive() && !have && setPhase({ kind: 'downloading', progress }));
          announceModelChange();
          if (!alive()) return;
          setPhase({ kind: 'working', loadingModel: false });
        }
        const result = await id.identify(photo);
        if (!alive()) return;
        if (result.status === 'no-subject') setPhase({ kind: 'no-subject' });
        else onResult(result);
      } catch (e) {
        if (!alive()) return;
        console.error(e);
        setPhase({ kind: 'error', code: e instanceof IdentifierError ? e.code : 'unknown' });
      }
    },
    [demo, photo, onResult],
  );

  useEffect(() => {
    void start(false);
    return () => {
      run.current++; // cancel on leave
    };
  }, [start]);

  const thumb = <Photo blob={photo} alt="Your photo" className="mx-auto aspect-[4/3] w-56 rounded-2xl" />;

  if (phase.kind === 'working') {
    return (
      <main className="safe-t safe-b flex min-h-app flex-col px-6" aria-busy="true">
        <div className="flex min-h-12 items-center"><BackButton onClick={onBack} label="Cancel" /></div>
        <section className="flex flex-1 flex-col items-center justify-center gap-7 pb-12 text-center">
          {thumb}
          <div role="status" aria-live="polite">
            <h1 className="font-serif text-3xl">{phase.loadingModel ? 'Waking the model…' : 'Analyzing…'}</h1>
          </div>
          <ul className="space-y-1 text-xl text-soft" aria-hidden="true">
            {['Looking at shape', 'Looking at color', 'Comparing features'].map((t, i) => (
              <li key={t} className="cycle" style={{ animationDelay: `${i * 1.2}s` }}>{t}</li>
            ))}
          </ul>
          <span aria-hidden="true" className="breathe block h-10 w-10 rounded-full border-[3px] border-moss" />
          <StatusPill>Analyzing on your device</StatusPill>
        </section>
      </main>
    );
  }

  if (phase.kind === 'downloading') {
    return (
      <main className="safe-t safe-b flex min-h-app flex-col px-6">
        <div className="flex min-h-12 items-center"><BackButton onClick={onBack} label="Cancel" /></div>
        <section className="flex flex-1 flex-col justify-center gap-5 pb-12" role="status" aria-live="polite">
          <h1 className="font-serif text-3xl">Downloading the nature model</h1>
          <p className="text-soft">This happens once. Keep this screen open; it takes a minute on a good connection.</p>
          <ProgressBar value={phase.progress.fraction} label="Model download" />
          <p className="text-soft">{phase.progress.label} · {Math.round(phase.progress.fraction * 100)}%</p>
        </section>
      </main>
    );
  }

  if (phase.kind === 'needs-model' || phase.kind === 'error') {
    const code = phase.kind === 'error' ? phase.code : 'model-missing';
    const e = ERRORS[code];
    const offlineNeedsDownload = e.action === 'download' && !online;
    return (
      <main className="safe-t safe-b flex min-h-app flex-col px-6">
        <div className="flex min-h-12 items-center"><BackButton onClick={onBack} /></div>
        <section className="flex flex-1 flex-col justify-center gap-6 pb-12">
          {thumb}
          <Notice title={e.title}>
            <p>{e.body}</p>
            {offlineNeedsDownload && <p className="mt-2 font-medium text-ink">You’re offline right now. Connect once to download it (about {MODEL_SIZE_MB} MB).</p>}
            {e.action === 'download' && !offlineNeedsDownload && <p className="mt-2">Download size: about {MODEL_SIZE_MB} MB.</p>}
          </Notice>
          {e.action === 'download' && <Button icon="download" disabled={offlineNeedsDownload} onClick={() => void start(true)}>Download model</Button>}
          {e.action === 'retry' && <Button onClick={() => void start(true)}>Try again</Button>}
          {e.action === 'retake' && <Button onClick={onRetake}>Retake photo</Button>}
        </section>
      </main>
    );
  }

  // no-subject
  return (
    <main className="safe-t safe-b flex min-h-app flex-col px-6">
      <div className="flex min-h-12 items-center"><BackButton onClick={onBack} /></div>
      <section className="flex flex-1 flex-col justify-center gap-6 pb-12">
        {thumb}
        <Notice title="I can’t see the subject clearly.">
          Try moving closer or finding better light.
        </Notice>
        <Button onClick={onRetake}>Retake photo</Button>
      </section>
    </main>
  );
}
