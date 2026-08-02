/**
 * Tipos vendor-agnósticos do Storage Manager Runtime — DIP-05 / STORAGE-01.
 *
 * Arquitetura obrigatória:
 *   Produto → Enterprise Runtime → Capture Engine Runtime
 *     → OCR Runtime → Document Classification Runtime
 *     → StorageManagerRuntimePort
 *     → Canonical Execution Orchestrator
 *     → StorageProviderPort
 *     → Storage Provider Adapter
 *     → Storage Backend
 */
import type { CanonicalExecutionOrchestratorPort } from "../../canonical-execution-orchestrator/ports/canonical-execution-orchestrator-port";
import type { DocumentClassificationRuntimePort } from "../../document-classification-runtime/ports/document-classification-runtime-port";
import type { StorageProviderPort } from "../../storage-provider/ports/storage-provider-port";
import type {
  StorageDeleteInput as ProviderDeleteInput,
  StorageDownloadInput as ProviderDownloadInput,
  StorageMetadataInput as ProviderMetadataInput,
  StorageProviderOperationResult,
  StorageUploadInput as ProviderUploadInput,
} from "../../storage-provider/ports/types";
import type {
  CanonicalStorageProviderReference,
  CanonicalStorageProviderReferenceId,
  CanonicalStorageRequest,
  CanonicalStorageResult,
  CanonicalStorageSession,
  StorageManagerRuntimeSessionStatus,
} from "./models";

export type {
  CanonicalStorageCapabilities,
  CanonicalStorageConfiguration,
  CanonicalStorageIdentity,
  CanonicalStorageMetadata,
  CanonicalStorageProviderReference,
  CanonicalStorageProviderReferenceId,
  CanonicalStorageReference,
  CanonicalStorageRequest,
  CanonicalStorageResult,
  CanonicalStorageSession,
  CanonicalStoredDocument,
  StorageManagerRuntimeSessionStatus,
} from "./models";

/** Provedores / mecanismos do Storage Manager Runtime (adapters do Port). */
export type StorageManagerRuntimeProviderId = "default" | "mock" | "test";

/** Resultado de health check. */
export type StorageManagerRuntimeHealth = {
  ok: boolean;
  provider: StorageManagerRuntimeProviderId;
  latencyMs?: number;
  message?: string;
  enterpriseOrchestratorOk?: boolean;
  documentClassificationRuntimeOk?: boolean;
  storageProviderOk?: boolean;
  realStorageAvailable: boolean;
  realUploadAvailable: boolean;
};

/**
 * Capacidades declaradas pelo adapter (Port level).
 * STORAGE-01: upload/download/delete/metadata via StorageProviderPort = TRUE.
 */
export type StorageManagerRuntimeCapabilities = {
  provider: StorageManagerRuntimeProviderId;
  adapterId: string;
  supportsCoordinateStorage: boolean;
  supportsGetSession: boolean;
  supportsListSessions: boolean;
  supportsHealth: boolean;
  supportsCapabilities: boolean;
  supportsProviderReferences: boolean;
  usesEnterpriseRuntimePorts: boolean;
  usesCanonicalExecutionOrchestrator: boolean;
  usesDocumentClassificationRuntime: boolean;
  usesOCRRuntime: boolean;
  usesCaptureEngineRuntime: boolean;
  usesStorageProviderPort: boolean;
  supportsVersioning: boolean;
  supportsRetentionPolicy: boolean;
  supportsEncryption: boolean;
  supportsCompression: boolean;
  supportsDeduplication: boolean;
  supportsCloudStorage: boolean;
  supportsLocalStorage: boolean;
  supportsImmutableStorage: boolean;
  implementsRealStorage: boolean;
  implementsUpload: boolean;
  implementsDownload: boolean;
  implementsDelete: boolean;
  implementsMetadata: boolean;
  implementsVersioning: boolean;
  implementsRetention: boolean;
  implementsPhysicalFileWrite: boolean;
  implementsExternalProviderCall: boolean;
};

/**
 * Dependências Enterprise injetadas no adapter default.
 * Evita implementação paralela e ciclo de import com o composition root.
 */
export type StorageManagerRuntimeEnterpriseDeps = {
  getOrchestratorPort(): CanonicalExecutionOrchestratorPort;
  /**
   * Document Classification Runtime (DIP-04) — hop anterior na cadeia.
   */
  getDocumentClassificationRuntimePort(): DocumentClassificationRuntimePort;
  /**
   * Storage Provider Port (STORAGE-01) — único caminho autorizado de I/O.
   */
  getStorageProviderPort(): StorageProviderPort;
};

export type GetStorageManagerRuntimeSessionInput = {
  runtimeSessionId: string;
};

export type GetStorageManagerRuntimeSessionResult = {
  ok: boolean;
  session?: CanonicalStorageSession;
  message?: string;
  code?: string;
};

export type ListStorageManagerRuntimeSessionsInput = {
  status?: StorageManagerRuntimeSessionStatus;
  documentId?: string;
  sessionId?: string;
  idPrefix?: string;
  captureRuntimeSessionId?: string;
  ocrRuntimeSessionId?: string;
  classificationRuntimeSessionId?: string;
};

