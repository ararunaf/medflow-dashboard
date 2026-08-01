/**
 * ExecutionDependencyRegistryStore — contrato interno do store (EPC-24 Sprint 09).
 *
 * Armazenamento in-memory estrutural apenas.
 * Sem banco. Sem HTTP. Sem Workers. Sem persistência real. Sem cache distribuído.
 * Sem resolução de dependências. Sem ordenação. Sem DAG.
 */
import type { ExecutionDependency, ExecutionDependencyRegistry } from "../ports/models";

export type StoredExecutionDependency = {
  dependency: ExecutionDependency;
  registryId: string;
};

export type StoredExecutionDependencyRegistry = {
  registry: ExecutionDependencyRegistry;
};

export interface ExecutionDependencyRegistryStore {
  readonly storeId: string;
  getRegistry(executionDependencyRegistryId: string): StoredExecutionDependencyRegistry | undefined;
  getRegistryByExecution(executionId: string): StoredExecutionDependencyRegistry | undefined;
  setRegistry(stored: StoredExecutionDependencyRegistry): void;
  listRegistries(): readonly StoredExecutionDependencyRegistry[];
  getDependency(executionDependencyId: string): StoredExecutionDependency | undefined;
  getDependencyByKey(
    executionDependencyRegistryId: string,
    key: string,
  ): StoredExecutionDependency | undefined;
  setDependency(stored: StoredExecutionDependency): void;
  listDependencies(executionDependencyRegistryId?: string): readonly StoredExecutionDependency[];
  removeDependency(executionDependencyId: string): boolean;
  registryCount(): number;
  dependencyCount(): number;
  referenceCount(): number;
  nodeCount(): number;
  edgeCount(): number;
  graphCount(): number;
  health(): { ok: boolean; message?: string };
}
