/**
 * Prompts for things that are NOT plants or animals. If the best match is one of these,
 * the app says it cannot see a plant, bird, animal or insect rather than forcing the
 * nearest species. Do not add anything an animal could be mistaken for (pets are animals).
 */
export const DISTRACTORS: string[] = [
  'a photo of a person',
  'a photo of the inside of a room',
  'a photo of a building',
  'a photo of a car on a road',
  'a photo of food on a plate',
  'a screenshot of text on a screen',
  'a very dark blurry photo',
  'a photo of the sky',
  'a photo of furniture',
];