import { useState } from 'react';
import { BackButton, Button, Icon, Photo, Rule, StatusPill } from '../components/ui';
import { challengeFor } from '../domain/challenges';
import { CATEGORY_LABEL, getSpecies } from '../domain/species';
import { safetyFor } from '../domain/safety';
import type { IdentificationResult, Observation } from '../domain/types';
import { getApproxLocation } from '../lib/geo';
import { pct } from '../lib/format';
import { saveObservation } from '../storage/db';
import { useSettings } from '../state/settings';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-1.5">
      <h2 className="text-lg">{title}</h2>
      {children}
    </section>
  );
}

export function Result({ photo, result, onSaved, onDone, onRetake, onBack }: {
  photo: Blob;
  result: IdentificationResult;
  onSaved: () => void;
  onDone: () => void;
  onRetake: () => void;
  onBack: () => void;
}) {
  const { location } = useSettings();
  const uncertain = result.status === 'uncertain';
  const [pick, setPick] = useState<string | null>(uncertain ? null : result.speciesId);
  const [note, setNote] = useState('');
  const [response, setResponse] = useState('');
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');

  const cand = result.alternatives.find((c) => c.speciesId === pick) ?? null;
  const species = cand ? getSpecies(cand.speciesId) : undefined;
  const challenge = species ? challengeFor(species) : null;
  const safety = safetyFor({ ...result, speciesId: cand?.speciesId ?? result.speciesId, category: cand?.category ?? result.category });
  const other = Math.max(0, 1 - result.alternatives.reduce((a, c) => a + c.confidence, 0));
  const isDemo = result.source === 'demo';

  async function save() {
    if (!cand) return;
    setState('saving');
    try {
      const obs: Observation = {
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        photo,
        speciesId: cand.speciesId,
        commonName: cand.commonName,
        scientificName: cand.scientificName,
        category: cand.category,
        confidence: cand.confidence,
        uncertain,
        note: note.trim(),
        challenge,
        challengeResponse: response.trim(),
        location: location ? await getApproxLocation() : undefined,
        source: result.source,
      };
      await saveObservation(obs);
      setState('saved');
      onSaved();
    } catch (e) {
      console.error(e);
      setState('failed');
    }
  }

  return (
    <main className="safe-t safe-b px-5 pb-16">
      <div className="flex min-h-12 items-center"><BackButton onClick={onBack} /></div>

      <Photo blob={photo} alt="Your photo" className="aspect-[4/3] w-full rounded-3xl" />

      <div className="rise mt-6 space-y-6">
        {isDemo && <StatusPill tone="clay">Demo mode: not a real prediction</StatusPill>}

        {uncertain && !cand ? (
          <section className="space-y-4">
            <h1 className="font-serif text-3xl">I’m not confident enough to identify this.</h1>
            <p className="text-soft">I think this may be:</p>
            <ol className="space-y-2">
              {result.alternatives.map((c, i) => (
                <li key={c.speciesId}>
                  <button
                    onClick={() => setPick(c.speciesId)}
                    className="press flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl border border-line bg-card px-4 text-left"
                  >
                    <span><span className="text-soft">{i + 1}. </span><span className="font-semibold">{c.commonName}</span></span>
                    <span className="font-medium">{pct(c.confidence)}</span>
                  </button>
                </li>
              ))}
              <li className="flex min-h-14 items-center justify-between px-4 text-soft">
                <span>Something else</span><span className="font-medium">{pct(other)}</span>
              </li>
            </ol>
            <p>Try taking another photo closer to the subject. Tap a guess to read about it.</p>
            <Button onClick={onRetake} className="w-full">Take another photo</Button>
          </section>
        ) : cand ? (
          <section className="space-y-3">
            {uncertain && (
              <button onClick={() => setPick(null)} className="press min-h-12 font-medium underline underline-offset-4 decoration-line">
                ← Other guesses
              </button>
            )}
            <div>
              <h1 className="font-serif text-4xl leading-tight">{cand.commonName}</h1>
              {cand.scientificName && <p className="sci text-xl text-soft">{cand.scientificName}</p>}
              <p className="mt-1 font-medium">{CATEGORY_LABEL[cand.category]}</p>
            </div>
            <Rule />
            <div>
              <p className="text-xl font-semibold">AI confidence: {pct(cand.confidence)}</p>
              <div className="mt-2 h-2 rounded-full bg-sand" aria-hidden="true">
                <div className="h-full rounded-full bg-moss" style={{ width: pct(cand.confidence) }} />
              </div>
              <p className="mt-2 text-soft">
                {uncertain ? 'This is one of several possible matches, not a firm answer. ' : ''}
                This is an AI prediction based on visual features.
              </p>
              {!uncertain && result.alternatives.some((c) => c.speciesId !== cand.speciesId && c.confidence >= 0.05) && (
                <p className="mt-2 text-soft">
                  Also possible:{' '}
                  {result.alternatives
                    .filter((c) => c.speciesId !== cand.speciesId && c.confidence >= 0.05)
                    .map((c) => `${c.commonName} ${pct(c.confidence)}`)
                    .join(', ')}
                </p>
              )}
            </div>
          </section>
        ) : null}

        {cand && (
          <>
            {safety && (
              <div role="note" className="rounded-2xl border-2 border-clay bg-card p-5">
                <p className="flex items-center gap-2 font-semibold text-clay"><Icon name="warn" /> Safety note</p>
                <p className="mt-2">Do not touch, eat, handle, or approach an organism based solely on this AI identification.</p>
                {safety.details.map((d) => <p key={d} className="mt-2">{d}</p>)}
                <p className="mt-2">If you need a safety-critical identification, consult a qualified local expert.</p>
              </div>
            )}

            <Rule />

            {species && (
              <div className="space-y-6">
                {species.clues?.length ? (
                  <Section title="Features to check">
                    <ul className="list-disc space-y-1 pl-5 marker:text-moss">
                      {species.clues.map((c) => <li key={c}>{c}</li>)}
                    </ul>
                    <p className="text-soft">Typical of this species. Compare them with what you can see.</p>
                  </Section>
                ) : null}
                {species.about && <Section title="About"><p>{species.about}</p></Section>}
                {species.habitat && <Section title="Habitat"><p>{species.habitat}</p></Section>}
                {species.fact && <Section title="Interesting fact"><p>{species.fact}</p></Section>}
                {!species.about && (
                  <p className="text-soft">WildLens can name this one but doesn’t have field notes for it yet.</p>
                )}
              </div>
            )}

            {challenge && (
              <section className="rounded-2xl bg-sand p-5">
                <p className="label">Look closer</p>
                <p className="mt-1 text-xl font-semibold">{challenge.title}</p>
                <p className="mt-1">{challenge.prompt}</p>
                <label className="mt-4 block">
                  <span className="label">What did you notice? (optional)</span>
                  <textarea
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    rows={2}
                    disabled={state === 'saved'}
                    className="field mt-1"
                  />
                </label>
              </section>
            )}

            <Rule />

            {state === 'saved' ? (
              <section className="space-y-5 text-center" role="status">
                <p className="flex items-center justify-center gap-2 font-medium text-moss"><Icon name="check" /> Saved to your field journal</p>
                <p className="font-serif text-4xl">Go observe it.</p>
                <Button variant="secondary" onClick={onDone} className="w-full">Keep exploring</Button>
              </section>
            ) : (
              <section className="space-y-4">
                <label className="block">
                  <span className="label">Add a note (optional)</span>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    placeholder="Where was it? What was it doing?"
                    className="field mt-1"
                  />
                </label>
                <Button onClick={save} disabled={state === 'saving'} className="w-full">
                  {state === 'saving' ? 'Saving…' : 'Save observation'}
                </Button>
                {state === 'failed' && <p role="alert" className="text-clay">Couldn’t save to this device. Check that storage isn’t full, then try again.</p>}
                <Button variant="quiet" onClick={onDone} className="w-full">Go observe it</Button>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}