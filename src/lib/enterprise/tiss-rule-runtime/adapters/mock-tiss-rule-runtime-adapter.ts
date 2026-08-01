/**
 * MockTISSRuleRuntimeAdapter — EPC-23 / FASE 3.
 *
 * Voltado para testes, homologação e desenvolvimento offline
 * sem alterar produção e sem dependência externa.
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
  TISSRuleRuntimeProviderId,
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

export const MOCK_TISS_RULE_RUNTIME_ADAPTER_ID = "mock-in-memory";
export const MOCK_TISS_RULE_RUNTIME_VERSION = "1.0.0";

export type MockTISSRuleRuntimeAdapterOptions = {
  provider?: Extract<TISSRuleRuntimeProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: TISSRuleRuntimeStore;
  createExecutionId?: () => string;
  createPipelineId?: () => string;
  createStageId?: () => string;
  createResultId?: () => string;
  createTraceId?: () => string;
  createMetadataId?: () => string;
  createCorrelationId?: () => string;
  now?: () => string;
};

export class MockTISSRuleRuntimeAdapter implements TISSRuleRuntimePort {
  readonly providerId: Extract<TISSRuleRuntimeProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly store: TISSRuleRuntimeStore;
  private readonly createExecutionId: () => string;
  private readonly createPipelineId: () => string;
  private readonly createStageId: () => string;
  private readonly createResultId: () => string;
  private readonly createTraceId: () => string;
  private readonly createMetadataId: () => string;
  private readonly createCorrelationId: () => string;
  private readonly now?: () => string;

  constructor(options: MockTISSRuleRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.providerId} tiss-rule-runtime ready.`;
    this.store = options.store ?? new DefaultTISSRuleRuntimeStore();
    this.createExecutionId = options.createExecutionId ?? createExecutionId;
    this.createPipelineId = options.createPipelineId ?? createPipelineId;
    this.createStageId = options.createStageId ?? createStageId;
    this.createResultId = options.createResultId ?? createResultId;
    this.createTraceId = options.createTraceId ?? createTraceId;
    this.createMetadataId = options.createMetadataId ?? createRuntimeMetadataId;
    this.createCorrelationId = options.createCorrelationId ?? createCorrelationId;
    this.now = options.now;
  }

  getStore(): TISSRuleRuntimeStore {
    return this.store;
  }

  capabilities(): TISSRuleRuntimeCapabilities {
    return {
      provider: this.providerId,
      adapterId: `${this.providerId}-in-memory`,
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

  async health(): Promise<TISSRuleRuntimeHealth> {
    return {
      ok: this.healthy,
      provider: this.providerId,
      message: this.message,
      storedContextCount: this.store.contextCount(),
      storedPipelineCount: this.store.pipelineCount(),
      storedResultCount: this.store.resultCount(),
      storedTraceCount: this.store.traceCount(),
      storedMetadataCount: this.store.metadataCount(),
    };
  }

  private stamp(): string {
    return this.now?.() ?? new Date().toISOString();
  }

  private unhealthy<T extends { ok: boolean; code?: string; message?: string }>(
    extra: Omit<T, "ok" | "code" | "message"> = {} as Omit<T, "ok" | "code" | "message">,
  ): T {
    return {
      ...extra,
      ok: false,
      code: "unhealthy",
      message: this.message,
    } as T;
  }

  async startExecution(input: StartExecutionInput): Promise<StartExecutionResult> {
    if (!this.healthy) return this.unhealthy<StartExecutionResult>();

    if (!input.healthcareModelRef) {
      return {
        ok: false,
        code: "invalid_input",
        message: "healthcareModelRef required — Runtime receives Healthcare Model exclusively",
      };
    }

    const stamp = this.stamp();
    const executionId = this.createExecutionId();
    const pipelineId = this.createPipelineId();
    const traceId = this.createTraceId();
    const metadataId = this.createMetadataId();
    const correlationId = input.correlationId ?? this.createCorrelationId();

    const stages = createCanonicalPipelineStages(this.createStageId);
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
    if (!this.healthy) return this.unhealthy<ResolveProfileResult>();

    const loaded = requireExecution(this.store, input.executionId);
    if (!loaded.ok) return loaded;

    const stamp = this.stamp();
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
    if (!this.healthy) return this.unhealthy<ResolveBindingsResult>();

    const loaded = requireExecution(this.store, input.executionId);
    if (!loaded.ok) return loaded;

    const stamp = this.stamp();
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
    if (!this.healthy) return this.unhealthy<ResolveRulePacksResult>();

    const loaded = requireExecution(this.store, input.executionId);
    if (!loaded.ok) return loaded;

    const stamp = this.stamp();
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
    if (!this.healthy) {
      return this.unhealthy<DispatchRulesResult>({ rulesExecuted: false });
    }

    const loaded = requireExecution(this.store, input.executionId);
    if (!loaded.ok) {
      return { ...loaded, rulesExecuted: false };
    }

    const stamp = this.stamp();
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
    if (!this.healthy) return this.unhealthy<CollectResultsResult>();

    const loaded = requireExecution(this.store, input.executionId);
    if (!loaded.ok) return loaded;

    const stamp = this.stamp();
    const resultId = this.createResultId();

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
