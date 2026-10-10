import type { IdentificationResult } from '../domain/types';

export interface ModelProgress {
  /** 0–1 */
  fraction: number;
  /** Short, human-readable description of the current step. */
  label: string;
}

export type IdentifierErrorCode =
  | 'model-missing' // not downloaded yet and no connection
  | 'download-failed' // download started but did not finish
  | 'out-of-memory'
  | 'bad-image'
  | 'unknown';

export class IdentifierError extends Error {
  readonly code: IdentifierErrorCode;
  constructor(code: IdentifierErrorCode, message?: string, options?: { cause?: unknown }) {
    super(message ?? code, options);
    this.name = 'IdentifierError';
    this.code = code;
  }
}

/**
 * The only thing the UI knows about identification.
 * Swap the implementation (CLIP today; TFLite, a fine-tuned classifier or a native
 * module tomorrow) without touching any screen.
 */
export interface NatureIdentifier {
  /** Stable id of the model, stored with each observation. */
  readonly modelId: string;
  /** Human-readable name for the Settings screen. */
  readonly modelLabel: string;
  readonly license: string;
  /** True only if the photo is processed on this device and never uploaded. */
  readonly runsLocally: boolean;

  /** Is the model already stored on this device (so it can run offline)? */
  isDownloaded(): Promise<boolean>;
  /** Loaded in memory and ready to identify. */
  isReady(): boolean;
  /** Download (if needed) and load the model. Safe to call more than once. */
  initialize(onProgress?: (p: ModelProgress) => void): Promise<void>;
  identify(image: Blob | ImageData): Promise<IdentificationResult>;
}
