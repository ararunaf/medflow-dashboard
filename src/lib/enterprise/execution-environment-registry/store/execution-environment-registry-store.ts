/**
 * ExecutionEnvironmentRegistryStore — contrato interno do store (EPC-24 Sprint 14).
 *
 * Armazenamento in-memory estrutural apenas.
 * Sem banco. Sem HTTP. Sem Workers. Sem persistência real. Sem cache distribuído.
 * Sem seleção de ambientes. Sem seleção de ambientes. Sem ativação de ambientes.
 */
import type { ExecutionEnvironment, ExecutionEnvironmentRegistry } from "../ports/models";

export type StoredExecutionEnvironment = {
  environment: ExecutionEnvironment;
  registryId: string;
};

export type StoredExecutionEnvironmentRegistry = {
  registry: ExecutionEnvironmentRegistry;
};

export interface ExecutionEnvironmentRegistryStore {
  readonly storeId: string;
  getRegistry(
    executionEnvironmentRegistryId: string,
  ): StoredExecutionEnvironmentRegistry | undefined;
  getRegistryByExecution(executionId: string): StoredExecutionEnvironmentRegistry | undefined;
  setRegistry(stored: StoredExecutionEnvironmentRegistry): void;
  listRegistries(): readonly StoredExecutionEnvironmentRegistry[];
  getEnvironment(executionEnvironmentId: string): StoredExecutionEnvironment | undefined;
  getEnvironmentByKey(
    executionEnvironmentRegistryId: string,
    key: string,
  ): StoredExecutionEnvironment | undefined;
  setEnvironment(stored: StoredExecutionEnvironment): void;
  listEnvironments(executionEnvironmentRegistryId?: string): readonly StoredExecutionEnvironment[];
  removeEnvironment(executionEnvironmentId: string): boolean;
  registryCount(): number;
  environmentCount(): number;
  referenceCount(): number;
  categoryCount(): number;
  scopeCount(): number;
  health(): { ok: boolean; message?: string };
}
