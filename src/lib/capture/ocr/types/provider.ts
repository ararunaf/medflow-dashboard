/**
 * Contrato unificado de provedores OCR — MEDICFLOW-OCR-IMPLEMENTATION-01
 */
import type { RawOcrResult } from "./raw-ocr-result";

export type OcrProviderCapabilities = {
  providerName: string;
  supportedMimeTypes: string[];
  maxBytes: number;
  supportsMultiPage: boolean;
  supportsHandwriting: boolean;
};

export type OcrProviderHealth = {
  available: boolean;
  latencyMs?: number;
  message?: string;
};

export type OcrProviderExtractInput = {
  sessionId: string;
  tenantId: string;
  storagePath: string;
  mimeType: string;
  fileBytes: Uint8Array;
  pageNumber?: number;
};

/** Contrato plugável — Azure (implementado), GPT-4o Vision e Tesseract (stubs). */
export interface OcrProvider {
  readonly providerId: string;
  readonly providerVersion: string;

  extract(input: OcrProviderExtractInput): Promise<RawOcrResult>;

  health(): Promise<OcrProviderHealth>;

  capabilities(): OcrProviderCapabilities;
}
