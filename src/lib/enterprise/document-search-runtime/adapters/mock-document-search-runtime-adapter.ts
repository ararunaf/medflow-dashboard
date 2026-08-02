/**
 * MockDocumentSearchRuntimeAdapter — DIP-06.
 *
 * Voltado para testes e homologação.
 * Quando enterpriseDeps estão presentes, usa Orchestrator + Storage Manager Runtime
 * (mesma cadeia do default). Sem deps, opera somente no store in-memory
 * para isolamento de contrato — sem busca real e sem implementação paralela.
 */
import { createDocumentSearchRuntimeSessionId } from "../ports/identity";
import type { DocumentSearchRuntimePort } from "../ports/document-search-runtime-port";
import type { CanonicalSearchSession } from "../ports/models";
import type {
  CoordinateSearchInput,
  CoordinateSearchResult,
  DocumentSearchRuntimeCapabilities,
  DocumentSearchRuntimeEnterpriseDeps,
  DocumentSearchRuntimeHealth,
  DocumentSearchRuntimeProviderId,
  GetDocumentSearchRuntimeSessionInput,
  GetDocumentSearchRuntimeSessionResult,
  ListDocumentSearchRuntimeSessionsInput,
  ListDocumentSearchRuntimeSessionsResult,
  ListSearchProviderReferencesResult,
} from "../ports/types";
import { STRUCTURAL_SEARCH_PROVIDER_REFERENCES } from "../ports/types";
import { InMemoryDocumentSearchRuntimeStore, type DocumentSearchRuntimeStore } from "../store";
import {
  DefaultDocumentSearchRuntimeAdapter,
  STRUCTURAL_SEARCH_PROVIDER_ADAPTER_ID,
} from "./default-document-search-runtime-adapter";

export const MOCK_DOCUMENT_SEARCH_RUNTIME_ADAPTER_ID = "mock-in-memory";

export type MockDocumentSearchRuntimeAdapterOptions = {
  provider?: Extract<DocumentSearchRuntimeProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: DocumentSearchRuntimeStore;
  enterpriseDeps?: DocumentSearchRuntimeEnterpriseDeps;
  createSessionId?: () => string;
  now?: () => string;
};

export class MockDocumentSearchRuntimeAdapter implements DocumentSearchRuntimePort {
  readonly providerId: Extract<DocumentSearchRuntimeProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly store: DocumentSearchRuntimeStore;
  private readonly createSessionId: () => string;
  private readonly now?: () => string;
  private readonly delegate: DefaultDocumentSearchRuntimeAdapter | undefined;

  constructor(options: MockDocumentSearchRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ?? `${this.providerId} document-search-runtime ready (no real search).`;
    this.store = options.store ?? new InMemoryDocumentSearchRuntimeStore();
    this.createSessionId = options.createSessionId ?? createDocumentSearchRuntimeSessionId;
    this.now = options.now;

    if (options.enterpriseDeps) {
      this.delegate = new DefaultDocumentSearchRuntimeAdapter({
        enterpriseDeps: options.enterpriseDeps,
        store: this.store,
        createSessionId: this.createSessionId,
        now: this.now,
        ping: async () => ({ ok: this.healthy, message: this.message }),
      });
    }
  }

  capabilities(): DocumentSearchRuntimeCapabilities {
    return {
      provider: this.providerId,
      adapterId: MOCK_DOCUMENT_SEARCH_RUNTIME_ADAPTER_ID,
      supportsCoordinateSearch: true,
      supportsGetSession: true,
      supportsListSessions: true,
      supportsHealth: true,
      supportsCapabilities: true,
      supportsProviderReferences: true,
      usesEnterpriseRuntimePorts: Boolean(this.delegate),
      usesCanonicalExecutionOrchestrator: Boolean(this.delegate),
      usesStorageManagerRuntime: Boolean(this.delegate),
      usesDocumentClassificationRuntime: Boolean(this.delegate),
      usesOCRRuntime: Boolean(this.delegate),
      usesCaptureEngineRuntime: Boolean(this.delegate),
      supportsKeywordSearch: false,
      supportsMetadataSearch: false,
      supportsFullTextSearch: false,
      supportsSemanticSearch: false,
      supportsVectorSearch: false,
      supportsBatchSearch: false,
      supportsRanking: false,
      supportsFacetedSearch: false,
      implementsRealSearch: false,
      implementsIndexing: false,
      implementsVectorSearch: false,
      implementsEmbeddings: false,
      implementsRAG: false,
      implementsAI: false,
      implementsExternalProviderCall: false,
    };
  }

