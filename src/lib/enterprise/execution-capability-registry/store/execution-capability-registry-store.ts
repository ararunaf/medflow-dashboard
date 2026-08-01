/**
 * ExecutionCapabilityRegistryStore — contrato interno do store (EPC-24 Sprint 08).
 *
 * Armazenamento in-memory estrutural apenas.
 * Sem banco. Sem HTTP. Sem Workers. Sem persistência real. Sem cache distribuído.
 * Sem descoberta automática. Sem carregamento dinâmico.
 */
import type { ExecutionCapability, ExecutionCapabilityRegistry } from "../ports/models";

export type StoredExecutionCapability = {
  capability: ExecutionCapability;
  registryId: string;
};

export type StoredExecutionCapabilityRegistry = {
  registry: ExecutionCapabilityRegistry;
};

export interface ExecutionCapabilityRegistryStore {
  readonly storeId: string;
  getRegistry(executionCapabilityRegistryId: string): StoredExecutionCapabilityRegistry | undefined;
  getRegistryByExecution(executionId: string): StoredExecutionCapabilityRegistry | undefined;
  setRegistry(stored: StoredExecutionCapabilityRegistry): void;
  listRegistries(): readonly StoredExecutionCapabilityRegistry[];
  getCapability(executionCapabilityId: string): StoredExecutionCapability | undefined;
  getCapabilityByKey(
    executionCapabilityRegistryId: string,
    key: string,
  ): StoredExecutionCapability | undefined;
  setCapability(stored: StoredExecutionCapability): void;
  listCapabilities(executionCapabilityRegistryId?: string): readonly StoredExecutionCapability[];
  removeCapability(executionCapabilityId: string): boolean;
  registryCount(): number;
  capabilityCount(): number;
  referenceCount(): number;
  categoryCount(): number;
  health(): { ok: boolean; message?: string };
}
