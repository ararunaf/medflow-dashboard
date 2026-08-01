/**
 * Provider / factory do ExecutionConstraintRegistryPort — inversão de dependência (EPC-24 Sprint 11).
 */
import { createExecutionConstraintRegistryFactory } from "../factory/execution-constraint-registry-factory";
import type { ExecutionConstraintRegistryPort } from "../ports/execution-constraint-registry-port";
import type { ExecutionConstraintRegistryProviderOptions } from "../ports/types";

export function createExecutionConstraintRegistryPort(
  options: ExecutionConstraintRegistryProviderOptions = {},
): ExecutionConstraintRegistryPort {
  return createExecutionConstraintRegistryFactory().create(options);
}
