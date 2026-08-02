/**
 * Enterprise Document Classification Runtime — Document Intelligence Platform (DIP-04 / CLASS-01).
 *
 * Fluxo oficial:
 *   Produto → Enterprise Runtime → Capture Engine Runtime
 *     → OCR Runtime → DocumentClassificationRuntimePort
 *     → Canonical Execution Orchestrator
 *     → DocumentClassificationProviderPort
 *     → DefaultDocumentClassificationAdapter → Classification Provider
 *
 * CLASS-01: classificação rule-based via Provider Port.
 * Sem IA, sem LLM, sem embeddings, sem ML, sem RAG.
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
  CanonicalDocumentClassificationTelemetry,
  CanonicalDocumentClassificationType,
  ClassifyDocumentInput,
  ClassifyDocumentResult,
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
