import { Icon, Logo, Photo, Rule, StatusPill } from '../components/ui';
import { useModelDownloaded, useOnline } from '../lib/hooks';
import { useSettings } from '../state/settings';
import { DEMO_AVAILABLE } from '../ai';
import type { Observation } from '../domain/types';

export function Home({ recent, onCamera, onJournal, onOpen }: {
  recent: Observation[];
  onCamera: () => void;
  onJournal: () => void;
  onOpen: (id: string) => void;
}) {
  const online = useOnline();
  const downloaded = useModelDownloaded();
  const { demo } = useSettings();
  const isDemo = DEMO_AVAILABLE && demo;

  let status: React.ReactNode = null;
  if (isDemo) status = <StatusPill tone="clay">Demo mode</StatusPill>;
  else if (downloaded) status = <StatusPill>{online ? 'Local AI' : 'Offline · Local AI'}</StatusPill>;
  else if (downloaded === false) status = <StatusPill tone="clay">{online ? 'Model not downloaded' : 'Offline · no model yet'}</StatusPill>;

  return (
    <main className="safe-t px-6 pb-8">
      <header className="flex min-h-12 items-center justify-between">
        <div className="flex items-center gap-2 font-serif text-xl font-semibold text-moss">
          <Logo size={30} />
          <span className="text-ink">WildLens</span>
        </div>
        {status}
      </header>

      <section className="rise pt-10 text-center">
        <h1 className="font-serif text-[2.75rem] leading-none">Look closer.</h1>
        <Rule className="mx-auto my-8 w-24" />

        <button
          onClick={onCamera}
          aria-label="Open camera to identify something"
          className="press mx-auto flex h-44 w-44 items-center justify-center rounded-full bg-moss text-moss-ink shadow-[0_0_0_10px_rgb(var(--sand))]"
        >
          <Icon name="lens" size={72} />
        </button>
        <p className="mx-auto mt-8 max-w-[18rem] text-balance text-xl font-medium">Identify something around you.</p>
        {downloaded === false && !isDemo && (
          <p className="mx-auto mt-3 max-w-xs text-soft">
            The first time, WildLens downloads its model (about 90 MB). After that it works offline.
          </p>
        )}
        <Rule className="mx-auto mt-8 w-24" />
      </section>

      <section className="pt-8" aria-labelledby="recent">
        <div className="flex items-baseline justify-between">
          <h2 id="recent" className="text-lg">Recent observations</h2>
          {recent.length > 0 && (
            <button onClick={onJournal} className="press min-h-12 pl-4 font-medium underline underline-offset-4 decoration-line">
              Field journal
            </button>
          )}
        </div>

        {recent.length === 0 ? (
          <p className="mt-2 text-soft">Nothing yet. What’s the first thing you’ll look at?</p>
        ) : (
          <ul className="mt-3 grid grid-cols-2 gap-3">
            {recent.slice(0, 4).map((o) => (
              <li key={o.id}>
                <button onClick={() => onOpen(o.id)} className="press block w-full text-left">
                  <Photo blob={o.photo} alt={o.commonName} className="aspect-square w-full rounded-2xl" />
                  <span className="mt-2 block font-medium leading-tight">{o.commonName}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-10 text-center text-soft">Your photos stay on your device.</p>
    </main>
  );
}
