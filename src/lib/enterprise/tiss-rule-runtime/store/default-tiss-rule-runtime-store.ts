/**
 * DefaultTISSRuleRuntimeStore — store in-process padrão (EPC-23).
 *
 * Utiliza mecanismo em memória do processo (sem novo banco, sem migrations).
 */
import type {
  StoredExecutionMetadata,
  StoredExecutionPipeline,
  StoredExecutionResult,
  StoredExecutionTrace,
  StoredTISSExecutionContext,
  TISSRuleRuntimeStore,
} from "./tiss-rule-runtime-store";

export const DEFAULT_TISS_RULE_RUNTIME_STORE_ID = "default-in-process";

export type DefaultTISSRuleRuntimeStoreOptions = {
  contexts?: readonly StoredTISSExecutionContext[];
  pipelines?: readonly StoredExecutionPipeline[];
  results?: readonly StoredExecutionResult[];
  traces?: readonly StoredExecutionTrace[];
  metadata?: readonly StoredExecutionMetadata[];
};

export class DefaultTISSRuleRuntimeStore implements TISSRuleRuntimeStore {
  readonly storeId = DEFAULT_TISS_RULE_RUNTIME_STORE_ID;

  private readonly contexts = new Map<string, StoredTISSExecutionContext>();
  private readonly pipelines = new Map<string, StoredExecutionPipeline>();
  private readonly pipelinesByExecution = new Map<string, string>();
  private readonly results = new Map<string, StoredExecutionResult>();
  private readonly resultsByExecution = new Map<string, string>();
  private readonly traces = new Map<string, StoredExecutionTrace>();
  private readonly tracesByExecution = new Map<string, string>();
  private readonly metadata = new Map<string, StoredExecutionMetadata>();

  constructor(options: DefaultTISSRuleRuntimeStoreOptions = {}) {
    for (const context of options.contexts ?? []) {
      this.setContext(context);
    }
    for (const pipeline of options.pipelines ?? []) {
      this.setPipeline(pipeline);
    }
    for (const result of options.results ?? []) {
      this.setResult(result);
    }
    for (const trace of options.traces ?? []) {
      this.setTrace(trace);
    }
    for (const meta of options.metadata ?? []) {
      this.metadata.set(meta.id, meta);
    }
  }

  getContext(executionId: string): StoredTISSExecutionContext | undefined {
    return this.contexts.get(executionId);
  }

  setContext(context: StoredTISSExecutionContext): void {
    this.contexts.set(context.executionId, context);
  }

  listContexts(): readonly StoredTISSExecutionContext[] {
    return [...this.contexts.values()];
  }

  removeContext(executionId: string): boolean {
    return this.contexts.delete(executionId);
  }

  contextCount(): number {
    return this.contexts.size;
  }

  getPipeline(pipelineId: string): StoredExecutionPipeline | undefined {
    return this.pipelines.get(pipelineId);
  }

  getPipelineByExecution(executionId: string): StoredExecutionPipeline | undefined {
    const id = this.pipelinesByExecution.get(executionId);
    return id ? this.pipelines.get(id) : undefined;
  }

  setPipeline(pipeline: StoredExecutionPipeline): void {
    this.pipelines.set(pipeline.id, pipeline);
    this.pipelinesByExecution.set(pipeline.executionId, pipeline.id);
  }

  listPipelines(): readonly StoredExecutionPipeline[] {
    return [...this.pipelines.values()];
  }

  removePipeline(pipelineId: string): boolean {
    const existing = this.pipelines.get(pipelineId);
    if (!existing) return false;
    this.pipelinesByExecution.delete(existing.executionId);
    return this.pipelines.delete(pipelineId);
  }

  pipelineCount(): number {
    return this.pipelines.size;
  }

  getResult(resultId: string): StoredExecutionResult | undefined {
    return this.results.get(resultId);
  }

  getResultByExecution(executionId: string): StoredExecutionResult | undefined {
    const id = this.resultsByExecution.get(executionId);
    return id ? this.results.get(id) : undefined;
  }

  setResult(result: StoredExecutionResult): void {
    this.results.set(result.id, result);
    this.resultsByExecution.set(result.executionId, result.id);
  }

  listResults(): readonly StoredExecutionResult[] {
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

  getTrace(traceId: string): StoredExecutionTrace | undefined {
    return this.traces.get(traceId);
  }

  getTraceByExecution(executionId: string): StoredExecutionTrace | undefined {
    const id = this.tracesByExecution.get(executionId);
    return id ? this.traces.get(id) : undefined;
  }

  setTrace(trace: StoredExecutionTrace): void {
    this.traces.set(trace.id, trace);
    this.tracesByExecution.set(trace.executionId, trace.id);
  }

  listTraces(): readonly StoredExecutionTrace[] {
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

  getMetadata(metadataId: string): StoredExecutionMetadata | undefined {
    return this.metadata.get(metadataId);
  }

  setMetadata(metadata: StoredExecutionMetadata): void {
    this.metadata.set(metadata.id, metadata);
  }

  listMetadata(): readonly StoredExecutionMetadata[] {
    return [...this.metadata.values()];
  }

  removeMetadata(metadataId: string): boolean {
    return this.metadata.delete(metadataId);
  }

  metadataCount(): number {
    return this.metadata.size;
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: "DefaultTISSRuleRuntimeStore pronto (sem I/O externo — EPC-23).",
    };
  }
}
