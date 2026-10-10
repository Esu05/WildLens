import type { NatureIdentifier } from './NatureIdentifier';

export type { NatureIdentifier, ModelProgress } from './NatureIdentifier';
export { IdentifierError } from './NatureIdentifier';
export { isModelCached, deleteModelCache, MODEL_ID, MODEL_LABEL, MODEL_SIZE_MB } from './modelInfo';

/** Demo mode only exists in development builds. */
export const DEMO_AVAILABLE = import.meta.env.DEV;

let clip: NatureIdentifier | null = null;
let demo: NatureIdentifier | null = null;

/**
 * The one place that decides which model runs. Screens only see the interface.
 * Implementations are imported lazily so the ML library stays out of the first load.
 */
export async function getIdentifier(useDemo: boolean): Promise<NatureIdentifier> {
  if (DEMO_AVAILABLE && useDemo) {
    demo ??= new (await import('./DemoIdentifier')).DemoIdentifier();
    return demo;
  }
  clip ??= new (await import('./BioClipIdentifier')).BioClipIdentifier();
  return clip;
}
