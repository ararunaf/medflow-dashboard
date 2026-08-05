/**
 * InMemoryWorkflowRuntimeStore — store in-process oficial (C-10).
 *
 * Utiliza mecanismo em memória do processo (sem novo banco, sem migrations,
 * sem workflow funcional, sem BPM, sem decisão automática, sem execução de runtime).
 */
import type { WorkflowExecutionStatistics } from "../ports/canonical";
import type {
  StoredWorkflowContext,
  StoredWorkflowExecution,
  StoredWorkflowExecutionResult,
  StoredWorkflowManifest,
  WorkflowRuntimeStore,
} from "./workflow-runtime-store";

export const IN_MEMORY_WORKFLOW_RUNTIME_STORE_ID = "in-memory-workflow-runtime";

export type InMemoryWorkflowRuntimeStoreOptions = {
  manifests?: readonly StoredWorkflowManifest[];
  contexts?: readonly StoredWorkflowContext[];
  executions?: readonly StoredWorkflowExecution[];
  results?: readonly StoredWorkflowExecutionResult[];
};

export class InMemoryWorkflowRuntimeStore implements WorkflowRuntimeStore {
  readonly storeId = IN_MEMORY_WORKFLOW_RUNTIME_STORE_ID;

  private readonly manifests = new Map<string, StoredWorkflowManifest>();
  private readonly contexts = new Map<string, StoredWorkflowContext>();
  private readonly executions = new Map<string, StoredWorkflowExecution>();
  private readonly results = new Map<string, StoredWorkflowExecutionResult>();

  constructor(options: InMemoryWorkflowRuntimeStoreOptions = {}) {
    for (const manifest of options.manifests ?? []) this.setManifest(manifest);
    for (const context of options.contexts ?? []) this.setContext(context);
    for (const execution of options.executions ?? []) this.setExecution(execution);
    for (const result of options.results ?? []) this.setResult(result);
  }

  getManifest(workflowId: string): StoredWorkflowManifest | undefined {
    const manifest = this.manifests.get(workflowId);
    return manifest ? { ...manifest } : undefined;
  }

  setManifest(manifest: StoredWorkflowManifest): void {
    const key = manifest.workflowId ?? `workflow-${this.manifests.size + 1}`;
    this.manifests.set(key, { ...manifest, workflowId: key });
  }

  listManifests(): readonly StoredWorkflowManifest[] {
    return Array.from(this.manifests.values()).map((manifest) => ({ ...manifest }));
  }

  manifestCount(): number {
    return this.manifests.size;
  }

  getContext(contextId: string): StoredWorkflowContext | undefined {
    const context = this.contexts.get(contextId);
    return context ? { ...context } : undefined;
  }

  setContext(context: StoredWorkflowContext): void {
    const key = context.contextId ?? context.workflowExecutionId ?? `ctx-${this.contexts.size + 1}`;
    this.contexts.set(key, { ...context });
  }

  listContexts(): readonly StoredWorkflowContext[] {
    return Array.from(this.contexts.values()).map((context) => ({ ...context }));
  }

  contextCount(): number {
    return this.contexts.size;
  }

  getExecution(workflowExecutionId: string): StoredWorkflowExecution | undefined {
    const execution = this.executions.get(workflowExecutionId);
    return execution ? { ...execution } : undefined;
  }

  setExecution(execution: StoredWorkflowExecution): void {
    const key = execution.workflowExecutionId ?? `workflow-execution-${this.executions.size + 1}`;
    this.executions.set(key, { ...execution, workflowExecutionId: key });
  }

  listExecutions(): readonly StoredWorkflowExecution[] {
    return Array.from(this.executions.values()).map((execution) => ({ ...execution }));
  }

  executionCount(): number {
    return this.executions.size;
  }

  getResult(resultId: string): StoredWorkflowExecutionResult | undefined {
    const result = this.results.get(resultId);
    return result ? { ...result } : undefined;
  }

  setResult(result: StoredWorkflowExecutionResult): void {
    const key = result.resultId ?? result.workflowExecutionId ?? `result-${this.results.size + 1}`;
    this.results.set(key, { ...result, resultId: key });
  }

  listResults(): readonly StoredWorkflowExecutionResult[] {
    return Array.from(this.results.values()).map((result) => ({ ...result }));
  }

  resultCount(): number {
    return this.results.size;
  }

  statistics(): WorkflowExecutionStatistics {
    const all = this.listManifests();
    let created = 0;
    let ready = 0;
    let waiting = 0;
    let running = 0;
    let paused = 0;
    let completed = 0;
    let failed = 0;
    let cancelled = 0;
    for (const manifest of all) {
      if (manifest.state === "CREATED") created += 1;
      if (manifest.state === "READY") ready += 1;
      if (manifest.state === "WAITING") waiting += 1;
      if (manifest.state === "RUNNING") running += 1;
      if (manifest.state === "PAUSED") paused += 1;
      if (manifest.state === "COMPLETED") completed += 1;
      if (manifest.state === "FAILED") failed += 1;
      if (manifest.state === "CANCELLED") cancelled += 1;
    }
    return {
      kind: "canonical-workflow-execution-statistics",
      totalManifests: all.length,
      totalContexts: this.contextCount(),
      totalExecutions: this.executionCount(),
      totalResults: this.resultCount(),
      createdCount: created,
      readyCount: ready,
      waitingCount: waiting,
      runningCount: running,
      pausedCount: paused,
      completedCount: completed,
      failedCount: failed,
      cancelledCount: cancelled,
      workflowImplementedCount: 0,
      workflowExecutionImplementedCount: 0,
      automaticDecisionImplementedCount: 0,
      runtimeExecutionImplementedCount: 0,
    };
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `Workflow Runtime store ready (${this.manifestCount()} manifests, ${this.contextCount()} contexts, ${this.executionCount()} executions, ${this.resultCount()} results).`,
    };
  }
}
