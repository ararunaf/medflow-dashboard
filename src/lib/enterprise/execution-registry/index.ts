/**
 * Enterprise Execution Registry Foundation — Ports & Adapters (EPC-24 Sprint 06).
 *
 * Fluxo oficial:
 *   Application → ExecutionRegistryPort → ExecutionRegistryAdapter
 *     → ExecutionRegistryStore → ExecutionRegistryFactory
 *     → ExecutionRegistryProvider
 *
 * O Registry NÃO persiste em banco. NÃO usa Supabase.
 * NÃO executa Engines. NÃO implementa histórico funcional.
 * Apenas representa estruturalmente o catálogo de execuções.
 *
 * Fluxo de orquestração:
 *   Execution Context
 *     → Execution Registry
 *     → Execution Context atualizado (referência estrutural)
 *
 * EPC-24 Sprint 06: registro estrutural apenas.
 * Nenhuma persistência real. Nenhuma Engine é invocada.
 */
export type {
  ExecutionRegistryCapabilities,
  ExecutionRegistryEntry,
  ExecutionRegistryFilter,
  ExecutionRegistryHealth,
  ExecutionRegistryIndex,
  ExecutionRegistryMetadata,
  ExecutionRegistryPort,
  ExecutionRegistryPortCapabilities,
  ExecutionRegistryPortHealth,
  ExecutionRegistryProviderId,
  ExecutionRegistryProviderOptions,
  ExecutionRegistryQuery,
  ExecutionRegistryRecord,
  ExecutionRegistryRecordKind,
  ExecutionRegistryReference,
  ExecutionRegistryResult,
  ExecutionRegistrySnapshot,
  ExecutionRegistryStatistics,
  ExecutionRegistryStatisticsResult,
  FindRegistryExecutionInput,
  FindRegistryExecutionResult,
  GetRegistryExecutionInput,
  GetRegistryExecutionResult,
  ListRegistryExecutionsInput,
  ListRegistryExecutionsResult,
  RegisterExecutionInput,
  RegisterExecutionResult,
  RemoveRegistryExecutionInput,
  RemoveRegistryExecutionResult,
} from "./ports";

export {
  STRUCTURAL_REGISTRY_CAPABILITY,
  createExecutionRegistryId,
  createRegistryIndexId,
  createRegistryRecordId,
  createRegistrySnapshotId,
  resetAllExecutionRegistryIdSequences,
  resetExecutionRegistryIdSequence,
  resetRegistryIndexIdSequence,
  resetRegistryRecordIdSequence,
  resetRegistrySnapshotIdSequence,
} from "./ports";

export {
  DEFAULT_EXECUTION_REGISTRY_ADAPTER_ID,
  DEFAULT_EXECUTION_REGISTRY_VERSION,
  DefaultExecutionRegistryAdapter,
  MOCK_EXECUTION_REGISTRY_ADAPTER_ID,
  MOCK_EXECUTION_REGISTRY_VERSION,
  MockExecutionRegistryAdapter,
  type DefaultExecutionRegistryRuntime,
  type MockExecutionRegistryAdapterOptions,
} from "./adapters";

export {
  DEFAULT_EXECUTION_REGISTRY_STORE_ID,
  DefaultExecutionRegistryStore,
  type DefaultExecutionRegistryStoreOptions,
  type ExecutionRegistryStore,
  type StoredExecutionRegistryEntry,
} from "./store";

export {
  ExecutionRegistryFactory,
  createExecutionRegistryFactory,
  type ExecutionRegistryFactoryOptions,
} from "./factory";

export { createExecutionRegistryPort } from "./providers";

export { getExecutionRegistryHealthSummary, type ExecutionRegistryHealthSummary } from "./demo";
