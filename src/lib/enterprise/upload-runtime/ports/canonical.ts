/**
 * Modelos canônicos do Enterprise Upload Runtime — F3-CAP-03.
 *
 * Foundation estrutural vendor-agnostic para uploads futuros.
 * Sem Upload real. Sem Upload Web/Desktop/Mobile/API. Sem Multipart/Chunked/Resumable. Sem Azure Blob/Supabase/S3/Drive/OneDrive/Dropbox.
 * Sem FileSystemWatcher. Sem Polling. Sem OCR. Sem Importação automática.
 * Sem monitoramento real. Sem filas. Sem banco. Sem API.
 */

/** Status estrutural de Upload / sessão / observação. */
export type CanonicalUploadStatus =
  | "pending"
  | "registered"
  | "unregistered"
  | "discovered"
  | "session-open"
  | "session-closed"
  | "received"
  | "failed"
  | "unknown"
  | (string & {});

/** Identidade canônica estrutural (opaca). */
export type CanonicalUploadIdentity = {
  kind: "canonical-upload-identity";
  uploadId?: string;
  uploadName?: string;
  channelKey?: string;
  sessionId?: string;
  receiptId?: string;
  correlationId?: string | null;
};

/** Provedor canônico declarado (estrutural). */
export type CanonicalUploadProvider = {
  kind: "canonical-upload-provider";
  providerId: string;
  adapterId?: string;
  vendor?: string;
  version?: string;
  label?: string;
};

/**
 * Metadata canônica de Upload / sessão / observação.
 * Estrutural — sem semântica de operadora/contrato/tenant.
 */
export type CanonicalUploadMetadata = {
  kind: "canonical-upload-metadata";
  sessionId?: string;
  correlationId?: string | null;
  channel?: string;
  source?: string;
  tags?: readonly string[];
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
};

/** Operação canônica do Upload Runtime. */
export type CanonicalUploadOperation =
  | "register"
  | "unregister"
  | "discover"
  | "openSession"
  | "closeSession"
  | "receive"
  | "stats"
  | "health"
  | "capabilities"
  | (string & {});

/**
 * Upload canônico estrutural.
 * Representa a infraestrutura de Upload — sem monitoramento real.
 */
export type CanonicalUpload = {
  kind: "canonical-upload";
  uploadId: string;
  uploadName: string;
  /** Caminho estrutural opaco — nunca lido do filesystem nesta fundação. */
  channelKey?: string;
  identity?: CanonicalUploadIdentity;
  metadata?: CanonicalUploadMetadata;
  status: CanonicalUploadStatus;
  discovered: boolean;
  createdAt: string;
  updatedAt: string;
  /** Sempre false — nenhum Upload real nesta fundação. */
  webUploadImplemented: false;
  desktopUploadImplemented: false;
  mobileUploadImplemented: false;
  apiUploadImplemented: false;
  multipartImplemented: false;
  chunkedUploadImplemented: false;
  resumableUploadImplemented: false;
  azureBlobImplemented: false;
  supabaseStorageImplemented: false;
  s3Implemented: false;
  googleDriveImplemented: false;
  oneDriveImplemented: false;
  dropboxImplemented: false;
};

/**
 * Sessão canônica estrutural (referência apenas — nunca abre watcher).
 */
export type CanonicalUploadSession = {
  kind: "canonical-upload-session";
  sessionId: string;
  uploadId: string;
  identity?: CanonicalUploadIdentity;
  metadata?: CanonicalUploadMetadata;
  status: CanonicalUploadStatus;
  openedAt: string;
  updatedAt: string;
  closedAt?: string;
  webUploadImplemented: false;
  desktopUploadImplemented: false;
  mobileUploadImplemented: false;
  apiUploadImplemented: false;
  multipartImplemented: false;
  chunkedUploadImplemented: false;
  resumableUploadImplemented: false;
  azureBlobImplemented: false;
  supabaseStorageImplemented: false;
  s3Implemented: false;
  googleDriveImplemented: false;
  oneDriveImplemented: false;
  dropboxImplemented: false;
};

/**
 * Observação canônica estrutural (registro apenas — nunca observa filesystem).
 */
export type CanonicalUploadReceipt = {
  kind: "canonical-upload-receipt";
  receiptId: string;
  uploadId: string;
  sessionId?: string;
  identity?: CanonicalUploadIdentity;
  metadata?: CanonicalUploadMetadata;
  status: CanonicalUploadStatus;
  createdAt: string;
  updatedAt: string;
  webUploadImplemented: false;
  desktopUploadImplemented: false;
  mobileUploadImplemented: false;
  apiUploadImplemented: false;
  multipartImplemented: false;
  chunkedUploadImplemented: false;
  resumableUploadImplemented: false;
  azureBlobImplemented: false;
  supabaseStorageImplemented: false;
  s3Implemented: false;
  googleDriveImplemented: false;
  oneDriveImplemented: false;
  dropboxImplemented: false;
};

