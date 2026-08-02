/**
 * MockStorageManagerRuntimeAdapter — DIP-05.
 *
 * Voltado para testes e homologação.
 * Quando enterpriseDeps estão presentes, usa Orchestrator + Classification Runtime
 * (mesma cadeia do default). Sem deps, opera somente no store in-memory
 * para isolamento de contrato — sem armazenamento real e sem implementação paralela.
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
  StorageManagerRuntimeProviderId,
} from "../ports/types";
import { STRUCTURAL_STORAGE_PROVIDER_REFERENCES } from "../ports/types";
import { InMemoryStorageManagerRuntimeStore, type StorageManagerRuntimeStore } from "../store";
import {
  DefaultStorageManagerRuntimeAdapter,
  STRUCTURAL_STORAGE_PROVIDER_ADAPTER_ID,
} from "./default-storage-manager-runtime-adapter";

export const MOCK_STORAGE_MANAGER_RUNTIME_ADAPTER_ID = "mock-in-memory";

export type MockStorageManagerRuntimeAdapterOptions = {
  provider?: Extract<StorageManagerRuntimeProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: StorageManagerRuntimeStore;
  enterpriseDeps?: StorageManagerRuntimeEnterpriseDeps;
  createSessionId?: () => string;
  now?: () => string;
};

export class MockStorageManagerRuntimeAdapter implements StorageManagerRuntimePort {
  readonly providerId: Extract<StorageManagerRuntimeProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly store: StorageManagerRuntimeStore;
  private readonly createSessionId: () => string;
  private readonly now?: () => string;
  private readonly delegate: DefaultStorageManagerRuntimeAdapter | undefined;

  constructor(options: MockStorageManagerRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ?? `${this.providerId} storage-manager-runtime ready (no real storage).`;
    this.store = options.store ?? new InMemoryStorageManagerRuntimeStore();
    this.createSessionId = options.createSessionId ?? createStorageManagerRuntimeSessionId;
    this.now = options.now;

    if (options.enterpriseDeps) {
      this.delegate = new DefaultStorageManagerRuntimeAdapter({
        enterpriseDeps: options.enterpriseDeps,
        store: this.store,
        createSessionId: this.createSessionId,
        now: this.now,
        ping: async () => ({ ok: this.healthy, message: this.message }),
      });
    }
  }

  capabilities(): StorageManagerRuntimeCapabilities {
    return {
      provider: this.providerId,
      adapterId: MOCK_STORAGE_MANAGER_RUNTIME_ADAPTER_ID,
      supportsCoordinateStorage: true,
      supportsGetSession: true,
      supportsListSessions: true,
      supportsHealth: true,
      supportsCapabilities: true,
      supportsProviderReferences: true,
      usesEnterpriseRuntimePorts: Boolean(this.delegate),
      usesCanonicalExecutionOrchestrator: Boolean(this.delegate),
      usesDocumentClassificationRuntime: Boolean(this.delegate),
      usesOCRRuntime: Boolean(this.delegate),
      usesCaptureEngineRuntime: Boolean(this.delegate),
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

  async health(): Promise<StorageManagerRuntimeHealth> {
    if (this.delegate) {
      const health = await this.delegate.health();
      return {
        ...health,
        provider: this.providerId,
        realStorageAvailable: false,
        realUploadAvailable: false,
      };
    }
    return {
      ok: this.healthy,
      provider: this.providerId,
      message: this.message,
      realStorageAvailable: false,
      realUploadAvailable: false,
    };
  }

  async coordinateStorage(input: CoordinateStorageInput): Promise<CoordinateStorageResult> {
    if (this.delegate) {
      return this.delegate.coordinateStorage(input);
    }

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

    const stamp = this.now?.() ?? new Date().toISOString();
    const runtimeSessionId = this.createSessionId();
    const session: CanonicalStorageSession = {
      kind: "canonical-storage-session",
      runtimeSessionId,
      status: "coordinated",
      request: input,
      executionId: `mock-exec-${runtimeSessionId}`,
      providerReferenceId: "mock-storage",
      storageProviderAdapterId: STRUCTURAL_STORAGE_PROVIDER_ADAPTER_ID,
      createdAt: stamp,
      updatedAt: stamp,
      message: "Mock storage coordinated (store-only; no Enterprise Ports; no real storage).",
      code: "MOCK_COORDINATED",
      realStorageExecuted: false,
      realUploadExecuted: false,
    };
    this.store.setSession(session);
    return {
      kind: "canonical-storage-result",
      ok: true,
      runtimeSessionId,
      session,
      executionId: session.executionId,
      providerReferenceId: "mock-storage",
      message: session.message,
      code: session.code,
      realStorageExecuted: false,
      realUploadExecuted: false,
    };
  }

  async getSession(
    input: GetStorageManagerRuntimeSessionInput,
  ): Promise<GetStorageManagerRuntimeSessionResult> {
    if (this.delegate) return this.delegate.getSession(input);
    const session = this.store.getSession(input.runtimeSessionId);
    if (!session) return { ok: false, message: "not found", code: "not_found" };
    return { ok: true, session };
  }

  async listSessions(
    input: ListStorageManagerRuntimeSessionsInput = {},
  ): Promise<ListStorageManagerRuntimeSessionsResult> {
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
      return true;
    });
    return { ok: true, sessions };
  }

  async listProviderReferences(): Promise<ListStorageProviderReferencesResult> {
    if (this.delegate) return this.delegate.listProviderReferences();
    return { ok: true, references: STRUCTURAL_STORAGE_PROVIDER_REFERENCES };
  }
}
