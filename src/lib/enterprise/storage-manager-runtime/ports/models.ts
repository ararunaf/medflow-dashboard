/**
 * Modelos canônicos do Storage Manager Runtime — DIP-05 / STORAGE-01.
 *
 * Modelos canônicos de persistência (STORAGE-01 — sem paralelos):
 *   CanonicalStorageResult
 *   CanonicalStorageMetadata
 *   CanonicalStoredDocument
 *
 * Reexportados do Storage Provider oficial.
 * Sessão / request / referência estrutural permanecem no Runtime.
 */
import type {
  CanonicalStorageMetadata,
  CanonicalStorageResult as StorageProviderCanonicalResult,
  CanonicalStoredDocument,
} from "../../storage-provider/ports/canonical";

export type { CanonicalStorageMetadata, CanonicalStoredDocument };

/** Status estrutural da sessão de storage no Runtime. */
export type StorageManagerRuntimeSessionStatus =
  | "pending"
  | "coordinating"
  | "coordinated"
  | "deferred"
  | "failed"
  | "completed";

/** Identidade canônica do documento no storage (referências opacas). */
export type CanonicalStorageIdentity = {
  kind: "canonical-storage-identity";
  documentId: string;
  documentKind?: string;
  version?: string;
};

/** Referência canônica opaca a artefatos Enterprise / produto / OCR / classificação / captura. */
export type CanonicalStorageReference = {
  kind: "canonical-storage-reference";
  storageKey?: string;
  storageContainer?: string;
  storageProvider?: string;
  metadataId?: string;
  metadataNamespace?: string;
  intakeId?: string;
  executionId?: string;
  captureRuntimeSessionId?: string;
  captureExecutionId?: string;
  /** DIP-03 — referência estrutural à sessão OCR Runtime. */
  ocrRuntimeSessionId?: string;
  ocrExecutionId?: string;
  /** DIP-04 — referência estrutural à sessão Classification Runtime. */
  classificationRuntimeSessionId?: string;
  classificationExecutionId?: string;
  /** Referência ao Storage Provider (STORAGE-01). */
  providerReferenceId?: CanonicalStorageProviderReferenceId;
};

/**
 * Capacidades canônicas tecnológicas do Storage Manager Runtime (modelo de domínio).
 */
export type CanonicalStorageCapabilities = {
  kind: "canonical-storage-capabilities";
  supportsVersioning: boolean;
  supportsRetentionPolicy: boolean;
  supportsEncryption: boolean;
  supportsCompression: boolean;
  supportsDeduplication: boolean;
  supportsCloudStorage: boolean;
  supportsLocalStorage: boolean;
  supportsImmutableStorage: boolean;
  declared?: readonly string[];
};

/** Configuração canônica estrutural do storage. */
export type CanonicalStorageConfiguration = {
  kind: "canonical-storage-configuration";
  preferredProviderReference?: CanonicalStorageProviderReferenceId;
  contentTypeHint?: string;
  channel?: string;
  priority?: "LOW" | "NORMAL" | "HIGH" | (string & {});
  notes?: string;
  /** Quando true, coordinateStorage executa upload via StorageProviderPort. */
  executeUpload?: boolean;
  /** Corpo opcional para upload durante coordinateStorage. */
  bodyBase64?: string;
};

/**
 * Referências a Storage Providers.
 * STORAGE-01: supabase-storage / mock-storage podem executar via StorageProviderPort.
 */
export type CanonicalStorageProviderReferenceId =
  | "supabase-storage"
  | "azure-blob"
  | "aws-s3"
  | "google-cloud-storage"
  | "sharepoint"
  | "nas"
  | "local-storage"
  | "mock-storage";

/** Descritor de um Storage Provider (estrutural ou executável). */
export type CanonicalStorageProviderReference = {
  kind: "canonical-storage-provider-reference";
  providerReferenceId: CanonicalStorageProviderReferenceId;
  displayName: string;
  vendor: string;
  status: "structural-reference-only" | "ready";
  implementsRealStorage: boolean;
  implementsUpload: boolean;
  implementsDownload: boolean;
  implementsVersioning: boolean;
  implementsRetention: boolean;
  connected: boolean;
};

/** Pedido canônico de coordenação de storage via Runtime. */
export type CanonicalStorageRequest = {
  kind: "canonical-storage-request";
  identity: CanonicalStorageIdentity;
  metadata: CanonicalStorageMetadata;
  reference?: CanonicalStorageReference;
  capabilities?: CanonicalStorageCapabilities;
  configuration?: CanonicalStorageConfiguration;
  structuralNotes?: string;
};

/** Sessão canônica de Storage Manager Runtime. */
export type CanonicalStorageSession = {
  kind: "canonical-storage-session";
  runtimeSessionId: string;
  status: StorageManagerRuntimeSessionStatus;
  request: CanonicalStorageRequest;
  executionId?: string;
  providerReferenceId?: CanonicalStorageProviderReferenceId;
  storageProviderAdapterId?: string;
  storedDocument?: CanonicalStoredDocument;
  createdAt: string;
  updatedAt: string;
  message?: string;
  code?: string;
  errors?: readonly string[];
  realStorageExecuted?: boolean;
  realUploadExecuted?: boolean;
};

/**
 * Resultado canônico — STORAGE-01.
 * Une coordenação do Runtime + resultado do StorageProviderPort.
 */
export type CanonicalStorageResult = {
  kind: "canonical-storage-result";
  ok: boolean;
  operation?: StorageProviderCanonicalResult["operation"];
  requestId?: string;
  runtimeSessionId?: string;
  session?: CanonicalStorageSession;
  executionId?: string;
  providerReferenceId?: CanonicalStorageProviderReferenceId;
  providerId?: string;
  storedDocument?: CanonicalStoredDocument;
  metadata?: CanonicalStorageMetadata;
  body?: Uint8Array;
  message?: string;
  code?: string;
  realStorageExecuted?: boolean;
  realUploadExecuted?: boolean;
  realDownloadExecuted?: boolean;
  realDeleteExecuted?: boolean;
};
