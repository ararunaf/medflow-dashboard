/**
 * DefaultDocumentSearchRuntimeAdapter — adapter default (DIP-06).
 *
 * Utiliza exclusivamente Ports Enterprise injetados:
 *   Canonical Execution Orchestrator → Storage Manager Runtime (hop anterior)
 *   → Search Provider Adapter (referência estrutural apenas)
 *
 * NÃO busca documentos. NÃO indexa.
 * NÃO integra Elasticsearch/OpenSearch/PostgreSQL FTS/Vector DB/Azure AI Search.
 * NÃO implementa embeddings, RAG ou IA.
 * NÃO conecta Search Providers externos.
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
  GetDocumentSearchRuntimeSessionInput,
  GetDocumentSearchRuntimeSessionResult,
  ListDocumentSearchRuntimeSessionsInput,
  ListDocumentSearchRuntimeSessionsResult,
  ListSearchProviderReferencesResult,
} from "../ports/types";
import {
  STRUCTURAL_SEARCH_PROVIDER_REFERENCES,
  resolveStructuralSearchProviderReference,
} from "../ports/types";
import { InMemoryDocumentSearchRuntimeStore, type DocumentSearchRuntimeStore } from "../store";

export const DEFAULT_DOCUMENT_SEARCH_RUNTIME_ADAPTER_ID = "default-enterprise-bridge";

/** Referência estrutural ao Search Provider Adapter (sem Port de execução). */
export const STRUCTURAL_SEARCH_PROVIDER_ADAPTER_ID = "structural-search-provider-adapter";

export type DefaultDocumentSearchRuntimeAdapterOptions = {
  /** Ports Enterprise obrigatórios — sem implementação paralela. */
  enterpriseDeps: DocumentSearchRuntimeEnterpriseDeps;
  store?: DocumentSearchRuntimeStore;
  ping?: () => Promise<{ ok: boolean; message?: string }>;
  createSessionId?: () => string;
  now?: () => string;
};

function nowIso(now?: () => string): string {
  return now?.() ?? new Date().toISOString();
}

