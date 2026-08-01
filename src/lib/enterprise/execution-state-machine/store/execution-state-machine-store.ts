/**
 * ExecutionStateMachineStore — contrato interno do store (EPC-24 Sprint 04).
 *
 * Persistência in-memory estrutural apenas.
 * Sem banco. Sem HTTP. Sem Workers. Sem filas.
 */
import type { ExecutionLifecycle } from "../ports/models";

export type StoredExecutionLifecycle = {
  lifecycle: ExecutionLifecycle;
};

export interface ExecutionStateMachineStore {
  readonly storeId: string;
  getLifecycle(stateMachineId: string): StoredExecutionLifecycle | undefined;
  getLifecycleByExecution(executionId: string): StoredExecutionLifecycle | undefined;
  setLifecycle(entry: StoredExecutionLifecycle): void;
  listLifecycles(): readonly StoredExecutionLifecycle[];
  removeLifecycle(stateMachineId: string): boolean;
  lifecycleCount(): number;
  transitionCount(): number;
  historyCount(): number;
  health(): { ok: boolean; message?: string };
}
