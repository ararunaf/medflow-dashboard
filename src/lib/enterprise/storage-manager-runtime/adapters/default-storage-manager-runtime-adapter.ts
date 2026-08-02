/**
 * DefaultStorageManagerRuntimeAdapter — adapter default (DIP-05).
 *
 * Utiliza exclusivamente Ports Enterprise injetados:
 *   Canonical Execution Orchestrator → Document Classification Runtime (hop anterior)
 *   → Storage Provider Adapter (referência estrutural apenas)
 *
 * NÃO armazena arquivos. NÃO faz upload/download.
 * NÃO integra Supabase/Azure/AWS/GCS/SharePoint/NAS.
 * NÃO implementa versionamento funcional nem retenção automática.
 * NÃO conecta Storage Providers externos.
 */
import { createStorageManagerRuntimeSessionId } from "../ports/identity";
import type { StorageManagerRuntimePort } from "../ports/storage-manager-runtime-port";
import type { CanonicalStorageSession } from "../ports/models";
import type {
  CoordinateStorageInput,
  CoordinateStorageResult,
  GetStorageManagerRuntimeSessionInput,
  GetStorageManagerRuntimeSessionResult,
  ListStorageManagerRuntimeSessionsInput,
  ListStorageManagerRuntimeSessionsResult,
  ListStorageProviderReferencesResult,
  StorageManagerRuntimeCapabilities,
  StorageManagerRuntimeEnterpriseDeps,
  StorageManagerRuntimeHealth,
} from "../ports/types";
import {
  STRUCTURAL_STORAGE_PROVIDER_REFERENCES,
  resolveStructuralStorageProviderReference,
} from "../ports/types";
import { InMemoryStorageManagerRuntimeStore, type StorageManagerRuntimeStore } from "../store";

export const DEFAULT_STORAGE_MANAGER_RUNTIME_ADAPTER_ID = "default-enterprise-bridge";

/** Referência estrutural ao Storage Provider Adapter (sem Port de execução). */
export const STRUCTURAL_STORAGE_PROVIDER_ADAPTER_ID = "structural-storage-provider-adapter";

export type DefaultStorageManagerRuntimeAdapterOptions = {
  /** Ports Enterprise obrigatórios — sem implementação paralela. */
  enterpriseDeps: StorageManagerRuntimeEnterpriseDeps;
  store?: StorageManagerRuntimeStore;
  ping?: () => Promise<{ ok: boolean; message?: string }>;
  createSessionId?: () => string;
  now?: () => string;
};

function nowIso(now?: () => string): string {
  return now?.() ?? new Date().toISOString();
}

function foundationCapabilities(): StorageManagerRuntimeCapabilities {
  return {
    provider: "default",
    adapterId: DEFAULT_STORAGE_MANAGER_RUNTIME_ADAPTER_ID,
    supportsCoordinateStorage: true,
    supportsGetSession: true,
    supportsListSessions: true,
    supportsHealth: true,
    supportsCapabilities: true,
    supportsProviderReferences: true,
    usesEnterpriseRuntimePorts: true,
    usesCanonicalExecutionOrchestrator: true,
    usesDocumentClassificationRuntime: true,
    usesOCRRuntime: true,
    usesCaptureEngineRuntime: true,
    supportsVersioning: false,
    supportsRetentionPolicy: false,
    supportsEncryption: false,
    supportsCompression: false,
    supportsDeduplication: false,
    supportsCloudStorage: false,
    supportsLocalStorage: false,
    supportsImmutableStorage: false,
    implementsRealStorage: false,
    implementsUpload: false,
    implementsDownload: false,
    implementsVersioning: false,
    implementsRetention: false,
    implementsPhysicalFileWrite: false,
    implementsExternalProviderCall: false,
  };
}

export class DefaultStorageManagerRuntimeAdapter implements StorageManagerRuntimePort {
  readonly providerId = "default" as const;

  private readonly enterpriseDeps: StorageManagerRuntimeEnterpriseDeps;
  private readonly store: StorageManagerRuntimeStore;
  private readonly ping?: () => Promise<{ ok: boolean; message?: string }>;
  private readonly createSessionId: () => string;
  private readonly now?: () => string;

