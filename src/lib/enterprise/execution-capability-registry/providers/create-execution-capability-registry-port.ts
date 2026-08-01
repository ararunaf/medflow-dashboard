/**
 * Provider / factory do ExecutionCapabilityRegistryPort — inversão de dependência (EPC-24 Sprint 08).
 */
import { createExecutionCapabilityRegistryFactory } from "../factory/execution-capability-registry-factory";
import type { ExecutionCapabilityRegistryPort } from "../ports/execution-capability-registry-port";
import type { ExecutionCapabilityRegistryProviderOptions } from "../ports/types";

export function createExecutionCapabilityRegistryPort(
  options: ExecutionCapabilityRegistryProviderOptions = {},
): ExecutionCapabilityRegistryPort {
  return createExecutionCapabilityRegistryFactory().create(options);
}
