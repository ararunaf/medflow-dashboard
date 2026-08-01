/**
 * Adapters — Execution Resource Registry Foundation (EPC-24 Sprint 13).
 */
export {
  DEFAULT_EXECUTION_RESOURCE_REGISTRY_ADAPTER_ID,
  DEFAULT_EXECUTION_RESOURCE_REGISTRY_VERSION,
  DefaultExecutionResourceRegistryAdapter,
  type DefaultExecutionResourceRegistryRuntime,
} from "./default-execution-resource-registry-adapter";

export {
  MOCK_EXECUTION_RESOURCE_REGISTRY_ADAPTER_ID,
  MOCK_EXECUTION_RESOURCE_REGISTRY_VERSION,
  MockExecutionResourceRegistryAdapter,
  type MockExecutionResourceRegistryAdapterOptions,
} from "./mock-execution-resource-registry-adapter";
