/**
 * ExecutionRequirementRegistryStore — contrato interno do store (EPC-24 Sprint 12).
 *
 * Armazenamento in-memory estrutural apenas.
 * Sem banco. Sem HTTP. Sem Workers. Sem persistência real. Sem cache distribuído.
 * Sem validação de requisitos. Sem Rule Engine. Sem Decision Engine.
 */
import type { ExecutionRequirement, ExecutionRequirementRegistry } from "../ports/models";

export type StoredExecutionRequirement = {
  requirement: ExecutionRequirement;
  registryId: string;
};

export type StoredExecutionRequirementRegistry = {
  registry: ExecutionRequirementRegistry;
};

export interface ExecutionRequirementRegistryStore {
  readonly storeId: string;
  getRegistry(
    executionRequirementRegistryId: string,
  ): StoredExecutionRequirementRegistry | undefined;
  getRegistryByExecution(executionId: string): StoredExecutionRequirementRegistry | undefined;
  setRegistry(stored: StoredExecutionRequirementRegistry): void;
  listRegistries(): readonly StoredExecutionRequirementRegistry[];
  getRequirement(executionRequirementId: string): StoredExecutionRequirement | undefined;
  getRequirementByKey(
    executionRequirementRegistryId: string,
    key: string,
  ): StoredExecutionRequirement | undefined;
  setRequirement(stored: StoredExecutionRequirement): void;
  listRequirements(executionRequirementRegistryId?: string): readonly StoredExecutionRequirement[];
  removeRequirement(executionRequirementId: string): boolean;
  registryCount(): number;
  requirementCount(): number;
  referenceCount(): number;
  categoryCount(): number;
  scopeCount(): number;
  health(): { ok: boolean; message?: string };
}
