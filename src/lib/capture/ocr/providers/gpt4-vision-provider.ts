/**
 * GPT-4o Vision OCR Provider — STUB como extrator de documento INTEIRO
 * (Tier 2 semântico, alternativa completa ao Azure Document Intelligence).
 *
 * F2-S5 implementou o caso de uso real que a sprint pedia — fallback
 * semântico por CAMPO de baixa confiança (< 0.70), não substituição do
 * provider inteiro — em src/lib/capture/ocr/fallback/semantic-fallback.ts
 * (applySemanticFallback), via AIProviderPort/capability "vision"
 * diretamente, sem passar por este OcrProvider: o contrato OcrProvider é
 * por documento completo, o fallback é por campo recortado + contexto do
 * parser, casos de uso diferentes o bastante para não caber na mesma
 * interface. Esta classe segue como stub caso um dia se queira o GPT-4o
 * Vision como provider primário/alternativo de documento inteiro.
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
