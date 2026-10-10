import { getSpecies } from '../domain/species';
import { SPECIES } from '../data/species';
import type { Candidate, GroupGuess, IdentificationResult } from '../domain/types';

/** CLIP's learned temperature. Cosine similarity × 100 gives the logits it was trained with. */
export const LOGIT_SCALE = 100;

/** Show a single answer only above this probability, and with a clear gap to the runner-up. */
export const CONFIDENT_MIN = 0.5;
export const CONFIDENT_GAP = 0.12;

/** A whole group (genus, family, order, class) is named only above this combined probability. */
export const GROUP_MIN = 0.6;

/**
 * If even the best species has a cosine below this, report "no subject".
 * 0 disables it. Set it from the eval screen: compare top cosines of nature photos and non-nature photos.
 */
export const MIN_TOP_COSINE = 0;

export interface LabelMeta {
  id: string;
  taxon: string;
  class?: string;
  order?: string;
  family?: string;
  genus?: string;
}

const GROUP_RANKS = ['genus', 'family', 'order', 'class'] as const;

export function softmax(xs: ArrayLike<number>): number[] {
  let max = -Infinity;
  for (let i = 0; i < xs.length; i++) if (xs[i] > max) max = xs[i];
  const exps: number[] = [];
  let sum = 0;
  for (let i = 0; i < xs.length; i++) {
    const e = Math.exp(xs[i] - max);
    exps.push(e);
    sum += e;
  }
  return exps.map((e) => e / sum);
}

/** Most specific group whose combined species probability is high enough, if any. */
function bestGroup(labels: LabelMeta[], speciesProbs: number[]): GroupGuess | undefined {
  for (const rank of GROUP_RANKS) {
    const totals = new Map<string, number>();
    labels.forEach((l, i) => {
      const name = l[rank];
      if (name) totals.set(name, (totals.get(name) ?? 0) + speciesProbs[i]);
    });
    let bestName = '';
    let best = 0;
    totals.forEach((p, name) => {
      if (p > best) {
        best = p;
        bestName = name;
      }
    });
    if (best >= GROUP_MIN) return { rank, name: bestName, probability: best };
  }
  return undefined;
}

/**
 * Turn probabilities (species first, then distractors, all from one softmax)
 * into a result the UI can show. Probability mass on distractors lowers species
 * confidence on purpose: a photo of a living room should not become "House Gecko".
 *
 * labels and topCosine are optional so the demo identifier, which only has the
 * built-in species list, can still call this with three arguments.
 */
export function buildResult(
  probs: number[],
  source: IdentificationResult['source'],
  modelId: string,
  labels: LabelMeta[] = SPECIES.map((s) => ({ id: s.id, taxon: s.scientificName })),
  topCosine = 1,
): IdentificationResult {
  const n = labels.length;
  const speciesProbs = probs.slice(0, n);
  const strongestDistractor = Math.max(0, ...probs.slice(n));

  const ranked: Candidate[] = labels
    .map((l, i) => {
      const s = getSpecies(l.id)!; // the identifier only keeps ids that exist
      return {
        speciesId: s.id,
        commonName: s.commonName,
        scientificName: s.scientificName,
        category: s.category,
        confidence: speciesProbs[i],
      };
    })
    .sort((a, b) => b.confidence - a.confidence);

  const top = ranked[0];
  const second = ranked[1];
  // Compare the single strongest "not nature" prompt with the best species. Summing them would
  // unfairly beat species whose probability is split across many similar labels.
  const noSubject = strongestDistractor > top.confidence || topCosine < MIN_TOP_COSINE;

  let status: IdentificationResult['status'] = 'uncertain';
  if (noSubject) status = 'no-subject';
  else if (top.confidence >= CONFIDENT_MIN && top.confidence - second.confidence >= CONFIDENT_GAP) {
    status = 'confident';
  }

  const group = status === 'uncertain' ? bestGroup(labels, speciesProbs) : undefined;

  return {
    status,
    speciesId: top.speciesId,
    commonName: top.commonName,
    scientificName: top.scientificName,
    category: top.category,
    confidence: top.confidence,
    // Typical field marks from the species database, not regions found in this photo.
    visualClues: getSpecies(top.speciesId)?.clues ?? [],
    alternatives: ranked.slice(0, 3),
    ...(group ? { group } : {}),
    source,
    modelId,
  };
}