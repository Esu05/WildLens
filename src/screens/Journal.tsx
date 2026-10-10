import { Button, Photo, Rule } from '../components/ui';
import { CATEGORY_LABEL } from '../domain/species';
import type { Observation } from '../domain/types';
import { longDate, pct, shortDate } from '../lib/format';

export function Journal({ items, onOpen, onStart }: { items: Observation[]; onOpen: (id: string) => void; onStart: () => void }) {
  if (items.length === 0) {
    return (
      <main className="flex flex-1 flex-col justify-center px-8 py-16 text-center">
        <div className="rise space-y-4">
          <h1 className="font-serif text-3xl">Your field journal is empty.</h1>
          <p className="text-xl text-soft">The world is full of things you haven’t noticed yet.</p>
          <Button onClick={onStart} className="mt-4">Start exploring</Button>
        </div>
      </main>
    );
  }

  let lastDay = '';
  return (
    <main className="safe-t px-5 pb-8">
      <h1 className="pt-4 font-serif text-3xl">Field journal</h1>
      <ol className="mt-4 space-y-8">
        {items.map((o) => {
          const day = longDate(o.createdAt);
          const showDay = day !== lastDay;
          lastDay = day;
          return (
            <li key={o.id}>
              {showDay && (
                <>
                  <p className="label">{day}</p>
                  <Rule className="mb-4 mt-1" />
                </>
              )}
              <button onClick={() => onOpen(o.id)} className="press block w-full rounded-3xl border border-line bg-card p-3 text-left">
                <Photo blob={o.photo} alt={`${o.commonName}, photographed ${shortDate(o.createdAt)}`} className="aspect-[4/3] w-full rounded-2xl" />
                <div className="px-2 pb-2 pt-4">
                  <p className="text-xl font-semibold leading-tight">{o.commonName}</p>
                  {o.scientificName && <p className="sci text-soft">{o.scientificName}</p>}
                  <p className="mt-1 font-medium">
                    {CATEGORY_LABEL[o.category]} · {pct(o.confidence)}
                    {o.uncertain && ' · unsure'}
                    {o.source === 'demo' && ' · demo'}
                  </p>
                  {o.note && <p className="mt-3 border-l-2 border-sage pl-3 font-serif italic">“{o.note}”</p>}
                  <p className="mt-3 text-right text-soft">{shortDate(o.createdAt)}</p>
                </div>
              </button>
            </li>
          );
        })}
      </ol>
    </main>
  );
}
