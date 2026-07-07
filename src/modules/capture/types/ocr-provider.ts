/**
 * Contrato OCR plugável — somente interface (MEDICFLOW-CAPTURE-PIPELINE-01).
 * Implementações concretas ficam para sprints futuras.
 */

export type OcrCapabilities = {
  supportedMimeTypes: string[];
  maxBytes: number;
  supportsMultiPage: boolean;
  supportsHandwriting: boolean;
  providerName: string;
};

export type OcrHealth = {
  available: boolean;
  latencyMs?: number;
  message?: string;
};

export type OcrExtractInput = {
  sessionId: string;
  storagePath: string;
  mimeType: string;
  pageNumber?: number;
};

export type OcrExtractResult = {
  rawText: string;
  confidence: number;
  blocks: Array<{
    text: string;
    confidence: number;
    boundingBox?: { x: number; y: number; width: number; height: number };
  }>;
  provider: string;
  modelVersion: string;
};

/** Provedor OCR — contrato para integração futura. */
export interface OcrProvider {
  readonly providerId: string;

  extract(input: OcrExtractInput): Promise<OcrExtractResult>;

  health(): Promise<OcrHealth>;

  capabilities(): OcrCapabilities;
}
