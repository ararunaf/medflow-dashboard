/**
 * AIOrchestrationRuntimeStore — contrato interno do store (F3-CAP-09).
 *
 * Camada entre Adapter e estado in-process.
 * NÃO é banco; NÃO cria migrations; NÃO executa IA real.
 * Acesso exclusivo via Adapter — nunca diretamente pelo produto.
 */
import type { AIExecutionResult, AIJob, AIRequest, AIStatistics, AITask } from "../ports/canonical";

export type StoredAIOrchestrationRuntimeJob = AIJob;
export type StoredAIOrchestrationRuntimeRequest = AIRequest;
export type StoredAIOrchestrationRuntimeTask = AITask;
export type StoredAIOrchestrationRuntimeResult = AIExecutionResult;

export interface AIOrchestrationRuntimeStore {
  readonly storeId: string;

  getJob(jobId: string): StoredAIOrchestrationRuntimeJob | undefined;
  setJob(job: StoredAIOrchestrationRuntimeJob): void;
  removeJob(jobId: string): void;
  listJobs(): readonly StoredAIOrchestrationRuntimeJob[];
  jobCount(): number;

  getRequest(requestId: string): StoredAIOrchestrationRuntimeRequest | undefined;
  setRequest(request: StoredAIOrchestrationRuntimeRequest): void;
  listRequests(jobId?: string): readonly StoredAIOrchestrationRuntimeRequest[];
  requestCount(): number;

  getTask(taskId: string): StoredAIOrchestrationRuntimeTask | undefined;
  setTask(task: StoredAIOrchestrationRuntimeTask): void;
  listTasks(jobId?: string): readonly StoredAIOrchestrationRuntimeTask[];
  taskCount(): number;

  getResult(resultId: string): StoredAIOrchestrationRuntimeResult | undefined;
  setResult(result: StoredAIOrchestrationRuntimeResult): void;
  listResults(): readonly StoredAIOrchestrationRuntimeResult[];
  resultCount(): number;

  statistics(): AIStatistics;

  /** Prontidão do store (sem I/O externo obrigatório). */
  health(): { ok: boolean; message?: string };
}
