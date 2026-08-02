/**
 * ExecutionObservabilityStore — contrato interno do store (INF-04).
 *
 * Armazenamento in-memory estrutural apenas.
 * Sem banco. Sem HTTP. Sem logs. Sem métricas. Sem tracing. Sem persistência real.
 * Sem cache distribuído. Sem transmissão de eventos.
 */
import type { CanonicalObservation } from "../ports/models";

export type StoredCanonicalObservation = {
  observation: CanonicalObservation;
};

export interface ExecutionObservabilityStore {
  readonly storeId: string;
  getObservation(executionObservabilityId: string): StoredCanonicalObservation | undefined;
  getObservationByExecution(executionId: string): StoredCanonicalObservation | undefined;
  setObservation(stored: StoredCanonicalObservation): void;
  removeObservation(executionObservabilityId: string): StoredCanonicalObservation | undefined;
  listObservations(): readonly StoredCanonicalObservation[];
  observationCount(): number;
  referenceCount(): number;
  health(): { ok: boolean; message?: string };
}
