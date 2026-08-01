/**
 * Ports — Processing Provider Framework (EPC-14).
 */
export type { ProcessingProviderPort } from "./processing-provider-port";

export type {
  GetProviderInput,
  GetProviderResult,
  HealthStatus,
  ListProvidersInput,
  ListProvidersResult,
  ProcessingProviderCapabilities,
  ProcessingProviderHealth,
  ProcessingProviderProviderId,
  ProcessingProviderProviderOptions,
  ProviderCapabilities,
  ProviderConfigurationReference,
  ProviderDescriptor,
  ProviderId,
  ProviderMetadataReference,
  ProviderName,
  ProviderTag,
  ProviderType,
  ProviderVersion,
  RegisterProviderInput,
  RegisterProviderResult,
  UnregisterProviderInput,
  UnregisterProviderResult,
} from "./types";

export { HEALTH_STATUSES, PROVIDER_TYPES } from "./types";

export {
  declaresAsync,
  declaresAttachments,
  declaresBatch,
  declaresConfidence,
  declaresMetadata,
  declaresStreaming,
  defineProviderCapabilities,
  emptyProviderCapabilities,
} from "./capabilities";

export {
  hasKnownProviderType,
  listProviderTypes,
  providerHasKnownProviderType,
} from "./provider-type";

export { createProviderId, resetProviderIdSequence } from "./identity";
