/**
 * Enterprise Execution Resource Registry Foundation — Ports & Adapters (EPC-24 Sprint 13).
 *
 * Fluxo oficial:
 *   Application → ExecutionResourceRegistryPort → ExecutionResourceRegistryAdapter
 *     → ExecutionResourceRegistryStore → ExecutionResourceRegistryFactory
 *     → ExecutionResourceRegistryProvider
 *
 * O Resource Registry NÃO aloca recursos. NÃO reserva recursos.
 * NÃO aloca recursos. NÃO balanceia carga.
 * NÃO acessa Engines. NÃO persiste em banco.
 * Apenas representa estruturalmente os recursos disponíveis.
 *
 * Fluxo de orquestração:
 *   Execution Context
 *     → Execution Resource Registry
 *     → Execution Context atualizado (referência estrutural)
 *
 * EPC-24 Sprint 13: registro estrutural apenas.
 * Nenhuma Engine é invocada. Nenhum recurso é alocado.
 */
export type {
  ExecutionResource,
  ExecutionResourceCapabilities,
  ExecutionResourceCategory,
  ExecutionResourceCategoryKind,
  ExecutionResourceDefinition,
  ExecutionResourceFilter,
  ExecutionResourceHealth,
  ExecutionResourceMetadata,
  ExecutionResourceRecordKind,
  ExecutionResourceReference,
  ExecutionResourceRegistry,
  ExecutionResourceRegistryPort,
  ExecutionResourceRegistryPortCapabilities,
  ExecutionResourceRegistryPortHealth,
  ExecutionResourceRegistryProviderId,
  ExecutionResourceRegistryProviderOptions,
  ExecutionResourceResult,
  ExecutionResourceScope,
  ExecutionResourceScopeKind,
  ExecutionResourceStatistics,
  ExecutionResourceStatisticsResult,
  FindResourcesInput,
  FindResourcesResult,
  GetResourceInput,
  GetResourceResult,
  ListResourcesInput,
  ListResourcesResult,
  RegisterResourceInput,
  RegisterResourceResult,
} from "./ports";

export {
  STRUCTURAL_RESOURCE_REGISTRY_CAPABILITY,
  createExecutionResourceId,
  createExecutionResourceRegistryId,
  createResourceCategoryId,
  createResourceDefinitionId,
  createResourceScopeId,
  resetAllExecutionResourceRegistryIdSequences,
  resetExecutionResourceIdSequence,
  resetExecutionResourceRegistryIdSequence,
  resetResourceCategoryIdSequence,
  resetResourceDefinitionIdSequence,
  resetResourceScopeIdSequence,
} from "./ports";

export {
  DEFAULT_EXECUTION_RESOURCE_REGISTRY_ADAPTER_ID,
  DEFAULT_EXECUTION_RESOURCE_REGISTRY_VERSION,
  DefaultExecutionResourceRegistryAdapter,
  MOCK_EXECUTION_RESOURCE_REGISTRY_ADAPTER_ID,
  MOCK_EXECUTION_RESOURCE_REGISTRY_VERSION,
  MockExecutionResourceRegistryAdapter,
  type DefaultExecutionResourceRegistryRuntime,
  type MockExecutionResourceRegistryAdapterOptions,
} from "./adapters";

export {
  DEFAULT_EXECUTION_RESOURCE_REGISTRY_STORE_ID,
  DefaultExecutionResourceRegistryStore,
  type DefaultExecutionResourceRegistryStoreOptions,
  type ExecutionResourceRegistryStore,
  type StoredExecutionResource,
  type StoredExecutionResourceRegistry,
} from "./store";

export {
  ExecutionResourceRegistryFactory,
  createExecutionResourceRegistryFactory,
  type ExecutionResourceRegistryFactoryOptions,
} from "./factory";

export { createExecutionResourceRegistryPort } from "./providers";

export {
  getExecutionResourceRegistryHealthSummary,
  type ExecutionResourceRegistryHealthSummary,
} from "./demo";
