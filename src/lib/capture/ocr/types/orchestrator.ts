/**
 * Tipos do OcrOrchestrator — MEDICFLOW-OCR-IMPLEMENTATION-01
 */
import type { RawOcrResult } from "./raw-ocr-result";

export type OcrOrchestratorConfig = {
  /** Provider primário (default: azure_document_intelligence) */
  primaryProviderId: string;
  /** Cadeia de fallback futura — não implementada nesta sprint */
  fallbackProviderIds?: string[];
  /** Timeout por tentativa em ms */
  timeoutMs?: number;
};

export type OcrOrchestratorInput = {
  sessionId: string;
  tenantId: string;
  storagePath: string;
  mimeType: string;
  fileBytes: Uint8Array;
};

export type OcrOrchestratorResult = {
  result: RawOcrResult;
  providerId: string;
  processingTimeMs: number;
  usedFallback: boolean;
};
