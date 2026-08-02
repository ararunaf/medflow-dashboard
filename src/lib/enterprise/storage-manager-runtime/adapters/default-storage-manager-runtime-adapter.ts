/**
 * DefaultStorageManagerRuntimeAdapter — adapter default (DIP-05 / STORAGE-01).
 *
 * Utiliza exclusivamente Ports Enterprise injetados:
 *   Canonical Execution Orchestrator → Document Classification Runtime
 *   → StorageProviderPort → Storage Provider Adapter → Storage Backend
 *
 * Persistência real exclusivamente via StorageProviderPort.
 * Sem bypass. Sem acesso direto a vendors pelo produto.
 */
import { DEFAULT_STORAGE_PROVIDER_ADAPTER_ID } from "../../storage-provider/adapters/default-storage-provider-adapter";
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
  StorageManagerDeleteInput,
  StorageManagerDownloadInput,
  StorageManagerMetadataInput,
  StorageManagerProviderOperationResult,
  StorageManagerRuntimeCapabilities,
  StorageManagerRuntimeEnterpriseDeps,
  StorageManagerRuntimeHealth,
  StorageManagerUploadInput,
} from "../ports/types";
import {
  STRUCTURAL_STORAGE_PROVIDER_REFERENCES,
  resolveStructuralStorageProviderReference,
} from "../ports/types";
import { InMemoryStorageManagerRuntimeStore, type StorageManagerRuntimeStore } from "../store";

export const DEFAULT_STORAGE_MANAGER_RUNTIME_ADAPTER_ID = "default-enterprise-bridge";

/** Adapter id do Storage Provider oficial (STORAGE-01). */
export const STRUCTURAL_STORAGE_PROVIDER_ADAPTER_ID = DEFAULT_STORAGE_PROVIDER_ADAPTER_ID;

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
    usesStorageProviderPort: true,
    supportsVersioning: false,
    supportsRetentionPolicy: false,
    supportsEncryption: false,
    supportsCompression: false,
    supportsDeduplication: false,
    supportsCloudStorage: true,
    supportsLocalStorage: false,
    supportsImmutableStorage: false,
    implementsRealStorage: true,
    implementsUpload: true,
    implementsDownload: true,
    implementsDelete: true,
    implementsMetadata: true,
    implementsVersioning: false,
    implementsRetention: false,
    implementsPhysicalFileWrite: true,
    implementsExternalProviderCall: true,
  };
}

