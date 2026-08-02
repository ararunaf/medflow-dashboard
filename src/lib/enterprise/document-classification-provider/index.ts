/**
 * Enterprise Document Classification Provider — Ports & Adapters (CLASS-01).
 *
 * Fluxo oficial:
 *   Produto → Enterprise Runtime → Capture Runtime → OCR Runtime
 *     → Document Classification Runtime → DocumentClassificationProviderPort
 *     → DefaultDocumentClassificationAdapter → Classification Provider
 *
 * CLASS-01: Classification Provider oficial rule-based.
 * Sem IA. Sem LLM. Sem ML. Sem embeddings. Sem RAG.
 * Sem HTTP Azure/OpenAI. Consome apenas resultado do OCR Runtime.
 */
export type {
  DocumentClassificationCapabilities,
  DocumentClassificationConfigurationValidation,
  DocumentClassificationProcessInput,
  DocumentClassificationProcessResult,
  DocumentClassificationProviderHealth,
  DocumentClassificationProviderId,
  DocumentClassificationProviderInfo,
  DocumentClassificationProviderMetadata,
  DocumentClassificationProviderOptions,
  DocumentClassificationProviderPort,
  DocumentClassificationProviderPortCapabilities,
  DocumentClassificationProviderRegistration,
  DocumentClassificationProviderStatus,
  DocumentClassificationRule,
  DocumentClassificationStructuredLog,
  DocumentClassificationTelemetry,
  DocumentClassificationType,
} from "./ports";

export {
  DEFAULT_DOCUMENT_CLASSIFICATION_RULES,
  DEFAULT_MOCK_CLASSIFICATION_CAPABILITIES,
  DEFAULT_RULE_BASED_CLASSIFICATION_CAPABILITIES,
  createDocumentClassificationRequestId,
  defineDocumentClassificationCapabilities,
  emptyDocumentClassificationCapabilities,
} from "./ports";

export {
  DEFAULT_DOCUMENT_CLASSIFICATION_ADAPTER_ID,
  DEFAULT_DOCUMENT_CLASSIFICATION_PROVIDER_VERSION,
  DEFAULT_MOCK_DOCUMENT_CLASSIFICATION_PROVIDER_VERSION,
  DefaultDocumentClassificationAdapter,
  MOCK_DOCUMENT_CLASSIFICATION_ADAPTER_ID,
  MockDocumentClassificationAdapter,
  RuleBasedDocumentClassificationAdapter,
  type DefaultDocumentClassificationAdapterOptions,
  type MockDocumentClassificationAdapterOptions,
} from "./adapters";

export {
  DocumentClassificationProviderFactory,
  createDocumentClassificationProviderFactory,
  type DocumentClassificationProviderFactoryOptions,
} from "./factory";

export {
  BUILTIN_DOCUMENT_CLASSIFICATION_PROVIDER_COUNT,
  DocumentClassificationProviderRegistry,
  createDefaultDocumentClassificationProviderRegistry,
  type DocumentClassificationProviderRegistrySnapshot,
} from "./registry";

export {
  createDocumentClassificationProviderPort,
  getDocumentClassificationProviderFactory,
} from "./providers";

export {
  getDocumentClassificationProviderHealthSummary,
  type DocumentClassificationProviderHealthSummary,
} from "./demo";
