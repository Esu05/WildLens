import { getSpecies } from './species';
import type { Hazard, IdentificationResult } from './types';

export interface SafetyNote {
  /** Shown as extra lines under the standard safety note. */
  details: string[];
}

const HAZARD_DETAIL: Record<Hazard, string> = {
  venomous: 'This species can be venomous. Keep well back and give it space.',
  poisonous: 'This species is poisonous. Do not touch, taste, or eat any part of it.',
  sting: 'This species can sting. Watch from a distance and do not disturb it.',
  bite: 'This animal can bite or scratch. Do not feed or approach it.',
};

/**
 * A safety note is shown when the top prediction, or any close alternative,
 * is a hazardous species, or when the subject is a plant (to keep "never eat
 * from a photo" front of mind).
 */
export function safetyFor(result: IdentificationResult): SafetyNote | null {
  const hazards = new Set<Hazard>();

  const top = getSpecies(result.speciesId);
  if (top?.hazard) hazards.add(top.hazard);

  // For uncertain results, any hazardous candidate in the shortlist counts.
  for (const c of result.alternatives) {
    if (c.confidence < 0.1) continue;
    const s = getSpecies(c.speciesId);
    if (s?.hazard) hazards.add(s.hazard);
  }

  const details = [...hazards].map((h) => HAZARD_DETAIL[h]);
  if (result.category === 'plant' && result.status !== 'no-subject') {
    details.push('Never eat or taste a wild plant or mushroom based on a photo identification.');
  }
  if (hazards.size === 0 && details.length === 0) return null;
  return { details };
}
