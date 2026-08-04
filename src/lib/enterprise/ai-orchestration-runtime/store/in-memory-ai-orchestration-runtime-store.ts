/**
 * InMemoryAIOrchestrationRuntimeStore — store in-process oficial (F3-CAP-09).
 *
 * Utiliza mecanismo em memória do processo (sem novo banco, sem migrations,
 * sem IA real).
 */
import type { AIStatistics } from "../ports/canonical";
import type {
  AIOrchestrationRuntimeStore,
  StoredAIOrchestrationRuntimeJob,
  StoredAIOrchestrationRuntimeRequest,
  StoredAIOrchestrationRuntimeResult,
  StoredAIOrchestrationRuntimeTask,
} from "./ai-orchestration-runtime-store";

export const IN_MEMORY_AI_ORCHESTRATION_RUNTIME_STORE_ID = "in-memory-ai-orchestration-runtime";

export type InMemoryAIOrchestrationRuntimeStoreOptions = {
  jobs?: readonly StoredAIOrchestrationRuntimeJob[];
  requests?: readonly StoredAIOrchestrationRuntimeRequest[];
  tasks?: readonly StoredAIOrchestrationRuntimeTask[];
  results?: readonly StoredAIOrchestrationRuntimeResult[];
};

export class InMemoryAIOrchestrationRuntimeStore implements AIOrchestrationRuntimeStore {
  readonly storeId = IN_MEMORY_AI_ORCHESTRATION_RUNTIME_STORE_ID;

  private readonly jobs = new Map<string, StoredAIOrchestrationRuntimeJob>();
  private readonly requests = new Map<string, StoredAIOrchestrationRuntimeRequest>();
  private readonly tasks = new Map<string, StoredAIOrchestrationRuntimeTask>();
  private readonly results = new Map<string, StoredAIOrchestrationRuntimeResult>();

  constructor(options: InMemoryAIOrchestrationRuntimeStoreOptions = {}) {
    for (const job of options.jobs ?? []) this.setJob(job);
    for (const request of options.requests ?? []) this.setRequest(request);
    for (const task of options.tasks ?? []) this.setTask(task);
    for (const result of options.results ?? []) this.setResult(result);
  }

  getJob(jobId: string): StoredAIOrchestrationRuntimeJob | undefined {
    const job = this.jobs.get(jobId);
    return job ? { ...job } : undefined;
  }

  setJob(job: StoredAIOrchestrationRuntimeJob): void {
    this.jobs.set(job.jobId, { ...job });
  }

  removeJob(jobId: string): void {
    this.jobs.delete(jobId);
  }

  listJobs(): readonly StoredAIOrchestrationRuntimeJob[] {
    return Array.from(this.jobs.values()).map((job) => ({ ...job }));
  }

  jobCount(): number {
    return this.jobs.size;
  }

  getRequest(requestId: string): StoredAIOrchestrationRuntimeRequest | undefined {
    const request = this.requests.get(requestId);
    return request ? { ...request } : undefined;
  }

  setRequest(request: StoredAIOrchestrationRuntimeRequest): void {
    this.requests.set(request.requestId, { ...request });
  }

  listRequests(jobId?: string): readonly StoredAIOrchestrationRuntimeRequest[] {
    const all = Array.from(this.requests.values()).map((request) => ({ ...request }));
    if (!jobId) return all;
    return all.filter((request) => request.jobId === jobId);
  }

  requestCount(): number {
    return this.requests.size;
  }

  getTask(taskId: string): StoredAIOrchestrationRuntimeTask | undefined {
    const task = this.tasks.get(taskId);
    return task ? { ...task } : undefined;
  }

  setTask(task: StoredAIOrchestrationRuntimeTask): void {
    this.tasks.set(task.taskId, { ...task });
  }

  listTasks(jobId?: string): readonly StoredAIOrchestrationRuntimeTask[] {
    const all = Array.from(this.tasks.values()).map((task) => ({ ...task }));
    if (!jobId) return all;
    return all.filter((task) => task.jobId === jobId);
  }

  taskCount(): number {
    return this.tasks.size;
  }

  getResult(resultId: string): StoredAIOrchestrationRuntimeResult | undefined {
    const result = this.results.get(resultId);
    return result ? { ...result } : undefined;
  }

  setResult(result: StoredAIOrchestrationRuntimeResult): void {
    this.results.set(result.resultId, { ...result });
  }

  listResults(): readonly StoredAIOrchestrationRuntimeResult[] {
    return Array.from(this.results.values()).map((result) => ({ ...result }));
  }

  resultCount(): number {
    return this.results.size;
  }

  statistics(): AIStatistics {
    const jobs = this.listJobs();
    let openJobs = 0;
    let closedJobs = 0;
    for (const job of jobs) {
      if (job.status === "job-open") openJobs += 1;
      if (job.status === "job-closed") closedJobs += 1;
    }
    return {
      kind: "canonical-ai-statistics",
      totalJobs: jobs.length,
      openJobs,
      closedJobs,
      totalRequests: this.requestCount(),
      totalTasks: this.taskCount(),
      totalResults: this.resultCount(),
      llmImplementedCount: 0,
      agentExecutionImplementedCount: 0,
      providerSelectionImplementedCount: 0,
      promptExecutionImplementedCount: 0,
      multiAgentImplementedCount: 0,
      workflowOrchestrationImplementedCount: 0,
      aiSupervisorImplementedCount: 0,
      contextManagementImplementedCount: 0,
      memoryImplementedCount: 0,
      reasoningImplementedCount: 0,
      decisionEngineImplementedCount: 0,
    };
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `AI Orchestration Runtime store ready (${this.jobCount()} jobs, ${this.requestCount()} requests, ${this.taskCount()} tasks, ${this.resultCount()} results).`,
    };
  }
}
