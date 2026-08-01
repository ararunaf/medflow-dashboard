/**
 * DefaultTISSRuleRuntimeAdapter — adapter default in-memory (EPC-23 / FASE 2).
 *
 * Implementação totalmente in-memory.
 * Sem regras. Sem decisões. Sem validação TISS. Sem contratos.
 * Sem banco. Sem OCR/AI/parser/Workflow.
 */
import {
  createCorrelationId,
  createExecutionId,
  createPipelineId,
  createResultId,
  createRuntimeMetadataId,
  createStageId,
  createTraceId,
} from "../ports/identity";
import { createCanonicalPipelineStages } from "../ports/pipeline";
import type { TISSRuleRuntimePort } from "../ports/tiss-rule-runtime-port";
import type {
  ExecutionMetadata,
  ExecutionPipeline,
  ExecutionResult,
  ExecutionTrace,
  TISSExecutionContext,
} from "../ports/models";
import type {
  CollectResultsInput,
  CollectResultsResult,
  DispatchRulesInput,
  DispatchRulesResult,
  ResolveBindingsInput,
  ResolveBindingsResult,
  ResolveProfileInput,
  ResolveProfileResult,
  ResolveRulePacksInput,
  ResolveRulePacksResult,
  StartExecutionInput,
  StartExecutionResult,
  TISSRuleRuntimeCapabilities,
  TISSRuleRuntimeHealth,
} from "../ports/types";
import { DefaultTISSRuleRuntimeStore, type TISSRuleRuntimeStore } from "../store";
import {
  completeStage,
  durationMs,
  markStageRunning,
  persistPipelineState,
  requireExecution,
  syncTraceFromPipeline,
} from "./runtime-stage-helpers";

export const DEFAULT_TISS_RULE_RUNTIME_ADAPTER_ID = "default-in-process";
export const DEFAULT_TISS_RULE_RUNTIME_VERSION = "1.0.0";

/**
 * Runtime injetável — permite testes e bind futuro
 * sem acoplar o Port a detalhes de produto.
 */
export type DefaultTISSRuleRuntimeRuntime = {
  /** Store ativo. Default: DefaultTISSRuleRuntimeStore in-process. */
  store?: TISSRuleRuntimeStore;
  /** Probe opcional. */
  ping?: () => Promise<{ ok: boolean; message?: string }>;
  createExecutionId?: () => string;
  createPipelineId?: () => string;
  createStageId?: () => string;
  createResultId?: () => string;
  createTraceId?: () => string;
  createMetadataId?: () => string;
  createCorrelationId?: () => string;
  /** Relógio injetável (testes). */
  now?: () => string;
};

function defaultRuntime(): DefaultTISSRuleRuntimeRuntime {
  return {
    store: new DefaultTISSRuleRuntimeStore(),
  };
}

function nowIso(runtime: DefaultTISSRuleRuntimeRuntime): string {
  return runtime.now?.() ?? new Date().toISOString();
}

function foundationCapabilities(
  provider: "default",
  adapterId: string,
): TISSRuleRuntimeCapabilities {
  return {
    provider,
    adapterId,
    supportsStartExecution: true,
    supportsResolveProfile: true,
    supportsResolveBindings: true,
    supportsResolveRulePacks: true,
    supportsDispatchRules: true,
    supportsCollectResults: true,
    supportsHealth: true,
    supportsCapabilities: true,
    supportsParallelExecution: true,
    supportsBatchExecution: true,
    supportsVersioning: true,
    supportsTracing: true,
    supportsRollback: true,
    supportsRetry: true,
    receivesHealthcareModelOnly: true,
    resolvesTissProfile: true,
    resolvesContractRuleBinding: true,
    forwardsRulePacksToRuleEngine: true,
    collectsResultsWithoutInterpretation: true,
    supportsFutureAiAuditor: true,
    supportsFutureExpressionEngine: true,
    supportsFutureOcr: true,
    supportsFutureContractFoundation: true,
    implementsRuleExecution: false,
    implementsTissValidation: false,
    implementsSpecificContracts: false,
    implementsAnsValidation: false,
    implementsOcr: false,
    implementsAi: false,
    implementsXmlParser: false,
    implementsPersistence: false,
    implementsClinicalWorkflow: false,
    orchestrationOnly: true,
  };
}

