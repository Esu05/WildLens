import { useCallback, useEffect, useRef, useState } from 'react';
import { Backdrop } from './components/Backdrop';
import { BottomNav, type Tab } from './components/BottomNav';
import type { IdentificationResult, Observation } from './domain/types';
import { normalizePhoto } from './lib/image';
import { Analyze } from './screens/Analyze';
import { Camera } from './screens/Camera';
import { Entry } from './screens/Entry';
import { Home } from './screens/Home';
import { Journal } from './screens/Journal';
import { Onboarding } from './screens/Onboarding';
import { Preview } from './screens/Preview';
import { Result } from './screens/Result';
import { Settings } from './screens/Settings';
import { updateSettings, useSettings } from './state/settings';
import { listObservations, requestPersistence } from './storage/db';

type View =
  | { name: 'home' }
  | { name: 'camera' }
  | { name: 'preview' }
  | { name: 'analyzing' }
  | { name: 'result' }
  | { name: 'journal' }
  | { name: 'entry'; id: string }
  | { name: 'settings' };

const HOME: View = { name: 'home' };

export default function App() {
  const { onboarded } = useSettings();
  const [view, setView] = useState<View>(HOME);
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [result, setResult] = useState<IdentificationResult | null>(null);
  const [items, setItems] = useState<Observation[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const photoRef = useRef<Blob | null>(null);
  photoRef.current = photo;

  const refresh = useCallback(() => {
    listObservations().then(setItems).catch(() => setItems([]));
  }, []);

  const go = useCallback((v: View, replace = false) => {
    if (replace) history.replaceState({ view: v }, '');
    else history.pushState({ view: v }, '');
    setView(v);
    scrollTo(0, 0);
    document.getElementById('app-frame')?.scrollTo(0, 0);
  }, []);

  const back = useCallback(() => {
    if (history.length > 1) history.back();
    else go(HOME, true);
  }, [go]);

  useEffect(() => {
    history.replaceState({ view: HOME }, '');
    refresh();
    const onPop = (e: PopStateEvent) => {
      let v: View = e.state?.view ?? HOME;
      // Screens that depend on a photo can't be restored without one.
      if (!photoRef.current && (v.name === 'preview' || v.name === 'analyzing' || v.name === 'result')) v = HOME;
      if (v.name === 'analyzing') v = { name: 'preview' };
      setView(v);
      scrollTo(0, 0);
      document.getElementById('app-frame')?.scrollTo(0, 0);
    };
    addEventListener('popstate', onPop);
    return () => removeEventListener('popstate', onPop);
  }, [refresh]);

  const onResult = useCallback((r: IdentificationResult) => {
    setResult(r);
    go({ name: 'result' }, true);
  }, [go]);

  async function onPhoto(blob: Blob) {
    try {
      setPhoto(await normalizePhoto(blob));
      setResult(null);
      go({ name: 'preview' });
    } catch {
      setNotice('That image couldn’t be opened. Try a different photo.');
      go(HOME, true);
    }
  }

  if (!onboarded) return <Shell><Onboarding onDone={() => updateSettings({ onboarded: true })} /></Shell>;

  const tab: Tab = view.name === 'journal' || view.name === 'entry' ? 'journal' : view.name === 'settings' ? 'settings' : 'identify';
  const showNav = view.name === 'home' || view.name === 'journal' || view.name === 'settings';
  const entry = view.name === 'entry' ? items.find((o) => o.id === view.id) : undefined;

  let screen: React.ReactNode;
  switch (view.name) {
    case 'camera':
      screen = <Camera onPhoto={onPhoto} onBack={back} />;
      break;
    case 'preview':
      screen = photo && <Preview photo={photo} onRetake={() => go({ name: 'camera' }, true)} onIdentify={() => go({ name: 'analyzing' }, true)} />;
      break;
    case 'analyzing':
      screen = photo && <Analyze photo={photo} onResult={onResult} onRetake={() => go({ name: 'camera' }, true)} onBack={() => go({ name: 'preview' }, true)} />;
      break;
    case 'result':
      screen = photo && result && (
        <Result
          photo={photo}
          result={result}
          onSaved={() => { refresh(); void requestPersistence(); }}
          onDone={() => go(HOME)}
          onRetake={() => go({ name: 'camera' }, true)}
          onBack={back}
        />
      );
      break;
    case 'journal':
      screen = <Journal items={items} onOpen={(id) => go({ name: 'entry', id })} onStart={() => go({ name: 'camera' })} />;
      break;
    case 'entry':
      screen = entry ? <Entry key={entry.id} obs={entry} onBack={back} onChanged={refresh} /> : <Journal items={items} onOpen={(id) => go({ name: 'entry', id })} onStart={() => go({ name: 'camera' })} />;
      break;
    case 'settings':
      screen = <Settings onJournalChanged={refresh} />;
      break;
    default:
      screen = <Home recent={items} onCamera={() => go({ name: 'camera' })} onJournal={() => go({ name: 'journal' })} onOpen={(id) => go({ name: 'entry', id })} />;
  }

  return (
    <Shell>
      {notice && view.name === 'home' && (
        <p role="alert" className="mx-6 mt-4 rounded-2xl bg-sand p-4" onClick={() => setNotice(null)}>{notice}</p>
      )}
      <div className="flex flex-1 flex-col">{screen}</div>
      {showNav && (
        <BottomNav
          active={tab}
          onChange={(t) => {
            if (t === tab) return;
            go(t === 'identify' ? HOME : t === 'journal' ? { name: 'journal' } : { name: 'settings' });
          }}
        />
      )}
    </Shell>
  );
}

/** The app window: full-screen on phones, a framed card over a decorated backdrop on larger screens. */
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Backdrop />
      <div id="app-frame" className="frame">{children}</div>
    </>
  );
}