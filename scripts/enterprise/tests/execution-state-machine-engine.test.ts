#!/usr/bin/env node
/**
 * EPC-24 Sprint 04 — Execution State Machine Foundation
 * Prova Application → ExecutionStateMachinePort → Adapter → Store
 * sem tocar produto e sem invocar OCR / IA / Mapping / regras.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_EXECUTION_STATE_MACHINE_ADAPTER_ID,
  DEFAULT_EXECUTION_STATE_MACHINE_STORE_ID,
  DefaultExecutionStateMachineAdapter,
  DefaultExecutionStateMachineStore,
  EXECUTION_STATE_DEFINITIONS,
  MOCK_EXECUTION_STATE_MACHINE_ADAPTER_ID,
  MockExecutionStateMachineAdapter,
  STRUCTURAL_TRANSITION_EDGES,
  createExecutionStateMachineFactory,
  createExecutionStateMachinePort,
  getExecutionStateDefinition,
  getExecutionStateMachineHealthSummary,
  isStructuralTransitionAllowed,
  isTerminalExecutionStatus,
  resetAllExecutionStateMachineIdSequences,
  type ExecutionStateMachinePort,
} from "../../../src/lib/enterprise/execution-state-machine/index.ts";
import {
  DefaultCanonicalExecutionOrchestratorAdapter,
  MockCanonicalExecutionOrchestratorAdapter,
  createCanonicalExecutionOrchestratorFactory,
  resetAllCanonicalExecutionIdSequences,
} from "../../../src/lib/enterprise/canonical-execution-orchestrator/index.ts";
import {
  createExecutionContextPort,
  type ExecutionContextPort,
} from "../../../src/lib/enterprise/execution-context/index.ts";
import {
  createPipelineResolverPort,
  type PipelineResolverPort,
} from "../../../src/lib/enterprise/pipeline-resolver/index.ts";

describe("EPC-24 ExecutionStateMachinePort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy", async () => {
    const port: ExecutionStateMachinePort = new MockExecutionStateMachineAdapter({
      provider: "mock",
    });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.storedLifecycleCount, 0);
    assert.equal(health.storedTransitionCount, 0);
    assert.equal(health.storedHistoryCount, 0);

    const caps = port.capabilities();
    assert.equal(caps.adapterId, "mock-in-memory");
    assert.equal(caps.supportsCreateStateMachine, true);
    assert.equal(caps.supportsTransition, true);
    assert.equal(caps.supportsGetCurrentState, true);
    assert.equal(caps.supportsGetHistory, true);
    assert.equal(caps.supportsHealth, true);
    assert.equal(caps.supportsCapabilities, true);
    assert.equal(caps.structuralLifecycleOnly, true);
    assert.equal(caps.enginesInvoked, false);
    assert.equal(caps.stagesExecuted, false);
    assert.equal(caps.processingPerformed, false);
    assert.equal(caps.implementsOcr, false);
    assert.equal(caps.implementsAi, false);
    assert.equal(caps.implementsXmlParser, false);
    assert.equal(caps.implementsTissRules, false);
    assert.equal(caps.implementsMapping, false);
    assert.equal(caps.implementsValidation, false);
    assert.equal(caps.implementsPersistence, false);
    assert.equal(caps.implementsUi, false);
    assert.equal(caps.implementsHttpWorkersQueues, false);
    assert.equal(caps.noDirectEngineCoupling, true);
    assert.equal(caps.decoupledFromEngines, true);
  });

  it("DefaultExecutionStateMachineAdapter é o default da fundação", async () => {
    const port: ExecutionStateMachinePort = new DefaultExecutionStateMachineAdapter();
    assert.equal(port.providerId, "default");
    const caps = port.capabilities();
    assert.equal(caps.adapterId, DEFAULT_EXECUTION_STATE_MACHINE_ADAPTER_ID);
    assert.equal(caps.structuralLifecycleOnly, true);
    assert.equal(caps.implementsOcr, false);
    assert.equal(caps.implementsAi, false);

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "default");
  });

  it("test adapter é resolvido pelo provider", async () => {
    const port = createExecutionStateMachinePort({ provider: "test" });
    assert.equal(port.providerId, "test");
    const health = await port.health();
    assert.equal(health.ok, true);
  });

  it("Default usa ping opcional sem I/O externo", async () => {
    const port = new DefaultExecutionStateMachineAdapter({
      store: new DefaultExecutionStateMachineStore(),
      ping: async () => ({
        ok: true,
        message: "execution-state-machine probe custom",
      }),
    });
    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.message, "execution-state-machine probe custom");
    assert.equal(typeof health.latencyMs, "number");
  });

  it("provider default resolve DefaultExecutionStateMachineAdapter", () => {
    const defaultPort = createExecutionStateMachinePort();
    assert.equal(defaultPort.providerId, "default");
  });

  it("Factory materializa adapters corretos", () => {
    const factory = createExecutionStateMachineFactory();
    assert.equal(factory.create().providerId, "default");
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
  });

  it("PoC Application depende só do Port (inversão de dependência)", async () => {
    const port = createExecutionStateMachinePort({ provider: "mock" });
    const summary = await getExecutionStateMachineHealthSummary(port);

    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.provider, "mock");
    assert.equal(summary.capabilities.provider, "mock");
    assert.equal(summary.health.ok, true);
  });

  it("MOCK adapter id constante está estável", () => {
    assert.equal(MOCK_EXECUTION_STATE_MACHINE_ADAPTER_ID, "mock-in-memory");
    assert.equal(DEFAULT_EXECUTION_STATE_MACHINE_STORE_ID, "default-in-process");
  });
});

describe("EPC-24 Execution State Machine — criação e modelos canônicos", () => {
  it("createStateMachine materializa Lifecycle, State, History, Metadata, Definitions, Rules", async () => {
    resetAllExecutionStateMachineIdSequences();
    const port = new MockExecutionStateMachineAdapter({
      createStateMachineId: () => "execution-state-machine-fixed-1",
      createStateId: (() => {
        let n = 0;
        return () => `state-fixed-${++n}`;
      })(),
      createHistoryId: () => "history-fixed-1",
      createTransitionRuleId: (() => {
        let n = 0;
        return () => `rule-fixed-${++n}`;
      })(),
      now: () => "2026-08-01T22:00:00.000Z",
    });

    const created = await port.createStateMachine({
      executionId: "exec-1",
      correlationId: "corr-1",
      tags: ["state-machine", "foundation"],
      structuralNotes: "structural only",
    });

    assert.equal(created.ok, true);
    assert.equal(created.lifecycle?.kind, "execution-lifecycle");
    assert.equal(created.lifecycle?.id, "execution-state-machine-fixed-1");
    assert.equal(created.lifecycle?.stateMachineId, "execution-state-machine-fixed-1");
    assert.equal(created.lifecycle?.executionId, "exec-1");
    assert.equal(created.lifecycle?.correlationId, "corr-1");

    // Current state
    assert.equal(created.lifecycle?.currentState.kind, "execution-state");
    assert.equal(created.lifecycle?.currentState.status, "Created");
    assert.equal(created.lifecycle?.currentState.enginesInvoked, false);
    assert.equal(created.lifecycle?.currentState.stagesExecuted, false);
    assert.equal(created.lifecycle?.currentState.processingPerformed, false);
    assert.equal(created.lifecycle?.currentState.definition.terminal, false);

    // Metadata
    assert.equal(created.lifecycle?.metadata.kind, "execution-state-metadata");
    assert.deepEqual(created.lifecycle?.metadata.tags, ["state-machine", "foundation"]);
    assert.equal(created.lifecycle?.metadata.createdAt, "2026-08-01T22:00:00.000Z");

    // History
    assert.equal(created.lifecycle?.history.kind, "execution-state-history");
    assert.equal(created.lifecycle?.history.entryCount, 0);
    assert.equal(created.lifecycle?.history.transitions.length, 0);

    // Capability
    assert.equal(created.lifecycle?.capability.kind, "execution-state-capabilities");
    assert.equal(created.lifecycle?.capability.structuralLifecycleOnly, true);
    assert.equal(created.lifecycle?.capability.decoupledFromEngines, true);

    // Definitions / Rules
    assert.equal(created.lifecycle?.definitions.length, 10);
    assert.equal(created.lifecycle?.transitionRules.length, STRUCTURAL_TRANSITION_EDGES.length);
    assert.equal(created.lifecycle?.enginesInvoked, false);
  });

  it("catálogo canônico define 10 estados estruturais", () => {
    assert.equal(EXECUTION_STATE_DEFINITIONS.length, 10);
    assert.equal(getExecutionStateDefinition("Created").order, 0);
    assert.equal(getExecutionStateDefinition("Completed").terminal, true);
    assert.equal(isTerminalExecutionStatus("Failed"), true);
    assert.equal(isTerminalExecutionStatus("Running"), false);
    assert.equal(isStructuralTransitionAllowed("Created", "Pending"), true);
    assert.equal(isStructuralTransitionAllowed("Completed", "Running"), false);
  });

  it("require executionId na criação", async () => {
    const port = new MockExecutionStateMachineAdapter();
    const created = await port.createStateMachine({
      executionId: "",
    });
    assert.equal(created.ok, false);
    assert.equal(created.code, "invalid_input");
  });

  it("rejeita duplicata por executionId", async () => {
    const port = new MockExecutionStateMachineAdapter();
    const first = await port.createStateMachine({ executionId: "dup-exec" });
    assert.equal(first.ok, true);
    const second = await port.createStateMachine({ executionId: "dup-exec" });
    assert.equal(second.ok, false);
    assert.equal(second.code, "already_exists");
  });
});

describe("EPC-24 Execution State Machine — transitions, history, lifecycle", () => {
  it("aplica transições estruturais e acumula history", async () => {
    resetAllExecutionStateMachineIdSequences();
    const port = new MockExecutionStateMachineAdapter({
      createStateMachineId: () => "sm-transition-1",
      now: () => "2026-08-01T22:10:00.000Z",
    });

    const created = await port.createStateMachine({ executionId: "exec-transition-1" });
    assert.equal(created.ok, true);
    const smId = created.lifecycle!.stateMachineId;

    const toPending = await port.transition({ stateMachineId: smId, to: "Pending" });
    assert.equal(toPending.ok, true);
    assert.equal(toPending.from, "Created");
    assert.equal(toPending.to, "Pending");
    assert.equal(toPending.lifecycle?.currentState.status, "Pending");

    const toResolving = await port.transition({ stateMachineId: smId, to: "Resolving" });
    assert.equal(toResolving.ok, true);
    const toReady = await port.transition({ stateMachineId: smId, to: "Ready" });
    assert.equal(toReady.ok, true);
    const toRunning = await port.transition({ stateMachineId: smId, to: "Running" });
    assert.equal(toRunning.ok, true);
    const toCompleted = await port.transition({ stateMachineId: smId, to: "Completed" });
    assert.equal(toCompleted.ok, true);
    assert.equal(toCompleted.lifecycle?.currentState.status, "Completed");
    assert.equal(toCompleted.lifecycle?.currentState.definition.terminal, true);

    const history = await port.getHistory({ stateMachineId: smId });
    assert.equal(history.ok, true);
    assert.equal(history.history?.entryCount, 5);
    assert.equal(history.transitions?.length, 5);
    assert.deepEqual(
      history.transitions?.map((t) => t.to),
      ["Pending", "Resolving", "Ready", "Running", "Completed"],
    );

    const current = await port.getCurrentState({ stateMachineId: smId });
    assert.equal(current.ok, true);
    assert.equal(current.state?.status, "Completed");
    assert.equal(current.lifecycle?.enginesInvoked, false);
  });

  it("rejeita transição estrutural inválida", async () => {
    const port = new MockExecutionStateMachineAdapter();
    const created = await port.createStateMachine({ executionId: "exec-invalid-1" });
    const smId = created.lifecycle!.stateMachineId;

    const invalid = await port.transition({ stateMachineId: smId, to: "Completed" });
    assert.equal(invalid.ok, false);
    assert.equal(invalid.code, "transition_not_allowed");
    assert.equal(invalid.from, "Created");
    assert.equal(invalid.to, "Completed");
  });

  it("rejeita transição para o mesmo estado", async () => {
    const port = new MockExecutionStateMachineAdapter();
    const created = await port.createStateMachine({ executionId: "exec-same-1" });
    const smId = created.lifecycle!.stateMachineId;

    const same = await port.transition({ stateMachineId: smId, to: "Created" });
    assert.equal(same.ok, false);
    assert.equal(same.code, "same_state");
  });

  it("suporta Waiting e Paused estruturalmente", async () => {
    const port = new MockExecutionStateMachineAdapter();
    const created = await port.createStateMachine({ executionId: "exec-pause-1" });
    const smId = created.lifecycle!.stateMachineId;

    await port.transition({ stateMachineId: smId, to: "Pending" });
    await port.transition({ stateMachineId: smId, to: "Resolving" });
    await port.transition({ stateMachineId: smId, to: "Ready" });
    await port.transition({ stateMachineId: smId, to: "Running" });
    const waiting = await port.transition({ stateMachineId: smId, to: "Waiting" });
    assert.equal(waiting.ok, true);
    const paused = await port.transition({ stateMachineId: smId, to: "Paused" });
    assert.equal(paused.ok, true);
    const resume = await port.transition({ stateMachineId: smId, to: "Running" });
    assert.equal(resume.ok, true);
  });

  it("suporta Cancelled e Failed como terminais", async () => {
    const port = new MockExecutionStateMachineAdapter();
    const a = await port.createStateMachine({ executionId: "exec-cancel-1" });
    const cancelled = await port.transition({
      stateMachineId: a.lifecycle!.stateMachineId,
      to: "Cancelled",
    });
    assert.equal(cancelled.ok, true);
    assert.equal(cancelled.lifecycle?.currentState.definition.terminal, true);

    const b = await port.createStateMachine({ executionId: "exec-fail-1" });
    await port.transition({ stateMachineId: b.lifecycle!.stateMachineId, to: "Pending" });
    const failed = await port.transition({
      stateMachineId: b.lifecycle!.stateMachineId,
      to: "Failed",
    });
    assert.equal(failed.ok, true);
    assert.equal(failed.lifecycle?.currentState.status, "Failed");
  });

  it("mock unhealthy bloqueia operações", async () => {
    const port = new MockExecutionStateMachineAdapter({
      healthy: false,
      message: "sm offline",
    });
    const created = await port.createStateMachine({ executionId: "x" });
    assert.equal(created.ok, false);
    assert.equal(created.code, "unhealthy");
  });

  it("getCurrentState / getHistory not_found", async () => {
    const port = new MockExecutionStateMachineAdapter();
    const state = await port.getCurrentState({ stateMachineId: "missing" });
    assert.equal(state.ok, false);
    assert.equal(state.code, "not_found");
    const history = await port.getHistory({ stateMachineId: "missing" });
    assert.equal(history.ok, false);
    assert.equal(history.code, "not_found");
  });
});

describe("EPC-24 Execution State Machine — Store / Adapter / persistence in-memory", () => {
  it("store in-memory persiste lifecycle e conta transitions", async () => {
    const store = new DefaultExecutionStateMachineStore();
    const port = new DefaultExecutionStateMachineAdapter({ store });

    const created = await port.createStateMachine({ executionId: "store-exec-1" });
    assert.equal(created.ok, true);
    assert.equal(store.lifecycleCount(), 1);
    assert.equal(store.transitionCount(), 0);

    await port.transition({
      stateMachineId: created.lifecycle!.stateMachineId,
      to: "Pending",
    });
    assert.equal(store.transitionCount(), 1);
    assert.equal(store.historyCount(), 1);

    const byExec = store.getLifecycleByExecution("store-exec-1");
    assert.ok(byExec);
    assert.equal(byExec.lifecycle.currentState.status, "Pending");

    const health = store.health();
    assert.equal(health.ok, true);
  });

  it("Factory com store compartilhado", async () => {
    const store = new DefaultExecutionStateMachineStore();
    const factory = createExecutionStateMachineFactory({ store });
    const port = factory.create({ provider: "mock" });
    await port.createStateMachine({ executionId: "shared-1" });
    assert.equal(store.lifecycleCount(), 1);
  });
});

describe("EPC-24 Sprint 04 — Orchestrator integra Execution State Machine", () => {
  it("adapters expõem ExecutionStateMachinePort e flags de capabilities", async () => {
    const mock = new MockCanonicalExecutionOrchestratorAdapter({ provider: "mock" });
    const def = new DefaultCanonicalExecutionOrchestratorAdapter();

    assert.ok(mock.getExecutionStateMachinePort());
    assert.ok(def.getExecutionStateMachinePort());

    const caps = mock.capabilities();
    assert.equal(caps.dependsOnExecutionStateMachine, true);
    assert.equal(caps.controlsLifecycleViaExecutionStateMachine, true);
    assert.equal(caps.dependsOnExecutionContext, true);
    assert.equal(caps.usesExecutionContextExclusively, true);
    assert.equal(caps.dependsOnPipelineResolver, true);
    assert.equal(caps.noDirectEngineCoupling, true);
  });

  it("startExecution cria SM, anexa ao Context e finaliza lifecycle em Completed", async () => {
    resetAllCanonicalExecutionIdSequences();
    resetAllExecutionStateMachineIdSequences();

    const stateMachine = createExecutionStateMachinePort({ provider: "mock" });
    const port = new MockCanonicalExecutionOrchestratorAdapter({
      createExecutionId: () => "canonical-exec-sprint04-1",
      createResultId: () => "canonical-result-sprint04-1",
      createTraceId: () => "canonical-trace-sprint04-1",
      createCorrelationId: () => "canonical-corr-sprint04-1",
      createStepId: (() => {
        let n = 0;
        return () => `canonical-step-sprint04-${++n}`;
      })(),
      executionStateMachine: stateMachine,
      now: () => "2026-08-01T23:00:00.000Z",
    });

    const started = await port.startExecution({ intakeRef: "intake-sprint04" });
    assert.equal(started.ok, true);
    assert.ok(started.executionContext);
    assert.equal(started.executionContext?.state.phase, "finalized");
    assert.equal(started.executionContext?.state.status, "completed");
    assert.equal(started.result?.enginesInvoked, false);

    // Context permanece transporte — referência estrutural à SM
    const smRef = started.executionContext?.references.find((r) => r.name === "stateMachineId");
    assert.ok(smRef);
    assert.ok(smRef.value.length > 0);

    const smPort = port.getExecutionStateMachinePort();
    const current = await smPort.getCurrentState({ stateMachineId: smRef.value });
    assert.equal(current.ok, true);
    assert.equal(current.state?.status, "Completed");
    assert.equal(current.lifecycle?.enginesInvoked, false);
    assert.equal(current.lifecycle?.stagesExecuted, false);
    assert.equal(current.lifecycle?.processingPerformed, false);

    const history = await smPort.getHistory({ stateMachineId: smRef.value });
    assert.equal(history.ok, true);
    assert.ok((history.history?.entryCount ?? 0) >= 5);
    assert.deepEqual(
      history.transitions?.map((t) => t.to),
      ["Pending", "Resolving", "Ready", "Running", "Completed"],
    );

    assert.ok(started.message?.includes("ExecutionStateMachinePort"));
  });

  it("Execution Context permanece transporte; lifecycle só via State Machine", async () => {
    resetAllCanonicalExecutionIdSequences();
    const orchestrator = new MockCanonicalExecutionOrchestratorAdapter({
      createExecutionId: () => "canonical-exec-sprint04-transport",
      createResultId: () => "canonical-result-sprint04-transport",
      createTraceId: () => "canonical-trace-sprint04-transport",
      createCorrelationId: () => "canonical-corr-sprint04-transport",
      createStepId: (() => {
        let n = 0;
        return () => `canonical-step-transport-${++n}`;
      })(),
      now: () => "2026-08-01T23:30:00.000Z",
    });

    const started = await orchestrator.startExecution();
    assert.equal(started.ok, true);

    const contextPort: ExecutionContextPort = orchestrator.getExecutionContextPort();
    const context = await contextPort.getContext({
      contextId: "canonical-exec-sprint04-transport",
    });
    assert.equal(context.ok, true);
    assert.equal(context.context?.capability.structuralTransportOnly, true);
    assert.equal(context.context?.state.processingPerformed, false);

    // Context não embute máquina de estados de negócio — apenas refs
    assert.equal((context.context as { lifecycle?: unknown } | undefined)?.lifecycle, undefined);

    const smCaps = orchestrator.getExecutionStateMachinePort().capabilities();
    assert.equal(smCaps.structuralLifecycleOnly, true);
    assert.equal(smCaps.decoupledFromEngines, true);
  });

  it("Pipeline Resolver permanece independente da State Machine", async () => {
    const resolver: PipelineResolverPort = createPipelineResolverPort({ provider: "mock" });
    const orchestrator = new MockCanonicalExecutionOrchestratorAdapter({
      pipelineResolver: resolver,
    });

    const resolved = await resolver.resolvePipeline();
    assert.equal(resolved.ok, true);
    assert.equal(resolved.result?.enginesInvoked, false);

    const started = await orchestrator.startExecution();
    assert.equal(started.ok, true);
    assert.equal(started.result?.enginesInvoked, false);

    // Resolver não conhece State Machine
    assert.equal(
      (resolver as { getExecutionStateMachinePort?: unknown }).getExecutionStateMachinePort,
      undefined,
    );
  });

  it("Factory do Orchestrator injeta ExecutionStateMachinePort", async () => {
    const sm = createExecutionStateMachinePort({ provider: "test" });
    const factory = createCanonicalExecutionOrchestratorFactory({
      executionStateMachine: sm,
    });
    const port = factory.create({ provider: "mock" });
    assert.ok((port as MockCanonicalExecutionOrchestratorAdapter).getExecutionStateMachinePort);
    const started = await port.startExecution();
    assert.equal(started.ok, true);
  });

  it("Execution Context Port permanece intacto (sem alteração de contrato)", async () => {
    const contextPort = createExecutionContextPort({ provider: "mock" });
    const caps = contextPort.capabilities();
    assert.equal(caps.structuralTransportOnly, true);
    assert.equal(caps.supportsCreateContext, true);
    assert.equal(caps.implementsOcr, false);
  });

  it("Default orchestrator health inclui State Machine", async () => {
    const port = new DefaultCanonicalExecutionOrchestratorAdapter();
    const health = await port.health();
    assert.equal(health.ok, true);
  });
});
