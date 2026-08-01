/**
 * ExecutionPolicyRegistryStore — contrato interno do store (EPC-24 Sprint 10).
 *
 * Armazenamento in-memory estrutural apenas.
 * Sem banco. Sem HTTP. Sem Workers. Sem persistência real. Sem cache distribuído.
 * Sem interpretação de políticas. Sem Rule Engine. Sem Decision Engine.
 */
import type { ExecutionPolicy, ExecutionPolicyRegistry } from "../ports/models";

export type StoredExecutionPolicy = {
  policy: ExecutionPolicy;
  registryId: string;
};

export type StoredExecutionPolicyRegistry = {
  registry: ExecutionPolicyRegistry;
};

export interface ExecutionPolicyRegistryStore {
  readonly storeId: string;
  getRegistry(executionPolicyRegistryId: string): StoredExecutionPolicyRegistry | undefined;
  getRegistryByExecution(executionId: string): StoredExecutionPolicyRegistry | undefined;
  setRegistry(stored: StoredExecutionPolicyRegistry): void;
  listRegistries(): readonly StoredExecutionPolicyRegistry[];
  getPolicy(executionPolicyId: string): StoredExecutionPolicy | undefined;
  getPolicyByKey(executionPolicyRegistryId: string, key: string): StoredExecutionPolicy | undefined;
  setPolicy(stored: StoredExecutionPolicy): void;
  listPolicies(executionPolicyRegistryId?: string): readonly StoredExecutionPolicy[];
  removePolicy(executionPolicyId: string): boolean;
  registryCount(): number;
  policyCount(): number;
  referenceCount(): number;
  categoryCount(): number;
  scopeCount(): number;
  health(): { ok: boolean; message?: string };
}
