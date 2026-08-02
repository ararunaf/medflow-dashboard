/**
 * Tipos vendor-agnósticos do Storage Manager Runtime — DIP-05.
 *
 * Arquitetura obrigatória:
 *   Produto → Enterprise Runtime → Capture Engine Runtime
 *     → OCR Runtime → Document Classification Runtime
 *     → StorageManagerRuntimePort
 *     → Canonical Execution Orchestrator
 *     → Storage Provider Adapter (referência estrutural)
 *     → Provider futuro
 *
 * Este componente NÃO armazena arquivos. NÃO faz upload/download.
 * NÃO integra Supabase/Azure/AWS/GCS/SharePoint/NAS.
 * Coordena estruturalmente via Ports oficiais.
 */
import type { CanonicalExecutionOrchestratorPort } from "../../canonical-execution-orchestrator/ports/canonical-execution-orchestrator-port";
import type { DocumentClassificationRuntimePort } from "../../document-classification-runtime/ports/document-classification-runtime-port";
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
  realStorageAvailable: false;
  realUploadAvailable: false;
};

/**
 * Capacidades declaradas pelo adapter (Port level).
 * Capacidades tecnológicas de storage permanecem FALSE — nenhuma é executada.
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
  /** Capacidades tecnológicas — informativas / FALSE (DIP-05). */
  supportsVersioning: false;
  supportsRetentionPolicy: false;
  supportsEncryption: false;
  supportsCompression: false;
  supportsDeduplication: false;
  supportsCloudStorage: false;
  supportsLocalStorage: false;
  supportsImmutableStorage: false;
  implementsRealStorage: false;
  implementsUpload: false;
  implementsDownload: false;
  implementsVersioning: false;
  implementsRetention: false;
  implementsPhysicalFileWrite: false;
  implementsExternalProviderCall: false;
};

/**
 * Dependências Enterprise injetadas no adapter default.
 * Evita implementação paralela e ciclo de import com o composition root.
 */
export type StorageManagerRuntimeEnterpriseDeps = {
  getOrchestratorPort(): CanonicalExecutionOrchestratorPort;
  /**
   * Document Classification Runtime (DIP-04) — hop anterior na cadeia estrutural.
   * NUNCA invocar classificação real; apenas health / sessão estrutural.
   */
  getDocumentClassificationRuntimePort(): DocumentClassificationRuntimePort;
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

/** Alias tipado da operação principal (coordenação estrutural — sem armazenamento real). */
export type CoordinateStorageInput = CanonicalStorageRequest;
export type CoordinateStorageResult = CanonicalStorageResult;

/** Opções de resolução do StorageManagerRuntimePort. */
export type StorageManagerRuntimeProviderOptions = {
  provider?: StorageManagerRuntimeProviderId;
  /**
   * Ports Enterprise injetados (obrigatório para provider `default` em produção).
   * Mock/test podem omitir e operar só com store — ou receber mocks.
   */
  enterpriseDeps?: StorageManagerRuntimeEnterpriseDeps;
};

/** Catálogo estrutural de Storage Providers futuros (sem conexão). */
export const STRUCTURAL_STORAGE_PROVIDER_REFERENCES: readonly CanonicalStorageProviderReference[] =
  [
    {
      kind: "canonical-storage-provider-reference",
      providerReferenceId: "supabase-storage",
      displayName: "Supabase Storage",
      vendor: "Supabase",
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
      status: "structural-reference-only",
      implementsRealStorage: false,
      implementsUpload: false,
      implementsDownload: false,
      implementsVersioning: false,
      implementsRetention: false,
      connected: false,
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
