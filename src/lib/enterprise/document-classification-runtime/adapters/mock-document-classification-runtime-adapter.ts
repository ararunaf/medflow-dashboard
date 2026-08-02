/**
 * MockDocumentClassificationRuntimeAdapter — DIP-04 / CLASS-01.
 *
 * Voltado para testes e homologação.
 * Quando enterpriseDeps estão presentes, usa Orchestrator + OCR Runtime
 * + DocumentClassificationProviderPort (mesma cadeia do default).
 * Sem deps, opera somente no store in-memory para isolamento de contrato.
 */
import { createDocumentClassificationRuntimeSessionId } from "../ports/identity";
import type { DocumentClassificationRuntimePort } from "../ports/document-classification-runtime-port";
import type { CanonicalDocumentClassificationSession } from "../ports/models";
import type {
  ClassifyDocumentInput,
  ClassifyDocumentResult,
  CoordinateClassificationInput,
  CoordinateClassificationResult,
  DocumentClassificationRuntimeCapabilities,
  DocumentClassificationRuntimeEnterpriseDeps,
  DocumentClassificationRuntimeHealth,
  DocumentClassificationRuntimeProviderId,
  GetDocumentClassificationRuntimeSessionInput,
  GetDocumentClassificationRuntimeSessionResult,
  ListDocumentClassificationProviderReferencesResult,
  ListDocumentClassificationRuntimeSessionsInput,
  ListDocumentClassificationRuntimeSessionsResult,
} from "../ports/types";
import { STRUCTURAL_DOCUMENT_CLASSIFICATION_PROVIDER_REFERENCES } from "../ports/types";
import {
  InMemoryDocumentClassificationRuntimeStore,
  type DocumentClassificationRuntimeStore,
} from "../store";
import {
  DefaultDocumentClassificationRuntimeAdapter,
  STRUCTURAL_CLASSIFICATION_PROVIDER_ADAPTER_ID,
} from "./default-document-classification-runtime-adapter";

export const MOCK_DOCUMENT_CLASSIFICATION_RUNTIME_ADAPTER_ID = "mock-in-memory";

export type MockDocumentClassificationRuntimeAdapterOptions = {
  provider?: Extract<DocumentClassificationRuntimeProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: DocumentClassificationRuntimeStore;
  enterpriseDeps?: DocumentClassificationRuntimeEnterpriseDeps;
  createSessionId?: () => string;
  now?: () => string;
};

export class MockDocumentClassificationRuntimeAdapter implements DocumentClassificationRuntimePort {
  readonly providerId: Extract<DocumentClassificationRuntimeProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly store: DocumentClassificationRuntimeStore;
  private readonly createSessionId: () => string;
  private readonly now?: () => string;
  private readonly delegate: DefaultDocumentClassificationRuntimeAdapter | undefined;

  constructor(options: MockDocumentClassificationRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ??
      `${this.providerId} document-classification-runtime ready (no real classification).`;
    this.store = options.store ?? new InMemoryDocumentClassificationRuntimeStore();
    this.createSessionId = options.createSessionId ?? createDocumentClassificationRuntimeSessionId;
    this.now = options.now;

    if (options.enterpriseDeps) {
      this.delegate = new DefaultDocumentClassificationRuntimeAdapter({
        enterpriseDeps: options.enterpriseDeps,
        store: this.store,
        createSessionId: this.createSessionId,
        now: this.now,
        ping: async () => ({ ok: this.healthy, message: this.message }),
      });
    }
  }

  capabilities(): DocumentClassificationRuntimeCapabilities {
    return {
      provider: this.providerId,
      adapterId: MOCK_DOCUMENT_CLASSIFICATION_RUNTIME_ADAPTER_ID,
      supportsCoordinateClassification: true,
      supportsClassify: Boolean(this.delegate),
      supportsGetSession: true,
      supportsListSessions: true,
      supportsHealth: true,
      supportsCapabilities: true,
      supportsProviderReferences: true,
      usesEnterpriseRuntimePorts: Boolean(this.delegate),
      usesCanonicalExecutionOrchestrator: Boolean(this.delegate),
      usesOCRRuntime: Boolean(this.delegate),
      usesCaptureEngineRuntime: Boolean(this.delegate),
      usesDocumentClassificationProviderAdapter: Boolean(this.delegate),
      supportsMedicalGuideClassification: Boolean(this.delegate),
      supportsInvoiceClassification: Boolean(this.delegate),
      supportsContractClassification: false,
      supportsBatchClassification: false,
      supportsConfidenceScore: Boolean(this.delegate),
      supportsMultiLabelClassification: false,
      supportsCustomModels: false,
      supportsRuleBasedClassification: Boolean(this.delegate),
      implementsRealClassification: Boolean(this.delegate),
      implementsAi: false,
      implementsMachineLearning: false,
      implementsRuleEngine: false,
      implementsEmbeddings: false,
      implementsLlm: false,
      implementsOcrForClassification: false,
    };
  }

