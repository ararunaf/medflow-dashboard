/**
 * Enterprise Document Classification Runtime — Document Intelligence Platform (DIP-04).
 *
 * Fluxo oficial:
 *   Produto → Enterprise Runtime → Capture Engine Runtime
 *     → OCR Runtime → DocumentClassificationRuntimePort
 *     → Canonical Execution Orchestrator
 *     → Classification Provider Adapter (referência estrutural)
 *     → Provider futuro
 *
 * DIP-04: infraestrutura oficial de coordenação de classificação documental —
 * sem classificação real, sem IA, sem LLM, sem embeddings, sem ML,
 * sem OCR para classificação, sem regras/heurísticas, sem I/O externo.
 */
export type {
  CanonicalDocumentClassificationCapabilities,
  CanonicalDocumentClassificationConfiguration,
  CanonicalDocumentClassificationIdentity,
  CanonicalDocumentClassificationMetadata,
  CanonicalDocumentClassificationProviderReference,
  CanonicalDocumentClassificationProviderReferenceId,
  CanonicalDocumentClassificationReference,
  CanonicalDocumentClassificationRequest,
  CanonicalDocumentClassificationResult,
  CanonicalDocumentClassificationSession,
  CoordinateClassificationInput,
  CoordinateClassificationResult,
  DocumentClassificationRuntimeCapabilities,
  DocumentClassificationRuntimeEnterpriseDeps,
  DocumentClassificationRuntimeHealth,
  DocumentClassificationRuntimePort,
  DocumentClassificationRuntimeProviderId,
  DocumentClassificationRuntimeProviderOptions,
  DocumentClassificationRuntimeSessionStatus,
  GetDocumentClassificationRuntimeSessionInput,
  GetDocumentClassificationRuntimeSessionResult,
  ListDocumentClassificationProviderReferencesResult,
  ListDocumentClassificationRuntimeSessionsInput,
  ListDocumentClassificationRuntimeSessionsResult,
} from "./ports";

export {
  STRUCTURAL_DOCUMENT_CLASSIFICATION_PROVIDER_REFERENCES,
  createDocumentClassificationRuntimeSessionId,
  resetAllDocumentClassificationRuntimeIdSequences,
  resetDocumentClassificationRuntimeSessionIdSequence,
  resolveStructuralClassificationProviderReference,
} from "./ports";

export {
  DEFAULT_DOCUMENT_CLASSIFICATION_RUNTIME_ADAPTER_ID,
  DefaultDocumentClassificationRuntimeAdapter,
  MOCK_DOCUMENT_CLASSIFICATION_RUNTIME_ADAPTER_ID,
  MockDocumentClassificationRuntimeAdapter,
  STRUCTURAL_CLASSIFICATION_PROVIDER_ADAPTER_ID,
  type DefaultDocumentClassificationRuntimeAdapterOptions,
  type MockDocumentClassificationRuntimeAdapterOptions,
} from "./adapters";

export {
  IN_MEMORY_DOCUMENT_CLASSIFICATION_RUNTIME_STORE_ID,
  InMemoryDocumentClassificationRuntimeStore,
  type DocumentClassificationRuntimeStore,
  type InMemoryDocumentClassificationRuntimeStoreOptions,
  type StoredDocumentClassificationRuntimeSession,
} from "./store";

export {
  DocumentClassificationRuntimeFactory,
  createDocumentClassificationRuntimeFactory,
  type DocumentClassificationRuntimeFactoryOptions,
} from "./factory";

export { createDocumentClassificationRuntimePort } from "./providers";

export {
  getDocumentClassificationRuntimeHealthSummary,
  type DocumentClassificationRuntimeHealthSummary,
} from "./demo";
