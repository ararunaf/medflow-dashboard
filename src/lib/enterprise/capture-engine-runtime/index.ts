/**
 * Enterprise Capture Engine Runtime — Document Intelligence Platform (DIP-02).
 *
 * Fluxo oficial:
 *   Produto → Enterprise Runtime → CaptureEngineRuntimePort
 *     → Canonical Execution Orchestrator → DocumentIntakeRuntime
 *     → DocumentIntakePort → Adapter → Implementação existente
 *
 * DIP-02: componente funcional oficial de captura — sem OCR, IA, XML, TISS,
 * parser, classificação documental, Storage Manager, versionamento, busca,
 * Workflow novo ou Rule Engine novo.
 */
export type {
  CanonicalCaptureCapabilities,
  CanonicalCaptureConfiguration,
  CanonicalCaptureIdentity,
  CanonicalCaptureMetadata,
  CanonicalCaptureReference,
  CanonicalCaptureRequest,
  CanonicalCaptureResult,
  CanonicalCaptureSession,
  CaptureEngineRuntimeCapabilities,
  CaptureEngineRuntimeEnterpriseDeps,
  CaptureEngineRuntimeHealth,
  CaptureEngineRuntimePort,
  CaptureEngineRuntimeProviderId,
  CaptureEngineRuntimeProviderOptions,
  CaptureEngineRuntimeSessionStatus,
  GetCaptureRuntimeSessionInput,
  GetCaptureRuntimeSessionResult,
  ListCaptureRuntimeSessionsInput,
  ListCaptureRuntimeSessionsResult,
  RegisterCaptureInput,
  RegisterCaptureResult,
} from "./ports";

export {
  createCaptureRuntimeSessionId,
  resetAllCaptureEngineRuntimeIdSequences,
  resetCaptureRuntimeSessionIdSequence,
} from "./ports";

export {
  DEFAULT_CAPTURE_ENGINE_RUNTIME_ADAPTER_ID,
  DefaultCaptureEngineRuntimeAdapter,
  MOCK_CAPTURE_ENGINE_RUNTIME_ADAPTER_ID,
  MockCaptureEngineRuntimeAdapter,
  type DefaultCaptureEngineRuntimeAdapterOptions,
  type MockCaptureEngineRuntimeAdapterOptions,
} from "./adapters";

export {
  IN_MEMORY_CAPTURE_ENGINE_RUNTIME_STORE_ID,
  InMemoryCaptureEngineRuntimeStore,
  type CaptureEngineRuntimeStore,
  type InMemoryCaptureEngineRuntimeStoreOptions,
  type StoredCaptureEngineRuntimeSession,
} from "./store";

export {
  CaptureEngineRuntimeFactory,
  createCaptureEngineRuntimeFactory,
  type CaptureEngineRuntimeFactoryOptions,
} from "./factory";

export { createCaptureEngineRuntimePort } from "./providers";

export {
  getCaptureEngineRuntimeHealthSummary,
  type CaptureEngineRuntimeHealthSummary,
} from "./demo";
