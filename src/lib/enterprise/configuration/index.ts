/**
 * Enterprise Configuration Engine — Ports & Adapters (EPC-03).
 *
 * Fluxo oficial:
 *   Application → ConfigurationPort → ConfigurationAdapter
 *     → ConfigurationProvider/Store → Default Configuration Store
 *
 * Domain/Application NÃO devem importar Settings, Feature Flags de produto,
 * Environment Manager ou detalhes de cooperativa/operadora.
 */
export type {
  ConfigurationCapabilities,
  ConfigurationEntry,
  ConfigurationExistsInput,
  ConfigurationExistsResult,
  ConfigurationGetInput,
  ConfigurationGetResult,
  ConfigurationHealth,
  ConfigurationLayer,
  ConfigurationListInput,
  ConfigurationListResult,
  ConfigurationPort,
  ConfigurationProviderId,
  ConfigurationProviderOptions,
  ConfigurationRemoveInput,
  ConfigurationRemoveResult,
  ConfigurationResolutionContext,
  ConfigurationResolutionLayer,
  ConfigurationScope,
  ConfigurationSetInput,
  ConfigurationSetResult,
  ConfigurationValue,
  ConfigurationValueKind,
  FeatureFlagDefinition,
  FeatureFlagKey,
  FeatureFlagState,
} from "./ports";

export {
  CONFIGURATION_HIERARCHY,
  CONFIGURATION_RESOLUTION_ORDER,
  FEATURE_FLAG_KEY_PREFIX,
  buildResolutionScopes,
  composeConfigurationStorageKey,
  getConfigurationResolutionOrder,
  getFeatureFlagState,
  getOfficialConfigurationHierarchy,
  layerToResolutionLayer,
  scopeToSegment,
  setFeatureFlagState,
  toFeatureFlagConfigurationKey,
} from "./ports";

export {
  DEFAULT_CONFIGURATION_ADAPTER_ID,
  DefaultConfigurationAdapter,
  MockConfigurationAdapter,
  type DefaultConfigurationRuntime,
  type MockConfigurationAdapterOptions,
} from "./adapters";

export {
  DEFAULT_CONFIGURATION_STORE_ID,
  DefaultConfigurationStore,
  type ConfigurationStore,
  type DefaultConfigurationStoreOptions,
  type StoredConfigurationEntry,
} from "./store";

export { createConfigurationPort } from "./providers";

export { getConfigurationHealthSummary, type ConfigurationHealthSummary } from "./demo";