  async health(): Promise<DocumentSearchRuntimeHealth> {
    if (this.delegate) {
      const health = await this.delegate.health();
      return {
        ...health,
        provider: this.providerId,
        realSearchAvailable: false,
        realIndexingAvailable: false,
      };
    }
    return {
      ok: this.healthy,
      provider: this.providerId,
      message: this.message,
      realSearchAvailable: false,
      realIndexingAvailable: false,
    };
  }

  async coordinateSearch(input: CoordinateSearchInput): Promise<CoordinateSearchResult> {
    if (this.delegate) {
      return this.delegate.coordinateSearch(input);
    }

    if (!input.identity?.documentId || !input.metadata?.sessionId) {
      return {
        kind: "canonical-search-result",
        ok: false,
        message: "identity.documentId e metadata.sessionId são obrigatórios.",
        code: "INVALID_INPUT",
        realSearchExecuted: false,
        realIndexingExecuted: false,
      };
    }

    const stamp = this.now?.() ?? new Date().toISOString();
    const runtimeSessionId = this.createSessionId();
    const session: CanonicalSearchSession = {
      kind: "canonical-search-session",
      runtimeSessionId,
      status: "coordinated",
      request: input,
      executionId: `mock-exec-${runtimeSessionId}`,
      providerReferenceId: "mock-search",
      searchProviderAdapterId: STRUCTURAL_SEARCH_PROVIDER_ADAPTER_ID,
      createdAt: stamp,
      updatedAt: stamp,
      message: "Mock search coordinated (store-only; no Enterprise Ports; no real search).",
      code: "MOCK_COORDINATED",
      realSearchExecuted: false,
      realIndexingExecuted: false,
    };
    this.store.setSession(session);
    return {
      kind: "canonical-search-result",
      ok: true,
      runtimeSessionId,
      session,
      executionId: session.executionId,
      providerReferenceId: "mock-search",
      message: session.message,
      code: session.code,
      realSearchExecuted: false,
      realIndexingExecuted: false,
    };
  }

  async getSession(
    input: GetDocumentSearchRuntimeSessionInput,
  ): Promise<GetDocumentSearchRuntimeSessionResult> {
    if (this.delegate) return this.delegate.getSession(input);
    const session = this.store.getSession(input.runtimeSessionId);
    if (!session) return { ok: false, message: "not found", code: "not_found" };
    return { ok: true, session };
  }

  async listSessions(
    input: ListDocumentSearchRuntimeSessionsInput = {},
  ): Promise<ListDocumentSearchRuntimeSessionsResult> {
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
      if (
        input.classificationRuntimeSessionId != null &&
        session.request.reference?.classificationRuntimeSessionId !==
          input.classificationRuntimeSessionId
      ) {
        return false;
      }
      if (
        input.storageManagerRuntimeSessionId != null &&
        session.request.reference?.storageManagerRuntimeSessionId !==
          input.storageManagerRuntimeSessionId
      ) {
        return false;
      }
      return true;
    });
    return { ok: true, sessions };
  }

  async listProviderReferences(): Promise<ListSearchProviderReferencesResult> {
    if (this.delegate) return this.delegate.listProviderReferences();
    return { ok: true, references: STRUCTURAL_SEARCH_PROVIDER_REFERENCES };
  }
}
