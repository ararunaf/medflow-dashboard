/**
 * Provider / factory do ExecutionEnvironmentRegistryPort — inversão de dependência (EPC-24 Sprint 14).
 */
import { createExecutionEnvironmentRegistryFactory } from "../factory/execution-environment-registry-factory";
import type { ExecutionEnvironmentRegistryPort } from "../ports/execution-environment-registry-port";
import type { ExecutionEnvironmentRegistryProviderOptions } from "../ports/types";

export function createExecutionEnvironmentRegistryPort(
  options: ExecutionEnvironmentRegistryProviderOptions = {},
): ExecutionEnvironmentRegistryPort {
  return createExecutionEnvironmentRegistryFactory().create(options);
}
