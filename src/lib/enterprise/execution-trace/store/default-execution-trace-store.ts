/**
 * DefaultExecutionTraceStore — store in-process padrão (EPC-24 Sprint 07).
 *
 * Armazenamento estrutural in-memory apenas.
 * Sem banco. Sem HTTP. Sem Workers. Sem persistência real. Sem logs. Sem telemetria.
 */
import type { ExecutionTraceStore, StoredExecutionTrace } from "./execution-trace-store";

export const DEFAULT_EXECUTION_TRACE_STORE_ID = "default-in-process";

export type DefaultExecutionTraceStoreOptions = {
  traces?: readonly StoredExecutionTrace[];
};

export class DefaultExecutionTraceStore implements ExecutionTraceStore {
  readonly storeId = DEFAULT_EXECUTION_TRACE_STORE_ID;
  private readonly traces = new Map<string, StoredExecutionTrace>();
  private readonly byExecution = new Map<string, string>();

  constructor(options: DefaultExecutionTraceStoreOptions = {}) {
    for (const stored of options.traces ?? []) {
      this.setTrace(stored);
    }
  }

  getTrace(executionTraceId: string): StoredExecutionTrace | undefined {
    return this.traces.get(executionTraceId);
  }

  getTraceByExecution(executionId: string): StoredExecutionTrace | undefined {
    const executionTraceId = this.byExecution.get(executionId);
    if (!executionTraceId) return undefined;
    return this.traces.get(executionTraceId);
  }

  setTrace(stored: StoredExecutionTrace): void {
    this.traces.set(stored.trace.executionTraceId, stored);
    this.byExecution.set(stored.trace.executionId, stored.trace.executionTraceId);
  }

  listTraces(): readonly StoredExecutionTrace[] {
    return [...this.traces.values()];
  }

  removeTrace(executionTraceId: string): boolean {
    const existing = this.traces.get(executionTraceId);
    if (!existing) return false;
    this.byExecution.delete(existing.trace.executionId);
    return this.traces.delete(executionTraceId);
  }

  removeTraceByExecution(executionId: string): boolean {
    const executionTraceId = this.byExecution.get(executionId);
    if (!executionTraceId) return false;
    return this.removeTrace(executionTraceId);
  }

  traceCount(): number {
    return this.traces.size;
  }

  entryCount(): number {
    let total = 0;
    for (const stored of this.traces.values()) {
      total += stored.trace.entries.length;
    }
    return total;
  }

  stepCount(): number {
    let total = 0;
    for (const stored of this.traces.values()) {
      total += stored.trace.steps.length;
    }
    return total;
  }

  nodeCount(): number {
    let total = 0;
    for (const stored of this.traces.values()) {
      total += stored.trace.nodes.length;
    }
    return total;
  }

  referenceCount(): number {
    let total = 0;
    for (const stored of this.traces.values()) {
      total += stored.trace.references.length;
      for (const entry of stored.trace.entries) {
        total += entry.references.length;
      }
    }
    return total;
  }

  snapshotCount(): number {
    let total = 0;
    for (const stored of this.traces.values()) {
      if (stored.trace.snapshot) total += 1;
    }
    return total;
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `DefaultExecutionTraceStore ready (${this.traces.size} traces).`,
    };
  }
}