function decodeBase64(bodyBase64: string): Uint8Array {
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(bodyBase64, "base64"));
  }
  const binary = atob(bodyBase64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
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
          "(Orchestrator + DocumentClassificationRuntimePort + StorageProviderPort). " +
          "Implementação paralela é proibida.",
      );
    }
    if (typeof options.enterpriseDeps.getStorageProviderPort !== "function") {
      throw new Error(
        "DefaultStorageManagerRuntimeAdapter exige enterpriseDeps.getStorageProviderPort().",
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
        realStorageAvailable: true,
        realUploadAvailable: true,
      };
    }

    const storeHealth = this.store.health();
    const [orchestratorHealth, classificationRuntimeHealth, storageProviderHealth] =
      await Promise.all([
        this.enterpriseDeps.getOrchestratorPort().health(),
        this.enterpriseDeps.getDocumentClassificationRuntimePort().health(),
        this.enterpriseDeps.getStorageProviderPort().health(),
      ]);
    const end = typeof performance !== "undefined" ? performance.now() : Date.now();
    const ok =
      storeHealth.ok &&
      orchestratorHealth.ok &&
      classificationRuntimeHealth.ok &&
      storageProviderHealth.ok;

    return {
      ok,
      provider: "default",
      latencyMs: Math.max(0, Math.round(end - start)),
      enterpriseOrchestratorOk: orchestratorHealth.ok,
      documentClassificationRuntimeOk: classificationRuntimeHealth.ok,
      storageProviderOk: storageProviderHealth.ok,
      realStorageAvailable: true,
      realUploadAvailable: true,
      message: ok
        ? "Storage Manager Runtime pronto (Orchestrator + Classification Runtime + StorageProviderPort)."
        : "Storage Manager Runtime degradado — ver Ports Enterprise.",
    };
  }

  async upload(input: StorageManagerUploadInput): Promise<StorageManagerProviderOperationResult> {
    return this.enterpriseDeps.getStorageProviderPort().upload(input);
  }

  async download(
    input: StorageManagerDownloadInput,
  ): Promise<StorageManagerProviderOperationResult> {
    return this.enterpriseDeps.getStorageProviderPort().download(input);
  }

  async delete(input: StorageManagerDeleteInput): Promise<StorageManagerProviderOperationResult> {
    return this.enterpriseDeps.getStorageProviderPort().delete(input);
  }

  async metadata(
    input: StorageManagerMetadataInput,
  ): Promise<StorageManagerProviderOperationResult> {
    return this.enterpriseDeps.getStorageProviderPort().metadata(input);
  }

  async coordinateStorage(input: CoordinateStorageInput): Promise<CoordinateStorageResult> {
    const stamp = nowIso(this.now);
    const runtimeSessionId = this.createSessionId();

    if (!input.identity?.documentId || !input.metadata?.sessionId) {
      return {
        kind: "canonical-storage-result",
        ok: false,
        operation: "coordinate",
        message: "identity.documentId e metadata.sessionId são obrigatórios.",
        code: "INVALID_INPUT",
        realStorageExecuted: false,
        realUploadExecuted: false,
      };
    }

    const providerReference = resolveStructuralStorageProviderReference(
      input.configuration?.preferredProviderReference ??
        input.reference?.providerReferenceId ??
        "supabase-storage",
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
        tags: ["dip-05", "storage-01", "storage-manager-runtime", ...(input.metadata.tags ?? [])],
        customAttributes: {
          source: "storage-manager-runtime-coordination",
          sessionId: input.metadata.sessionId,
          documentId: input.identity.documentId,
          providerReferenceId: providerReference.providerReferenceId,
          captureRuntimeSessionId: input.reference?.captureRuntimeSessionId ?? null,
          ocrRuntimeSessionId: input.reference?.ocrRuntimeSessionId ?? null,
          classificationRuntimeSessionId: input.reference?.classificationRuntimeSessionId ?? null,
          ...(input.metadata.customAttributes ?? {}),
        },
        structuralNotes:
          input.structuralNotes ??
          "STORAGE-01: Storage coordinated via Storage Manager Runtime → StorageProviderPort.",
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
          operation: "coordinate",
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
          operation: "coordinate",
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

      const storageProvider = this.enterpriseDeps.getStorageProviderPort();
      const providerCaps = storageProvider.capabilities();
      const providerHealth = await storageProvider.health();

      if (!providerHealth.ok) {
        session = {
          ...session,
          status: "failed",
          executionId: execution.context?.executionId,
          storageProviderAdapterId: providerCaps.adapterId,
          updatedAt: nowIso(this.now),
          message: providerHealth.message ?? "Storage Provider health falhou.",
          code: "STORAGE_PROVIDER_UNHEALTHY",
          errors: [providerHealth.message ?? "STORAGE_PROVIDER_UNHEALTHY"],
          realStorageExecuted: false,
          realUploadExecuted: false,
        };
        this.store.setSession(session);
        return {
          kind: "canonical-storage-result",
          ok: false,
          operation: "coordinate",
          runtimeSessionId,
          session,
          executionId: execution.context?.executionId,
          providerReferenceId: providerReference.providerReferenceId,
          providerId: storageProvider.providerId,
          message: session.message,
          code: session.code,
          realStorageExecuted: false,
          realUploadExecuted: false,
        };
      }

      let realUploadExecuted = false;
      let realStorageExecuted = false;
      let storedDocument = undefined as CoordinateStorageResult["storedDocument"];
      let operationResultMessage: string | undefined;

      // Upload opcional durante coordinate quando executeUpload + body/key presentes.
      if (input.configuration?.executeUpload && input.reference?.storageKey) {
        const body = input.configuration.bodyBase64
          ? decodeBase64(input.configuration.bodyBase64)
          : new TextEncoder().encode(
              JSON.stringify({
                documentId: input.identity.documentId,
                sessionId: input.metadata.sessionId,
                coordinatedAt: nowIso(this.now),
              }),
            );
        const uploadResult = await storageProvider.upload({
          key: input.reference.storageKey,
          body,
          contentType: input.configuration.contentTypeHint ?? "application/octet-stream",
          container: input.reference.storageContainer,
          documentId: input.identity.documentId,
          sessionId: input.metadata.sessionId,
          tenantRef: input.metadata.tenantRef,
          correlationId: input.metadata.correlationId,
        });
        realStorageExecuted = uploadResult.realStorageExecuted;
        realUploadExecuted = uploadResult.realUploadExecuted;
        storedDocument = uploadResult.storedDocument;
        operationResultMessage = uploadResult.message;
        if (!uploadResult.ok) {
          session = {
            ...session,
            status: "failed",
            executionId: execution.context?.executionId,
            storageProviderAdapterId: providerCaps.adapterId,
            updatedAt: nowIso(this.now),
            message: uploadResult.message ?? "StorageProviderPort.upload falhou.",
            code: uploadResult.code ?? "STORAGE_UPLOAD_FAILED",
            errors: [uploadResult.message ?? "STORAGE_UPLOAD_FAILED"],
            realStorageExecuted,
            realUploadExecuted,
          };
          this.store.setSession(session);
          return {
            kind: "canonical-storage-result",
            ok: false,
            operation: "upload",
            runtimeSessionId,
            session,
            executionId: execution.context?.executionId,
            providerReferenceId: providerReference.providerReferenceId,
            providerId: storageProvider.providerId,
            storedDocument,
            metadata: uploadResult.metadata,
            message: session.message,
            code: session.code,
            realStorageExecuted,
            realUploadExecuted,
            realDownloadExecuted: false,
            realDeleteExecuted: false,
          };
        }
      }

      session = {
        ...session,
        status: "coordinated",
        executionId: execution.context?.executionId,
        storageProviderAdapterId: providerCaps.adapterId,
        storedDocument,
        updatedAt: nowIso(this.now),
        message:
          operationResultMessage ??
          "Storage coordinated via Storage Manager Runtime " +
            `(Orchestrator + Classification Runtime adapter=${classificationCaps.adapterId} + ` +
            `StorageProviderPort adapter=${providerCaps.adapterId}).`,
        code: realUploadExecuted ? "STORAGE_UPLOADED" : "COORDINATED",
        realStorageExecuted,
        realUploadExecuted,
      };
      this.store.setSession(session);

      return {
        kind: "canonical-storage-result",
        ok: true,
        operation: realUploadExecuted ? "upload" : "coordinate",
        runtimeSessionId,
        session,
        executionId: execution.context?.executionId,
        providerReferenceId: providerReference.providerReferenceId,
        providerId: storageProvider.providerId,
        storedDocument,
        metadata: input.metadata,
        message: session.message,
        code: session.code,
        realStorageExecuted,
        realUploadExecuted,
        realDownloadExecuted: false,
        realDeleteExecuted: false,
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
        operation: "coordinate",
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
