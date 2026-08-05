/**
 * WorkflowRuntimeStore — contrato interno do store (C-10).
 *
 * Camada entre Adapter e estado in-process.
 * NÃO é banco; NÃO cria migrations; NÃO orquestra; NÃO decide automaticamente.
 * Acesso exclusivo via Adapter — nunca diretamente pelo produto.
 */
import type {
  WorkflowContext,
  WorkflowExecution,
  WorkflowExecutionResult,
  WorkflowExecutionStatistics,
  WorkflowManifest,
} from "../ports/canonical";

export type StoredWorkflowManifest = WorkflowManifest;
export type StoredWorkflowContext = WorkflowContext;
export type StoredWorkflowExecution = WorkflowExecution;
export type StoredWorkflowExecutionResult = WorkflowExecutionResult & {
  resultId?: string;
};

export interface WorkflowRuntimeStore {
  readonly storeId: string;

  getManifest(workflowId: string): StoredWorkflowManifest | undefined;
  setManifest(manifest: StoredWorkflowManifest): void;
  listManifests(): readonly StoredWorkflowManifest[];
  manifestCount(): number;

  getContext(contextId: string): StoredWorkflowContext | undefined;
  setContext(context: StoredWorkflowContext): void;
  listContexts(): readonly StoredWorkflowContext[];
  contextCount(): number;

  getExecution(workflowExecutionId: string): StoredWorkflowExecution | undefined;
  setExecution(execution: StoredWorkflowExecution): void;
  listExecutions(): readonly StoredWorkflowExecution[];
  executionCount(): number;

  getResult(resultId: string): StoredWorkflowExecutionResult | undefined;
  setResult(result: StoredWorkflowExecutionResult): void;
  listResults(): readonly StoredWorkflowExecutionResult[];
  resultCount(): number;

  statistics(): WorkflowExecutionStatistics;

  /** Prontidão do store (sem I/O externo obrigatório). */
  health(): { ok: boolean; message?: string };
}
