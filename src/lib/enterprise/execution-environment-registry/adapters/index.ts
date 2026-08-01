/**
 * Adapters — Execution Environment Registry Foundation (EPC-24 Sprint 14).
 */
export {
  DEFAULT_EXECUTION_ENVIRONMENT_REGISTRY_ADAPTER_ID,
  DEFAULT_EXECUTION_ENVIRONMENT_REGISTRY_VERSION,
  DefaultExecutionEnvironmentRegistryAdapter,
  type DefaultExecutionEnvironmentRegistryRuntime,
} from "./default-execution-environment-registry-adapter";

export {
  MOCK_EXECUTION_ENVIRONMENT_REGISTRY_ADAPTER_ID,
  MOCK_EXECUTION_ENVIRONMENT_REGISTRY_VERSION,
  MockExecutionEnvironmentRegistryAdapter,
  type MockExecutionEnvironmentRegistryAdapterOptions,
} from "./mock-execution-environment-registry-adapter";
