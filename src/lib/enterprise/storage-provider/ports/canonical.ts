/**
 * Modelos canônicos do Storage Provider — STORAGE-01.
 *
 * Únicos modelos canônicos de persistência documental:
 *   CanonicalStorageResult
 *   CanonicalStorageMetadata
 *   CanonicalStoredDocument
 *
 * Sem modelos paralelos. Runtime e Provider compartilham estes tipos.
 */

/** Metadados canônicos de um documento armazenado / operação de storage. */
export type CanonicalStorageMetadata = {
  kind: "canonical-storage-metadata";
  sessionId: string;
  tenantRef?: string;
  correlationId?: string;
  channel?: string;
  contentType?: string;
  sizeBytes?: number;
  etag?: string;
  lastModified?: string;
  tags?: readonly string[];
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
};

/** Documento canônico persistido via StorageProviderPort. */
export type CanonicalStoredDocument = {
  kind: "canonical-stored-document";
  documentId: string;
  storageKey: string;
  storageContainer?: string;
  providerId: string;
  contentType?: string;
  sizeBytes?: number;
  etag?: string;
  checksum?: string;
  version?: string;
  createdAt?: string;
  updatedAt?: string;
  metadata?: CanonicalStorageMetadata;
};

/** Resultado canônico de operação de storage (upload / download / delete / metadata). */
export type CanonicalStorageResult = {
  kind: "canonical-storage-result";
  ok: boolean;
  operation: "upload" | "download" | "delete" | "metadata" | "signedUrl" | "coordinate";
  requestId?: string;
  runtimeSessionId?: string;
  executionId?: string;
  providerId?: string;
  storedDocument?: CanonicalStoredDocument;
  metadata?: CanonicalStorageMetadata;
  /** Corpo binário (apenas download bem-sucedido). */
  body?: Uint8Array;
  /** URL assinada (apenas signedUrl bem-sucedido). */
  signedUrl?: string;
  expiresAt?: string;
  message?: string;
  code?: string;
  realStorageExecuted: boolean;
  realUploadExecuted: boolean;
  realDownloadExecuted: boolean;
  realDeleteExecuted: boolean;
};