  constructor(options: DefaultStorageManagerRuntimeAdapterOptions) {
    if (!options.enterpriseDeps) {
      throw new Error(
        "DefaultStorageManagerRuntimeAdapter exige enterpriseDeps " +
          "(Orchestrator + DocumentClassificationRuntimePort). Implementação paralela é proibida.",
      );
    }
    this.enterpriseDeps = options.enterpriseDeps;
    this.store = options.store ?? new InMemoryStorageManagerRuntimeStore();
    this.ping = options.ping;
    this.createSessionId = options.createSessionId ?? createStorageManagerRuntimeSessionId;
    this.now = options.now;
  }

  capabilities(): StorageManagerRuntimeCapabilities {
    return foundationCapabilities();
  }

  async health(): Promise<StorageManagerRuntimeHealth> {
    const start = typeof performance !== "undefined" ? performance.now() : Date.now();

    if (this.ping) {
      const probe = await this.ping();
      const end = typeof performance !== "undefined" ? performance.now() : Date.now();
      return {
        ok: probe.ok,
        provider: "default",
        latencyMs: Math.max(0, Math.round(end - start)),
        message: probe.message ?? (probe.ok ? "probe ok" : "probe falhou"),
        realStorageAvailable: false,
        realUploadAvailable: false,
      };
    }

    const storeHealth = this.store.health();
    const [orchestratorHealth, classificationRuntimeHealth] = await Promise.all([
      this.enterpriseDeps.getOrchestratorPort().health(),
      this.enterpriseDeps.getDocumentClassificationRuntimePort().health(),
    ]);
    const end = typeof performance !== "undefined" ? performance.now() : Date.now();
    const ok = storeHealth.ok && orchestratorHealth.ok && classificationRuntimeHealth.ok;

    return {
      ok,
      provider: "default",
      latencyMs: Math.max(0, Math.round(end - start)),
      enterpriseOrchestratorOk: orchestratorHealth.ok,
      documentClassificationRuntimeOk: classificationRuntimeHealth.ok,
      realStorageAvailable: false,
      realUploadAvailable: false,
      message: ok
        ? "Storage Manager Runtime pronto (Orchestrator + Classification Runtime — sem armazenamento real)."
        : "Storage Manager Runtime degradado — ver Ports Enterprise.",
    };
  }

