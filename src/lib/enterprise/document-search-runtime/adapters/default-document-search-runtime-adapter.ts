/**
 * DefaultDocumentSearchRuntimeAdapter — DIP-06 / SEARCH-01.
 *
 * Utiliza exclusivamente Ports Enterprise injetados:
 *   Canonical Execution Orchestrator → Storage Manager Runtime
 *   → SearchProviderPort → DefaultSearchProviderAdapter
 *   → StorageProviderPort → Backend oficial
 *
 * Busca real exclusivamente via SearchProviderPort.search().
 * NÃO integra Elastic/OpenSearch/Azure Search/Supabase/S3/FS diretamente.
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
  RuntimeSearchInput,
  RuntimeSearchResult,
} from "../ports/types";
import {
  STRUCTURAL_SEARCH_PROVIDER_REFERENCES,
  resolveStructuralSearchProviderReference,
} from "../ports/types";
import { InMemoryDocumentSearchRuntimeStore, type DocumentSearchRuntimeStore } from "../store";

export const DEFAULT_DOCUMENT_SEARCH_RUNTIME_ADAPTER_ID = "default-enterprise-bridge";

/** @deprecated SEARCH-01 — prefer adapterId do SearchProviderPort. */
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
    supportsSearch: true,
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
    usesSearchProviderAdapter: true,
    supportsKeywordSearch: true,
    supportsMetadataSearch: true,
    supportsFullTextSearch: false,
    supportsSemanticSearch: false,
    supportsVectorSearch: false,
    supportsBatchSearch: false,
    supportsRanking: true,
    supportsFacetedSearch: false,
    implementsRealSearch: true,
    implementsIndexing: true,
    implementsVectorSearch: false,
    implementsEmbeddings: false,
    implementsRAG: false,
    implementsAI: false,
    implementsExternalProviderCall: false,
  };
}

