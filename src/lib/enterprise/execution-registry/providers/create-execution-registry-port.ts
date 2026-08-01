/**
 * Provider / factory do ExecutionRegistryPort — inversão de dependência (EPC-24 Sprint 06).
 */
import { createExecutionRegistryFactory } from "../factory/execution-registry-factory";
import type { ExecutionRegistryPort } from "../ports/execution-registry-port";
import type { ExecutionRegistryProviderOptions } from "../ports/types";

export function createExecutionRegistryPort(
  options: ExecutionRegistryProviderOptions = {},
): ExecutionRegistryPort {
  return createExecutionRegistryFactory().create(options);
}
