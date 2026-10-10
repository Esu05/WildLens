import { useState } from 'react';
import { BackButton, Button, Photo, Rule } from '../components/ui';
import { CATEGORY_LABEL } from '../domain/species';
import type { Observation } from '../domain/types';
import { pct, shortDate } from '../lib/format';
import { deleteObservation, saveObservation } from '../storage/db';

export function Entry({ obs, onBack, onChanged }: { obs: Observation; onBack: () => void; onChanged: () => void }) {
  const [note, setNote] = useState(obs.note);
  const [response, setResponse] = useState(obs.challengeResponse ?? '');
  const [confirm, setConfirm] = useState(false);
  const [saved, setSaved] = useState(false);
  const dirty = note !== obs.note || response !== (obs.challengeResponse ?? '');

  async function save() {
    await saveObservation({ ...obs, note: note.trim(), challengeResponse: response.trim() });
    setSaved(true);
    onChanged();
  }

  async function remove() {
    await deleteObservation(obs.id);
    onChanged();
    onBack();
  }

  return (
    <main className="safe-t safe-b px-5 pb-16">
      <div className="flex min-h-12 items-center"><BackButton onClick={onBack} label="Journal" /></div>
      <Photo blob={obs.photo} alt={obs.commonName} className="aspect-[4/3] w-full rounded-3xl" />

      <div className="rise mt-6 space-y-6">
        <div>
          <h1 className="font-serif text-4xl leading-tight">{obs.commonName}</h1>
          {obs.scientificName && <p className="sci text-xl text-soft">{obs.scientificName}</p>}
          <p className="mt-1 font-medium">
            {CATEGORY_LABEL[obs.category]} · AI confidence {pct(obs.confidence)}
            {obs.uncertain && ' · saved as a guess'}
            {obs.source === 'demo' && ' · demo'}
          </p>
          <p className="text-soft">
            {shortDate(obs.createdAt)}
            {obs.location && ` · near ${obs.location.lat}, ${obs.location.lon}`}
          </p>
        </div>

        <Rule />

        <label className="block">
          <span className="label">Your note</span>
          <textarea
            value={note}
            onChange={(e) => { setNote(e.target.value); setSaved(false); }}
            rows={4}
            placeholder="What did you see?"
            className="field mt-1"
          />
        </label>

        {obs.challenge && (
          <section className="rounded-2xl bg-sand p-5">
            <p className="label">Look closer</p>
            <p className="mt-1 text-xl font-semibold">{obs.challenge.title}</p>
            <p className="mt-1">{obs.challenge.prompt}</p>
            <label className="mt-4 block">
              <span className="label">What you noticed</span>
              <textarea
                value={response}
                onChange={(e) => { setResponse(e.target.value); setSaved(false); }}
                rows={3}
                className="field mt-1"
              />
            </label>
          </section>
        )}

        <Button onClick={save} disabled={!dirty} className="w-full">{saved ? 'Saved' : 'Save changes'}</Button>

        <Rule />

        {confirm ? (
          <div className="space-y-3">
            <p className="font-medium">Delete this observation and its photo from your device?</p>
            <Button variant="danger" onClick={remove} icon="trash" className="w-full">Yes, delete it</Button>
            <Button variant="quiet" onClick={() => setConfirm(false)} className="w-full">Keep it</Button>
          </div>
        ) : (
          <Button variant="quiet" onClick={() => setConfirm(true)} className="w-full text-clay">Delete observation</Button>
        )}
      </div>
    </main>
  );
}