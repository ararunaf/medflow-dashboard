/**
 * Provider / factory do ExecutionRequirementRegistryPort — inversão de dependência (EPC-24 Sprint 12).
 */
import { createExecutionRequirementRegistryFactory } from "../factory/execution-requirement-registry-factory";
import type { ExecutionRequirementRegistryPort } from "../ports/execution-requirement-registry-port";
import type { ExecutionRequirementRegistryProviderOptions } from "../ports/types";

export function createExecutionRequirementRegistryPort(
  options: ExecutionRequirementRegistryProviderOptions = {},
): ExecutionRequirementRegistryPort {
  return createExecutionRequirementRegistryFactory().create(options);
}
