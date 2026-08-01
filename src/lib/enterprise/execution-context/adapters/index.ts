/**
 * Adapters — Execution Context Foundation (EPC-24 Sprint 03).
 */
export {
  DEFAULT_EXECUTION_CONTEXT_ADAPTER_ID,
  DEFAULT_EXECUTION_CONTEXT_VERSION,
  DefaultExecutionContextAdapter,
  type DefaultExecutionContextRuntime,
} from "./default-execution-context-adapter";

export {
  MOCK_EXECUTION_CONTEXT_ADAPTER_ID,
  MOCK_EXECUTION_CONTEXT_VERSION,
  MockExecutionContextAdapter,
  type MockExecutionContextAdapterOptions,
} from "./mock-execution-context-adapter";
