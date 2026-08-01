/**
 * ExecutionResourceRegistryStore — contrato interno do store (EPC-24 Sprint 13).
 *
 * Armazenamento in-memory estrutural apenas.
 * Sem banco. Sem HTTP. Sem Workers. Sem persistência real. Sem cache distribuído.
 * Sem validação de recursos. Sem alocação de recursos. Sem balanceamento de carga.
 */
import type { ExecutionResource, ExecutionResourceRegistry } from "../ports/models";

export type StoredExecutionResource = {
  resource: ExecutionResource;
  registryId: string;
};

export type StoredExecutionResourceRegistry = {
  registry: ExecutionResourceRegistry;
};

export interface ExecutionResourceRegistryStore {
  readonly storeId: string;
  getRegistry(executionResourceRegistryId: string): StoredExecutionResourceRegistry | undefined;
  getRegistryByExecution(executionId: string): StoredExecutionResourceRegistry | undefined;
  setRegistry(stored: StoredExecutionResourceRegistry): void;
  listRegistries(): readonly StoredExecutionResourceRegistry[];
  getResource(executionResourceId: string): StoredExecutionResource | undefined;
  getResourceByKey(
    executionResourceRegistryId: string,
    key: string,
  ): StoredExecutionResource | undefined;
  setResource(stored: StoredExecutionResource): void;
  listResources(executionResourceRegistryId?: string): readonly StoredExecutionResource[];
  removeResource(executionResourceId: string): boolean;
  registryCount(): number;
  resourceCount(): number;
  referenceCount(): number;
  categoryCount(): number;
  scopeCount(): number;
  health(): { ok: boolean; message?: string };
}
