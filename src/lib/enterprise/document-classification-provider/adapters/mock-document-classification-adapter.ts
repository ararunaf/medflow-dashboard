/**
 * MockDocumentClassificationAdapter — CLASS-01.
 *
 * Implementação totalmente determinística.
 * Sem classificação real avançada. Sem HTTP. Sem IA.
 */
import { DEFAULT_MOCK_CLASSIFICATION_CAPABILITIES } from "../ports/capabilities";
import { createDocumentClassificationRequestId } from "../ports/identity";
import type { DocumentClassificationProviderPort } from "../ports/document-classification-provider-port";
import type {
  DocumentClassificationConfigurationValidation,
  DocumentClassificationProcessInput,
  DocumentClassificationProcessResult,
  DocumentClassificationProviderHealth,
  DocumentClassificationProviderId,
  DocumentClassificationProviderInfo,
  DocumentClassificationProviderMetadata,
  DocumentClassificationProviderPortCapabilities,
  DocumentClassificationType,
} from "../ports/types";

export const MOCK_DOCUMENT_CLASSIFICATION_ADAPTER_ID = "mock-deterministic";
export const DEFAULT_MOCK_DOCUMENT_CLASSIFICATION_PROVIDER_VERSION = "1.0.0";

export type MockDocumentClassificationAdapterOptions = {
  provider?: Extract<DocumentClassificationProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  documentType?: DocumentClassificationType;
  confidence?: number;
};

function mockMetadata(
  providerId: Extract<DocumentClassificationProviderId, "mock" | "test">,
): DocumentClassificationProviderMetadata {
  return {
    name:
      providerId === "test"
        ? "Test Document Classification Provider"
        : "Mock Document Classification Provider",
    version: DEFAULT_MOCK_DOCUMENT_CLASSIFICATION_PROVIDER_VERSION,
    vendor: "medicflow-enterprise",
    description: "Deterministic in-process classification mock — no network, no AI, no ML.",
  };
}

export class MockDocumentClassificationAdapter implements DocumentClassificationProviderPort {
  readonly providerId: Extract<DocumentClassificationProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly metadata: DocumentClassificationProviderMetadata;
  private readonly documentType: DocumentClassificationType;
  private readonly confidence: number;

  constructor(options: MockDocumentClassificationAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ??
      `${this.providerId} document classification provider ready (deterministic).`;
    this.metadata = mockMetadata(this.providerId);
    this.documentType = options.documentType ?? "documento-desconhecido";
    this.confidence = options.confidence ?? 0.99;
  }

  capabilities(): DocumentClassificationProviderPortCapabilities {
    return {
      provider: this.providerId,
      adapterId: MOCK_DOCUMENT_CLASSIFICATION_ADAPTER_ID,
      classification: { ...DEFAULT_MOCK_CLASSIFICATION_CAPABILITIES },
      supportsCanonicalResult: true,
      supportsOcrRuntimeInput: true,
      supportsConfigurableRules: false,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      implementsAi: false,
      implementsMachineLearning: false,
      implementsEmbeddings: false,
      implementsLlm: false,
    };
  }

  providerInfo(): DocumentClassificationProviderInfo {
    return {
      providerId: this.providerId,
      metadata: this.metadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "DOCUMENT_CLASSIFICATION",
      capabilities: { ...DEFAULT_MOCK_CLASSIFICATION_CAPABILITIES },
    };
  }

  async health(): Promise<DocumentClassificationProviderHealth> {
    return {
      ok: this.healthy,
      provider: this.providerId,
      latencyMs: 0,
      status: this.healthy ? "ready" : "unhealthy",
      message: this.message,
    };
  }

  async validateConfiguration(): Promise<DocumentClassificationConfigurationValidation> {
    return {
      ok: true,
      provider: this.providerId,
      errors: [],
      warnings: [],
      message: "Mock classification provider não requer configuração externa.",
    };
  }

  async classify(
    input: DocumentClassificationProcessInput,
  ): Promise<DocumentClassificationProcessResult> {
    const requestId = input.requestId ?? createDocumentClassificationRequestId();
    const startedMs = Date.now();

    if (input.signal?.aborted) {
      return {
        ok: false,
        requestId,
        provider: this.providerId,
        documentType: "documento-desconhecido",
        confidence: 0,
        matchedRules: [],
        message: "Classificação cancelada.",
        code: "CLASSIFICATION_CANCELLED",
        simulated: true,
        telemetry: {
          latencyMs: Math.max(0, Date.now() - startedMs),
          attempts: 0,
          cancelled: true,
          matchedRuleCount: 0,
          documentType: "documento-desconhecido",
        },
      };
    }

    if (!this.healthy) {
      return {
        ok: false,
        requestId,
        provider: this.providerId,
        documentType: "documento-desconhecido",
        confidence: 0,
        matchedRules: [],
        message: "Mock classification provider unhealthy.",
        code: "CLASSIFICATION_UNHEALTHY",
        simulated: true,
        telemetry: {
          latencyMs: Math.max(0, Date.now() - startedMs),
          attempts: 1,
          cancelled: false,
          matchedRuleCount: 0,
          documentType: "documento-desconhecido",
        },
      };
    }

    return {
      ok: true,
      requestId,
      provider: this.providerId,
      documentType: this.documentType,
      confidence: this.confidence,
      matchedRules: ["mock-fixed"],
      message: "Mock classification completed (deterministic).",
      code: "CLASSIFIED",
      simulated: true,
      telemetry: {
        latencyMs: Math.max(0, Date.now() - startedMs),
        attempts: 1,
        cancelled: false,
        matchedRuleCount: 1,
        documentType: this.documentType,
      },
      logs: [
        {
          level: "info",
          code: "CLASSIFICATION_OK",
          message: "Mock classification ok",
          requestId,
          providerId: this.providerId,
          attempt: 1,
        },
      ],
    };
  }
}
