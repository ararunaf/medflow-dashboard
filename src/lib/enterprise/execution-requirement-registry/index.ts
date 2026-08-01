/**
 * Enterprise Execution Requirement Registry Foundation — Ports & Adapters (EPC-24 Sprint 12).
 *
 * Fluxo oficial:
 *   Application → ExecutionRequirementRegistryPort → ExecutionRequirementRegistryAdapter
 *     → ExecutionRequirementRegistryStore → ExecutionRequirementRegistryFactory
 *     → ExecutionRequirementRegistryProvider
 *
 * O Requirement Registry NÃO valida requisitos. NÃO verifica pré-condições.
 * NÃO invoca Rule Engine. NÃO invoca Decision Engine.
 * NÃO acessa Engines. NÃO persiste em banco.
 * Apenas representa estruturalmente as requisitos disponíveis.
 *
 * Fluxo de orquestração:
 *   Execution Context
 *     → Execution Requirement Registry
 *     → Execution Context atualizado (referência estrutural)
 *
 * EPC-24 Sprint 12: registro estrutural apenas.
 * Nenhuma Engine é invocada. Nenhuma requisito é validada.
 */
export type {
  ExecutionRequirement,
  ExecutionRequirementCapabilities,
  ExecutionRequirementCategory,
  ExecutionRequirementCategoryKind,
  ExecutionRequirementDefinition,
  ExecutionRequirementFilter,
  ExecutionRequirementHealth,
  ExecutionRequirementMetadata,
  ExecutionRequirementRecordKind,
  ExecutionRequirementReference,
  ExecutionRequirementRegistry,
  ExecutionRequirementRegistryPort,
  ExecutionRequirementRegistryPortCapabilities,
  ExecutionRequirementRegistryPortHealth,
  ExecutionRequirementRegistryProviderId,
  ExecutionRequirementRegistryProviderOptions,
  ExecutionRequirementResult,
  ExecutionRequirementScope,
  ExecutionRequirementScopeKind,
  ExecutionRequirementStatistics,
  ExecutionRequirementStatisticsResult,
  FindRequirementsInput,
  FindRequirementsResult,
  GetRequirementInput,
  GetRequirementResult,
  ListRequirementsInput,
  ListRequirementsResult,
  RegisterRequirementInput,
  RegisterRequirementResult,
} from "./ports";

export {
  STRUCTURAL_REQUIREMENT_REGISTRY_CAPABILITY,
  createExecutionRequirementId,
  createExecutionRequirementRegistryId,
  createRequirementCategoryId,
  createRequirementDefinitionId,
  createRequirementScopeId,
  resetAllExecutionRequirementRegistryIdSequences,
  resetExecutionRequirementIdSequence,
  resetExecutionRequirementRegistryIdSequence,
  resetRequirementCategoryIdSequence,
  resetRequirementDefinitionIdSequence,
  resetRequirementScopeIdSequence,
} from "./ports";

export {
  DEFAULT_EXECUTION_REQUIREMENT_REGISTRY_ADAPTER_ID,
  DEFAULT_EXECUTION_REQUIREMENT_REGISTRY_VERSION,
  DefaultExecutionRequirementRegistryAdapter,
  MOCK_EXECUTION_REQUIREMENT_REGISTRY_ADAPTER_ID,
  MOCK_EXECUTION_REQUIREMENT_REGISTRY_VERSION,
  MockExecutionRequirementRegistryAdapter,
  type DefaultExecutionRequirementRegistryRuntime,
  type MockExecutionRequirementRegistryAdapterOptions,
} from "./adapters";

export {
  DEFAULT_EXECUTION_REQUIREMENT_REGISTRY_STORE_ID,
  DefaultExecutionRequirementRegistryStore,
  type DefaultExecutionRequirementRegistryStoreOptions,
  type ExecutionRequirementRegistryStore,
  type StoredExecutionRequirement,
  type StoredExecutionRequirementRegistry,
} from "./store";

export {
  ExecutionRequirementRegistryFactory,
  createExecutionRequirementRegistryFactory,
  type ExecutionRequirementRegistryFactoryOptions,
} from "./factory";

export { createExecutionRequirementRegistryPort } from "./providers";

export {
  getExecutionRequirementRegistryHealthSummary,
  type ExecutionRequirementRegistryHealthSummary,
} from "./demo";
