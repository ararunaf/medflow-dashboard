/**
 * TISSRuleRuntimeStore — contrato interno do store (EPC-23).
 *
 * Camada entre Adapter e persistência física.
 * NÃO é banco; NÃO cria migrations; NÃO conhece regras / contratos / validações.
 */
import type {
  ExecutionMetadata,
  ExecutionPipeline,
  ExecutionResult,
  ExecutionTrace,
  TISSExecutionContext,
} from "../ports/models";

export type StoredTISSExecutionContext = TISSExecutionContext;
export type StoredExecutionPipeline = ExecutionPipeline;
export type StoredExecutionResult = ExecutionResult;
export type StoredExecutionTrace = ExecutionTrace;
export type StoredExecutionMetadata = ExecutionMetadata;

export interface TISSRuleRuntimeStore {
  readonly storeId: string;

  getContext(executionId: string): StoredTISSExecutionContext | undefined;
  setContext(context: StoredTISSExecutionContext): void;
  listContexts(): readonly StoredTISSExecutionContext[];
  removeContext(executionId: string): boolean;
  contextCount(): number;

  getPipeline(pipelineId: string): StoredExecutionPipeline | undefined;
  getPipelineByExecution(executionId: string): StoredExecutionPipeline | undefined;
  setPipeline(pipeline: StoredExecutionPipeline): void;
  listPipelines(): readonly StoredExecutionPipeline[];
  removePipeline(pipelineId: string): boolean;
  pipelineCount(): number;

  getResult(resultId: string): StoredExecutionResult | undefined;
  getResultByExecution(executionId: string): StoredExecutionResult | undefined;
  setResult(result: StoredExecutionResult): void;
  listResults(): readonly StoredExecutionResult[];
  removeResult(resultId: string): boolean;
  resultCount(): number;

  getTrace(traceId: string): StoredExecutionTrace | undefined;
  getTraceByExecution(executionId: string): StoredExecutionTrace | undefined;
  setTrace(trace: StoredExecutionTrace): void;
  listTraces(): readonly StoredExecutionTrace[];
  removeTrace(traceId: string): boolean;
  traceCount(): number;

  getMetadata(metadataId: string): StoredExecutionMetadata | undefined;
  setMetadata(metadata: StoredExecutionMetadata): void;
  listMetadata(): readonly StoredExecutionMetadata[];
  removeMetadata(metadataId: string): boolean;
  metadataCount(): number;

  /** Prontidão do store (sem I/O externo obrigatório). */
  health(): { ok: boolean; message?: string };
}
