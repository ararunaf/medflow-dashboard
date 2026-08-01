/**
 * CanonicalExecutionOrchestratorStore — contrato interno do store (EPC-24).
 *
 * Camada entre Adapter e persistência física.
 * NÃO é banco; NÃO cria migrations; NÃO conhece OCR / IA / regras / validações.
 */
import type {
  CanonicalExecutionContext,
  CanonicalExecutionResult,
  CanonicalExecutionTrace,
} from "../ports/models";

export type StoredCanonicalExecutionContext = CanonicalExecutionContext;
export type StoredCanonicalExecutionResult = CanonicalExecutionResult;
export type StoredCanonicalExecutionTrace = CanonicalExecutionTrace;

export interface CanonicalExecutionOrchestratorStore {
  readonly storeId: string;

  getContext(executionId: string): StoredCanonicalExecutionContext | undefined;
  setContext(context: StoredCanonicalExecutionContext): void;
  listContexts(): readonly StoredCanonicalExecutionContext[];
  removeContext(executionId: string): boolean;
  contextCount(): number;

  getResult(resultId: string): StoredCanonicalExecutionResult | undefined;
  getResultByExecution(executionId: string): StoredCanonicalExecutionResult | undefined;
  setResult(result: StoredCanonicalExecutionResult): void;
  listResults(): readonly StoredCanonicalExecutionResult[];
  removeResult(resultId: string): boolean;
  resultCount(): number;

  getTrace(traceId: string): StoredCanonicalExecutionTrace | undefined;
  getTraceByExecution(executionId: string): StoredCanonicalExecutionTrace | undefined;
  setTrace(trace: StoredCanonicalExecutionTrace): void;
  listTraces(): readonly StoredCanonicalExecutionTrace[];
  removeTrace(traceId: string): boolean;
  traceCount(): number;

  /** Prontidão do store (sem I/O externo obrigatório). */
  health(): { ok: boolean; message?: string };
}
