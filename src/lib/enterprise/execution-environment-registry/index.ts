/**
 * Enterprise Execution Environment Registry Foundation — Ports & Adapters (EPC-24 Sprint 14).
 *
 * Fluxo oficial:
 *   Application → ExecutionEnvironmentRegistryPort → ExecutionEnvironmentRegistryAdapter
 *     → ExecutionEnvironmentRegistryStore → ExecutionEnvironmentRegistryFactory
 *     → ExecutionEnvironmentRegistryProvider
 *
 * O Environment Registry NÃO seleciona ambientes. NÃO provisiona ambientes.
 * NÃO seleciona ambientes. NÃO ativa ambientes.
 * NÃO acessa Engines. NÃO persiste em banco.
 * Apenas representa estruturalmente os ambientes disponíveis.
 *
 * Fluxo de orquestração:
 *   Execution Context
 *     → Execution Environment Registry
 *     → Execution Context atualizado (referência estrutural)
 *
 * EPC-24 Sprint 14: registro estrutural apenas.
 * Nenhuma Engine é invocada. Nenhum ambiente é selecionado / ativado.
 */
export type {
  ExecutionEnvironment,
  ExecutionEnvironmentCapabilities,
  ExecutionEnvironmentCategory,
  ExecutionEnvironmentCategoryKind,
  ExecutionEnvironmentDefinition,
  ExecutionEnvironmentFilter,
  ExecutionEnvironmentHealth,
  ExecutionEnvironmentMetadata,
  ExecutionEnvironmentRecordKind,
  ExecutionEnvironmentReference,
  ExecutionEnvironmentRegistry,
  ExecutionEnvironmentRegistryPort,
  ExecutionEnvironmentRegistryPortCapabilities,
  ExecutionEnvironmentRegistryPortHealth,
  ExecutionEnvironmentRegistryProviderId,
  ExecutionEnvironmentRegistryProviderOptions,
  ExecutionEnvironmentResult,
  ExecutionEnvironmentScope,
  ExecutionEnvironmentScopeKind,
  ExecutionEnvironmentStatistics,
  ExecutionEnvironmentStatisticsResult,
  FindEnvironmentsInput,
  FindEnvironmentsResult,
  GetEnvironmentInput,
  GetEnvironmentResult,
  ListEnvironmentsInput,
  ListEnvironmentsResult,
  RegisterEnvironmentInput,
  RegisterEnvironmentResult,
} from "./ports";

export {
  STRUCTURAL_ENVIRONMENT_REGISTRY_CAPABILITY,
  createExecutionEnvironmentId,
  createExecutionEnvironmentRegistryId,
  createEnvironmentCategoryId,
  createEnvironmentDefinitionId,
  createEnvironmentScopeId,
  resetAllExecutionEnvironmentRegistryIdSequences,
  resetExecutionEnvironmentIdSequence,
  resetExecutionEnvironmentRegistryIdSequence,
  resetEnvironmentCategoryIdSequence,
  resetEnvironmentDefinitionIdSequence,
  resetEnvironmentScopeIdSequence,
} from "./ports";

export {
  DEFAULT_EXECUTION_ENVIRONMENT_REGISTRY_ADAPTER_ID,
  DEFAULT_EXECUTION_ENVIRONMENT_REGISTRY_VERSION,
  DefaultExecutionEnvironmentRegistryAdapter,
  MOCK_EXECUTION_ENVIRONMENT_REGISTRY_ADAPTER_ID,
  MOCK_EXECUTION_ENVIRONMENT_REGISTRY_VERSION,
  MockExecutionEnvironmentRegistryAdapter,
  type DefaultExecutionEnvironmentRegistryRuntime,
  type MockExecutionEnvironmentRegistryAdapterOptions,
} from "./adapters";

export {
  DEFAULT_EXECUTION_ENVIRONMENT_REGISTRY_STORE_ID,
  DefaultExecutionEnvironmentRegistryStore,
  type DefaultExecutionEnvironmentRegistryStoreOptions,
  type ExecutionEnvironmentRegistryStore,
  type StoredExecutionEnvironment,
  type StoredExecutionEnvironmentRegistry,
} from "./store";

export {
  ExecutionEnvironmentRegistryFactory,
  createExecutionEnvironmentRegistryFactory,
  type ExecutionEnvironmentRegistryFactoryOptions,
} from "./factory";

export { createExecutionEnvironmentRegistryPort } from "./providers";

export {
  getExecutionEnvironmentRegistryHealthSummary,
  type ExecutionEnvironmentRegistryHealthSummary,
} from "./demo";
