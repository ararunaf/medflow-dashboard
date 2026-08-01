/**
 * DefaultMockOCRProvider / MockOCRProviderAdapter — EPC-15 FASE 2.
 *
 * Implementação totalmente determinística.
 * Sem OCR real. Sem HTTP. Sem IA. Sem I/O de arquivo.
 * Sempre retorna ProcessingOutput canônico (EPC-13).
 *
 * O OCR apenas extrai (simula extração). Nunca interpreta, valida
 * ou toma decisões de domínio.
 */
import { createOutputId, createProcessingId } from "../../document-processor/ports/identity";
import type {
  DocumentProcessingResult,
  ProcessingOutput,
} from "../../document-processor/ports/types";
import { DEFAULT_MOCK_OCR_CAPABILITIES, type OCRCapabilities } from "../ports/capabilities";
import { FUTURE_NORMALIZATION_TAG } from "../ports/extension-points";
import { createOCRRequestId } from "../ports/identity";
import type { OCRProviderPort } from "../ports/ocr-provider-port";
import type {
  OCRConfigurationValidation,
  OCRProcessInput,
  OCRProcessResult,
  OCRProviderHealth,
  OCRProviderId,
  OCRProviderInfo,
  OCRProviderMetadata,
  OCRProviderPortCapabilities,
} from "../ports/types";

export const MOCK_OCR_PROVIDER_ADAPTER_ID = "mock-deterministic";
export const DEFAULT_MOCK_OCR_PROVIDER_VERSION = "1.0.0";

export type MockOCRProviderAdapterOptions = {
  provider?: Extract<OCRProviderId, "mock" | "test" | "default">;
  healthy?: boolean;
  message?: string;
  capabilities?: OCRCapabilities;
  createProcessingId?: () => string;
  createOutputId?: () => string;
  now?: () => string;
};

function mockMetadata(
  providerId: Extract<OCRProviderId, "mock" | "test" | "default">,
): OCRProviderMetadata {
  const name =
    providerId === "test"
      ? "Test OCR Provider"
      : providerId === "default"
        ? "Default OCR Provider (Mock)"
        : "Default Mock OCR Provider";
  return {
    name,
    version: DEFAULT_MOCK_OCR_PROVIDER_VERSION,
    vendor: "medicflow-enterprise",
    description: "Deterministic in-process OCR mock — no network, no real OCR engine, no AI.",
  };
}

/**
 * Mock determinístico. Também exportado como `DefaultMockOCRProvider`.
 */
export class MockOCRProviderAdapter implements OCRProviderPort {
  readonly providerId: Extract<OCRProviderId, "mock" | "test" | "default">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly ocrCapabilities: OCRCapabilities;
  private readonly metadata: OCRProviderMetadata;
  private readonly createProcessingIdFn: () => string;
  private readonly createOutputIdFn: () => string;
  private readonly now: () => string;

