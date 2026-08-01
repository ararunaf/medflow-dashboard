/**
 * Tipos vendor-agnósticos da camada de storage — EPC-02.
 *
 * Nenhum tipo do Supabase Storage, Azure Blob, S3 ou SDK de object store
 * deve aparecer aqui.
 */

/** Provedores de armazenamento suportados (extensível). */
export type StorageProviderId =
  | "supabase"
  | "azure-blob"
  | "s3"
  | "gcs"
  | "nas"
  | "local"
  | "sharepoint"
  | "mock"
  | "test";

/** Resultado de health check do provedor de storage. */
export type StorageHealth = {
  ok: boolean;
  provider: StorageProviderId;
  latencyMs?: number;
  message?: string;
};

/**
 * Capacidades declaradas pelo adapter.
 * Usado por Application/Domain para decisões sem conhecer o vendor.
 */
export type StorageCapabilities = {
  provider: StorageProviderId;
  /** Identificador legível do adapter (ex.: supabase-default). */
  adapterId: string;
  supportsPut: boolean;
  supportsGet: boolean;
  supportsDelete: boolean;
  supportsSignedUrl: boolean;
  supportsVersioning: boolean;
};

/**
 * Preparação para Document Identity (EPC-08) — todos os campos opcionais.
 *
 * Incluídos agora para que put/get/delete/signedUrl possam receber identidade
 * documental no futuro sem quebrar assinaturas (options bag extensível).
 * EPC-02 NÃO implementa EPC-08.
 */
export type StorageDocumentContext = {
  documentId?: string;
  tenantId?: string;
  metadata?: Record<string, unknown>;
  version?: string | number;
  hash?: string;
  tags?: readonly string[];
  origin?: string;
  correlationId?: string;
};

/** Corpo binário vendor-agnóstico (sem Blob/File de DOM obrigatório). */
export type StorageObjectBody = Uint8Array | ArrayBuffer | string;

/** Entrada de put — key lógica; bucket/path físico fica no adapter. */
export type StoragePutInput = {
  key: string;
  body: StorageObjectBody;
  contentType?: string;
  /** Document Identity futura (EPC-08) — opcional, sem quebra de assinatura. */
  document?: StorageDocumentContext;
};

export type StoragePutResult = {
  ok: boolean;
  key: string;
  etag?: string;
  message?: string;
};

export type StorageGetInput = {
  key: string;
  document?: StorageDocumentContext;
};

export type StorageGetResult = {
  ok: boolean;
  key: string;
  body?: Uint8Array;
  contentType?: string;
  message?: string;
};

export type StorageDeleteInput = {
  key: string;
  document?: StorageDocumentContext;
};

export type StorageDeleteResult = {
  ok: boolean;
  key: string;
  message?: string;
};

export type StorageSignedUrlInput = {
  key: string;
  /** Segundos de validade. Interpretação fica no adapter. */
  expiresInSeconds?: number;
  document?: StorageDocumentContext;
};

export type StorageSignedUrlResult = {
  ok: boolean;
  key: string;
  url?: string;
  expiresAt?: string;
  message?: string;
};

/** Opções de resolução do StoragePort (provider). */
export type StorageProviderOptions = {
  /**
   * Provedor desejado. Default de produção: `supabase`.
   * Em testes: `mock` | `test`.
   */
  provider?: StorageProviderId;
};
