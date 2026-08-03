/**
 * Enterprise TISS Runtime — TISS-01…TISS-09.
 *
 * Fluxo oficial:
 *   Produto → Enterprise Runtime → TISSRuntimePort
 *     → TISSCatalogPort → RulePackEnginePort
 *     → XMLRuntimePort → XMLGenerationRuntimePort
 *     → XMLSerializerRuntimePort → XMLSchemaRuntimePort
 *     → XMLValidationRuntimePort → XSDRuntimePort
 *     → Canonical Execution Orchestrator → TISSProviderPort
 *     → DefaultTISSProviderAdapter → Implementação oficial
 */
export type {
  CanonicalTISSRuntimeSession,
  GetTISSRuntimeSessionInput,
  GetTISSRuntimeSessionResult,
  ListTISSRuntimeSessionsInput,
  ListTISSRuntimeSessionsResult,
  RuntimeTISSProcessInput,
  RuntimeTISSProcessResult,
  TISSRuntimeCapabilities,
  TISSRuntimeEnterpriseDeps,
  TISSRuntimeHealth,
  TISSRuntimePort,
  TISSRuntimeProviderId,
  TISSRuntimeProviderOptions,
  TISSRuntimeSessionStatus,
} from "./ports";

export { createTISSRuntimeSessionId } from "./ports";

export {
  DEFAULT_TISS_RUNTIME_ADAPTER_ID,
  DefaultTISSRuntimeAdapter,
  MOCK_TISS_RUNTIME_ADAPTER_ID,
  MockTISSRuntimeAdapter,
  type DefaultTISSRuntimeAdapterOptions,
  type MockTISSRuntimeAdapterOptions,
} from "./adapters";

export {
  TISSRuntimeFactory,
  createTISSRuntimeFactory,
  type TISSRuntimeFactoryOptions,
} from "./factory";

export { createTISSRuntimePort } from "./providers";

export {
  IN_MEMORY_TISS_RUNTIME_STORE_ID,
  InMemoryTISSRuntimeStore,
  type InMemoryTISSRuntimeStoreOptions,
  type StoredTISSRuntimeSession,
  type TISSRuntimeStore,
} from "./store";

export { getTISSRuntimeHealthSummary, type TISSRuntimeHealthSummary } from "./demo";
