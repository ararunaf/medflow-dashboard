/**
 * ExecutionConstraintRegistryStore — contrato interno do store (EPC-24 Sprint 11).
 *
 * Armazenamento in-memory estrutural apenas.
 * Sem banco. Sem HTTP. Sem Workers. Sem persistência real. Sem cache distribuído.
 * Sem interpretação de restrições. Sem Rule Engine. Sem Decision Engine.
 */
import type { ExecutionConstraint, ExecutionConstraintRegistry } from "../ports/models";

export type StoredExecutionConstraint = {
  constraint: ExecutionConstraint;
  registryId: string;
};

export type StoredExecutionConstraintRegistry = {
  registry: ExecutionConstraintRegistry;
};

export interface ExecutionConstraintRegistryStore {
  readonly storeId: string;
  getRegistry(executionConstraintRegistryId: string): StoredExecutionConstraintRegistry | undefined;
  getRegistryByExecution(executionId: string): StoredExecutionConstraintRegistry | undefined;
  setRegistry(stored: StoredExecutionConstraintRegistry): void;
  listRegistries(): readonly StoredExecutionConstraintRegistry[];
  getConstraint(executionConstraintId: string): StoredExecutionConstraint | undefined;
  getConstraintByKey(
    executionConstraintRegistryId: string,
    key: string,
  ): StoredExecutionConstraint | undefined;
  setConstraint(stored: StoredExecutionConstraint): void;
  listConstraints(executionConstraintRegistryId?: string): readonly StoredExecutionConstraint[];
  removeConstraint(executionConstraintId: string): boolean;
  registryCount(): number;
  constraintCount(): number;
  referenceCount(): number;
  categoryCount(): number;
  scopeCount(): number;
  health(): { ok: boolean; message?: string };
}
