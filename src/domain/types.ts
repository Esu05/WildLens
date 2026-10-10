export type Category = 'plant' | 'bird' | 'animal' | 'insect';

export type Hazard = 'venomous' | 'poisonous' | 'sting' | 'bite';

export interface Challenge {
  title: string;
  prompt: string;
}

export interface GroupGuess {
  rank: 'genus' | 'family' | 'order' | 'class';
  /** Scientific group name, e.g. "Felidae". */
  name: string;
  /** Combined probability of every species in the group. */
  probability: number;
}

/** One entry in the local species database. */
export interface Species {
  id: string;
  commonName: string;
  /** Empty when the common name covers several species. */
  scientificName: string;
  category: Category;
  /** Text prompt for the vision model. Defaults to "a photo of {name}, a bird/plant/…". */
  prompt?: string;
  /** Field notes below are only on the detailed entries (data/species.ts). */
  /** Typical field marks, shown as "Features to check". */
  clues?: string[];
  about?: string;
  habitat?: string;
  fact?: string;
  /** Overrides the category default "Look closer" challenge. */
  observe?: Challenge;
  hazard?: Hazard;
}

export interface Candidate {
  speciesId: string;
  commonName: string;
  scientificName: string;
  category: Category;
  confidence: number;
}

/**
 * confident  – top prediction is strong enough to show as the answer
 * uncertain  – show the top candidates and ask for another photo
 * no-subject – the model thinks the photo isn't a plant/bird/animal/insect
 */
 
export type IdentificationStatus = 'confident' | 'uncertain' | 'no-subject';

export interface IdentificationResult {
  status: IdentificationStatus;
  speciesId: string;
  commonName: string;
  scientificName: string;
  category: Category;
  confidence: number;
  visualClues: string[];
  /** Top candidates, best first (includes the top one). */
  alternatives: Candidate[];
  group?: GroupGuess;
  source: 'local-clip' | 'demo';
  modelId: string;
}

export interface Observation {
  id: string;
  createdAt: number;
  photo: Blob;
  speciesId: string;
  commonName: string;
  scientificName: string;
  category: Category;
  confidence: number;
  /** True when the user saved an uncertain identification. */
  uncertain: boolean;
  note: string;
  challenge: Challenge | null;
  /** What the user noticed when they tried the "Look closer" challenge. */
  challengeResponse: string;
  /** Rounded to ~1 km. Only stored if the user enabled location. */
  location?: { lat: number; lon: number };
  source: 'local-clip' | 'demo';
}