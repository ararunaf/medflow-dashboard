/**
 * Provider / factory do ExecutionStateMachinePort — inversão de dependência (EPC-24 Sprint 04).
 */
import { createExecutionStateMachineFactory } from "../factory/execution-state-machine-factory";
import type { ExecutionStateMachinePort } from "../ports/execution-state-machine-port";
import type { ExecutionStateMachineProviderOptions } from "../ports/types";

export function createExecutionStateMachinePort(
  options: ExecutionStateMachineProviderOptions = {},
): ExecutionStateMachinePort {
  return createExecutionStateMachineFactory().create(options);
}