function foundationCapabilities(): DocumentSearchRuntimeCapabilities {
  return {
    provider: "default",
    adapterId: DEFAULT_DOCUMENT_SEARCH_RUNTIME_ADAPTER_ID,
    supportsCoordinateSearch: true,
    supportsGetSession: true,
    supportsListSessions: true,
    supportsHealth: true,
    supportsCapabilities: true,
    supportsProviderReferences: true,
    usesEnterpriseRuntimePorts: true,
    usesCanonicalExecutionOrchestrator: true,
    usesStorageManagerRuntime: true,
    usesDocumentClassificationRuntime: true,
    usesOCRRuntime: true,
    usesCaptureEngineRuntime: true,
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

export class DefaultDocumentSearchRuntimeAdapter implements DocumentSearchRuntimePort {
  readonly providerId = "default" as const;

  private readonly enterpriseDeps: DocumentSearchRuntimeEnterpriseDeps;
  private readonly store: DocumentSearchRuntimeStore;
  private readonly ping?: () => Promise<{ ok: boolean; message?: string }>;
  private readonly createSessionId: () => string;
  private readonly now?: () => string;

  constructor(options: DefaultDocumentSearchRuntimeAdapterOptions) {
    if (!options.enterpriseDeps) {
      throw new Error(
        "DefaultDocumentSearchRuntimeAdapter exige enterpriseDeps " +
          "(Orchestrator + StorageManagerRuntimePort). Implementação paralela é proibida.",
      );
    }
    this.enterpriseDeps = options.enterpriseDeps;
    this.store = options.store ?? new InMemoryDocumentSearchRuntimeStore();
    this.ping = options.ping;
    this.createSessionId = options.createSessionId ?? createDocumentSearchRuntimeSessionId;
    this.now = options.now;
  }

  capabilities(): DocumentSearchRuntimeCapabilities {
    return foundationCapabilities();
  }

  async health(): Promise<DocumentSearchRuntimeHealth> {
    const start = typeof performance !== "undefined" ? performance.now() : Date.now();

    if (this.ping) {
      const probe = await this.ping();
      const end = typeof performance !== "undefined" ? performance.now() : Date.now();
      return {
        ok: probe.ok,
        provider: "default",
        latencyMs: Math.max(0, Math.round(end - start)),
        message: probe.message ?? (probe.ok ? "probe ok" : "probe falhou"),
        realSearchAvailable: false,
        realIndexingAvailable: false,
      };
    }

    const storeHealth = this.store.health();
    const [orchestratorHealth, storageManagerRuntimeHealth] = await Promise.all([
      this.enterpriseDeps.getOrchestratorPort().health(),
      this.enterpriseDeps.getStorageManagerRuntimePort().health(),
    ]);
    const end = typeof performance !== "undefined" ? performance.now() : Date.now();
    const ok = storeHealth.ok && orchestratorHealth.ok && storageManagerRuntimeHealth.ok;

    return {
      ok,
      provider: "default",
      latencyMs: Math.max(0, Math.round(end - start)),
      enterpriseOrchestratorOk: orchestratorHealth.ok,
      storageManagerRuntimeOk: storageManagerRuntimeHealth.ok,
      realSearchAvailable: false,
      realIndexingAvailable: false,
      message: ok
        ? "Document Search Runtime pronto (Orchestrator + Storage Manager Runtime — sem busca real)."
        : "Document Search Runtime degradado — ver Ports Enterprise.",
    };
  }

  async coordinateSearch(input: CoordinateSearchInput): Promise<CoordinateSearchResult> {
    const stamp = nowIso(this.now);
    const runtimeSessionId = this.createSessionId();

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

    const providerReference = resolveStructuralSearchProviderReference(
      input.configuration?.preferredProviderReference ??
        input.reference?.providerReferenceId ??
        "mock-search",
    );

    let session: CanonicalSearchSession = {
      kind: "canonical-search-session",
      runtimeSessionId,
      status: "pending",
      request: input,
      providerReferenceId: providerReference.providerReferenceId,
      createdAt: stamp,
      updatedAt: stamp,
      realSearchExecuted: false,
      realIndexingExecuted: false,
    };
    this.store.setSession(session);

    try {
      session = {
        ...session,
        status: "coordinating",
        updatedAt: nowIso(this.now),
      };
      this.store.setSession(session);

      const orchestrator = this.enterpriseDeps.getOrchestratorPort();
      const channel =
        input.configuration?.channel ?? input.metadata.channel ?? "document-search-runtime";

      const execution = await orchestrator.startExecution({
        correlationId: input.metadata.correlationId,
        tenantRef: input.metadata.tenantRef,
        channel,
        intakeRef: input.metadata.sessionId,
        documentRef: input.identity.documentId,
        tags: ["dip-06", "document-search-runtime", ...(input.metadata.tags ?? [])],
        customAttributes: {
          source: "document-search-runtime-coordination",
          sessionId: input.metadata.sessionId,
          documentId: input.identity.documentId,
          providerReferenceId: providerReference.providerReferenceId,
          captureRuntimeSessionId: input.reference?.captureRuntimeSessionId ?? null,
          ocrRuntimeSessionId: input.reference?.ocrRuntimeSessionId ?? null,
          classificationRuntimeSessionId: input.reference?.classificationRuntimeSessionId ?? null,
          storageManagerRuntimeSessionId: input.reference?.storageManagerRuntimeSessionId ?? null,
          realSearchExecuted: false,
          realIndexingExecuted: false,
          ...(input.metadata.customAttributes ?? {}),
        },
        structuralNotes:
          input.structuralNotes ??
          "DIP-06: Search coordinated structurally via Document Search Runtime (no real search / no indexing).",
      });

      if (!execution.ok) {
        session = {
          ...session,
          status: "failed",
          executionId: execution.context?.executionId,
          updatedAt: nowIso(this.now),
          message: execution.message ?? "Orchestrator startExecution falhou.",
          code: execution.code ?? "ORCHESTRATOR_FAILED",
          errors: [execution.message ?? "ORCHESTRATOR_FAILED"],
          realSearchExecuted: false,
          realIndexingExecuted: false,
        };
        this.store.setSession(session);
        return {
          kind: "canonical-search-result",
          ok: false,
          runtimeSessionId,
          session,
          executionId: execution.context?.executionId,
          providerReferenceId: providerReference.providerReferenceId,
          message: session.message,
          code: session.code,
          realSearchExecuted: false,
          realIndexingExecuted: false,
        };
      }

      // Hop estrutural Storage Manager Runtime — health/capabilities apenas.
      // PROIBIDO: busca / indexação / vetores / embeddings / RAG / IA / HTTP nesta sprint.
      const storageManagerRuntime = this.enterpriseDeps.getStorageManagerRuntimePort();
      const storageCaps = storageManagerRuntime.capabilities();
      const storageHealth = await storageManagerRuntime.health();

      if (!storageHealth.ok) {
        session = {
          ...session,
          status: "failed",
          executionId: execution.context?.executionId,
          searchProviderAdapterId: STRUCTURAL_SEARCH_PROVIDER_ADAPTER_ID,
          updatedAt: nowIso(this.now),
          message: storageHealth.message ?? "Storage Manager Runtime health falhou.",
          code: "STORAGE_MANAGER_RUNTIME_UNHEALTHY",
          errors: [storageHealth.message ?? "STORAGE_MANAGER_RUNTIME_UNHEALTHY"],
          realSearchExecuted: false,
          realIndexingExecuted: false,
        };
        this.store.setSession(session);
        return {
          kind: "canonical-search-result",
          ok: false,
          runtimeSessionId,
          session,
          executionId: execution.context?.executionId,
          providerReferenceId: providerReference.providerReferenceId,
          message: session.message,
          code: session.code,
          realSearchExecuted: false,
          realIndexingExecuted: false,
        };
      }

      // Search Provider Adapter — referência estrutural apenas (health/capabilities simbólicos).
      // PROIBIDO: query / index / search / vector / embedding / RAG / HTTP / credenciais nesta sprint.
      // Storage Manager Runtime capabilities consultadas estruturalmente (implementsRealStorage permanece false).

      session = {
        ...session,
        status: "coordinated",
        executionId: execution.context?.executionId,
        searchProviderAdapterId: STRUCTURAL_SEARCH_PROVIDER_ADAPTER_ID,
        updatedAt: nowIso(this.now),
        message:
          "Search coordinated structurally via Document Search Runtime " +
          `(Orchestrator + Storage Manager Runtime adapter=${storageCaps.adapterId} + ` +
          "Search Provider Adapter reference — no real search / no indexing).",
        code: "COORDINATED",
        realSearchExecuted: false,
        realIndexingExecuted: false,
      };
      this.store.setSession(session);

      return {
        kind: "canonical-search-result",
        ok: true,
        runtimeSessionId,
        session,
        executionId: execution.context?.executionId,
        providerReferenceId: providerReference.providerReferenceId,
        message: session.message,
        code: session.code,
        realSearchExecuted: false,
        realIndexingExecuted: false,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      session = {
        ...session,
        status: "failed",
        updatedAt: nowIso(this.now),
        message,
        code: "RUNTIME_BRIDGE_ERROR",
        errors: [message],
        realSearchExecuted: false,
        realIndexingExecuted: false,
      };
      this.store.setSession(session);
      return {
        kind: "canonical-search-result",
        ok: false,
        runtimeSessionId,
        session,
        message,
        code: "RUNTIME_BRIDGE_ERROR",
        realSearchExecuted: false,
        realIndexingExecuted: false,
      };
    }
  }

  async getSession(
    input: GetDocumentSearchRuntimeSessionInput,
  ): Promise<GetDocumentSearchRuntimeSessionResult> {
    const session = this.store.getSession(input.runtimeSessionId);
    if (!session) {
      return { ok: false, message: "not found", code: "not_found" };
    }
    return { ok: true, session };
  }

  async listSessions(
    input: ListDocumentSearchRuntimeSessionsInput = {},
  ): Promise<ListDocumentSearchRuntimeSessionsResult> {
    const sessions = this.store.listSessions().filter((session) => matchesList(session, input));
    return { ok: true, sessions };
  }

  async listProviderReferences(): Promise<ListSearchProviderReferencesResult> {
    return { ok: true, references: STRUCTURAL_SEARCH_PROVIDER_REFERENCES };
  }
}

function matchesList(
  session: CanonicalSearchSession,
  input: ListDocumentSearchRuntimeSessionsInput,
): boolean {
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
}