function storeCounts(store: TISSRuleRuntimeStore) {
  return {
    storedContextCount: store.contextCount(),
    storedPipelineCount: store.pipelineCount(),
    storedResultCount: store.resultCount(),
    storedTraceCount: store.traceCount(),
    storedMetadataCount: store.metadataCount(),
  };
}

export class DefaultTISSRuleRuntimeAdapter implements TISSRuleRuntimePort {
  readonly providerId = "default" as const;

  private readonly runtime: DefaultTISSRuleRuntimeRuntime;
  private readonly store: TISSRuleRuntimeStore;

  constructor(runtime: DefaultTISSRuleRuntimeRuntime = defaultRuntime()) {
    this.runtime = runtime;
    this.store = runtime.store ?? new DefaultTISSRuleRuntimeStore();
  }

  /** Acesso estrutural ao store (testes / demo). */
  getStore(): TISSRuleRuntimeStore {
    return this.store;
  }

  capabilities(): TISSRuleRuntimeCapabilities {
    return foundationCapabilities("default", DEFAULT_TISS_RULE_RUNTIME_ADAPTER_ID);
  }

  async health(): Promise<TISSRuleRuntimeHealth> {
    const start = typeof performance !== "undefined" ? performance.now() : Date.now();

    if (this.runtime.ping) {
      const probe = await this.runtime.ping();
      const end = typeof performance !== "undefined" ? performance.now() : Date.now();
      return {
        ok: probe.ok,
        provider: "default",
        latencyMs: Math.max(0, Math.round(end - start)),
        message:
          probe.message ??
          (probe.ok
            ? "Default tiss-rule-runtime probe ok."
            : "Default tiss-rule-runtime probe falhou."),
        ...storeCounts(this.store),
      };
    }

    const storeHealth = this.store.health();
    const end = typeof performance !== "undefined" ? performance.now() : Date.now();
    return {
      ok: storeHealth.ok,
      provider: "default",
      latencyMs: Math.max(0, Math.round(end - start)),
      message:
        storeHealth.message ?? "DefaultTISSRuleRuntimeStore pronto (sem I/O externo — EPC-23).",
      ...storeCounts(this.store),
    };
  }

  async startExecution(input: StartExecutionInput): Promise<StartExecutionResult> {
    if (!input.healthcareModelRef) {
      return {
        ok: false,
        code: "invalid_input",
        message: "healthcareModelRef required — Runtime receives Healthcare Model exclusively",
      };
    }

    const stamp = nowIso(this.runtime);
    const executionId = this.runtime.createExecutionId?.() ?? createExecutionId();
    const pipelineId = this.runtime.createPipelineId?.() ?? createPipelineId();
    const traceId = this.runtime.createTraceId?.() ?? createTraceId();
    const metadataId = this.runtime.createMetadataId?.() ?? createRuntimeMetadataId();
    const correlationId =
      input.correlationId ?? this.runtime.createCorrelationId?.() ?? createCorrelationId();
    const stageIdFactory = this.runtime.createStageId ?? createStageId;

    const stages = createCanonicalPipelineStages(stageIdFactory);
    const stagesAfterReceive = completeStage(
      markStageRunning(stages, "receive-healthcare-model", stamp),
      "receive-healthcare-model",
      stamp,
      input.healthcareModelRef,
      "Healthcare Model received (structural — no interpretation)",
    );

    const metadata: ExecutionMetadata = {
      kind: "execution-metadata",
      id: metadataId,
      executionId,
      tenantRef: input.tenantRef,
      correlationId,
      channel: input.channel,
      tags: input.tags,
      customAttributes: input.customAttributes ?? input.metadata?.customAttributes,
      createdAt: stamp,
      updatedAt: stamp,
      status: "running",
      version: "1",
      ...input.metadata,
    };

    const pipeline: ExecutionPipeline = {
      kind: "execution-pipeline",
      id: pipelineId,
      executionId,
      stages: stagesAfterReceive,
      status: "running",
      currentStageName: "resolve-profile",
      startedAt: stamp,
    };

    const context: TISSExecutionContext = {
      kind: "execution-context",
      id: executionId,
      executionId,
      correlationId,
      pipelineId,
      healthcareModelRef: input.healthcareModelRef,
      traceId,
      metadataId,
      metadata,
      status: "running",
      startedAt: stamp,
      createdAt: stamp,
      updatedAt: stamp,
      version: "1",
      tags: input.tags,
      structuralNotes: input.structuralNotes,
      customAttributes: input.customAttributes,
    };

    const trace: ExecutionTrace = {
      kind: "execution-trace",
      id: traceId,
      executionId,
      correlationId,
      pipelineId,
      stages: stagesAfterReceive,
      startedAt: stamp,
      status: "running",
      errors: [],
      warnings: [],
    };

    this.store.setMetadata(metadata);
    persistPipelineState(this.store, context, pipeline, trace);

    return {
      ok: true,
      context,
      pipeline,
      trace,
      code: "started",
      message: "execution started — orchestration only",
    };
  }