  async health(): Promise<DocumentClassificationRuntimeHealth> {
    if (this.delegate) {
      const health = await this.delegate.health();
      return { ...health, provider: this.providerId };
    }
    return {
      ok: this.healthy,
      provider: this.providerId,
      message: this.message,
      realClassificationAvailable: false,
    };
  }

  async coordinateClassification(
    input: CoordinateClassificationInput,
  ): Promise<CoordinateClassificationResult> {
    if (this.delegate) {
      return this.delegate.coordinateClassification(input);
    }

    if (!input.identity?.documentId || !input.metadata?.sessionId) {
      return {
        kind: "canonical-document-classification-result",
        ok: false,
        message: "identity.documentId e metadata.sessionId são obrigatórios.",
        code: "INVALID_INPUT",
        realClassificationExecuted: false,
      };
    }

    const stamp = this.now?.() ?? new Date().toISOString();
    const runtimeSessionId = this.createSessionId();
    const session: CanonicalDocumentClassificationSession = {
      kind: "canonical-document-classification-session",
      runtimeSessionId,
      status: "coordinated",
      request: input,
      executionId: `mock-exec-${runtimeSessionId}`,
      providerReferenceId: "mock",
      classificationProviderAdapterId: STRUCTURAL_CLASSIFICATION_PROVIDER_ADAPTER_ID,
      createdAt: stamp,
      updatedAt: stamp,
      message:
        "Mock classification coordinated (store-only; no Enterprise Ports; no real classification).",
      code: "MOCK_COORDINATED",
      realClassificationExecuted: false,
    };
    this.store.setSession(session);
    return {
      kind: "canonical-document-classification-result",
      ok: true,
      runtimeSessionId,
      session,
      executionId: session.executionId,
      providerReferenceId: "mock",
      message: session.message,
      code: session.code,
      realClassificationExecuted: false,
    };
  }

  async classify(input: ClassifyDocumentInput): Promise<ClassifyDocumentResult> {
    if (this.delegate) {
      return this.delegate.classify(input);
    }
    return {
      kind: "canonical-document-classification-result",
      ok: false,
      message: "Mock store-only adapter não executa classify() sem enterpriseDeps.",
      code: "CLASSIFY_UNSUPPORTED",
      realClassificationExecuted: false,
    };
  }

  async getSession(
    input: GetDocumentClassificationRuntimeSessionInput,
  ): Promise<GetDocumentClassificationRuntimeSessionResult> {
    if (this.delegate) return this.delegate.getSession(input);
    const session = this.store.getSession(input.runtimeSessionId);
    if (!session) return { ok: false, message: "not found", code: "not_found" };
    return { ok: true, session };
  }

  async listSessions(
    input: ListDocumentClassificationRuntimeSessionsInput = {},
  ): Promise<ListDocumentClassificationRuntimeSessionsResult> {
    if (this.delegate) return this.delegate.listSessions(input);
    const sessions = this.store.listSessions().filter((session) => {
      if (input.status != null && session.status !== input.status) return false;
      if (input.documentId != null && session.request.identity.documentId !== input.documentId) {
        return false;
      }
      if (input.sessionId != null && session.request.metadata.sessionId !== input.sessionId) {
        return false;
      }
      if (input.idPrefix != null && !session.runtimeSessionId.startsWith(input.idPrefix)) {
        return false;
      }
      if (
        input.captureRuntimeSessionId != null &&
        session.request.reference?.captureRuntimeSessionId !== input.captureRuntimeSessionId
      ) {
        return false;
      }
      if (
        input.ocrRuntimeSessionId != null &&
        session.request.reference?.ocrRuntimeSessionId !== input.ocrRuntimeSessionId
      ) {
        return false;
      }
      return true;
    });
    return { ok: true, sessions };
  }

  async listProviderReferences(): Promise<ListDocumentClassificationProviderReferencesResult> {
    if (this.delegate) return this.delegate.listProviderReferences();
    return { ok: true, references: STRUCTURAL_DOCUMENT_CLASSIFICATION_PROVIDER_REFERENCES };
  }
}
