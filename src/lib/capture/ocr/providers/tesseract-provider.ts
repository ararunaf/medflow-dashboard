/**
 * Tesseract OCR Provider — STUB (Tier 3 fallback local/custo).
 *
 * TODO (sprint futura): Implementar via tesseract-wasm no Worker ou
 * microserviço dedicado para tenants com ocr_tier=local ou budget exceeded.
 */
import { DomainError } from "@/lib/domain/operations/errors";
import type { OcrProvider, OcrProviderExtractInput, OcrProviderHealth } from "../types/provider";
import type { RawOcrResult } from "../types/raw-ocr-result";
import { CAPTURE_OCR_MAX_BYTES, CAPTURE_OCR_SUPPORTED_MIMES } from "./shared";

export class TesseractProvider implements OcrProvider {
  readonly providerId = "tesseract";
  readonly providerVersion = "tesseract@5.x-stub";

  capabilities() {
    return {
      providerName: "Tesseract 5.x",
      supportedMimeTypes: [...CAPTURE_OCR_SUPPORTED_MIMES],
      maxBytes: CAPTURE_OCR_MAX_BYTES,
      supportsMultiPage: true,
      supportsHandwriting: false,
    };
  }

  async health(): Promise<OcrProviderHealth> {
    return {
      available: false,
      message: "Not Implemented — Tesseract fallback agendado para sprint futura.",
    };
  }

  async extract(_input: OcrProviderExtractInput): Promise<RawOcrResult> {
    throw new DomainError(
      "not_implemented",
      "Tesseract OCR não implementado nesta sprint. Use azure_document_intelligence.",
    );
  }
}