  async resolveProfile(input: ResolveProfileInput): Promise<ResolveProfileResult> {
    const loaded = requireExecution(this.store, input.executionId);
    if (!loaded.ok) return loaded;

    const stamp = nowIso(this.runtime);
    const profileRef =
      input.profileRef ?? `structural-profile-ref:${loaded.context.healthcareModelRef}`;

    const stages = completeStage(
      markStageRunning(loaded.pipeline.stages, "resolve-profile", stamp),
      "resolve-profile",
      stamp,
      profileRef,
      "TISS Profile resolved structurally — no validation",
    );

    const pipeline: ExecutionPipeline = {
      ...loaded.pipeline,
      stages,
      currentStageName: "resolve-contract-binding",
      status: "running",
    };

    const context: TISSExecutionContext = {
      ...loaded.context,
      profileRef,
      updatedAt: stamp,
    };

    const trace = syncTraceFromPipeline(loaded.trace, pipeline, "running");
    persistPipelineState(this.store, context, pipeline, trace);

    return {
      ok: true,
      executionId: input.executionId,
      profileRef,
      stageStatus: "completed",
      code: "profile_resolved",
      message: "profile resolved structurally",
    };
  }

  async resolveBindings(input: ResolveBindingsInput): Promise<ResolveBindingsResult> {
    const loaded = requireExecution(this.store, input.executionId);
    if (!loaded.ok) return loaded;

    const stamp = nowIso(this.runtime);
    const bindingRefs =
      input.bindingRefs ??
      ([`structural-binding-ref:${loaded.context.profileRef ?? "unbound"}`] as const);

    const stages = completeStage(
      markStageRunning(loaded.pipeline.stages, "resolve-contract-binding", stamp),
      "resolve-contract-binding",
      stamp,
      bindingRefs.join(","),
      "Contract Rule Binding resolved structurally — no contract interpretation",
    );

    const pipeline: ExecutionPipeline = {
      ...loaded.pipeline,
      stages,
      currentStageName: "resolve-rule-packs",
      status: "running",
    };

    const context: TISSExecutionContext = {
      ...loaded.context,
      bindingRefs,
      updatedAt: stamp,
    };

    const trace = syncTraceFromPipeline(loaded.trace, pipeline, "running");
    persistPipelineState(this.store, context, pipeline, trace);

    return {
      ok: true,
      executionId: input.executionId,
      bindingRefs,
      stageStatus: "completed",
      code: "bindings_resolved",
      message: "bindings resolved structurally",
    };
  }

