/**
 * Helpers internos de avanço estrutural de estágios (EPC-23).
 *
 * Somente orquestração de estado in-memory.
 * Sem regras. Sem validações. Sem decisões de negócio.
 */
import type {
  ExecutionPipeline,
  ExecutionStage,
  ExecutionStageName,
  ExecutionStatus,
  ExecutionTrace,
  TISSExecutionContext,
} from "../ports/models";
import type { TISSRuleRuntimeStore } from "../store";

export function durationMs(startedAt?: string, finishedAt?: string): number | undefined {
  if (!startedAt || !finishedAt) return undefined;
  const start = Date.parse(startedAt);
  const end = Date.parse(finishedAt);
  if (Number.isNaN(start) || Number.isNaN(end)) return undefined;
  return Math.max(0, end - start);
}

export function completeStage(
  stages: readonly ExecutionStage[],
  name: ExecutionStageName,
  stamp: string,
  artifactRef?: string,
  notes?: string,
): ExecutionStage[] {
  return stages.map((stage) => {
    if (stage.name !== name) return stage;
    const startedAt = stage.startedAt ?? stamp;
    return {
      ...stage,
      status: "completed" as const,
      startedAt,
      finishedAt: stamp,
      durationMs: durationMs(startedAt, stamp),
      artifactRef: artifactRef ?? stage.artifactRef,
      notes: notes ?? stage.notes,
    };
  });
}

export function markStageRunning(
  stages: readonly ExecutionStage[],
  name: ExecutionStageName,
  stamp: string,
): ExecutionStage[] {
  return stages.map((stage) => {
    if (stage.name !== name) return stage;
    if (stage.status === "completed") return stage;
    return {
      ...stage,
      status: "running" as const,
      startedAt: stage.startedAt ?? stamp,
    };
  });
}

export function syncTraceFromPipeline(
  trace: ExecutionTrace,
  pipeline: ExecutionPipeline,
  status: ExecutionStatus,
): ExecutionTrace {
  const errors = pipeline.stages.flatMap((stage) => stage.errors ?? []);
  const warnings = pipeline.stages.flatMap((stage) => stage.warnings ?? []);
  return {
    ...trace,
    stages: pipeline.stages,
    status,
    startedAt: pipeline.startedAt ?? trace.startedAt,
    finishedAt: pipeline.finishedAt,
    durationMs: pipeline.durationMs,
    errors,
    warnings,
  };
}

export function persistPipelineState(
  store: TISSRuleRuntimeStore,
  context: TISSExecutionContext,
  pipeline: ExecutionPipeline,
  trace: ExecutionTrace,
): void {
  store.setContext(context);
  store.setPipeline(pipeline);
  store.setTrace(trace);
}

export function requireExecution(
  store: TISSRuleRuntimeStore,
  executionId: string,
):
  | {
      ok: true;
      context: TISSExecutionContext;
      pipeline: ExecutionPipeline;
      trace: ExecutionTrace;
    }
  | { ok: false; code: string; message: string } {
  const context = store.getContext(executionId);
  if (!context) {
    return { ok: false, code: "not_found", message: "execution context not found" };
  }
  const pipeline = store.getPipelineByExecution(executionId);
  if (!pipeline) {
    return { ok: false, code: "pipeline_missing", message: "execution pipeline not found" };
  }
  const trace = store.getTraceByExecution(executionId);
  if (!trace) {
    return { ok: false, code: "trace_missing", message: "execution trace not found" };
  }
  return { ok: true, context, pipeline, trace };
}
