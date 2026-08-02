/**
 * Enterprise Document Intake Runtime — Document Intelligence Platform (DIP-01).
 *
 * Fluxo oficial:
 *   Produto → Enterprise Runtime → DocumentIntakeRuntimePort
 *     → Canonical Execution Orchestrator → DocumentIntakePort → Adapter → Store
 *
 * Ponto único de entrada documental da plataforma Enterprise.
 *
 * DIP-01: componente funcional oficial — sem OCR, IA, XML, TISS, parser,
 * classificação documental, Workflow novo ou Rule Engine novo.
 */
export type {
  CanonicalDocumentIntakeCapabilities,
  CanonicalDocumentIntakeIdentity,
  CanonicalDocumentIntakeMetadata,
  CanonicalDocumentIntakeReference,
  CanonicalDocumentIntakeRequest,
  CanonicalDocumentIntakeResult,
  CanonicalDocumentIntakeSession,
  CanonicalDocumentIntakeSource,
  DocumentIntakeRuntimeCapabilities,
  DocumentIntakeRuntimeEnterpriseDeps,
  DocumentIntakeRuntimeHealth,
  DocumentIntakeRuntimePort,
  DocumentIntakeRuntimeProviderId,
  DocumentIntakeRuntimeProviderOptions,
  DocumentIntakeRuntimeSessionStatus,
  GetIntakeRuntimeSessionInput,
  GetIntakeRuntimeSessionResult,
  ListIntakeRuntimeSessionsInput,
  ListIntakeRuntimeSessionsResult,
  RegisterIntakeInput,
  RegisterIntakeResult,
} from "./ports";

export {
  createRuntimeSessionId,
  resetAllDocumentIntakeRuntimeIdSequences,
  resetRuntimeSessionIdSequence,
} from "./ports";

export {
  DEFAULT_DOCUMENT_INTAKE_RUNTIME_ADAPTER_ID,
  DefaultDocumentIntakeRuntimeAdapter,
  MOCK_DOCUMENT_INTAKE_RUNTIME_ADAPTER_ID,
  MockDocumentIntakeRuntimeAdapter,
  type DefaultDocumentIntakeRuntimeAdapterOptions,
  type MockDocumentIntakeRuntimeAdapterOptions,
} from "./adapters";

export {
  IN_MEMORY_DOCUMENT_INTAKE_RUNTIME_STORE_ID,
  InMemoryDocumentIntakeRuntimeStore,
  type DocumentIntakeRuntimeStore,
  type InMemoryDocumentIntakeRuntimeStoreOptions,
  type StoredDocumentIntakeRuntimeSession,
} from "./store";

export {
  DocumentIntakeRuntimeFactory,
  createDocumentIntakeRuntimeFactory,
  type DocumentIntakeRuntimeFactoryOptions,
} from "./factory";

export { createDocumentIntakeRuntimePort } from "./providers";

export {
  getDocumentIntakeRuntimeHealthSummary,
  type DocumentIntakeRuntimeHealthSummary,
} from "./demo";
