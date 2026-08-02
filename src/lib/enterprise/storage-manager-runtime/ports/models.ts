/**
 * Modelos canônicos do Storage Manager Runtime — DIP-05.
 *
 * Representação estrutural da sessão de armazenamento documental na
 * Document Intelligence Platform.
 * Sem armazenamento real. Sem upload. Sem download. Sem versionamento funcional.
 * Sem retenção automática. Sem criptografia executada. Sem compressão executada.
 * Sem deduplicação. Sem I/O de arquivo físico. Sem Providers reais.
 */

/** Status estrutural da sessão de storage no Runtime. */
export type StorageManagerRuntimeSessionStatus =
  | "pending"
  | "coordinating"
  | "coordinated"
  | "deferred"
  | "failed";

/** Identidade canônica do documento no storage (referências opacas). */
export type CanonicalStorageIdentity = {
  kind: "canonical-storage-identity";
  documentId: string;
  documentKind?: string;
  version?: string;
};

/** Metadados canônicos estruturais da sessão de storage. */
export type CanonicalStorageMetadata = {
  kind: "canonical-storage-metadata";
  sessionId: string;
  tenantRef?: string;
  correlationId?: string;
  channel?: string;
  tags?: readonly string[];
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
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
  /** DIP-03 — referência estrutural à sessão OCR Runtime (sem OCR real). */
  ocrRuntimeSessionId?: string;
  ocrExecutionId?: string;
  /** DIP-04 — referência estrutural à sessão Classification Runtime (sem classificação real). */
  classificationRuntimeSessionId?: string;
  classificationExecutionId?: string;
  /** Referência estrutural ao Storage Provider futuro (nunca executado). */
  providerReferenceId?: CanonicalStorageProviderReferenceId;
};

/**
 * Capacidades canônicas tecnológicas do Storage Manager Runtime (modelo de domínio).
 * Todas FALSE / informativas — nenhuma capacidade é executada (DIP-05).
 */
export type CanonicalStorageCapabilities = {
  kind: "canonical-storage-capabilities";
  supportsVersioning: false;
  supportsRetentionPolicy: false;
  supportsEncryption: false;
  supportsCompression: false;
  supportsDeduplication: false;
  supportsCloudStorage: false;
  supportsLocalStorage: false;
  supportsImmutableStorage: false;
  declared?: readonly string[];
};

/** Configuração canônica estrutural do storage (sem armazenamento). */
export type CanonicalStorageConfiguration = {
  kind: "canonical-storage-configuration";
  /** Provider futuro referenciado estruturalmente — sem bind / sem HTTP / sem upload. */
  preferredProviderReference?: CanonicalStorageProviderReferenceId;
  contentTypeHint?: string;
  channel?: string;
  priority?: "LOW" | "NORMAL" | "HIGH" | (string & {});
  notes?: string;
};

/**
 * Referências estruturais a Storage Providers futuros.
 * NÃO são implementações. NÃO conectam serviços externos. NÃO fazem upload.
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

/** Descritor estrutural de um Storage Provider futuro. */
export type CanonicalStorageProviderReference = {
  kind: "canonical-storage-provider-reference";
  providerReferenceId: CanonicalStorageProviderReferenceId;
  displayName: string;
  vendor: string;
  status: "structural-reference-only";
  implementsRealStorage: false;
  implementsUpload: false;
  implementsDownload: false;
  implementsVersioning: false;
  implementsRetention: false;
  connected: false;
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
  createdAt: string;
  updatedAt: string;
  message?: string;
  code?: string;
  errors?: readonly string[];
  /** Sempre false nesta sprint — coordenação sem armazenamento. */
  realStorageExecuted?: false;
  /** Sempre false nesta sprint — sem upload. */
  realUploadExecuted?: false;
};

/** Resultado canônico da coordenação via Storage Manager Runtime. */
export type CanonicalStorageResult = {
  kind: "canonical-storage-result";
  ok: boolean;
  runtimeSessionId?: string;
  session?: CanonicalStorageSession;
  executionId?: string;
  providerReferenceId?: CanonicalStorageProviderReferenceId;
  message?: string;
  code?: string;
  /** Sempre false nesta sprint. */
  realStorageExecuted?: false;
  /** Sempre false nesta sprint. */
  realUploadExecuted?: false;
};
