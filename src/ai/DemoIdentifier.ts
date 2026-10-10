import { SPECIES } from '../data/species';
import { DISTRACTORS } from '../data/distractors';
import type { IdentificationResult } from '../domain/types';
import type { ModelProgress, NatureIdentifier } from './NatureIdentifier';
import { buildResult, softmax } from './scoring';

/**
 * DEVELOPMENT ONLY. Gives deterministic predictions so screens can be demonstrated
 * without downloading a model. It does not look at the picture, only at its bytes,
 * and every result it produces is labelled "demo" in the UI.
 * It is excluded from production builds (see ai/index.ts).
 */
export class DemoIdentifier implements NatureIdentifier {
  readonly modelId = 'demo';
  readonly modelLabel = 'Demo (not a real model)';
  readonly license = 'n/a';
  readonly runsLocally = true;

  isReady() {
    return true;
  }
  async isDownloaded() {
    return true;
  }
  async initialize(onProgress?: (p: ModelProgress) => void) {
    onProgress?.({ fraction: 1, label: 'Demo' });
  }

  async identify(image: Blob | ImageData): Promise<IdentificationResult> {
    await new Promise((r) => setTimeout(r, 1800)); // let the analysis screen be seen
    const bytes = image instanceof Blob ? new Uint8Array(await image.slice(0, 4096).arrayBuffer()) : image.data.slice(0, 4096);
    let h = 2166136261;
    for (const b of bytes) h = Math.imul(h ^ b, 16777619) >>> 0;

    const n = SPECIES.length;
    const logits = new Array(n + DISTRACTORS.length).fill(0);
    const pick = h % n;
    const second = (pick + 7) % n;
    // Every 5th photo is deliberately uncertain so that screen can be reviewed too.
    const uncertain = h % 5 === 0;
    logits[pick] = uncertain ? 5.2 : 8;
    logits[second] = uncertain ? 4.9 : 3;
    return buildResult(softmax(logits), 'demo', this.modelId);
  }
}
