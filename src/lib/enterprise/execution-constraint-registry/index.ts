/**
 * Enterprise Execution Constraint Registry Foundation — Ports & Adapters (EPC-24 Sprint 11).
 *
 * Fluxo oficial:
 *   Application → ExecutionConstraintRegistryPort → ExecutionConstraintRegistryAdapter
 *     → ExecutionConstraintRegistryStore → ExecutionConstraintRegistryFactory
 *     → ExecutionConstraintRegistryProvider
 *
 * O Constraint Registry NÃO interpreta restrições. NÃO aplica regras.
 * NÃO invoca Rule Engine. NÃO invoca Decision Engine.
 * NÃO acessa Engines. NÃO persiste em banco.
 * Apenas representa estruturalmente as restrições disponíveis.
 *
 * Fluxo de orquestração:
 *   Execution Context
 *     → Execution Constraint Registry
 *     → Execution Context atualizado (referência estrutural)
 *
 * EPC-24 Sprint 11: registro estrutural apenas.
 * Nenhuma Engine é invocada. Nenhuma restrição é avaliada.
 */
export type {
  ExecutionConstraint,
  ExecutionConstraintCapabilities,
  ExecutionConstraintCategory,
  ExecutionConstraintCategoryKind,
  ExecutionConstraintDefinition,
  ExecutionConstraintFilter,
  ExecutionConstraintHealth,
  ExecutionConstraintMetadata,
  ExecutionConstraintRecordKind,
  ExecutionConstraintReference,
  ExecutionConstraintRegistry,
  ExecutionConstraintRegistryPort,
  ExecutionConstraintRegistryPortCapabilities,
  ExecutionConstraintRegistryPortHealth,
  ExecutionConstraintRegistryProviderId,
  ExecutionConstraintRegistryProviderOptions,
  ExecutionConstraintResult,
  ExecutionConstraintScope,
  ExecutionConstraintScopeKind,
  ExecutionConstraintStatistics,
  ExecutionConstraintStatisticsResult,
  FindConstraintsInput,
  FindConstraintsResult,
  GetConstraintInput,
  GetConstraintResult,
  ListConstraintsInput,
  ListConstraintsResult,
  RegisterConstraintInput,
  RegisterConstraintResult,
} from "./ports";

export {
  STRUCTURAL_CONSTRAINT_REGISTRY_CAPABILITY,
  createExecutionConstraintId,
  createExecutionConstraintRegistryId,
  createConstraintCategoryId,
  createConstraintDefinitionId,
  createConstraintScopeId,
  resetAllExecutionConstraintRegistryIdSequences,
  resetExecutionConstraintIdSequence,
  resetExecutionConstraintRegistryIdSequence,
  resetConstraintCategoryIdSequence,
  resetConstraintDefinitionIdSequence,
  resetConstraintScopeIdSequence,
} from "./ports";

export {
  DEFAULT_EXECUTION_CONSTRAINT_REGISTRY_ADAPTER_ID,
  DEFAULT_EXECUTION_CONSTRAINT_REGISTRY_VERSION,
  DefaultExecutionConstraintRegistryAdapter,
  MOCK_EXECUTION_CONSTRAINT_REGISTRY_ADAPTER_ID,
  MOCK_EXECUTION_CONSTRAINT_REGISTRY_VERSION,
  MockExecutionConstraintRegistryAdapter,
  type DefaultExecutionConstraintRegistryRuntime,
  type MockExecutionConstraintRegistryAdapterOptions,
} from "./adapters";

export {
  DEFAULT_EXECUTION_CONSTRAINT_REGISTRY_STORE_ID,
  DefaultExecutionConstraintRegistryStore,
  type DefaultExecutionConstraintRegistryStoreOptions,
  type ExecutionConstraintRegistryStore,
  type StoredExecutionConstraint,
  type StoredExecutionConstraintRegistry,
} from "./store";

export {
  ExecutionConstraintRegistryFactory,
  createExecutionConstraintRegistryFactory,
  type ExecutionConstraintRegistryFactoryOptions,
} from "./factory";

export { createExecutionConstraintRegistryPort } from "./providers";

export {
  getExecutionConstraintRegistryHealthSummary,
  type ExecutionConstraintRegistryHealthSummary,
} from "./demo";
