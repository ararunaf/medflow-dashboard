/**
 * Tipos vendor-agnósticos da camada Storage Provider — STORAGE-01.
 *
 * Arquitetura obrigatória:
 *   Application → StorageProviderPort → Adapter → Factory → Registry
 *     → Storage Backend (Supabase Storage homologado)
 *
 * Sem acesso direto a Azure Blob / AWS S3 / GCS pelo produto.
 * Reutiliza a integração Supabase Storage existente (sem implementação paralela).
 */
import type { StorageProviderCapabilities } from "./capabilities";
import type {
  CanonicalStorageMetadata,
  CanonicalStorageResult,
  CanonicalStoredDocument,
} from "./canonical";

export type { StorageProviderCapabilities };
export type { CanonicalStorageMetadata, CanonicalStorageResult, CanonicalStoredDocument };

/** Provedores / mecanismos de storage suportados na fundação. */
export type StorageProviderId = "mock" | "test" | "default" | "supabase";

/** Status operacional declarado no registry. */
export type StorageProviderStatus = "ready" | "stub" | "disabled" | "unhealthy" | "unknown";

/** Telemetria estrutural embutida no resultado (sem SDK externo). */
export type StorageProviderTelemetry = {
  latencyMs: number;
  attempts: number;
  cancelled: boolean;
  operation?: "upload" | "download" | "delete" | "metadata" | "signedUrl";
  bytes?: number;
};

/** Logging estrutural embutido (sem logger SDK). */
export type StorageProviderStructuredLog = {
  level: "info" | "warn" | "error";
  code: string;
  message: string;
  requestId?: string;
  providerId?: StorageProviderId;
  attempt?: number;
  operation?: "upload" | "download" | "delete" | "metadata" | "signedUrl";
};

/** Resultado de health check. */
export type StorageProviderHealth = {
  ok: boolean;
  provider: StorageProviderId;
  latencyMs?: number;
  message?: string;
  status?: StorageProviderStatus;
};

/**
 * Capacidades do adapter no nível do Port.
 */
export type StorageProviderPortCapabilities = {
  provider: StorageProviderId;
  adapterId: string;
  storage: StorageProviderCapabilities;
  supportsCanonicalResult: boolean;
  supportsUpload: boolean;
  supportsDownload: boolean;
  supportsDelete: boolean;
  supportsMetadata: boolean;
  supportsTimeout: boolean;
  supportsRetry: boolean;
  supportsCancellation: boolean;
  supportsTelemetry: boolean;
  implementsRealStorage: boolean;
};

/** Metadados estáveis do provedor. */
export type StorageProviderMetadata = {
  name: string;
  version: string;
  vendor: string;
  description?: string;
};

/** Info agregada retornada por providerInfo(). */
export type StorageProviderInfo = {
  providerId: StorageProviderId;
  metadata: StorageProviderMetadata;
  status: StorageProviderStatus;
  providerType: "DOCUMENT_STORAGE";
  capabilities: StorageProviderCapabilities;
};

/** Resultado de validateConfiguration(). */
export type StorageProviderConfigurationValidation = {
  ok: boolean;
  provider: StorageProviderId;
  errors: readonly string[];
  warnings: readonly string[];
  message?: string;
};

/** Corpo binário vendor-agnóstico. */
export type StorageProviderObjectBody = Uint8Array | ArrayBuffer | string;

/** Controles operacionais compartilhados. */
export type StorageProviderOperationControls = {
  requestId?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
  retryCount?: number;
  attributes?: Readonly<Record<string, unknown>>;
};

/** Input de upload(). */
export type StorageUploadInput = StorageProviderOperationControls & {
  key: string;
  body: StorageProviderObjectBody;
  contentType?: string;
  container?: string;
  documentId?: string;
  sessionId?: string;
  tenantRef?: string;
  correlationId?: string;
  checksum?: string;
  upsert?: boolean;
};

/** Input de download(). */
export type StorageDownloadInput = StorageProviderOperationControls & {
  key: string;
  container?: string;
  documentId?: string;
  sessionId?: string;
  tenantRef?: string;
};

/** Input de delete(). */
export type StorageDeleteInput = StorageProviderOperationControls & {
  key: string;
  container?: string;
  documentId?: string;
  sessionId?: string;
  tenantRef?: string;
};

/** Input de metadata(). */
export type StorageMetadataInput = StorageProviderOperationControls & {
  key: string;
  container?: string;
  documentId?: string;
  sessionId?: string;
  tenantRef?: string;
};

/** Input de signedUrl(). */
export type StorageSignedUrlInput = StorageProviderOperationControls & {
  key: string;
  container?: string;
  documentId?: string;
  sessionId?: string;
  tenantRef?: string;
  expiresInSeconds?: number;
  downloadFilename?: string;
};

/**
 * Resultado de operação no Port — promove CanonicalStorageResult.
 * Sem modelos paralelos de domínio.
 */
export type StorageProviderOperationResult = CanonicalStorageResult & {
  requestId?: string;
  provider: StorageProviderId;
  telemetry: StorageProviderTelemetry;
  logs?: readonly StorageProviderStructuredLog[];
  simulated?: boolean;
};

/** Opções de resolução do StorageProviderPort. */
export type StorageProviderOptions = {
  /**
   * Provedor desejado. Default da fundação: `supabase` (STORAGE-01).
   */
  provider?: StorageProviderId;
  /**
   * Backend de I/O injetável (reuso da integração Supabase homologada).
   * Obrigatório para I/O real em adapters default/supabase.
   */
  backend?: StorageProviderBackend;
};

/**
 * Backend de object store injetável — único ponto de I/O do Adapter.
 * Produto NÃO acessa este contrato; apenas o Adapter oficial.
 */
export type StorageProviderBackend = {
  upload(input: {
    key: string;
    body: Uint8Array;
    contentType?: string;
    container?: string;
    upsert?: boolean;
  }): Promise<{ ok: boolean; etag?: string; message?: string }>;
  download(input: {
    key: string;
    container?: string;
  }): Promise<{ ok: boolean; body?: Uint8Array; contentType?: string; message?: string }>;
  delete(input: { key: string; container?: string }): Promise<{ ok: boolean; message?: string }>;
  metadata(input: { key: string; container?: string }): Promise<{
    ok: boolean;
    contentType?: string;
    sizeBytes?: number;
    etag?: string;
    lastModified?: string;
    message?: string;
  }>;
  signedUrl?(input: {
    key: string;
    container?: string;
    expiresInSeconds?: number;
    downloadFilename?: string;
  }): Promise<{ ok: boolean; url?: string; expiresAt?: string; message?: string }>;
  publicUrl?(input: {
    key: string;
    container?: string;
  }): Promise<{ ok: boolean; url?: string; message?: string }>;
  health?(): Promise<{ ok: boolean; message?: string }>;
};

/** Entrada de registro no StorageProviderRegistry. */
export type StorageProviderRegistration = {
  providerId: StorageProviderId;
  name: string;
  version: string;
  status: StorageProviderStatus;
  adapterId: string;
  vendor: string;
  capabilities: StorageProviderCapabilities;
  description?: string;
};
