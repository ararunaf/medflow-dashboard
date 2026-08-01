/**
 * DefaultCanonicalExecutionOrchestratorStore — store in-process padrão (EPC-24).
 *
 * Utiliza mecanismo em memória do processo (sem novo banco, sem migrations).
 */
import type {
  CanonicalExecutionOrchestratorStore,
  StoredCanonicalExecutionContext,
  StoredCanonicalExecutionResult,
  StoredCanonicalExecutionTrace,
} from "./canonical-execution-orchestrator-store";

export const DEFAULT_CANONICAL_EXECUTION_ORCHESTRATOR_STORE_ID = "default-in-process";

export type DefaultCanonicalExecutionOrchestratorStoreOptions = {
  contexts?: readonly StoredCanonicalExecutionContext[];
  results?: readonly StoredCanonicalExecutionResult[];
  traces?: readonly StoredCanonicalExecutionTrace[];
};

export class DefaultCanonicalExecutionOrchestratorStore implements CanonicalExecutionOrchestratorStore {
  readonly storeId = DEFAULT_CANONICAL_EXECUTION_ORCHESTRATOR_STORE_ID;

  private readonly contexts = new Map<string, StoredCanonicalExecutionContext>();
  private readonly results = new Map<string, StoredCanonicalExecutionResult>();
  private readonly resultsByExecution = new Map<string, string>();
  private readonly traces = new Map<string, StoredCanonicalExecutionTrace>();
  private readonly tracesByExecution = new Map<string, string>();

  constructor(options: DefaultCanonicalExecutionOrchestratorStoreOptions = {}) {
    for (const context of options.contexts ?? []) {
      this.setContext(context);
    }
    for (const result of options.results ?? []) {
      this.setResult(result);
    }
    for (const trace of options.traces ?? []) {
      this.setTrace(trace);
    }
  }

  getContext(executionId: string): StoredCanonicalExecutionContext | undefined {
    return this.contexts.get(executionId);
  }

  setContext(context: StoredCanonicalExecutionContext): void {
    this.contexts.set(context.executionId, context);
  }

  listContexts(): readonly StoredCanonicalExecutionContext[] {
    return [...this.contexts.values()];
  }

  removeContext(executionId: string): boolean {
    return this.contexts.delete(executionId);
  }

  contextCount(): number {
    return this.contexts.size;
  }

  getResult(resultId: string): StoredCanonicalExecutionResult | undefined {
    return this.results.get(resultId);
  }

  getResultByExecution(executionId: string): StoredCanonicalExecutionResult | undefined {
    const id = this.resultsByExecution.get(executionId);
    return id ? this.results.get(id) : undefined;
  }

  setResult(result: StoredCanonicalExecutionResult): void {
    this.results.set(result.id, result);
    this.resultsByExecution.set(result.executionId, result.id);
  }

  listResults(): readonly StoredCanonicalExecutionResult[] {
    return [...this.results.values()];
  }

  removeResult(resultId: string): boolean {
    const existing = this.results.get(resultId);
    if (!existing) return false;
    this.resultsByExecution.delete(existing.executionId);
    return this.results.delete(resultId);
  }

  resultCount(): number {
    return this.results.size;
  }

  getTrace(traceId: string): StoredCanonicalExecutionTrace | undefined {
    return this.traces.get(traceId);
  }

  getTraceByExecution(executionId: string): StoredCanonicalExecutionTrace | undefined {
    const id = this.tracesByExecution.get(executionId);
    return id ? this.traces.get(id) : undefined;
  }

  setTrace(trace: StoredCanonicalExecutionTrace): void {
    this.traces.set(trace.id, trace);
    this.tracesByExecution.set(trace.executionId, trace.id);
  }

  listTraces(): readonly StoredCanonicalExecutionTrace[] {
    return [...this.traces.values()];
  }

  removeTrace(traceId: string): boolean {
    const existing = this.traces.get(traceId);
    if (!existing) return false;
    this.tracesByExecution.delete(existing.executionId);
    return this.traces.delete(traceId);
  }

  traceCount(): number {
    return this.traces.size;
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: "DefaultCanonicalExecutionOrchestratorStore pronto (sem I/O externo — EPC-24).",
    };
  }
}