  constructor(options: MockOCRProviderAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.providerId} OCR provider ready (deterministic).`;
    this.ocrCapabilities = options.capabilities ?? DEFAULT_MOCK_OCR_CAPABILITIES;
    this.metadata = mockMetadata(this.providerId);
    this.createProcessingIdFn = options.createProcessingId ?? createProcessingId;
    this.createOutputIdFn = options.createOutputId ?? createOutputId;
    this.now = options.now ?? (() => new Date().toISOString());
  }

  capabilities(): OCRProviderPortCapabilities {
    return {
      provider: this.providerId,
      adapterId: MOCK_OCR_PROVIDER_ADAPTER_ID,
      ocr: { ...this.ocrCapabilities },
      supportsCanonicalProcessingOutput: true,
      supportsDocumentProcessingResult: true,
      supportsDocumentIdentityReference: true,
      supportsMetadataReference: true,
      supportsFutureNormalizationHook: true,
      supportsFutureRealEngines: true,
    };
  }

  providerInfo(): OCRProviderInfo {
    return {
      providerId: this.providerId,
      metadata: this.metadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "OCR",
      capabilities: { ...this.ocrCapabilities },
    };
  }

  async health(): Promise<OCRProviderHealth> {
    return {
      ok: this.healthy,
      provider: this.providerId,
      latencyMs: 0,
      status: this.healthy ? "ready" : "unhealthy",
      message: this.message,
    };
  }

  async validateConfiguration(): Promise<OCRConfigurationValidation> {
    return {
      ok: true,
      provider: this.providerId,
      errors: [],
      warnings: [],
      message: "Mock OCR provider não requer configuração externa.",
    };
  }

  async process(input: OCRProcessInput): Promise<OCRProcessResult> {
    const requestId = input.requestId ?? createOCRRequestId();
    const stamp = this.now();
    const processingId = this.createProcessingIdFn();
    const outputId = this.createOutputIdFn();

    if (!this.healthy) {
      const failedProcessing: DocumentProcessingResult = {
        processingId,
        processorType: "OCR",
        status: "FAILED",
        startedAt: stamp,
        finishedAt: stamp,
        duration: 0,
        documentIdentityReference: input.documentIdentityReference,
        metadataReference: input.metadataReference,
        errors: [{ code: "ocr_unhealthy", message: "Mock OCR provider unhealthy." }],
        tags: ["ocr", "mock", FUTURE_NORMALIZATION_TAG],
        customAttributes: {
          providerId: this.providerId,
          simulated: true,
          realOcr: false,
        },
      };

      const emptyOutput: ProcessingOutput = {
        outputId,
        contentType: input.contentType ?? "text/plain",
        structuredData: {},
        confidence: 0,
        language: input.language,
        metadataReference: input.metadataReference,
        rawDataReference: input.rawDataReference,
      };

      return {
        ok: false,
        requestId,
        provider: this.providerId,
        processing: failedProcessing,
        output: emptyOutput,
        simulated: true,
        message: "Mock OCR provider unhealthy.",
      };
    }

    /**
     * ProcessingOutput canônico determinístico.
     * Conteúdo simulado fica em structuredData opaco — sem campos OCR-específicos
     * no tipo (ocrText / boundingBoxes / ocrEngine são proibidos na raiz).
     */
    const output: ProcessingOutput = {
      outputId,
      contentType: input.contentType ?? "text/plain",
      structuredData: {
        extractedText: "MOCK_OCR_EXTRACTED_CONTENT",
        pageCount: 1,
        engine: "mock-deterministic",
        requestId,
      },
      rawDataReference: input.rawDataReference,
      metadataReference: input.metadataReference,
      confidence: 0.99,
      language: input.language ?? "pt-BR",
      encoding: "utf-8",
      pages: [
        {
          pageId: "page-1",
          sequence: 1,
          confidence: 0.99,
          tags: ["ocr", "mock"],
          customAttributes: {
            extractedText: "MOCK_OCR_EXTRACTED_CONTENT",
          },
        },
      ],
    };

    const processing: DocumentProcessingResult = {
      processingId,
      processorType: "OCR",
      status: "COMPLETED",
      startedAt: stamp,
      finishedAt: stamp,
      duration: 0,
      confidence: 0.99,
      documentIdentityReference: input.documentIdentityReference,
      metadataReference: input.metadataReference,
      outputReference: {
        outputId: output.outputId,
        contentType: output.contentType,
        kind: "processing-output",
      },
      capabilities: ["extraction", "canonical-output"],
      tags: ["ocr", "mock", "extraction", FUTURE_NORMALIZATION_TAG],
      customAttributes: {
        providerId: this.providerId,
        adapterId: MOCK_OCR_PROVIDER_ADAPTER_ID,
        simulated: true,
        realOcr: false,
        http: false,
        ai: false,
        /**
         * EXTENSION POINT (FASE 8): Application futura pode ler esta flag
         * e encaminhar `output` a um NormalizationPort — sem implementação aqui.
         */
        normalizationHook: "EP-NORM-01",
      },
    };

    return {
      ok: true,
      requestId,
      provider: this.providerId,
      processing,
      output,
      simulated: true,
      message: "Deterministic mock OCR extraction (ProcessingOutput canonical).",
    };
  }
}

/** Alias oficial da sprint EPC-15. */
export { MockOCRProviderAdapter as DefaultMockOCRProvider };
