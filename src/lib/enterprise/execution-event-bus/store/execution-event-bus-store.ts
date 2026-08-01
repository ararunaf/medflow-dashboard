/**
 * ExecutionEventBusStore — contrato interno do store (EPC-24 Sprint 05).
 *
 * Persistência in-memory estrutural apenas.
 * Sem banco. Sem HTTP. Sem Workers. Sem filas. Sem Pub/Sub.
 */
import type { ExecutionEventBus } from "../ports/models";

export type StoredExecutionEventBus = {
  bus: ExecutionEventBus;
};

export interface ExecutionEventBusStore {
  readonly storeId: string;
  getBus(eventBusId: string): StoredExecutionEventBus | undefined;
  getBusByExecution(executionId: string): StoredExecutionEventBus | undefined;
  setBus(entry: StoredExecutionEventBus): void;
  listBuses(): readonly StoredExecutionEventBus[];
  removeBus(eventBusId: string): boolean;
  busCount(): number;
  eventCount(): number;
  registrationCount(): number;
  historyCount(): number;
  health(): { ok: boolean; message?: string };
}
