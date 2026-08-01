/**
 * Provider / factory do ExecutionPolicyRegistryPort — inversão de dependência (EPC-24 Sprint 10).
 */
import { createExecutionPolicyRegistryFactory } from "../factory/execution-policy-registry-factory";
import type { ExecutionPolicyRegistryPort } from "../ports/execution-policy-registry-port";
import type { ExecutionPolicyRegistryProviderOptions } from "../ports/types";

export function createExecutionPolicyRegistryPort(
  options: ExecutionPolicyRegistryProviderOptions = {},
): ExecutionPolicyRegistryPort {
  return createExecutionPolicyRegistryFactory().create(options);
}
