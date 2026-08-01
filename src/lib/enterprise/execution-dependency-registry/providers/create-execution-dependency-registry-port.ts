/**
 * Provider / factory do ExecutionDependencyRegistryPort — inversão de dependência (EPC-24 Sprint 09).
 */
import { createExecutionDependencyRegistryFactory } from "../factory/execution-dependency-registry-factory";
import type { ExecutionDependencyRegistryPort } from "../ports/execution-dependency-registry-port";
import type { ExecutionDependencyRegistryProviderOptions } from "../ports/types";

export function createExecutionDependencyRegistryPort(
  options: ExecutionDependencyRegistryProviderOptions = {},
): ExecutionDependencyRegistryPort {
  return createExecutionDependencyRegistryFactory().create(options);
}
