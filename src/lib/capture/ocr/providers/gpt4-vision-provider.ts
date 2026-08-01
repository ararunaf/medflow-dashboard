/**
 * GPT-4o Vision OCR Provider — STUB (Tier 2 semântico).
 *
 * TODO (sprint futura): Integrar com operational-gpt-openai.ts para extração
 * semântica de campos ambíguos quando confidence Azure < 0.70.
 * Deve receber hints do Azure OCR parcial como contexto.
 */
import { DomainError } from "@/lib/domain/operations/errors";
import type { OcrProvider, OcrProviderExtractInput, OcrProviderHealth } from "../types/provider";
import type { RawOcrResult } from "../types/raw-ocr-result";
import { CAPTURE_OCR_MAX_BYTES, CAPTURE_OCR_SUPPORTED_MIMES } from "./shared";

export class Gpt4VisionProvider implements OcrProvider {
  readonly providerId = "gpt4_vision";
  readonly providerVersion = "gpt-4o@stub";

  capabilities() {
    return {
      providerName: "GPT-4o Vision",
      supportedMimeTypes: [...CAPTURE_OCR_SUPPORTED_MIMES],
      maxBytes: CAPTURE_OCR_MAX_BYTES,
      supportsMultiPage: false,
      supportsHandwriting: true,
    };
  }

  async health(): Promise<OcrProviderHealth> {
    return {
      available: false,
      message: "Not Implemented — GPT-4o Vision OCR agendado para sprint futura.",
    };
  }

  async extract(_input: OcrProviderExtractInput): Promise<RawOcrResult> {
    throw new DomainError(
      "not_implemented",
      "GPT-4o Vision OCR não implementado nesta sprint. Use azure_document_intelligence.",
    );
  }
}
