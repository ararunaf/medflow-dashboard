/**
 * Enterprise OCR Runtime — Document Intelligence Platform (DIP-03).
 *
 * Fluxo oficial:
 *   Produto → Enterprise Runtime → Capture Engine Runtime
 *     → OCRRuntimePort → Canonical Execution Orchestrator
 *     → OCR Provider Adapter → Provider futuro
 *
 * DIP-03: infraestrutura oficial de coordenação OCR — sem OCR real,
 * sem extração de texto, sem interpretação documental, sem Azure /
 * Google Vision / Textract / Tesseract, sem I/O externo.
 */
export type {
  CanonicalOCRCapabilities,
  CanonicalOCRConfiguration,
  CanonicalOCRIdentity,
  CanonicalOCRMetadata,
  CanonicalOCRProviderReference,
  CanonicalOCRProviderReferenceId,
  CanonicalOCRReference,
  CanonicalOCRRequest,
  CanonicalOCRResult,
  CanonicalOCRSession,
  CoordinateOCRInput,
  CoordinateOCRResult,
  GetOCRRuntimeSessionInput,
  GetOCRRuntimeSessionResult,
  ListOCRProviderReferencesResult,
  ListOCRRuntimeSessionsInput,
  ListOCRRuntimeSessionsResult,
  OCRRuntimeCapabilities,
  OCRRuntimeEnterpriseDeps,
  OCRRuntimeHealth,
  OCRRuntimePort,
  OCRRuntimeProviderId,
  OCRRuntimeProviderOptions,
  OCRRuntimeSessionStatus,
} from "./ports";

export {
  STRUCTURAL_OCR_PROVIDER_REFERENCES,
  createOCRRuntimeSessionId,
  resetAllOCRRuntimeIdSequences,
  resetOCRRuntimeSessionIdSequence,
  resolveStructuralProviderReference,
} from "./ports";

export {
  DEFAULT_OCR_RUNTIME_ADAPTER_ID,
  DefaultOCRRuntimeAdapter,
  MOCK_OCR_RUNTIME_ADAPTER_ID,
  MockOCRRuntimeAdapter,
  type DefaultOCRRuntimeAdapterOptions,
  type MockOCRRuntimeAdapterOptions,
} from "./adapters";

export {
  IN_MEMORY_OCR_RUNTIME_STORE_ID,
  InMemoryOCRRuntimeStore,
  type InMemoryOCRRuntimeStoreOptions,
  type OCRRuntimeStore,
  type StoredOCRRuntimeSession,
} from "./store";

export {
  OCRRuntimeFactory,
  createOCRRuntimeFactory,
  type OCRRuntimeFactoryOptions,
} from "./factory";

export { createOCRRuntimePort } from "./providers";

export { getOCRRuntimeHealthSummary, type OCRRuntimeHealthSummary } from "./demo";
