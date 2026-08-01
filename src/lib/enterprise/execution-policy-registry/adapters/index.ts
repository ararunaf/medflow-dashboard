/**
 * Adapters — Execution Policy Registry Foundation (EPC-24 Sprint 10).
 */
export {
  DEFAULT_EXECUTION_POLICY_REGISTRY_ADAPTER_ID,
  DEFAULT_EXECUTION_POLICY_REGISTRY_VERSION,
  DefaultExecutionPolicyRegistryAdapter,
  type DefaultExecutionPolicyRegistryRuntime,
} from "./default-execution-policy-registry-adapter";

export {
  MOCK_EXECUTION_POLICY_REGISTRY_ADAPTER_ID,
  MOCK_EXECUTION_POLICY_REGISTRY_VERSION,
  MockExecutionPolicyRegistryAdapter,
  type MockExecutionPolicyRegistryAdapterOptions,
} from "./mock-execution-policy-registry-adapter";
