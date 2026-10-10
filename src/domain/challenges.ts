import type { Category, Challenge, Species } from './types';

/** "Look closer" prompts. Each one sends the user back to the real thing. */
const DEFAULTS: Record<Category, Challenge[]> = {
  bird: [
    { title: 'Watch for 30 seconds', prompt: 'What does it do immediately before flying?' },
    { title: 'Listen first', prompt: 'Close your eyes for a few seconds. How many different calls can you hear?' },
    { title: 'Look at the bill', prompt: 'Is it thick, thin, hooked or long? What do you think it eats?' },
    { title: 'Follow the movement', prompt: 'Does it hop, walk, or run along the ground? Does it keep still or never stop?' },
  ],
  plant: [
    { title: 'Look at the leaves', prompt: 'Are they growing opposite each other or alternating along the stem?' },
    { title: 'Look at the base', prompt: 'Where does the plant meet the ground? What else is growing right beside it?' },
    { title: 'Look for visitors', prompt: 'Stay for a minute. Which insects or birds come to it?' },
    { title: 'Compare two leaves', prompt: 'Are two leaves on the same plant exactly the same size and shape?' },
  ],
  animal: [
    { title: 'Watch how it moves', prompt: 'Does it walk, hop, climb, or freeze? What makes it change?' },
    { title: 'Look at the eyes', prompt: 'Are they on the front or the sides of its head? What does that suggest about how it lives?' },
    { title: 'Look at the feet', prompt: 'How many toes can you see? Do they have claws, pads or hooves?' },
  ],
  insect: [
    { title: 'Watch its movement', prompt: 'Does it walk, jump, fly, or crawl?' },
    { title: 'Count the legs', prompt: 'How many legs can you count? How many wings?' },
    { title: 'Follow its route', prompt: 'Does it keep going back to the same spot? What is it looking for?' },
  ],
};

/** Species-specific challenge if present, otherwise a category default. */
export function challengeFor(species: Pick<Species, 'id' | 'category' | 'observe'>): Challenge {
  if (species.observe) return species.observe;
  const list = DEFAULTS[species.category];
  let h = 0;
  for (let i = 0; i < species.id.length; i++) h = (h * 31 + species.id.charCodeAt(i)) >>> 0;
  return list[h % list.length];
}