  async coordinateStorage(input: CoordinateStorageInput): Promise<CoordinateStorageResult> {
    const stamp = nowIso(this.now);
    const runtimeSessionId = this.createSessionId();

    if (!input.identity?.documentId || !input.metadata?.sessionId) {
      return {
        kind: "canonical-storage-result",
        ok: false,
        message: "identity.documentId e metadata.sessionId são obrigatórios.",
        code: "INVALID_INPUT",
        realStorageExecuted: false,
        realUploadExecuted: false,
      };
    }

    const providerReference = resolveStructuralStorageProviderReference(
      input.configuration?.preferredProviderReference ??
        input.reference?.providerReferenceId ??
        "mock-storage",
    );

    let session: CanonicalStorageSession = {
      kind: "canonical-storage-session",
      runtimeSessionId,
      status: "pending",
      request: input,
      providerReferenceId: providerReference.providerReferenceId,
      createdAt: stamp,
      updatedAt: stamp,
      realStorageExecuted: false,
      realUploadExecuted: false,
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
        input.configuration?.channel ?? input.metadata.channel ?? "storage-manager-runtime";

      const execution = await orchestrator.startExecution({
        correlationId: input.metadata.correlationId,
        tenantRef: input.metadata.tenantRef,
        channel,
        intakeRef: input.metadata.sessionId,
        documentRef: input.identity.documentId,
        tags: ["dip-05", "storage-manager-runtime", ...(input.metadata.tags ?? [])],
        customAttributes: {
          source: "storage-manager-runtime-coordination",
          sessionId: input.metadata.sessionId,
          documentId: input.identity.documentId,
          providerReferenceId: providerReference.providerReferenceId,
          captureRuntimeSessionId: input.reference?.captureRuntimeSessionId ?? null,
          ocrRuntimeSessionId: input.reference?.ocrRuntimeSessionId ?? null,
          classificationRuntimeSessionId: input.reference?.classificationRuntimeSessionId ?? null,
          realStorageExecuted: false,
          realUploadExecuted: false,
          ...(input.metadata.customAttributes ?? {}),
        },
        structuralNotes:
          input.structuralNotes ??
          "DIP-05: Storage coordinated structurally via Storage Manager Runtime (no real storage / no upload).",
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
          realStorageExecuted: false,
          realUploadExecuted: false,
        };
        this.store.setSession(session);
        return {
          kind: "canonical-storage-result",
          ok: false,
          runtimeSessionId,
          session,
          executionId: execution.context?.executionId,
          providerReferenceId: providerReference.providerReferenceId,
          message: session.message,
          code: session.code,
          realStorageExecuted: false,
          realUploadExecuted: false,
        };
      }

      // Hop estrutural Classification Runtime — health/capabilities apenas.
      // PROIBIDO: armazenamento / upload / download / versionamento / retenção / I/O nesta sprint.
      const classificationRuntime = this.enterpriseDeps.getDocumentClassificationRuntimePort();
      const classificationCaps = classificationRuntime.capabilities();
      const classificationHealth = await classificationRuntime.health();

      if (!classificationHealth.ok) {
        session = {
          ...session,
          status: "failed",
          executionId: execution.context?.executionId,
          storageProviderAdapterId: STRUCTURAL_STORAGE_PROVIDER_ADAPTER_ID,
          updatedAt: nowIso(this.now),
          message: classificationHealth.message ?? "Document Classification Runtime health falhou.",
          code: "CLASSIFICATION_RUNTIME_UNHEALTHY",
          errors: [classificationHealth.message ?? "CLASSIFICATION_RUNTIME_UNHEALTHY"],
          realStorageExecuted: false,
          realUploadExecuted: false,
        };
        this.store.setSession(session);
        return {
          kind: "canonical-storage-result",
          ok: false,
          runtimeSessionId,
          session,
          executionId: execution.context?.executionId,
          providerReferenceId: providerReference.providerReferenceId,
          message: session.message,
          code: session.code,
          realStorageExecuted: false,
          realUploadExecuted: false,
        };
      }

      // Storage Provider Adapter — referência estrutural apenas (health/capabilities simbólicos).
      // PROIBIDO: put / get / upload / download / signedUrl / HTTP / credenciais / arquivos nesta sprint.
      // Classification Runtime capabilities consultadas estruturalmente (implementsRealClassification permanece false).

      session = {
        ...session,
        status: "coordinated",
        executionId: execution.context?.executionId,
        storageProviderAdapterId: STRUCTURAL_STORAGE_PROVIDER_ADAPTER_ID,
        updatedAt: nowIso(this.now),
        message:
          "Storage coordinated structurally via Storage Manager Runtime " +
          `(Orchestrator + Classification Runtime adapter=${classificationCaps.adapterId} + ` +
          "Storage Provider Adapter reference — no real storage / no upload).",
        code: "COORDINATED",
        realStorageExecuted: false,
        realUploadExecuted: false,
      };
      this.store.setSession(session);

      return {
        kind: "canonical-storage-result",
        ok: true,
        runtimeSessionId,
        session,
        executionId: execution.context?.executionId,
        providerReferenceId: providerReference.providerReferenceId,
        message: session.message,
        code: session.code,
        realStorageExecuted: false,
        realUploadExecuted: false,
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
        realStorageExecuted: false,
        realUploadExecuted: false,
      };
      this.store.setSession(session);
      return {
        kind: "canonical-storage-result",
        ok: false,
        runtimeSessionId,
        session,
        message,
        code: "RUNTIME_BRIDGE_ERROR",
        realStorageExecuted: false,
        realUploadExecuted: false,
      };
    }
  }

  async getSession(
    input: GetStorageManagerRuntimeSessionInput,
  ): Promise<GetStorageManagerRuntimeSessionResult> {
    const session = this.store.getSession(input.runtimeSessionId);
    if (!session) {
      return { ok: false, message: "not found", code: "not_found" };
    }
    return { ok: true, session };
  }

  async listSessions(
    input: ListStorageManagerRuntimeSessionsInput = {},
  ): Promise<ListStorageManagerRuntimeSessionsResult> {
    const sessions = this.store.listSessions().filter((session) => matchesList(session, input));
    return { ok: true, sessions };
  }

  async listProviderReferences(): Promise<ListStorageProviderReferencesResult> {
    return { ok: true, references: STRUCTURAL_STORAGE_PROVIDER_REFERENCES };
  }
}

function matchesList(
  session: CanonicalStorageSession,
  input: ListStorageManagerRuntimeSessionsInput,
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
  return true;
}
