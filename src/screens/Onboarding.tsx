import { useState } from 'react';
import { Button, Logo } from '../components/ui';

const SLIDES = [
  { title: 'WildLens', body: 'Look closer.', logo: true },
  { title: 'Identify plants, birds, animals and insects', body: 'With AI that runs on your phone, not on someone else’s server.' },
  { title: 'Your photos stay on your device', body: 'Download the model once. After that, explore even when there’s no signal.' },
  { title: 'Ready to go outside?', body: 'Take a photo, learn a little, then put the phone away.' },
];

export function Onboarding({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const last = i === SLIDES.length - 1;
  const s = SLIDES[i];

  return (
    <main className="safe-t safe-b flex min-h-app flex-col px-7">
      <div className="flex min-h-12 justify-end">
        {!last && (
          <button onClick={onDone} className="press min-h-12 px-3 font-medium text-soft">
            Skip
          </button>
        )}
      </div>

      <section key={i} className="rise flex flex-1 flex-col justify-center gap-5 pb-10" aria-live="polite">
        {s.logo && <div className="text-moss"><Logo size={72} /></div>}
        <h1 className={s.logo ? 'font-serif text-5xl' : 'font-serif text-[2rem]'}>{s.title}</h1>
        <p className={s.logo ? 'text-2xl text-soft' : 'text-xl text-soft'}>{s.body}</p>
      </section>

      <div className="flex flex-col gap-6">
        <div className="flex justify-center gap-2" aria-hidden="true">
          {SLIDES.map((_, n) => (
            <span key={n} className={`h-2 rounded-full transition-all ${n === i ? 'w-6 bg-moss' : 'w-2 bg-line'}`} />
          ))}
        </div>
        <Button onClick={() => (last ? onDone() : setI(i + 1))} className="w-full">
          {last ? 'Start exploring' : 'Continue'}
        </Button>
      </div>
    </main>
  );
}
