#!/usr/bin/env node
/**
 * EPC-23 — TISS Rule Runtime Foundation
 * Prova Application → TISSRuleRuntimePort → Adapter → Store sem tocar produto.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_TISS_RULE_RUNTIME_ADAPTER_ID,
  DEFAULT_TISS_RULE_RUNTIME_STORE_ID,
  DefaultTISSRuleRuntimeAdapter,
  DefaultTISSRuleRuntimeStore,
  EXECUTION_PIPELINE_STAGES,
  FUTURE_INTEGRATION_NOTES,
  MOCK_TISS_RULE_RUNTIME_ADAPTER_ID,
  MockTISSRuleRuntimeAdapter,
  RUNTIME_ORCHESTRATED_COMPONENTS,
  RUNTIME_ORCHESTRATION_PIPELINE,
  RUNTIME_STRUCTURAL_CHAIN,
  RUNTIME_VERSION_FAMILIES,
  createCanonicalPipelineStages,
  createTISSRuleRuntimeFactory,
  createTISSRuleRuntimePort,
  getTISSRuleRuntimeHealthSummary,
  resetAllTISSRuleRuntimeIdSequences,
  type TISSRuleRuntimePort,
} from "../../../src/lib/enterprise/tiss-rule-runtime/index.ts";

describe("EPC-23 TISSRuleRuntimePort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy", async () => {
    const port: TISSRuleRuntimePort = new MockTISSRuleRuntimeAdapter({ provider: "mock" });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.storedContextCount, 0);
    assert.equal(health.storedPipelineCount, 0);
    assert.equal(health.storedResultCount, 0);
    assert.equal(health.storedTraceCount, 0);
    assert.equal(health.storedMetadataCount, 0);

    const caps = port.capabilities();
    assert.equal(caps.adapterId, "mock-in-memory");
    assert.equal(caps.supportsStartExecution, true);
    assert.equal(caps.supportsResolveProfile, true);
    assert.equal(caps.supportsResolveBindings, true);
    assert.equal(caps.supportsResolveRulePacks, true);
    assert.equal(caps.supportsDispatchRules, true);
    assert.equal(caps.supportsCollectResults, true);
    assert.equal(caps.supportsParallelExecution, true);
    assert.equal(caps.supportsBatchExecution, true);
    assert.equal(caps.supportsVersioning, true);
    assert.equal(caps.supportsTracing, true);
    assert.equal(caps.supportsRollback, true);
    assert.equal(caps.supportsRetry, true);
    assert.equal(caps.receivesHealthcareModelOnly, true);
    assert.equal(caps.resolvesTissProfile, true);
    assert.equal(caps.resolvesContractRuleBinding, true);
    assert.equal(caps.forwardsRulePacksToRuleEngine, true);
    assert.equal(caps.collectsResultsWithoutInterpretation, true);
    assert.equal(caps.supportsFutureAiAuditor, true);
    assert.equal(caps.supportsFutureExpressionEngine, true);
    assert.equal(caps.supportsFutureOcr, true);
    assert.equal(caps.implementsRuleExecution, false);
    assert.equal(caps.implementsTissValidation, false);
    assert.equal(caps.implementsSpecificContracts, false);
    assert.equal(caps.implementsAnsValidation, false);
    assert.equal(caps.implementsOcr, false);
    assert.equal(caps.implementsAi, false);
    assert.equal(caps.implementsXmlParser, false);
    assert.equal(caps.implementsPersistence, false);
    assert.equal(caps.implementsClinicalWorkflow, false);
    assert.equal(caps.orchestrationOnly, true);
  });

  it("DefaultTISSRuleRuntimeAdapter é o default da fundação", async () => {
    const port: TISSRuleRuntimePort = new DefaultTISSRuleRuntimeAdapter();
    assert.equal(port.providerId, "default");
    const caps = port.capabilities();
    assert.equal(caps.adapterId, DEFAULT_TISS_RULE_RUNTIME_ADAPTER_ID);
    assert.equal(caps.implementsRuleExecution, false);
    assert.equal(caps.implementsTissValidation, false);
    assert.equal(caps.implementsSpecificContracts, false);
    assert.equal(caps.orchestrationOnly, true);

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "default");
  });

  it("test adapter é resolvido pelo provider", async () => {
    const port = createTISSRuleRuntimePort({ provider: "test" });
    assert.equal(port.providerId, "test");
    const health = await port.health();
    assert.equal(health.ok, true);
  });

  it("Default usa ping opcional sem I/O externo", async () => {
    const port = new DefaultTISSRuleRuntimeAdapter({
      store: new DefaultTISSRuleRuntimeStore(),
      ping: async () => ({ ok: true, message: "tiss-rule-runtime probe custom" }),
    });
    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.message, "tiss-rule-runtime probe custom");
    assert.equal(typeof health.latencyMs, "number");
  });

  it("provider default resolve DefaultTISSRuleRuntimeAdapter", () => {
    const defaultPort = createTISSRuleRuntimePort();
    assert.equal(defaultPort.providerId, "default");
  });

  it("Factory materializa adapters corretos", () => {
    const factory = createTISSRuleRuntimeFactory();
    assert.equal(factory.create().providerId, "default");
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
  });

  it("PoC Application depende só do Port (inversão de dependência)", async () => {
    const port = createTISSRuleRuntimePort({ provider: "mock" });
    const summary = await getTISSRuleRuntimeHealthSummary(port);

    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.provider, "mock");
    assert.equal(summary.capabilities.provider, "mock");
    assert.equal(summary.health.ok, true);
  });

  it("MOCK adapter id constante está estável", () => {
    assert.equal(MOCK_TISS_RULE_RUNTIME_ADAPTER_ID, "mock-in-memory");
    assert.equal(DEFAULT_TISS_RULE_RUNTIME_STORE_ID, "default-in-process");
  });
});

describe("EPC-23 ExecutionPipeline orchestration (sem regras)", () => {
  it("pipeline canônico contém exatamente os 6 estágios da FASE 7", () => {
    assert.deepEqual(
      [...EXECUTION_PIPELINE_STAGES],
      [
        "receive-healthcare-model",
        "resolve-profile",
        "resolve-contract-binding",
        "resolve-rule-packs",
        "dispatch-rule-engine",
        "collect-result",
      ],
    );

    const stages = createCanonicalPipelineStages(() => "stage-fixed");
    assert.equal(stages.length, 6);
    assert.ok(stages.every((stage) => stage.status === "pending"));
  });

  it("orquestra Healthcare Model → Profile → Binding → Packs → Dispatch → Collect", async () => {
    resetAllTISSRuleRuntimeIdSequences();
    const port = new MockTISSRuleRuntimeAdapter({
      createExecutionId: () => "tiss-runtime-exec-fixed-1",
      createPipelineId: () => "tiss-runtime-pipeline-fixed-1",
      createTraceId: () => "tiss-runtime-trace-fixed-1",
      createResultId: () => "tiss-runtime-result-fixed-1",
      createMetadataId: () => "tiss-runtime-meta-fixed-1",
      createCorrelationId: () => "tiss-runtime-corr-fixed-1",
      createStageId: (() => {
        let n = 0;
        return () => `tiss-runtime-stage-fixed-${++n}`;
      })(),
      now: () => "2026-07-31T20:00:00.000Z",
    });

    const started = await port.startExecution({
      healthcareModelRef: "hm-ref-consultation-001",
      channel: "enterprise-test",
      tags: ["foundation", "orchestration"],
    });

    assert.equal(started.ok, true);
    assert.equal(started.context?.healthcareModelRef, "hm-ref-consultation-001");
    assert.equal(started.context?.executionId, "tiss-runtime-exec-fixed-1");
    assert.equal(started.pipeline?.stages.length, 6);
    assert.equal(started.pipeline?.stages[0]?.name, "receive-healthcare-model");
    assert.equal(started.pipeline?.stages[0]?.status, "completed");
    assert.equal(started.pipeline?.currentStageName, "resolve-profile");
    assert.equal(started.trace?.status, "running");
    assert.equal(started.trace?.correlationId, "tiss-runtime-corr-fixed-1");

    const profile = await port.resolveProfile({
      executionId: "tiss-runtime-exec-fixed-1",
      profileRef: "profile-ref-consultation",
    });
    assert.equal(profile.ok, true);
    assert.equal(profile.profileRef, "profile-ref-consultation");
    assert.equal(profile.stageStatus, "completed");

    const bindings = await port.resolveBindings({
      executionId: "tiss-runtime-exec-fixed-1",
      bindingRefs: ["binding-ref-a", "binding-ref-b"],
    });
    assert.equal(bindings.ok, true);
    assert.deepEqual(bindings.bindingRefs, ["binding-ref-a", "binding-ref-b"]);

    const packs = await port.resolveRulePacks({
      executionId: "tiss-runtime-exec-fixed-1",
      rulePackRefs: ["rule-pack-ref-1"],
    });
    assert.equal(packs.ok, true);
    assert.deepEqual(packs.rulePackRefs, ["rule-pack-ref-1"]);

    const dispatch = await port.dispatchRules({
      executionId: "tiss-runtime-exec-fixed-1",
      ruleDispatchRef: "dispatch-ref-1",
    });
    assert.equal(dispatch.ok, true);
    assert.equal(dispatch.rulesExecuted, false);
    assert.equal(dispatch.ruleDispatchRef, "dispatch-ref-1");

    const collected = await port.collectResults({
      executionId: "tiss-runtime-exec-fixed-1",
      collectedPayload: { opaque: true, note: "never interpreted by runtime" },
    });
    assert.equal(collected.ok, true);
    assert.equal(collected.result?.status, "completed");
    assert.equal(collected.result?.aiAuditorPrepared, true);
    assert.equal(collected.result?.healthcareModelRef, "hm-ref-consultation-001");
    assert.equal(collected.result?.profileRef, "profile-ref-consultation");
    assert.deepEqual(collected.result?.bindingRefs, ["binding-ref-a", "binding-ref-b"]);
    assert.deepEqual(collected.result?.rulePackRefs, ["rule-pack-ref-1"]);
    assert.equal(collected.result?.ruleDispatchRef, "dispatch-ref-1");
    assert.equal(collected.pipeline?.status, "completed");
    assert.equal(collected.trace?.status, "completed");
    assert.ok(collected.pipeline?.stages.every((stage) => stage.status === "completed"));

    const health = await port.health();
    assert.equal(health.storedContextCount, 1);
    assert.equal(health.storedPipelineCount, 1);
    assert.equal(health.storedResultCount, 1);
    assert.equal(health.storedTraceCount, 1);
    assert.equal(health.storedMetadataCount, 1);
  });

  it("DefaultTISSRuleRuntimeAdapter percorre o pipeline sem executar regras", async () => {
    resetAllTISSRuleRuntimeIdSequences();
    const port = new DefaultTISSRuleRuntimeAdapter({
      now: () => "2026-07-31T21:00:00.000Z",
    });

    const started = await port.startExecution({
      healthcareModelRef: "hm-default-1",
    });
    assert.equal(started.ok, true);
    const executionId = started.context!.executionId;

    await port.resolveProfile({ executionId });
    await port.resolveBindings({ executionId });
    await port.resolveRulePacks({ executionId });
    const dispatch = await port.dispatchRules({ executionId });
    assert.equal(dispatch.rulesExecuted, false);

    const collected = await port.collectResults({ executionId });
    assert.equal(collected.ok, true);
    assert.equal(collected.result?.aiAuditorPrepared, true);

    const caps = port.capabilities();
    assert.equal(caps.implementsRuleExecution, false);
    assert.equal(caps.implementsTissValidation, false);
  });

  it("startExecution rejeita ausência de Healthcare Model", async () => {
    const port = new MockTISSRuleRuntimeAdapter();
    const started = await port.startExecution({
      healthcareModelRef: "",
    });
    assert.equal(started.ok, false);
    assert.equal(started.code, "invalid_input");
  });

  it("resolveProfile falha para executionId inexistente", async () => {
    const port = new MockTISSRuleRuntimeAdapter();
    const result = await port.resolveProfile({ executionId: "missing" });
    assert.equal(result.ok, false);
    assert.equal(result.code, "not_found");
  });

  it("mock unhealthy bloqueia orquestração", async () => {
    const port = new MockTISSRuleRuntimeAdapter({
      healthy: false,
      message: "offline for homologation",
    });
    const health = await port.health();
    assert.equal(health.ok, false);

    const started = await port.startExecution({
      healthcareModelRef: "hm-x",
    });
    assert.equal(started.ok, false);
    assert.equal(started.code, "unhealthy");
  });
});

describe("EPC-23 structural constants and future integration", () => {
  it("documenta pipeline de orquestração e componentes", () => {
    assert.ok(RUNTIME_ORCHESTRATION_PIPELINE.includes("healthcare-model"));
    assert.ok(RUNTIME_ORCHESTRATION_PIPELINE.includes("tiss-profile"));
    assert.ok(RUNTIME_ORCHESTRATION_PIPELINE.includes("contract-rule-binding"));
    assert.ok(RUNTIME_ORCHESTRATION_PIPELINE.includes("rule-packs"));
    assert.ok(RUNTIME_ORCHESTRATION_PIPELINE.includes("rule-engine"));
    assert.ok(RUNTIME_ORCHESTRATION_PIPELINE.includes("expression-engine"));
    assert.ok(RUNTIME_ORCHESTRATION_PIPELINE.includes("ai-auditor"));

    assert.ok(RUNTIME_ORCHESTRATED_COMPONENTS.includes("healthcare-model"));
    assert.ok(RUNTIME_ORCHESTRATED_COMPONENTS.includes("ai-auditor"));
    assert.ok(RUNTIME_ORCHESTRATED_COMPONENTS.includes("ocr-provider"));

    assert.deepEqual(
      [...RUNTIME_STRUCTURAL_CHAIN],
      [
        "execution-context",
        "execution-stage",
        "execution-pipeline",
        "execution-result",
        "execution-metadata",
        "execution-trace",
      ],
    );

    assert.deepEqual([...RUNTIME_VERSION_FAMILIES], ["tiss-4.x", "tiss-5.x", "proprietary"]);
  });

  it("FUTURE_INTEGRATION_NOTES cobre componentes Enterprise", () => {
    assert.ok(FUTURE_INTEGRATION_NOTES.healthcareModel.length > 0);
    assert.ok(FUTURE_INTEGRATION_NOTES.tissProfile.length > 0);
    assert.ok(FUTURE_INTEGRATION_NOTES.contractRuleBinding.length > 0);
    assert.ok(FUTURE_INTEGRATION_NOTES.rulePacks.length > 0);
    assert.ok(FUTURE_INTEGRATION_NOTES.ruleEngine.length > 0);
    assert.ok(FUTURE_INTEGRATION_NOTES.expressionEngine.length > 0);
    assert.ok(FUTURE_INTEGRATION_NOTES.aiAuditor.length > 0);
    assert.ok(FUTURE_INTEGRATION_NOTES.ocr.length > 0);
    assert.ok(FUTURE_INTEGRATION_NOTES.contractFoundation.length > 0);
  });

  it("modelos canônicos obrigatórios estão tipados no barrel", () => {
    // Smoke tipado: se o barrel quebrar, o import do topo falha em tsc.
    assert.equal(typeof createCanonicalPipelineStages, "function");
    assert.equal(typeof createTISSRuleRuntimePort, "function");
  });
});
