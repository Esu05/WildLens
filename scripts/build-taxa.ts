import { mkdirSync, writeFileSync } from 'node:fs';
import { SPECIES } from '../src/data/species';
import { DISTRACTORS } from '../src/data/distractors';

interface Gbif {
  matchType?: string;
  confidence?: number;
  kingdom?: string;
  phylum?: string;
  class?: string;
  order?: string;
  family?: string;
  genus?: string;
  species?: string;
}

/**
 * Hand-written taxa for entries with no scientific name (pets, broad groups).
 * Keys are your species ids. Add more from the "unresolved" list this script prints.
 */
const OVERRIDES: Record<string, string> = {
  cat: 'Animalia Chordata Mammalia Carnivora Felidae Felis catus',
  dog: 'Animalia Chordata Mammalia Carnivora Canidae Canis lupus familiaris',
};

async function match(name: string): Promise<Gbif | null> {
  const res = await fetch(`https://api.gbif.org/v1/species/match?name=${encodeURIComponent(name)}`);
  if (!res.ok) return null;
  const m = (await res.json()) as Gbif;
  const ok =
    m.matchType === 'EXACT' ||
    m.matchType === 'HIGHERRANK' ||
    (m.matchType === 'FUZZY' && (m.confidence ?? 0) >= 95);
  return ok ? m : null;
}

const labels: Array<Record<string, string>> = [];
const unresolved: string[] = [];

for (const s of SPECIES) {
  let taxon = '';
  let ranks: Record<string, string | undefined> = {};

  if (OVERRIDES[s.id]) {
    taxon = OVERRIDES[s.id];
    const t = taxon.split(' ');
    ranks = { class: t[2], order: t[3], family: t[4], genus: t[5] };
  } else if (s.scientificName) {
    const m = await match(s.scientificName);
    if (m) {
      // BioCLIP format: kingdom ... family, then the binomial (genus + epithet)
      taxon = [m.kingdom, m.phylum, m.class, m.order, m.family, m.species ?? m.genus]
        .filter(Boolean)
        .join(' ');
      ranks = { class: m.class, order: m.order, family: m.family, genus: m.genus };
    }
    await new Promise((r) => setTimeout(r, 100));
  }

  if (!taxon) {
    unresolved.push(`${s.id} (${s.commonName})`);
    taxon = s.commonName; // weak fallback, fix via OVERRIDES
  }

  const entry: Record<string, string> = { id: s.id, taxon };
  for (const [k, v] of Object.entries(ranks)) if (v) entry[k] = v;
  labels.push(entry);
}

mkdirSync('public/models', { recursive: true });
writeFileSync(
  'public/models/labels.json',
  JSON.stringify({ model: 'bioclip-vit-b16', dim: 512, species: labels, distractors: DISTRACTORS }),
);
console.log(`Wrote ${labels.length} species.`);
if (unresolved.length) console.log('Unresolved, add to OVERRIDES:\n' + unresolved.join('\n'));