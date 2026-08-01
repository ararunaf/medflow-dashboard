/**
 * Enterprise Execution Policy Registry Foundation — Ports & Adapters (EPC-24 Sprint 10).
 *
 * Fluxo oficial:
 *   Application → ExecutionPolicyRegistryPort → ExecutionPolicyRegistryAdapter
 *     → ExecutionPolicyRegistryStore → ExecutionPolicyRegistryFactory
 *     → ExecutionPolicyRegistryProvider
 *
 * O Policy Registry NÃO interpreta políticas. NÃO aplica regras.
 * NÃO invoca Rule Engine. NÃO invoca Decision Engine.
 * NÃO acessa Engines. NÃO persiste em banco.
 * Apenas representa estruturalmente as políticas disponíveis.
 *
 * Fluxo de orquestração:
 *   Execution Context
 *     → Execution Policy Registry
 *     → Execution Context atualizado (referência estrutural)
 *
 * EPC-24 Sprint 10: registro estrutural apenas.
 * Nenhuma Engine é invocada. Nenhuma política é avaliada.
 */
export type {
  ExecutionPolicy,
  ExecutionPolicyCapabilities,
  ExecutionPolicyCategory,
  ExecutionPolicyCategoryKind,
  ExecutionPolicyDefinition,
  ExecutionPolicyFilter,
  ExecutionPolicyHealth,
  ExecutionPolicyMetadata,
  ExecutionPolicyRecordKind,
  ExecutionPolicyReference,
  ExecutionPolicyRegistry,
  ExecutionPolicyRegistryPort,
  ExecutionPolicyRegistryPortCapabilities,
  ExecutionPolicyRegistryPortHealth,
  ExecutionPolicyRegistryProviderId,
  ExecutionPolicyRegistryProviderOptions,
  ExecutionPolicyResult,
  ExecutionPolicyScope,
  ExecutionPolicyScopeKind,
  ExecutionPolicyStatistics,
  ExecutionPolicyStatisticsResult,
  FindPoliciesInput,
  FindPoliciesResult,
  GetPolicyInput,
  GetPolicyResult,
  ListPoliciesInput,
  ListPoliciesResult,
  RegisterPolicyInput,
  RegisterPolicyResult,
} from "./ports";

export {
  STRUCTURAL_POLICY_REGISTRY_CAPABILITY,
  createExecutionPolicyId,
  createExecutionPolicyRegistryId,
  createPolicyCategoryId,
  createPolicyDefinitionId,
  createPolicyScopeId,
  resetAllExecutionPolicyRegistryIdSequences,
  resetExecutionPolicyIdSequence,
  resetExecutionPolicyRegistryIdSequence,
  resetPolicyCategoryIdSequence,
  resetPolicyDefinitionIdSequence,
  resetPolicyScopeIdSequence,
} from "./ports";

export {
  DEFAULT_EXECUTION_POLICY_REGISTRY_ADAPTER_ID,
  DEFAULT_EXECUTION_POLICY_REGISTRY_VERSION,
  DefaultExecutionPolicyRegistryAdapter,
  MOCK_EXECUTION_POLICY_REGISTRY_ADAPTER_ID,
  MOCK_EXECUTION_POLICY_REGISTRY_VERSION,
  MockExecutionPolicyRegistryAdapter,
  type DefaultExecutionPolicyRegistryRuntime,
  type MockExecutionPolicyRegistryAdapterOptions,
} from "./adapters";

export {
  DEFAULT_EXECUTION_POLICY_REGISTRY_STORE_ID,
  DefaultExecutionPolicyRegistryStore,
  type DefaultExecutionPolicyRegistryStoreOptions,
  type ExecutionPolicyRegistryStore,
  type StoredExecutionPolicy,
  type StoredExecutionPolicyRegistry,
} from "./store";

export {
  ExecutionPolicyRegistryFactory,
  createExecutionPolicyRegistryFactory,
  type ExecutionPolicyRegistryFactoryOptions,
} from "./factory";

export { createExecutionPolicyRegistryPort } from "./providers";

export {
  getExecutionPolicyRegistryHealthSummary,
  type ExecutionPolicyRegistryHealthSummary,
} from "./demo";
