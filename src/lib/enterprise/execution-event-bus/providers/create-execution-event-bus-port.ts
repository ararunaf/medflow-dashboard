/**
 * Provider / factory do ExecutionEventBusPort — inversão de dependência (EPC-24 Sprint 05).
 */
import { createExecutionEventBusFactory } from "../factory/execution-event-bus-factory";
import type { ExecutionEventBusPort } from "../ports/execution-event-bus-port";
import type { ExecutionEventBusProviderOptions } from "../ports/types";

export function createExecutionEventBusPort(
  options: ExecutionEventBusProviderOptions = {},
): ExecutionEventBusPort {
  return createExecutionEventBusFactory().create(options);
}
