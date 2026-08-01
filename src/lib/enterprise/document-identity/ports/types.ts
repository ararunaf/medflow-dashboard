/**
 * Tipos vendor-agnósticos da camada Document Identity — EPC-08.
 *
 * Nenhum tipo clínico, TISS, contrato, nota fiscal, prontuário, exame,
 * receita, laudo, OCR, IA, Workflow ou Storage de produto deve aparecer aqui.
 *
 * Document Identity representa um documento canônico genérico.
 * Especializações de domínio ficam FORA deste componente.
 */

/** Provedores / mecanismos de document identity (extensível). */
export type DocumentIdentityProviderId =
  | "default"
  | "mock"
  | "test"
  | "database"
  | "remote"
  | "registry";

/** Resultado de health check. */
export type DocumentIdentityHealth = {
  ok: boolean;
  provider: DocumentIdentityProviderId;
  latencyMs?: number;
  message?: string;
};

/**
 * Capacidades declaradas pelo adapter.
 * Usado por Application/Domain sem conhecer o store.
 */
export type DocumentIdentityCapabilities = {
  provider: DocumentIdentityProviderId;
  /** Identificador legível do adapter (ex.: default-in-process). */
  adapterId: string;
  supportsCreateDocument: boolean;
  supportsGetDocument: boolean;
  supportsListDocuments: boolean;
  /** Referências opacas a Metadata Engine (sem acoplamento). */
  supportsMetadataReference: boolean;
  /** Referências opacas a Storage (sem I/O real). */
  supportsStorageReference: boolean;
  /** Modelo de páginas estrutural. */
  supportsPages: boolean;
  /** Identidade canônica (UUID/Hash/Fingerprint/…). */
  supportsCanonicalIdentity: boolean;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Identidade canônica (FASE 7) — todos genéricos
 * ───────────────────────────────────────────────────────────────────────── */

/** Identificador estável de documento (canônico). */
export type DocumentId = string;

/** Identificador estável de página. */
export type PageId = string;

/** Tipo de documento — string livre, sem enum de domínio. */
export type DocumentType = string;

/** Origem / fonte lógica do documento (genérica). */
export type DocumentSource = string;

/** Status estrutural genérico. */
export type DocumentStatus =
  | "draft"
  | "active"
  | "archived"
  | "deleted"
  | "processing"
  | "unknown"
  | (string & {});

/** Tag genérica — classificação livre. */
export type DocumentTag = string;

/** Versão estrutural do documento (rótulo livre). */
export type DocumentVersion = string;

/** Checksum genérico (algoritmo + valor opacos). */
export type DocumentChecksum = {
  algorithm?: string;
  value: string;
};

/** Hash genérico (opaco). */
export type DocumentHash = {
  algorithm?: string;
  value: string;
};

/**
 * Fingerprint estrutural — identidade derivada genérica.
 * Sem semântica clínica ou de negócio.
 */
export type DocumentFingerprint = {
  value: string;
  method?: string;
};

/**
 * Identidade canônica agregada (FASE 7).
 * Preparação estrutural — sem geração criptográfica obrigatória nesta sprint.
 */
export type DocumentCanonicalIdentity = {
  /** UUID canônico (quando distinto do DocumentId). */
  uuid?: string;
  /** Hash de conteúdo / identidade. */
  hash?: DocumentHash;
  /** Fingerprint derivado. */
  fingerprint?: DocumentFingerprint;
  /** Checksum de integridade. */
  checksum?: DocumentChecksum;
  /** Id na fonte de origem. */
  sourceId?: string;
  /** Correlação cross-sistema. */
  correlationId?: string;
  /** Id externo (vendor / sistema legado). */
  externalId?: string;
  /** Origem lógica (sistema, canal, processo). */
  origin?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Referências opacas (prep para Metadata / Storage — sem acoplamento)
 * ───────────────────────────────────────────────────────────────────────── */

/** Referência opaca a artefato do Metadata Engine. */
export type DocumentMetadataReference = {
  id?: string;
  name?: string;
  namespace?: string;
  version?: string;
  kind?: string;
};

/** Referência opaca a objeto no Storage Port (sem I/O). */
export type DocumentStorageReference = {
  /** Chave / path lógico. */
  key?: string;
  /** Bucket / container lógico. */
  container?: string;
  /** Provider de storage (id genérico). */
  provider?: string;
  /** URI opaca. */
  uri?: string;
};

/** Referência opaca a imagem / thumbnail (sem blob). */
export type DocumentImageReference = {
  storageRef?: DocumentStorageReference;
  uri?: string;
  mimeType?: string;
  width?: number;
  height?: number;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Página (FASE 6) — sem informação clínica
 * ───────────────────────────────────────────────────────────────────────── */

export type DocumentPage = {
  pageId: PageId;
  sequence: number;
  width?: number;
  height?: number;
  /** Rotação em graus (0–360), genérica. */
  rotation?: number;
  checksum?: DocumentChecksum;
  imageReference?: DocumentImageReference;
  thumbnailReference?: DocumentImageReference;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Anexos / imagens estruturais (referências — sem conteúdo binário)
 * ───────────────────────────────────────────────────────────────────────── */

export type DocumentAttachment = {
  id?: string;
  name?: string;
  mimeType?: string;
  fileSize?: number;
  checksum?: DocumentChecksum;
  storageReference?: DocumentStorageReference;
  tags?: readonly DocumentTag[];
};

export type DocumentImage = {
  id?: string;
  sequence?: number;
  mimeType?: string;
  width?: number;
  height?: number;
  checksum?: DocumentChecksum;
  imageReference?: DocumentImageReference;
  thumbnailReference?: DocumentImageReference;
  tags?: readonly DocumentTag[];
};

/* ─────────────────────────────────────────────────────────────────────────
 * Documento canônico (FASE 5) — somente campos listados
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Modelo canônico de Document Identity.
 *
 * Campos permitidos (exclusivos):
 * DocumentId | DocumentType | Source | CreatedAt | UpdatedAt | Status |
 * Pages | Attachments | Images | MetadataReference | StorageReference |
 * Checksum | Version | MimeType | FileSize | Language | Tags | CustomAttributes
 *
 * Identidade canônica adicional vive em `identity` (FASE 7 prep).
 */
export type DocumentIdentity = {
  documentId: DocumentId;
  documentType: DocumentType;
  source?: DocumentSource;
  createdAt: string;
  updatedAt: string;
  status: DocumentStatus;
  pages?: readonly DocumentPage[];
  attachments?: readonly DocumentAttachment[];
  images?: readonly DocumentImage[];
  metadataReference?: DocumentMetadataReference;
  storageReference?: DocumentStorageReference;
  checksum?: DocumentChecksum;
  version?: DocumentVersion;
  mimeType?: string;
  fileSize?: number;
  language?: string;
  tags?: readonly DocumentTag[];
  /** Atributos livres opacos — sem schema clínico. */
  customAttributes?: Readonly<Record<string, unknown>>;
  /** Identidade canônica agregada (UUID/Hash/Fingerprint/…). */
  identity?: DocumentCanonicalIdentity;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Inputs / Results do Port
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Input de criação — campos gerados pelo adapter quando omitidos:
 * documentId, createdAt, updatedAt, status default.
 */
export type CreateDocumentInput = {
  document: Omit<DocumentIdentity, "documentId" | "createdAt" | "updatedAt" | "status"> & {
    documentId?: DocumentId;
    createdAt?: string;
    updatedAt?: string;
    status?: DocumentStatus;
  };
};

export type CreateDocumentResult = {
  ok: boolean;
  documentId: DocumentId;
  document?: DocumentIdentity;
  message?: string;
};

export type GetDocumentInput = {
  documentId: DocumentId;
};

export type GetDocumentResult = {
  ok: boolean;
  document?: DocumentIdentity;
  message?: string;
};

export type ListDocumentsInput = {
  documentType?: DocumentType;
  source?: DocumentSource;
  status?: DocumentStatus;
  tag?: DocumentTag;
  /** Prefixo de documentId opcional. */
  idPrefix?: string;
  /** correlationId / externalId / sourceId via identity. */
  correlationId?: string;
  externalId?: string;
  sourceId?: string;
};

export type ListDocumentsResult = {
  ok: boolean;
  documents: readonly DocumentIdentity[];
  message?: string;
};

/** Opções de resolução do DocumentIdentityPort (provider factory). */
export type DocumentIdentityProviderOptions = {
  /**
   * Provedor desejado. Default de produção: `default`.
   * Em testes: `mock` | `test`.
   */
  provider?: DocumentIdentityProviderId;
};
