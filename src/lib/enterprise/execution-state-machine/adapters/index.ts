/**
 * Adapters — Execution State Machine Foundation (EPC-24 Sprint 04).
 */
export {
  DEFAULT_EXECUTION_STATE_MACHINE_ADAPTER_ID,
  DEFAULT_EXECUTION_STATE_MACHINE_VERSION,
  DefaultExecutionStateMachineAdapter,
  type DefaultExecutionStateMachineRuntime,
} from "./default-execution-state-machine-adapter";

export {
  MOCK_EXECUTION_STATE_MACHINE_ADAPTER_ID,
  MOCK_EXECUTION_STATE_MACHINE_VERSION,
  MockExecutionStateMachineAdapter,
  type MockExecutionStateMachineAdapterOptions,
} from "./mock-execution-state-machine-adapter";
