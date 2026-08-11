/**
 * Azure Document Intelligence — bridge de produto (OCR-01).
 *
 * NÃO chama Azure/HTTP diretamente.
 * Fluxo obrigatório:
 *   Produto → Enterprise Runtime → Capture Runtime → OCR Runtime
 *     → OCRProviderPort → AzureDocumentIntelligenceAdapter → Azure
 *
 * Mantém a interface OcrProvider do produto (RawOcrResult) sem alterar APIs públicas.
 */
import type { OcrProvider, OcrProviderExtractInput, OcrProviderHealth } from "../types/provider";
import { CAPTURE_OCR_MAX_BYTES, CAPTURE_OCR_SUPPORTED_MIMES } from "./shared";
import {
  healthCaptureOcrViaEnterprise,
  processCaptureOcrViaEnterprise,
} from "../enterprise/process-ocr-via-enterprise";
import type { AzureFetchFn } from "@/lib/enterprise/ocr-provider";

const PROVIDER_ID = "azure_document_intelligence";
const PROVIDER_VERSION = "prebuilt-layout@2024-11-30";

export class AzureDocumentIntelligenceProvider implements OcrProvider {
  readonly providerId = PROVIDER_ID;
  readonly providerVersion = PROVIDER_VERSION;

  constructor(
    private readonly fetchFn?: AzureFetchFn,
    private readonly pollIntervalMs = 500,
    private readonly maxPolls = 60,
  ) {}

  capabilities() {
    return {
      providerName: "Azure Document Intelligence",
      supportedMimeTypes: [...CAPTURE_OCR_SUPPORTED_MIMES],
      maxBytes: CAPTURE_OCR_MAX_BYTES,
      supportsMultiPage: true,
      supportsHandwriting: true,
    };
  }

  async health(): Promise<OcrProviderHealth> {
    if (this.fetchFn) {
      // Caminho de teste com fetch injetado — valida via Adapter Enterprise.
      const { AzureDocumentIntelligenceAdapter } = await import("@/lib/enterprise/ocr-provider");
      const adapter = new AzureDocumentIntelligenceAdapter({
        fetchFn: this.fetchFn,
        pollIntervalMs: this.pollIntervalMs,
        maxPolls: this.maxPolls,
      });
      const health = await adapter.health();
      return {
        available: health.ok,
        latencyMs: health.latencyMs,
        message: health.message,
      };
    }

    const { resolveCaptureEnterpriseRuntime } =
      await import("@/lib/capture/enterprise/resolve-enterprise-runtime");
    const port = resolveCaptureEnterpriseRuntime().getOCRProviderPort();
    const validation = await port.validateConfiguration();
    if (!validation.ok) {
      return { available: false, message: "Credenciais Azure não configuradas." };
    }
    return healthCaptureOcrViaEnterprise();
  }

  async extract(input: OcrProviderExtractInput) {
    const { raw } = await processCaptureOcrViaEnterprise({
      sessionId: input.sessionId,
      tenantId: input.tenantId,
      storagePath: input.storagePath,
      mimeType: input.mimeType,
      fileBytes: input.fileBytes,
      fetchFn: this.fetchFn,
      pollIntervalMs: this.pollIntervalMs,
      maxPolls: this.maxPolls,
    });
    return raw;
  }
}
