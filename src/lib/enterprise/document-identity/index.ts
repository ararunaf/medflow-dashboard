/**
 * Enterprise Document Identity — Ports & Adapters (EPC-08).
 *
 * Fluxo oficial:
 *   Application → DocumentIdentityPort → DocumentIdentityAdapter
 *     → DocumentIdentityStore → DocumentIdentityFactory → DocumentIdentityProvider
 *
 * Domain/Application NÃO devem importar conceitos clínicos, TISS, contratos,
 * OCR, Captura, Storage real, Workflow ou IA de produto.
 *
 * Document Identity representa um documento canônico genérico.
 * Especializações (TISS, Prontuário, Contrato, …) ficam FORA deste componente.
 */
export type {
  CreateDocumentInput,
  CreateDocumentResult,
  DocumentAttachment,
  DocumentCanonicalIdentity,
  DocumentChecksum,
  DocumentFingerprint,
  DocumentHash,
  DocumentId,
  DocumentIdentity,
  DocumentIdentityCapabilities,
  DocumentIdentityHealth,
  DocumentIdentityPort,
  DocumentIdentityProviderId,
  DocumentIdentityProviderOptions,
  DocumentImage,
  DocumentImageReference,
  DocumentMetadataReference,
  DocumentPage,
  DocumentSource,
  DocumentStatus,
  DocumentStorageReference,
  DocumentTag,
  DocumentType,
  DocumentVersion,
  GetDocumentInput,
  GetDocumentResult,
  ListDocumentsInput,
  ListDocumentsResult,
  PageId,
} from "./ports";

export {
  createDocumentUuid,
  defineCanonicalIdentity,
  defineChecksum,
  defineFingerprint,
  defineHash,
  findPageById,
  findPageBySequence,
  getCorrelationId,
  getExternalId,
  getOrigin,
  getPageCount,
  getSourceId,
  hasCanonicalIdentity,
  resequencePages,
  sortPagesBySequence,
} from "./ports";

export {
  DEFAULT_DOCUMENT_IDENTITY_ADAPTER_ID,
  DefaultDocumentIdentityAdapter,
  MockDocumentIdentityAdapter,
  type DefaultDocumentIdentityRuntime,
  type MockDocumentIdentityAdapterOptions,
} from "./adapters";

export {
  DEFAULT_DOCUMENT_IDENTITY_STORE_ID,
  DefaultDocumentIdentityStore,
  type DefaultDocumentIdentityStoreOptions,
  type DocumentIdentityStore,
  type StoredDocumentIdentity,
} from "./store";

export {
  DocumentIdentityFactory,
  createDocumentIdentityFactory,
  type DocumentIdentityFactoryOptions,
} from "./factory";

export { createDocumentIdentityPort } from "./providers";

export { getDocumentIdentityHealthSummary, type DocumentIdentityHealthSummary } from "./demo";
