#!/usr/bin/env node
/**
 * EPC-24 Sprint 07 — Execution Trace Foundation
 * Prova Application → ExecutionTracePort → Adapter → Store
 * sem tocar produto e sem invocar OCR / IA / Mapping / regras / banco / logs / telemetria.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_EXECUTION_TRACE_ADAPTER_ID,
  DEFAULT_EXECUTION_TRACE_STORE_ID,
  DefaultExecutionTraceAdapter,
  DefaultExecutionTraceStore,
  MOCK_EXECUTION_TRACE_ADAPTER_ID,
  MockExecutionTraceAdapter,
  STRUCTURAL_TRACE_CAPABILITY,
  createExecutionTraceFactory,
  createExecutionTracePort,
  getExecutionTraceHealthSummary,
  resetAllExecutionTraceIdSequences,
  type ExecutionTracePort,
} from "../../../src/lib/enterprise/execution-trace/index.ts";
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
import { createExecutionEventBusPort } from "../../../src/lib/enterprise/execution-event-bus/index.ts";
import { createExecutionRegistryPort } from "../../../src/lib/enterprise/execution-registry/index.ts";
import { createExecutionStateMachinePort } from "../../../src/lib/enterprise/execution-state-machine/index.ts";
import {
  createPipelineResolverPort,
  type PipelineResolverPort,
} from "../../../src/lib/enterprise/pipeline-resolver/index.ts";

describe("EPC-24 ExecutionTracePort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy", async () => {
    const port: ExecutionTracePort = new MockExecutionTraceAdapter({
      provider: "mock",
    });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.storedTraceCount, 0);
    assert.equal(health.storedEntryCount, 0);
    assert.equal(health.structuralHealth?.kind, "execution-trace-health");
    assert.equal(health.structuralHealth?.persistenceImplemented, false);
    assert.equal(health.structuralHealth?.logsImplemented, false);
    assert.equal(health.structuralHealth?.telemetryImplemented, false);

    const caps = port.capabilities();
    assert.equal(caps.adapterId, "mock-in-memory");
    assert.equal(caps.supportsCreateTrace, true);
    assert.equal(caps.supportsAppendTrace, true);
    assert.equal(caps.supportsGetTrace, true);
    assert.equal(caps.supportsListTraceEntries, true);
    assert.equal(caps.supportsHealth, true);
    assert.equal(caps.supportsCapabilities, true);
    assert.equal(caps.supportsStatistics, true);
    assert.equal(caps.structuralTraceOnly, true);
    assert.equal(caps.persistenceImplemented, false);
    assert.equal(caps.databaseUsed, false);
    assert.equal(caps.logsImplemented, false);
    assert.equal(caps.telemetryImplemented, false);
    assert.equal(caps.observabilityExternal, false);
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

  it("DefaultExecutionTraceAdapter é o default da fundação", async () => {
    const port: ExecutionTracePort = new DefaultExecutionTraceAdapter();
    assert.equal(port.providerId, "default");
    const caps = port.capabilities();
    assert.equal(caps.adapterId, DEFAULT_EXECUTION_TRACE_ADAPTER_ID);
    assert.equal(caps.structuralTraceOnly, true);
    assert.equal(caps.logsImplemented, false);
    assert.equal(caps.telemetryImplemented, false);

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "default");
  });

  it("test adapter é resolvido pelo provider", async () => {
    const port = createExecutionTracePort({ provider: "test" });
    assert.equal(port.providerId, "test");
    const health = await port.health();
    assert.equal(health.ok, true);
  });

  it("Default usa ping opcional sem I/O externo", async () => {
    const port = new DefaultExecutionTraceAdapter({
      store: new DefaultExecutionTraceStore(),
      ping: async () => ({
        ok: true,
        message: "execution-trace probe custom",
      }),
    });
    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.message, "execution-trace probe custom");
    assert.equal(typeof health.latencyMs, "number");
  });

  it("provider default resolve DefaultExecutionTraceAdapter", () => {
    const defaultPort = createExecutionTracePort();
    assert.equal(defaultPort.providerId, "default");
  });

  it("Factory materializa adapters corretos", () => {
    const factory = createExecutionTraceFactory();
    assert.equal(factory.create().providerId, "default");
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
  });

  it("PoC Application depende só do Port (inversão de dependência)", async () => {
    const port = createExecutionTracePort({ provider: "mock" });
    const summary = await getExecutionTraceHealthSummary(port);

    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.provider, "mock");
    assert.equal(summary.capabilities.provider, "mock");
    assert.equal(summary.health.ok, true);
  });

  it("MOCK adapter id constante está estável", () => {
    assert.equal(MOCK_EXECUTION_TRACE_ADAPTER_ID, "mock-in-memory");
    assert.equal(DEFAULT_EXECUTION_TRACE_STORE_ID, "default-in-process");
  });
});

describe("EPC-24 Execution Trace — criação e modelos canônicos", () => {
  it("createTrace materializa Trace, Metadata, Snapshot, Timeline, Capabilities", async () => {
    resetAllExecutionTraceIdSequences();
    const port = new MockExecutionTraceAdapter({
      createExecutionTraceId: () => "execution-trace-fixed-1",
      createSnapshotId: () => "snapshot-fixed-1",
      createTimelineId: () => "timeline-fixed-1",
      now: () => "2026-08-01T22:00:00.000Z",
    });

    const created = await port.createTrace({
      executionId: "exec-1",
      correlationId: "corr-1",
      contextId: "ctx-1",
      stateMachineId: "sm-1",
      eventBusId: "bus-1",
      executionRegistryId: "reg-1",
      pipelineId: "pipe-1",
      tags: ["trace", "foundation"],
      structuralNotes: "structural only",
      nodes: [{ name: "node-a", order: 1, portRef: "PortA" }],
      steps: [{ name: "step-a", order: 1, status: "pending" }],
    });

    assert.equal(created.ok, true);
    assert.equal(created.persistenceImplemented, false);
    assert.equal(created.databaseUsed, false);
    assert.equal(created.logsImplemented, false);
    assert.equal(created.telemetryImplemented, false);
    assert.equal(created.enginesInvoked, false);

    assert.equal(created.trace?.kind, "execution-trace");
    assert.equal(created.trace?.id, "execution-trace-fixed-1");
    assert.equal(created.trace?.executionTraceId, "execution-trace-fixed-1");
    assert.equal(created.trace?.executionId, "exec-1");
    assert.equal(created.trace?.correlationId, "corr-1");
    assert.equal(created.trace?.contextId, "ctx-1");
    assert.equal(created.trace?.stateMachineId, "sm-1");
    assert.equal(created.trace?.eventBusId, "bus-1");
    assert.equal(created.trace?.executionRegistryId, "reg-1");
    assert.equal(created.trace?.pipelineId, "pipe-1");

    assert.equal(created.trace?.metadata.kind, "execution-trace-metadata");
    assert.deepEqual(created.trace?.metadata.tags, ["trace", "foundation"]);
    assert.equal(created.trace?.metadata.createdAt, "2026-08-01T22:00:00.000Z");

    assert.equal(created.trace?.snapshot?.kind, "execution-trace-snapshot");
    assert.equal(created.trace?.snapshot?.id, "snapshot-fixed-1");
    assert.equal(created.trace?.snapshot?.logsWritten, false);
    assert.equal(created.trace?.snapshot?.telemetrySent, false);

    assert.equal(created.trace?.timeline.kind, "execution-trace-timeline");
    assert.equal(created.trace?.timeline.id, "timeline-fixed-1");
    assert.equal(created.trace?.timeline.entryCount, 0);

    assert.equal(created.trace?.nodes.length, 1);
    assert.equal(created.trace?.nodes[0]?.kind, "execution-trace-node");
    assert.equal(created.trace?.steps.length, 1);
    assert.equal(created.trace?.steps[0]?.kind, "execution-trace-step");

    assert.ok(created.trace?.references.some((r) => r.name === "contextId"));
    assert.ok(created.trace?.references.some((r) => r.name === "stateMachineId"));
    assert.ok(created.trace?.references.some((r) => r.name === "eventBusId"));
    assert.ok(created.trace?.references.some((r) => r.name === "executionRegistryId"));
    assert.ok(created.trace?.references.some((r) => r.name === "pipelineId"));

    assert.equal(created.trace?.capability.kind, "execution-trace-capabilities");
    assert.equal(created.trace?.capability.structuralTraceOnly, true);
    assert.equal(created.trace?.capability.decoupledFromEngines, true);
    assert.equal(created.trace?.capability.logsImplemented, false);
    assert.equal(created.trace?.capability.telemetryImplemented, false);
    assert.deepEqual(created.trace?.capability, STRUCTURAL_TRACE_CAPABILITY);
  });

  it("rejeita create duplicado por executionId", async () => {
    const port = new MockExecutionTraceAdapter();
    const first = await port.createTrace({ executionId: "dup-1" });
    assert.equal(first.ok, true);
    const second = await port.createTrace({ executionId: "dup-1" });
    assert.equal(second.ok, false);
    assert.equal(second.code, "already_exists");
  });

  it("rejeita create sem executionId", async () => {
    const port = new MockExecutionTraceAdapter();
    const result = await port.createTrace({ executionId: "" });
    assert.equal(result.ok, false);
    assert.equal(result.code, "invalid_input");
  });
});

describe("EPC-24 Execution Trace — append / consulta / listagem", () => {
  it("appendTrace anexa entrada estrutural sem logs/telemetria", async () => {
    resetAllExecutionTraceIdSequences();
    const port = new MockExecutionTraceAdapter({
      createExecutionTraceId: () => "trace-append-1",
      createEntryId: () => "entry-fixed-1",
      now: () => "2026-08-01T22:15:00.000Z",
    });

    await port.createTrace({ executionId: "exec-append-1" });
    const appended = await port.appendTrace({
      executionTraceId: "trace-append-1",
      name: "structural.step",
      notes: "append only",
      tags: ["append"],
    });

    assert.equal(appended.ok, true);
    assert.equal(appended.logsImplemented, false);
    assert.equal(appended.telemetryImplemented, false);
    assert.equal(appended.entry?.kind, "execution-trace-entry");
    assert.equal(appended.entry?.id, "entry-fixed-1");
    assert.equal(appended.entry?.name, "structural.step");
    assert.equal(appended.entry?.sequence, 1);
    assert.equal(appended.entry?.logsWritten, false);
    assert.equal(appended.entry?.telemetrySent, false);
    assert.equal(appended.trace?.entries.length, 1);
    assert.equal(appended.trace?.timeline.entryCount, 1);
  });

  it("getTrace por executionTraceId e executionId", async () => {
    const port = new MockExecutionTraceAdapter({
      createExecutionTraceId: () => "trace-get-1",
    });
    await port.createTrace({ executionId: "exec-get-1", correlationId: "c1" });

    const byId = await port.getTrace({ executionTraceId: "trace-get-1" });
    assert.equal(byId.ok, true);
    assert.equal(byId.trace?.executionId, "exec-get-1");

    const byExec = await port.getTrace({ executionId: "exec-get-1" });
    assert.equal(byExec.ok, true);
    assert.equal(byExec.trace?.executionTraceId, "trace-get-1");

    const missing = await port.getTrace({ executionId: "missing" });
    assert.equal(missing.ok, false);
    assert.equal(missing.code, "not_found");
  });

  it("listTraceEntries com limit", async () => {
    const port = new MockExecutionTraceAdapter({
      createExecutionTraceId: () => "trace-list-1",
    });
    await port.createTrace({ executionId: "exec-list-1" });
    await port.appendTrace({ executionTraceId: "trace-list-1", name: "e1" });
    await port.appendTrace({ executionTraceId: "trace-list-1", name: "e2" });
    await port.appendTrace({ executionTraceId: "trace-list-1", name: "e3" });

    const all = await port.listTraceEntries({ executionTraceId: "trace-list-1" });
    assert.equal(all.ok, true);
    assert.equal(all.total, 3);

    const limited = await port.listTraceEntries({
      executionTraceId: "trace-list-1",
      limit: 1,
    });
    assert.equal(limited.total, 1);
  });

  it("append rejeita sem name e sem id", async () => {
    const port = new MockExecutionTraceAdapter();
    await port.createTrace({ executionId: "exec-bad" });

    const noName = await port.appendTrace({
      executionId: "exec-bad",
      name: "",
    });
    assert.equal(noName.ok, false);
    assert.equal(noName.code, "invalid_input");

    const noId = await port.appendTrace({ name: "x" });
    assert.equal(noId.ok, false);
    assert.equal(noId.code, "invalid_input");
  });
});

describe("EPC-24 Execution Trace — Metadata / Capabilities / Statistics / Health", () => {
  it("statistics e health refletem o rastreador in-memory", async () => {
    const port = new MockExecutionTraceAdapter({
      now: () => "2026-08-01T23:00:00.000Z",
    });

    await port.createTrace({
      executionId: "stats-1",
      contextId: "ctx",
      stateMachineId: "sm",
      nodes: [{ name: "n1", order: 1 }],
      steps: [{ name: "s1", order: 1 }],
    });
    await port.appendTrace({ executionId: "stats-1", name: "entry-1" });
    await port.createTrace({ executionId: "stats-2" });

    const stats = await port.statistics();
    assert.equal(stats.ok, true);
    assert.equal(stats.statistics?.kind, "execution-trace-statistics");
    assert.equal(stats.statistics?.totalTraces, 2);
    assert.equal(stats.statistics?.totalEntries, 1);
    assert.ok((stats.statistics?.totalSteps ?? 0) >= 1);
    assert.ok((stats.statistics?.totalNodes ?? 0) >= 1);
    assert.equal(stats.statistics?.persistenceImplemented, false);
    assert.equal(stats.statistics?.logsImplemented, false);
    assert.equal(stats.statistics?.telemetryImplemented, false);
    assert.equal(stats.statistics?.enginesInvoked, false);

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.storedTraceCount, 2);
    assert.equal(health.structuralHealth?.traceCount, 2);
    assert.equal(health.structuralHealth?.timelineReady, true);
  });

  it("capabilities e STRUCTURAL_TRACE_CAPABILITY permanecem sem Engines/logs", () => {
    const port = createExecutionTracePort({ provider: "mock" });
    const caps = port.capabilities();
    assert.equal(caps.enginesInvoked, false);
    assert.equal(caps.decoupledFromEngines, true);
    assert.equal(caps.logsImplemented, false);
    assert.equal(caps.telemetryImplemented, false);
    assert.equal(STRUCTURAL_TRACE_CAPABILITY.implementsPersistence, false);
  });
});

describe("EPC-24 Execution Trace — Store / Adapter / Factory / Provider", () => {
  it("Store in-memory acumula traces e entries", async () => {
    const store = new DefaultExecutionTraceStore();
    const port = new DefaultExecutionTraceAdapter({ store });

    const created = await port.createTrace({ executionId: "store-exec-1" });
    assert.equal(created.ok, true);
    assert.equal(store.traceCount(), 1);
    assert.equal(store.snapshotCount(), 1);

    await port.appendTrace({ executionId: "store-exec-1", name: "e1" });
    assert.equal(store.entryCount(), 1);

    const byExec = store.getTraceByExecution("store-exec-1");
    assert.ok(byExec);
    assert.equal(byExec.trace.executionId, "store-exec-1");

    const health = store.health();
    assert.equal(health.ok, true);
  });

  it("Factory com store compartilhado", async () => {
    const store = new DefaultExecutionTraceStore();
    const factory = createExecutionTraceFactory({ store });
    const port = factory.create({ provider: "mock" });
    await port.createTrace({ executionId: "shared-1" });
    assert.equal(store.traceCount(), 1);
  });

  it("Mock unhealthy bloqueia operações", async () => {
    const port = new MockExecutionTraceAdapter({
      healthy: false,
      message: "trace offline",
    });
    const created = await port.createTrace({ executionId: "x" });
    assert.equal(created.ok, false);
    assert.equal(created.code, "unhealthy");

    const health = await port.health();
    assert.equal(health.ok, false);
  });
});

describe("EPC-24 Sprint 07 — Orchestrator integra Execution Trace", () => {
  it("adapters expõem ExecutionTracePort e flags de capabilities", async () => {
    const mock = new MockCanonicalExecutionOrchestratorAdapter({ provider: "mock" });
    const def = new DefaultCanonicalExecutionOrchestratorAdapter();

    assert.ok(mock.getExecutionTracePort());
    assert.ok(def.getExecutionTracePort());

    const caps = mock.capabilities();
    assert.equal(caps.dependsOnExecutionTrace, true);
    assert.equal(caps.usesExecutionTraceStructurally, true);
    assert.equal(caps.dependsOnExecutionRegistry, true);
    assert.equal(caps.dependsOnExecutionEventBus, true);
    assert.equal(caps.dependsOnExecutionStateMachine, true);
    assert.equal(caps.dependsOnExecutionContext, true);
    assert.equal(caps.usesExecutionContextExclusively, true);
    assert.equal(caps.dependsOnPipelineResolver, true);
    assert.equal(caps.noDirectEngineCoupling, true);
  });

  it("startExecution cria Trace, anexa executionTraceId e NÃO loga/telemetra", async () => {
    resetAllCanonicalExecutionIdSequences();
    resetAllExecutionTraceIdSequences();

    const tracePort = createExecutionTracePort({ provider: "mock" });
    const port = new MockCanonicalExecutionOrchestratorAdapter({
      createExecutionId: () => "canonical-exec-sprint07-1",
      createResultId: () => "canonical-result-sprint07-1",
      createTraceId: () => "canonical-trace-sprint07-1",
      createCorrelationId: () => "canonical-corr-sprint07-1",
      createStepId: (() => {
        let n = 0;
        return () => `canonical-step-sprint07-${++n}`;
      })(),
      executionTrace: tracePort,
      now: () => "2026-08-01T23:00:00.000Z",
    });

    const started = await port.startExecution({ intakeRef: "intake-sprint07" });
    assert.equal(started.ok, true);
    assert.ok(started.executionContext);
    assert.equal(started.executionContext?.state.phase, "finalized");
    assert.equal(started.executionContext?.state.status, "completed");
    assert.equal(started.result?.enginesInvoked, false);

    const traceRef = started.executionContext?.references.find(
      (r) => r.name === "executionTraceId",
    );
    assert.ok(traceRef);
    assert.ok(traceRef.value.length > 0);

    const registryRef = started.executionContext?.references.find(
      (r) => r.name === "executionRegistryId",
    );
    assert.ok(registryRef);

    const busRef = started.executionContext?.references.find((r) => r.name === "eventBusId");
    assert.ok(busRef);

    const smRef = started.executionContext?.references.find((r) => r.name === "stateMachineId");
    assert.ok(smRef);

    const historyEntry = started.executionContext?.history.find(
      (h) => h.event === "execution-trace-attached",
    );
    assert.ok(historyEntry);

    const orchestratorTracePort = port.getExecutionTracePort();
    const got = await orchestratorTracePort.getTrace({ executionTraceId: traceRef.value });
    assert.equal(got.ok, true);
    assert.equal(got.trace?.executionId, "canonical-exec-sprint07-1");
    assert.equal(got.trace?.persistenceImplemented, false);
    assert.equal(got.trace?.logsImplemented, false);
    assert.equal(got.trace?.telemetryImplemented, false);
    assert.equal(got.trace?.enginesInvoked, false);

    const caps = orchestratorTracePort.capabilities();
    assert.equal(caps.logsImplemented, false);
    assert.equal(caps.telemetryImplemented, false);
    assert.equal(caps.decoupledFromEngines, true);

    assert.ok(started.message?.includes("ExecutionTracePort"));
  });

  it("Execution Context permanece transporte; Trace só via Port", async () => {
    resetAllCanonicalExecutionIdSequences();
    const orchestrator = new MockCanonicalExecutionOrchestratorAdapter({
      createExecutionId: () => "canonical-exec-sprint07-transport",
      createResultId: () => "canonical-result-sprint07-transport",
      createTraceId: () => "canonical-trace-sprint07-transport",
      createCorrelationId: () => "canonical-corr-sprint07-transport",
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
      contextId: "canonical-exec-sprint07-transport",
    });
    assert.equal(context.ok, true);
    assert.equal(context.context?.capability.structuralTransportOnly, true);
    assert.equal(context.context?.state.processingPerformed, false);

    assert.equal(
      (context.context as { executionTrace?: unknown } | undefined)?.executionTrace,
      undefined,
    );

    const traceCaps = orchestrator.getExecutionTracePort().capabilities();
    assert.equal(traceCaps.structuralTraceOnly, true);
    assert.equal(traceCaps.decoupledFromEngines, true);
    assert.equal(traceCaps.logsImplemented, false);
  });

  it("Pipeline Resolver / SM / Event Bus / Registry permanecem independentes do Trace", async () => {
    const resolver: PipelineResolverPort = createPipelineResolverPort({ provider: "mock" });
    const stateMachine = createExecutionStateMachinePort({ provider: "mock" });
    const eventBus = createExecutionEventBusPort({ provider: "mock" });
    const registry = createExecutionRegistryPort({ provider: "mock" });
    const orchestrator = new MockCanonicalExecutionOrchestratorAdapter({
      pipelineResolver: resolver,
      executionStateMachine: stateMachine,
      executionEventBus: eventBus,
      executionRegistry: registry,
    });

    const resolved = await resolver.resolvePipeline();
    assert.equal(resolved.ok, true);
    assert.equal(resolved.result?.enginesInvoked, false);

    const started = await orchestrator.startExecution();
    assert.equal(started.ok, true);
    assert.equal(started.result?.enginesInvoked, false);

    assert.equal(
      (resolver as { getExecutionTracePort?: unknown }).getExecutionTracePort,
      undefined,
    );
    assert.equal(
      (stateMachine as { getExecutionTracePort?: unknown }).getExecutionTracePort,
      undefined,
    );
    assert.equal(
      (eventBus as { getExecutionTracePort?: unknown }).getExecutionTracePort,
      undefined,
    );
    assert.equal(
      (registry as { getExecutionTracePort?: unknown }).getExecutionTracePort,
      undefined,
    );
  });

  it("Factory do Orchestrator injeta ExecutionTracePort", async () => {
    const trace = createExecutionTracePort({ provider: "test" });
    const factory = createCanonicalExecutionOrchestratorFactory({
      executionTrace: trace,
    });
    const port = factory.create({ provider: "mock" });
    assert.ok((port as MockCanonicalExecutionOrchestratorAdapter).getExecutionTracePort);
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

  it("Default orchestrator health inclui Trace", async () => {
    const port = new DefaultCanonicalExecutionOrchestratorAdapter();
    const health = await port.health();
    assert.equal(health.ok, true);
  });
});