export type ListStorageManagerRuntimeSessionsResult = {
  ok: boolean;
  sessions: readonly CanonicalStorageSession[];
  message?: string;
  code?: string;
};

export type ListStorageProviderReferencesResult = {
  ok: boolean;
  references: readonly CanonicalStorageProviderReference[];
};

/** Alias tipado da operação principal. */
export type CoordinateStorageInput = CanonicalStorageRequest;
export type CoordinateStorageResult = CanonicalStorageResult;

/** Operações STORAGE-01 delegadas ao StorageProviderPort. */
export type StorageManagerUploadInput = ProviderUploadInput;
export type StorageManagerDownloadInput = ProviderDownloadInput;
export type StorageManagerDeleteInput = ProviderDeleteInput;
export type StorageManagerMetadataInput = ProviderMetadataInput;
export type StorageManagerProviderOperationResult = StorageProviderOperationResult;

/** Opções de resolução do StorageManagerRuntimePort. */
export type StorageManagerRuntimeProviderOptions = {
  provider?: StorageManagerRuntimeProviderId;
  /**
   * Ports Enterprise injetados (obrigatório para provider `default` em produção).
   * Mock/test podem omitir e operar só com store — ou receber mocks.
   */
  enterpriseDeps?: StorageManagerRuntimeEnterpriseDeps;
};

/** Catálogo de Storage Providers (STORAGE-01: supabase/mock ready). */
export const STRUCTURAL_STORAGE_PROVIDER_REFERENCES: readonly CanonicalStorageProviderReference[] =
  [
    {
      kind: "canonical-storage-provider-reference",
      providerReferenceId: "supabase-storage",
      displayName: "Supabase Storage",
      vendor: "Supabase",
      status: "ready",
      implementsRealStorage: true,
      implementsUpload: true,
      implementsDownload: true,
      implementsVersioning: false,
      implementsRetention: false,
      connected: true,
    },
    {
      kind: "canonical-storage-provider-reference",
      providerReferenceId: "azure-blob",
      displayName: "Azure Blob Storage",
      vendor: "Microsoft Azure",
      status: "structural-reference-only",
      implementsRealStorage: false,
      implementsUpload: false,
      implementsDownload: false,
      implementsVersioning: false,
      implementsRetention: false,
      connected: false,
    },
    {
      kind: "canonical-storage-provider-reference",
      providerReferenceId: "aws-s3",
      displayName: "AWS S3",
      vendor: "Amazon Web Services",
      status: "structural-reference-only",
      implementsRealStorage: false,
      implementsUpload: false,
      implementsDownload: false,
      implementsVersioning: false,
      implementsRetention: false,
      connected: false,
    },
    {
      kind: "canonical-storage-provider-reference",
      providerReferenceId: "google-cloud-storage",
      displayName: "Google Cloud Storage",
      vendor: "Google Cloud",
      status: "structural-reference-only",
      implementsRealStorage: false,
      implementsUpload: false,
      implementsDownload: false,
      implementsVersioning: false,
      implementsRetention: false,
      connected: false,
    },
    {
      kind: "canonical-storage-provider-reference",
      providerReferenceId: "sharepoint",
      displayName: "SharePoint",
      vendor: "Microsoft",
      status: "structural-reference-only",
      implementsRealStorage: false,
      implementsUpload: false,
      implementsDownload: false,
      implementsVersioning: false,
      implementsRetention: false,
      connected: false,
    },
    {
      kind: "canonical-storage-provider-reference",
      providerReferenceId: "nas",
      displayName: "NAS",
      vendor: "Network Attached Storage",
      status: "structural-reference-only",
      implementsRealStorage: false,
      implementsUpload: false,
      implementsDownload: false,
      implementsVersioning: false,
      implementsRetention: false,
      connected: false,
    },
    {
      kind: "canonical-storage-provider-reference",
      providerReferenceId: "local-storage",
      displayName: "Local Storage",
      vendor: "Local Filesystem",
      status: "structural-reference-only",
      implementsRealStorage: false,
      implementsUpload: false,
      implementsDownload: false,
      implementsVersioning: false,
      implementsRetention: false,
      connected: false,
    },
    {
      kind: "canonical-storage-provider-reference",
      providerReferenceId: "mock-storage",
      displayName: "Mock Storage",
      vendor: "MedicFlow Enterprise",
      status: "ready",
      implementsRealStorage: true,
      implementsUpload: true,
      implementsDownload: true,
      implementsVersioning: false,
      implementsRetention: false,
      connected: true,
    },
  ] as const;

export function resolveStructuralStorageProviderReference(
  id?: CanonicalStorageProviderReferenceId,
): CanonicalStorageProviderReference {
  const found = STRUCTURAL_STORAGE_PROVIDER_REFERENCES.find(
    (ref) => ref.providerReferenceId === id,
  );
  return (
    found ??
    STRUCTURAL_STORAGE_PROVIDER_REFERENCES.find(
      (ref) => ref.providerReferenceId === "mock-storage",
    )!
  );
}
