/**
 * Enterprise Execution Dependency Registry Foundation — Ports & Adapters (EPC-24 Sprint 09).
 *
 * Fluxo oficial:
 *   Application → ExecutionDependencyRegistryPort → ExecutionDependencyRegistryAdapter
 *     → ExecutionDependencyRegistryStore → ExecutionDependencyRegistryFactory
 *     → ExecutionDependencyRegistryProvider
 *
 * O Dependency Registry NÃO resolve dependências. NÃO ordena execução.
 * NÃO calcula DAG. NÃO acessa Engines. NÃO persiste em banco.
 * Apenas representa estruturalmente as dependências entre capacidades e componentes.
 *
 * Fluxo de orquestração:
 *   Execution Context
 *     → Execution Dependency Registry
 *     → Execution Context atualizado (referência estrutural)
 *
 * EPC-24 Sprint 09: registro estrutural apenas.
 * Nenhuma Engine é invocada. Nenhuma dependência é resolvida.
 */
export type {
  ExecutionDependency,
  ExecutionDependencyCapabilities,
  ExecutionDependencyDefinition,
  ExecutionDependencyEdge,
  ExecutionDependencyFilter,
  ExecutionDependencyGraph,
  ExecutionDependencyHealth,
  ExecutionDependencyMetadata,
  ExecutionDependencyNode,
  ExecutionDependencyNodeRole,
  ExecutionDependencyRecordKind,
  ExecutionDependencyReference,
  ExecutionDependencyRegistry,
  ExecutionDependencyRegistryPort,
  ExecutionDependencyRegistryPortCapabilities,
  ExecutionDependencyRegistryPortHealth,
  ExecutionDependencyRegistryProviderId,
  ExecutionDependencyRegistryProviderOptions,
  ExecutionDependencyResult,
  ExecutionDependencyStatistics,
  ExecutionDependencyStatisticsResult,
  FindDependenciesInput,
  FindDependenciesResult,
  GetDependencyInput,
  GetDependencyResult,
  ListDependenciesInput,
  ListDependenciesResult,
  RegisterDependencyInput,
  RegisterDependencyResult,
} from "./ports";

export {
  STRUCTURAL_DEPENDENCY_REGISTRY_CAPABILITY,
  createDependencyDefinitionId,
  createDependencyEdgeId,
  createDependencyGraphId,
  createDependencyNodeId,
  createExecutionDependencyId,
  createExecutionDependencyRegistryId,
  resetAllExecutionDependencyRegistryIdSequences,
  resetDependencyDefinitionIdSequence,
  resetDependencyEdgeIdSequence,
  resetDependencyGraphIdSequence,
  resetDependencyNodeIdSequence,
  resetExecutionDependencyIdSequence,
  resetExecutionDependencyRegistryIdSequence,
} from "./ports";

export {
  DEFAULT_EXECUTION_DEPENDENCY_REGISTRY_ADAPTER_ID,
  DEFAULT_EXECUTION_DEPENDENCY_REGISTRY_VERSION,
  DefaultExecutionDependencyRegistryAdapter,
  MOCK_EXECUTION_DEPENDENCY_REGISTRY_ADAPTER_ID,
  MOCK_EXECUTION_DEPENDENCY_REGISTRY_VERSION,
  MockExecutionDependencyRegistryAdapter,
  type DefaultExecutionDependencyRegistryRuntime,
  type MockExecutionDependencyRegistryAdapterOptions,
} from "./adapters";

export {
  DEFAULT_EXECUTION_DEPENDENCY_REGISTRY_STORE_ID,
  DefaultExecutionDependencyRegistryStore,
  type DefaultExecutionDependencyRegistryStoreOptions,
  type ExecutionDependencyRegistryStore,
  type StoredExecutionDependency,
  type StoredExecutionDependencyRegistry,
} from "./store";

export {
  ExecutionDependencyRegistryFactory,
  createExecutionDependencyRegistryFactory,
  type ExecutionDependencyRegistryFactoryOptions,
} from "./factory";

export { createExecutionDependencyRegistryPort } from "./providers";

export {
  getExecutionDependencyRegistryHealthSummary,
  type ExecutionDependencyRegistryHealthSummary,
} from "./demo";
