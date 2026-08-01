/**
 * Adapters — Execution Dependency Registry Foundation (EPC-24 Sprint 09).
 */
export {
  DEFAULT_EXECUTION_DEPENDENCY_REGISTRY_ADAPTER_ID,
  DEFAULT_EXECUTION_DEPENDENCY_REGISTRY_VERSION,
  DefaultExecutionDependencyRegistryAdapter,
  type DefaultExecutionDependencyRegistryRuntime,
} from "./default-execution-dependency-registry-adapter";

export {
  MOCK_EXECUTION_DEPENDENCY_REGISTRY_ADAPTER_ID,
  MOCK_EXECUTION_DEPENDENCY_REGISTRY_VERSION,
  MockExecutionDependencyRegistryAdapter,
  type MockExecutionDependencyRegistryAdapterOptions,
} from "./mock-execution-dependency-registry-adapter";
