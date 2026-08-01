/**
 * ExecutionTraceStore — contrato interno do store (EPC-24 Sprint 07).
 *
 * Armazenamento in-memory estrutural apenas.
 * Sem banco. Sem HTTP. Sem Workers. Sem persistência real. Sem logs. Sem telemetria.
 */
import type { ExecutionTrace } from "../ports/models";

export type StoredExecutionTrace = {
  trace: ExecutionTrace;
};

export interface ExecutionTraceStore {
  readonly storeId: string;
  getTrace(executionTraceId: string): StoredExecutionTrace | undefined;
  getTraceByExecution(executionId: string): StoredExecutionTrace | undefined;
  setTrace(stored: StoredExecutionTrace): void;
  listTraces(): readonly StoredExecutionTrace[];
  removeTrace(executionTraceId: string): boolean;
  removeTraceByExecution(executionId: string): boolean;
  traceCount(): number;
  entryCount(): number;
  stepCount(): number;
  nodeCount(): number;
  referenceCount(): number;
  snapshotCount(): number;
  health(): { ok: boolean; message?: string };
}