/**
 * Resultado canônico de operação de Upload Runtime (F3-CAP-03).
 * Contém apenas referência/estrutura canônica — nunca Upload real.
 */
export type CanonicalUploadResult = {
  kind: "canonical-upload-result";
  ok: boolean;
  resultId: string;
  operation: CanonicalUploadOperation;
  upload?: CanonicalUpload;
  session?: CanonicalUploadSession;
  receipt?: CanonicalUploadReceipt;
  uploads?: readonly CanonicalUpload[];
  identity?: CanonicalUploadIdentity;
  metadata?: CanonicalUploadMetadata;
  provider?: CanonicalUploadProvider;
  webUploadImplemented: false;
  desktopUploadImplemented: false;
  mobileUploadImplemented: false;
  apiUploadImplemented: false;
  multipartImplemented: false;
  chunkedUploadImplemented: false;
  resumableUploadImplemented: false;
  azureBlobImplemented: false;
  supabaseStorageImplemented: false;
  s3Implemented: false;
  googleDriveImplemented: false;
  oneDriveImplemented: false;
  dropboxImplemented: false;
  /** Sempre true — runtime estrutural pronto (sem Upload real). */
  runtimeReady: true;
  status: CanonicalUploadStatus;
  messageText?: string;
  code?: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * Estatísticas estruturais do Upload Runtime (in-process).
 */
export type CanonicalUploadStatistics = {
  kind: "canonical-upload-statistics";
  totalUploads: number;
  registeredUploads: number;
  discoveredUploads: number;
  openSessions: number;
  closedSessions: number;
  totalReceipts: number;
  webUploadImplementedCount: 0;
  desktopUploadImplementedCount: 0;
  mobileUploadImplementedCount: 0;
  apiUploadImplementedCount: 0;
  multipartImplementedCount: 0;
  chunkedUploadImplementedCount: 0;
  resumableUploadImplementedCount: 0;
  azureBlobImplementedCount: 0;
  supabaseStorageImplementedCount: 0;
  s3ImplementedCount: 0;
  googleDriveImplementedCount: 0;
  oneDriveImplementedCount: 0;
  dropboxImplementedCount: 0;
};

/**
 * Saúde canônica do provedor Upload Runtime.
 */
export type CanonicalUploadHealth = {
  kind: "canonical-upload-health";
  ok: boolean;
  provider: string;
  latencyMs?: number;
  message?: string;
  status?: string;
  storedUploadCount?: number;
  storedSessionCount?: number;
  storedReceiptCount?: number;
  scannerRuntimeOk?: boolean;
  watchFolderRuntimeOk?: boolean;
  captureEngineRuntimeOk?: boolean;
  ocrRuntimeOk?: boolean;
  persistentQueueRuntimeOk?: boolean;
  schedulerRuntimeOk?: boolean;
  workerRuntimeOk?: boolean;
  observabilityRuntimeOk?: boolean;
  runtimeReady: true;
  webUploadImplemented: false;
  desktopUploadImplemented: false;
  mobileUploadImplemented: false;
  apiUploadImplemented: false;
  multipartImplemented: false;
  chunkedUploadImplemented: false;
  resumableUploadImplemented: false;
  azureBlobImplemented: false;
  supabaseStorageImplemented: false;
  s3Implemented: false;
  googleDriveImplemented: false;
  oneDriveImplemented: false;
  dropboxImplemented: false;
};

/**
 * Capacidades canônicas declaradas do provedor Upload Runtime.
 */
export type CanonicalUploadCapabilities = {
  kind: "canonical-upload-capabilities";
  supportsRegister: boolean;
  supportsUnregister: boolean;
  supportsDiscover: boolean;
  supportsOpenSession: boolean;
  supportsCloseSession: boolean;
  supportsReceive: boolean;
  supportsStats: boolean;
  supportsHealth: boolean;
  supportsCanonicalUpload: boolean;
  runtimeReady: true;
  webUploadImplemented: false;
  desktopUploadImplemented: false;
  mobileUploadImplemented: false;
  apiUploadImplemented: false;
  multipartImplemented: false;
  chunkedUploadImplemented: false;
  resumableUploadImplemented: false;
  azureBlobImplemented: false;
  supabaseStorageImplemented: false;
  s3Implemented: false;
  googleDriveImplemented: false;
  oneDriveImplemented: false;
  dropboxImplemented: false;
  knowsOperatorOrCooperative: false;
  knowsContract: false;
  knowsTenant: false;
  knowsTissPattern: false;
};
