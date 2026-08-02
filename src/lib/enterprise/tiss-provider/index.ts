/**
 * Enterprise TISS Provider — Ports & Adapters (TISS-01).
 *
 * Fluxo oficial:
 *   Produto → Enterprise Runtime → TISS Runtime
 *     → TISSProviderPort → DefaultTISSProviderAdapter → Implementação oficial
 *
 * TISS-01: infraestrutura oficial Enterprise TISS.
 * Sem XML real. Sem envio a operadoras. Sem validações clínicas/ANS.
 * Sem acesso direto a banco / Storage / OCR.
 * Sem lógica específica de operadora / contrato / tenant / cliente.
 */
export type {
  CanonicalTISSMetadata,
  CanonicalTISSMode,
  CanonicalTISSProfileReference,
  CanonicalTISSProviderReference,
  CanonicalTISSRequest,
  CanonicalTISSResult,
  TISSProcessInput,
  TISSProviderCapabilities,
  TISSProviderConfigurationValidation,
  TISSProviderHealth,
  TISSProviderId,
  TISSProviderInfo,
  TISSProviderMetadata,
  TISSProviderOperationResult,
  TISSProviderOptions,
  TISSProviderPort,
  TISSProviderPortCapabilities,
  TISSProviderRegistration,
  TISSProviderStatus,
  TISSProviderStructuredLog,
  TISSProviderTelemetry,
} from "./ports";

export {
  DEFAULT_MOCK_TISS_PROVIDER_CAPABILITIES,
  DEFAULT_TISS_PROVIDER_CAPABILITIES,
  createTISSProviderRequestId,
  defineTISSProviderCapabilities,
  emptyTISSProviderCapabilities,
} from "./ports";

export {
  DEFAULT_TISS_PROVIDER_ADAPTER_ID,
  DEFAULT_TISS_PROVIDER_VERSION,
  DEFAULT_MOCK_TISS_PROVIDER_VERSION,
  DefaultTISSProviderAdapter,
  EnterpriseTISSProviderAdapter,
  MOCK_TISS_PROVIDER_ADAPTER_ID,
  MockTISSProviderAdapter,
  type DefaultTISSProviderAdapterOptions,
  type MockTISSProviderAdapterOptions,
} from "./adapters";

export {
  TISSProviderFactory,
  createTISSProviderFactory,
  type TISSProviderFactoryOptions,
} from "./factory";

export {
  BUILTIN_TISS_PROVIDER_COUNT,
  TISSProviderRegistry,
  createDefaultTISSProviderRegistry,
  type TISSProviderRegistrySnapshot,
} from "./registry";

export { createTISSProviderPort, getTISSProviderFactory } from "./providers";

export { getTISSProviderHealthSummary, type TISSProviderHealthSummary } from "./demo";
