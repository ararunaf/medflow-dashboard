/**
 * Provider / factory do ExecutionResourceRegistryPort — inversão de dependência (EPC-24 Sprint 13).
 */
import { createExecutionResourceRegistryFactory } from "../factory/execution-resource-registry-factory";
import type { ExecutionResourceRegistryPort } from "../ports/execution-resource-registry-port";
import type { ExecutionResourceRegistryProviderOptions } from "../ports/types";

export function createExecutionResourceRegistryPort(
  options: ExecutionResourceRegistryProviderOptions = {},
): ExecutionResourceRegistryPort {
  return createExecutionResourceRegistryFactory().create(options);
}
