/**
 * Enterprise Execution Capability Registry Foundation — Ports & Adapters (EPC-24 Sprint 08).
 *
 * Fluxo oficial:
 *   Application → ExecutionCapabilityRegistryPort → ExecutionCapabilityRegistryAdapter
 *     → ExecutionCapabilityRegistryStore → ExecutionCapabilityRegistryFactory
 *     → ExecutionCapabilityRegistryProvider
 *
 * O Capability Registry NÃO executa capacidades. NÃO usa descoberta automática.
 * NÃO usa reflexão. NÃO usa plugins. NÃO usa carregamento dinâmico.
 * NÃO acessa Engines. NÃO persiste em banco.
 * Apenas representa estruturalmente as capacidades disponíveis.
 *
 * Fluxo de orquestração:
 *   Execution Context
 *     → Execution Capability Registry
 *     → Execution Context atualizado (referência estrutural)
 *
 * EPC-24 Sprint 08: registro estrutural apenas.
 * Nenhuma Engine é invocada. Nenhuma capacidade é executada.
 */
export type {
  ExecutionCapability,
  ExecutionCapabilityCapabilities,
  ExecutionCapabilityCategory,
  ExecutionCapabilityCategoryKind,
  ExecutionCapabilityDefinition,
  ExecutionCapabilityDescriptor,
  ExecutionCapabilityFilter,
  ExecutionCapabilityHealth,
  ExecutionCapabilityMetadata,
  ExecutionCapabilityRecordKind,
  ExecutionCapabilityReference,
  ExecutionCapabilityRegistry,
  ExecutionCapabilityRegistryPort,
  ExecutionCapabilityRegistryPortCapabilities,
  ExecutionCapabilityRegistryPortHealth,
  ExecutionCapabilityRegistryProviderId,
  ExecutionCapabilityRegistryProviderOptions,
  ExecutionCapabilityResult,
  ExecutionCapabilityStatistics,
  ExecutionCapabilityStatisticsResult,
  FindCapabilitiesInput,
  FindCapabilitiesResult,
  GetCapabilityInput,
  GetCapabilityResult,
  ListCapabilitiesInput,
  ListCapabilitiesResult,
  RegisterCapabilityInput,
  RegisterCapabilityResult,
} from "./ports";

export {
  STRUCTURAL_CAPABILITY_REGISTRY_CAPABILITY,
  createCapabilityCategoryId,
  createCapabilityDefinitionId,
  createCapabilityDescriptorId,
  createExecutionCapabilityId,
  createExecutionCapabilityRegistryId,
  resetAllExecutionCapabilityRegistryIdSequences,
  resetCapabilityCategoryIdSequence,
  resetCapabilityDefinitionIdSequence,
  resetCapabilityDescriptorIdSequence,
  resetExecutionCapabilityIdSequence,
  resetExecutionCapabilityRegistryIdSequence,
} from "./ports";

export {
  DEFAULT_EXECUTION_CAPABILITY_REGISTRY_ADAPTER_ID,
  DEFAULT_EXECUTION_CAPABILITY_REGISTRY_VERSION,
  DefaultExecutionCapabilityRegistryAdapter,
  MOCK_EXECUTION_CAPABILITY_REGISTRY_ADAPTER_ID,
  MOCK_EXECUTION_CAPABILITY_REGISTRY_VERSION,
  MockExecutionCapabilityRegistryAdapter,
  type DefaultExecutionCapabilityRegistryRuntime,
  type MockExecutionCapabilityRegistryAdapterOptions,
} from "./adapters";

export {
  DEFAULT_EXECUTION_CAPABILITY_REGISTRY_STORE_ID,
  DefaultExecutionCapabilityRegistryStore,
  type DefaultExecutionCapabilityRegistryStoreOptions,
  type ExecutionCapabilityRegistryStore,
  type StoredExecutionCapability,
  type StoredExecutionCapabilityRegistry,
} from "./store";

export {
  ExecutionCapabilityRegistryFactory,
  createExecutionCapabilityRegistryFactory,
  type ExecutionCapabilityRegistryFactoryOptions,
} from "./factory";

export { createExecutionCapabilityRegistryPort } from "./providers";

export {
  getExecutionCapabilityRegistryHealthSummary,
  type ExecutionCapabilityRegistryHealthSummary,
} from "./demo";
