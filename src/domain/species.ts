import { SPECIES } from '../data/species';
import type { Category, Species } from './types';

const byId = new Map(SPECIES.map((s) => [s.id, s]));

export function getSpecies(id: string): Species | undefined {
  return byId.get(id);
}

export const CATEGORY_LABEL: Record<Category, string> = {
  plant: 'Plant',
  bird: 'Bird',
  animal: 'Animal',
  insect: 'Insect',
};

/** Used to build the text prompt for each species, e.g. "a photo of a Neem, a plant". */
const CATEGORY_NOUN: Record<Category, string> = {
  plant: 'a plant',
  bird: 'a bird',
  animal: 'an animal',
  insect: 'an insect',
};

export function promptFor(s: Species): string {
  if (s.prompt) return s.prompt;
  return `a photo of ${s.commonName}, ${CATEGORY_NOUN[s.category]}`;
}

/** Version string for the species list. Changing it invalidates cached text embeddings. */
export function speciesFingerprint(): string {
  let h = 5381;
  for (const s of SPECIES) {
    const str = `${s.id}|${promptFor(s)}`;
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  }
  return `${SPECIES.length}-${(h >>> 0).toString(16)}`;
}