function toProviderReferenceId(
  providerId: string,
): ReturnType<typeof resolveStructuralSearchProviderReference>["providerReferenceId"] {
  if (providerId === "mock" || providerId === "test") return "mock-search";
  return "mock-search";
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
          "(Orchestrator + StorageManagerRuntimePort + SearchProviderPort). " +
          "Implementação paralela é proibida.",
      );
    }
    if (typeof options.enterpriseDeps.getSearchProviderPort !== "function") {
      throw new Error(
        "DefaultDocumentSearchRuntimeAdapter exige " + "enterpriseDeps.getSearchProviderPort().",
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
        realSearchAvailable: probe.ok,
        realIndexingAvailable: probe.ok,
      };
    }

    const storeHealth = this.store.health();
    const [orchestratorHealth, storageManagerRuntimeHealth, searchProviderHealth] =
      await Promise.all([
        this.enterpriseDeps.getOrchestratorPort().health(),
        this.enterpriseDeps.getStorageManagerRuntimePort().health(),
        this.enterpriseDeps.getSearchProviderPort().health(),
      ]);
    const end = typeof performance !== "undefined" ? performance.now() : Date.now();
    const ok =
      storeHealth.ok &&
      orchestratorHealth.ok &&
      storageManagerRuntimeHealth.ok &&
      searchProviderHealth.ok;

    return {
      ok,
      provider: "default",
      latencyMs: Math.max(0, Math.round(end - start)),
      enterpriseOrchestratorOk: orchestratorHealth.ok,
      storageManagerRuntimeOk: storageManagerRuntimeHealth.ok,
      searchProviderAdapterOk: searchProviderHealth.ok,
      realSearchAvailable: searchProviderHealth.ok,
      realIndexingAvailable: searchProviderHealth.ok,
      message: ok
        ? "Document Search Runtime pronto (Orchestrator + Storage Manager Runtime + SearchProviderPort)."
        : "Document Search Runtime degradado — ver Ports Enterprise.",
    };
  }

  async coordinateSearch(input: CoordinateSearchInput): Promise<CoordinateSearchResult> {
    const stamp = nowIso(this.now);
    const runtimeSessionId = this.createSessionId();
    const searchProvider = this.enterpriseDeps.getSearchProviderPort();
    const providerCaps = searchProvider.capabilities();

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
        toProviderReferenceId(searchProvider.providerId),
    );

    let session: CanonicalSearchSession = {
      kind: "canonical-search-session",
      runtimeSessionId,
      status: "pending",
      request: input,
      providerReferenceId: providerReference.providerReferenceId,
      searchProviderAdapterId: providerCaps.adapterId,
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
        tags: ["dip-06", "search-01", "document-search-runtime", ...(input.metadata.tags ?? [])],
        customAttributes: {
          source: "document-search-runtime-coordination",
          sessionId: input.metadata.sessionId,
          documentId: input.identity.documentId,
          providerReferenceId: providerReference.providerReferenceId,
          searchProviderId: searchProvider.providerId,
          searchProviderAdapterId: providerCaps.adapterId,
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
          "SEARCH-01: Search coordinated via Document Search Runtime (execution via search()).",
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

      const storageManagerRuntime = this.enterpriseDeps.getStorageManagerRuntimePort();
      const storageCaps = storageManagerRuntime.capabilities();
      const storageHealth = await storageManagerRuntime.health();

      if (!storageHealth.ok) {
        session = {
          ...session,
          status: "failed",
          executionId: execution.context?.executionId,
          searchProviderAdapterId: providerCaps.adapterId,
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

      const providerHealth = await searchProvider.health();
      if (!providerHealth.ok) {
        session = {
          ...session,
          status: "failed",
          executionId: execution.context?.executionId,
          searchProviderAdapterId: providerCaps.adapterId,
          updatedAt: nowIso(this.now),
          message: providerHealth.message ?? "SearchProviderPort health falhou.",
          code: "SEARCH_PROVIDER_UNHEALTHY",
          errors: [providerHealth.message ?? "SEARCH_PROVIDER_UNHEALTHY"],
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

      session = {
        ...session,
        status: "coordinated",
        executionId: execution.context?.executionId,
        searchProviderAdapterId: providerCaps.adapterId,
        updatedAt: nowIso(this.now),
        message:
          "Search coordinated via Document Search Runtime " +
          `(Orchestrator + Storage Manager Runtime adapter=${storageCaps.adapterId} + ` +
          `Search Provider adapter=${providerCaps.adapterId} — execution via search()).`,
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

  async search(input: RuntimeSearchInput): Promise<RuntimeSearchResult> {
    const stamp = nowIso(this.now);
    const runtimeSessionId = this.createSessionId();
    const searchProvider = this.enterpriseDeps.getSearchProviderPort();
    const providerCaps = searchProvider.capabilities();
    const providerReferenceId = toProviderReferenceId(searchProvider.providerId);
    const documentId = input.documentId ?? "unknown";
    const sessionId = input.metadata?.sessionId ?? runtimeSessionId;

    let session: CanonicalSearchSession = {
      kind: "canonical-search-session",
      runtimeSessionId,
      status: "pending",
      request: {
        kind: "canonical-search-request",
        identity: {
          kind: "canonical-search-identity",
          documentId,
          documentKind: input.documentKind ?? "capture-document",
        },
        metadata: {
          kind: "canonical-search-metadata",
          sessionId,
          tenantRef: input.tenantRef ?? input.metadata?.tenantRef,
          correlationId: input.metadata?.correlationId,
          channel: "document-search-runtime-search",
          tags: ["search-01", "document-search-runtime", "search"],
          patientId: input.patientId ?? input.metadata?.patientId,
          competencia: input.competencia ?? input.metadata?.competencia,
        },
        reference: {
          kind: "canonical-search-reference",
          storageKey: input.storageKey,
          storageContainer: input.storageContainer,
          providerReferenceId,
        },
        configuration: {
          kind: "canonical-search-configuration",
          preferredProviderReference: providerReferenceId,
          queryHint: input.query,
          channel: "document-search-runtime-search",
          notes: "SEARCH-01: search via SearchProviderPort (storage-backed).",
        },
        structuralNotes: "SEARCH-01: Document Search Runtime search → SearchProviderPort.search().",
      },
      providerReferenceId,
      searchProviderAdapterId: providerCaps.adapterId,
      createdAt: stamp,
      updatedAt: stamp,
      realSearchExecuted: false,
      realIndexingExecuted: false,
    };
    this.store.setSession(session);

    try {
      session = { ...session, status: "coordinating", updatedAt: nowIso(this.now) };
      this.store.setSession(session);

      try {
        const orchestrator = this.enterpriseDeps.getOrchestratorPort();
        const execution = await orchestrator.startExecution({
          correlationId: input.metadata?.correlationId,
          tenantRef: input.tenantRef ?? input.metadata?.tenantRef,
          channel: "document-search-runtime-search",
          intakeRef: sessionId,
          documentRef: documentId,
          tags: ["search-01", "document-search-runtime", "search"],
          customAttributes: {
            source: "document-search-runtime-search",
            requestId: input.requestId ?? null,
            providerId: searchProvider.providerId,
            adapterId: providerCaps.adapterId,
            mode: input.mode,
          },
          structuralNotes: "SEARCH-01: Search execution coordinated via Runtime → ProviderPort.",
        });
        if (execution.ok) {
          session = {
            ...session,
            executionId: execution.context?.executionId,
            updatedAt: nowIso(this.now),
          };
          this.store.setSession(session);
        }
      } catch {
        // Orchestrator best-effort — SearchProviderPort permanece obrigatório.
      }

      const providerResult = await searchProvider.search(input);

      session = {
        ...session,
        status: providerResult.ok ? "coordinated" : "failed",
        updatedAt: nowIso(this.now),
        message: providerResult.message,
        code: providerResult.code ?? (providerResult.ok ? "SEARCHED" : "SEARCH_FAILED"),
        documents: providerResult.documents,
        realSearchExecuted: providerResult.realSearchExecuted,
        realIndexingExecuted: false,
        errors: providerResult.ok
          ? undefined
          : [providerResult.message ?? providerResult.code ?? "SEARCH_FAILED"],
      };
      this.store.setSession(session);

      return {
        ...providerResult,
        runtimeSessionId,
        session,
        executionId: session.executionId,
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
        requestId: input.requestId,
        documents: [],
        totalCount: 0,
        metadata: input.metadata,
        message,
        code: "RUNTIME_BRIDGE_ERROR",
        realSearchExecuted: false,
        provider: searchProvider.providerId,
        telemetry: {
          latencyMs: 0,
          attempts: 0,
          cancelled: false,
          mode: input.mode,
          hitCount: 0,
        },
        runtimeSessionId,
        session,
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