  async resolveRulePacks(input: ResolveRulePacksInput): Promise<ResolveRulePacksResult> {
    const loaded = requireExecution(this.store, input.executionId);
    if (!loaded.ok) return loaded;

    const stamp = nowIso(this.runtime);
    const rulePackRefs =
      input.rulePackRefs ??
      ([`structural-rule-pack-ref:${loaded.context.bindingRefs?.[0] ?? "unbound"}`] as const);

    const stages = completeStage(
      markStageRunning(loaded.pipeline.stages, "resolve-rule-packs", stamp),
      "resolve-rule-packs",
      stamp,
      rulePackRefs.join(","),
      "Rule Packs resolved structurally — packs not loaded or executed",
    );

    const pipeline: ExecutionPipeline = {
      ...loaded.pipeline,
      stages,
      currentStageName: "dispatch-rule-engine",
      status: "running",
    };

    const context: TISSExecutionContext = {
      ...loaded.context,
      rulePackRefs,
      updatedAt: stamp,
    };

    const trace = syncTraceFromPipeline(loaded.trace, pipeline, "running");
    persistPipelineState(this.store, context, pipeline, trace);

    return {
      ok: true,
      executionId: input.executionId,
      rulePackRefs,
      stageStatus: "completed",
      code: "rule_packs_resolved",
      message: "rule packs resolved structurally",
    };
  }

  async dispatchRules(input: DispatchRulesInput): Promise<DispatchRulesResult> {
    const loaded = requireExecution(this.store, input.executionId);
    if (!loaded.ok) {
      return { ...loaded, rulesExecuted: false };
    }

    const stamp = nowIso(this.runtime);
    const ruleDispatchRef =
      input.ruleDispatchRef ??
      `structural-dispatch-ref:${loaded.context.rulePackRefs?.[0] ?? "unbound"}`;

    const stages = completeStage(
      markStageRunning(loaded.pipeline.stages, "dispatch-rule-engine", stamp),
      "dispatch-rule-engine",
      stamp,
      ruleDispatchRef,
      "Dispatched structurally to Rule Engine — no rules executed",
    );

    const pipeline: ExecutionPipeline = {
      ...loaded.pipeline,
      stages,
      currentStageName: "collect-result",
      status: "running",
    };

    const context: TISSExecutionContext = {
      ...loaded.context,
      ruleDispatchRef,
      updatedAt: stamp,
    };

    const trace = syncTraceFromPipeline(loaded.trace, pipeline, "running");
    persistPipelineState(this.store, context, pipeline, trace);

    return {
      ok: true,
      executionId: input.executionId,
      ruleDispatchRef,
      stageStatus: "completed",
      rulesExecuted: false,
      code: "dispatched",
      message: "rules dispatched structurally — zero rules executed",
    };
  }

  async collectResults(input: CollectResultsInput): Promise<CollectResultsResult> {
    const loaded = requireExecution(this.store, input.executionId);
    if (!loaded.ok) return loaded;

    const stamp = nowIso(this.runtime);
    const resultId = this.runtime.createResultId?.() ?? createResultId();

    const stages = completeStage(
      markStageRunning(loaded.pipeline.stages, "collect-result", stamp),
      "collect-result",
      stamp,
      resultId,
      "Result collected without interpretation",
    );

    const pipeline: ExecutionPipeline = {
      ...loaded.pipeline,
      stages,
      currentStageName: undefined,
      status: "completed",
      finishedAt: stamp,
      durationMs: durationMs(loaded.pipeline.startedAt, stamp),
    };

    const result: ExecutionResult = {
      kind: "execution-result",
      id: resultId,
      executionId: input.executionId,
      pipelineId: pipeline.id,
      status: "completed",
      healthcareModelRef: loaded.context.healthcareModelRef,
      profileRef: loaded.context.profileRef,
      bindingRefs: loaded.context.bindingRefs,
      rulePackRefs: loaded.context.rulePackRefs,
      ruleDispatchRef: loaded.context.ruleDispatchRef,
      collectedPayload: input.collectedPayload,
      errors: [],
      warnings: [],
      startedAt: loaded.context.startedAt,
      finishedAt: stamp,
      durationMs: durationMs(loaded.context.startedAt, stamp),
      aiAuditorPrepared: true,
    };

    const context: TISSExecutionContext = {
      ...loaded.context,
      resultId,
      status: "completed",
      finishedAt: stamp,
      updatedAt: stamp,
    };

    const trace = syncTraceFromPipeline(loaded.trace, pipeline, "completed");
    this.store.setResult(result);
    persistPipelineState(this.store, context, pipeline, trace);

    return {
      ok: true,
      executionId: input.executionId,
      result,
      trace,
      context,
      pipeline,
      code: "collected",
      message: "results collected without interpretation",
    };
  }
}
