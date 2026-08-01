/**
 * Provider / factory do ExecutionTracePort — inversão de dependência (EPC-24 Sprint 07).
 */
import { createExecutionTraceFactory } from "../factory/execution-trace-factory";
import type { ExecutionTracePort } from "../ports/execution-trace-port";
import type { ExecutionTraceProviderOptions } from "../ports/types";

export function createExecutionTracePort(
  options: ExecutionTraceProviderOptions = {},
): ExecutionTracePort {
  return createExecutionTraceFactory().create(options);
}
