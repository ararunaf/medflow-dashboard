#!/usr/bin/env node
/**
 * EPC-24 Sprint 06 — Execution Registry Foundation
 * Prova Application → ExecutionRegistryPort → Adapter → Store
 * sem tocar produto e sem invocar OCR / IA / Mapping / regras / banco.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_EXECUTION_REGISTRY_ADAPTER_ID,
  DEFAULT_EXECUTION_REGISTRY_STORE_ID,
  DefaultExecutionRegistryAdapter,
  DefaultExecutionRegistryStore,
  MOCK_EXECUTION_REGISTRY_ADAPTER_ID,
  MockExecutionRegistryAdapter,
  STRUCTURAL_REGISTRY_CAPABILITY,
  createExecutionRegistryFactory,
  createExecutionRegistryPort,
  getExecutionRegistryHealthSummary,
  resetAllExecutionRegistryIdSequences,
  type ExecutionRegistryPort,
} from "../../../src/lib/enterprise/execution-registry/index.ts";
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
import { createExecutionStateMachinePort } from "../../../src/lib/enterprise/execution-state-machine/index.ts";
import {
  createPipelineResolverPort,
  type PipelineResolverPort,
} from "../../../src/lib/enterprise/pipeline-resolver/index.ts";

describe("EPC-24 ExecutionRegistryPort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy", async () => {
    const port: ExecutionRegistryPort = new MockExecutionRegistryAdapter({
      provider: "mock",
    });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.storedEntryCount, 0);
    assert.equal(health.storedRecordCount, 0);
    assert.equal(health.storedReferenceCount, 0);
    assert.equal(health.storedSnapshotCount, 0);
    assert.equal(health.structuralHealth?.kind, "execution-registry-health");
    assert.equal(health.structuralHealth?.persistenceImplemented, false);
    assert.equal(health.structuralHealth?.databaseUsed, false);

    const caps = port.capabilities();
    assert.equal(caps.adapterId, "mock-in-memory");
    assert.equal(caps.supportsRegisterExecution, true);
    assert.equal(caps.supportsGetExecution, true);
    assert.equal(caps.supportsListExecutions, true);
    assert.equal(caps.supportsFindExecution, true);
    assert.equal(caps.supportsRemoveExecution, true);
    assert.equal(caps.supportsHealth, true);
    assert.equal(caps.supportsCapabilities, true);
    assert.equal(caps.supportsStatistics, true);
    assert.equal(caps.structuralRegistryOnly, true);
    assert.equal(caps.persistenceImplemented, false);
    assert.equal(caps.databaseUsed, false);
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

  it("DefaultExecutionRegistryAdapter é o default da fundação", async () => {
    const port: ExecutionRegistryPort = new DefaultExecutionRegistryAdapter();
    assert.equal(port.providerId, "default");
    const caps = port.capabilities();
    assert.equal(caps.adapterId, DEFAULT_EXECUTION_REGISTRY_ADAPTER_ID);
    assert.equal(caps.structuralRegistryOnly, true);
    assert.equal(caps.implementsOcr, false);
    assert.equal(caps.implementsAi, false);

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "default");
  });

  it("test adapter é resolvido pelo provider", async () => {
    const port = createExecutionRegistryPort({ provider: "test" });
    assert.equal(port.providerId, "test");
    const health = await port.health();
    assert.equal(health.ok, true);
  });

  it("Default usa ping opcional sem I/O externo", async () => {
    const port = new DefaultExecutionRegistryAdapter({
      store: new DefaultExecutionRegistryStore(),
      ping: async () => ({
        ok: true,
        message: "execution-registry probe custom",
      }),
    });
    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.message, "execution-registry probe custom");
    assert.equal(typeof health.latencyMs, "number");
  });

  it("provider default resolve DefaultExecutionRegistryAdapter", () => {
    const defaultPort = createExecutionRegistryPort();
    assert.equal(defaultPort.providerId, "default");
  });

  it("Factory materializa adapters corretos", () => {
    const factory = createExecutionRegistryFactory();
    assert.equal(factory.create().providerId, "default");
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
  });

  it("PoC Application depende só do Port (inversão de dependência)", async () => {
    const port = createExecutionRegistryPort({ provider: "mock" });
    const summary = await getExecutionRegistryHealthSummary(port);

    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.provider, "mock");
    assert.equal(summary.capabilities.provider, "mock");
    assert.equal(summary.health.ok, true);
  });

  it("MOCK adapter id constante está estável", () => {
    assert.equal(MOCK_EXECUTION_REGISTRY_ADAPTER_ID, "mock-in-memory");
    assert.equal(DEFAULT_EXECUTION_REGISTRY_STORE_ID, "default-in-process");
  });
});

describe("EPC-24 Execution Registry — registro e modelos canônicos", () => {
  it("registerExecution materializa Entry, Record, Metadata, Snapshot, Capabilities", async () => {
    resetAllExecutionRegistryIdSequences();
    const port = new MockExecutionRegistryAdapter({
      createExecutionRegistryId: () => "execution-registry-fixed-1",
      createRecordId: () => "record-fixed-1",
      createSnapshotId: () => "snapshot-fixed-1",
      now: () => "2026-08-01T22:00:00.000Z",
    });

    const registered = await port.registerExecution({
      executionId: "exec-1",
      correlationId: "corr-1",
      contextId: "ctx-1",
      stateMachineId: "sm-1",
      eventBusId: "bus-1",
      pipelineId: "pipe-1",
      tags: ["registry", "foundation"],
      structuralNotes: "structural only",
    });

    assert.equal(registered.ok, true);
    assert.equal(registered.persistenceImplemented, false);
    assert.equal(registered.databaseUsed, false);
    assert.equal(registered.enginesInvoked, false);

    assert.equal(registered.entry?.kind, "execution-registry-entry");
    assert.equal(registered.entry?.id, "execution-registry-fixed-1");
    assert.equal(registered.entry?.executionRegistryId, "execution-registry-fixed-1");
    assert.equal(registered.entry?.executionId, "exec-1");
    assert.equal(registered.entry?.correlationId, "corr-1");
    assert.equal(registered.entry?.contextId, "ctx-1");
    assert.equal(registered.entry?.stateMachineId, "sm-1");
    assert.equal(registered.entry?.eventBusId, "bus-1");
    assert.equal(registered.entry?.pipelineId, "pipe-1");

    // Record
    assert.equal(registered.record?.kind, "execution-registry-record");
    assert.equal(registered.record?.id, "record-fixed-1");

    // Metadata
    assert.equal(registered.entry?.metadata.kind, "execution-registry-metadata");
    assert.deepEqual(registered.entry?.metadata.tags, ["registry", "foundation"]);
    assert.equal(registered.entry?.metadata.createdAt, "2026-08-01T22:00:00.000Z");

    // Snapshot
    assert.equal(registered.entry?.snapshot?.kind, "execution-registry-snapshot");
    assert.equal(registered.entry?.snapshot?.id, "snapshot-fixed-1");
    assert.equal(registered.entry?.snapshot?.enginesInvoked, false);

    // References (derived)
    assert.ok(registered.entry?.references.some((r) => r.name === "contextId"));
    assert.ok(registered.entry?.references.some((r) => r.name === "stateMachineId"));
    assert.ok(registered.entry?.references.some((r) => r.name === "eventBusId"));
    assert.ok(registered.entry?.references.some((r) => r.name === "pipelineId"));

    // Capability
    assert.equal(registered.entry?.capability.kind, "execution-registry-capabilities");
    assert.equal(registered.entry?.capability.structuralRegistryOnly, true);
    assert.equal(registered.entry?.capability.decoupledFromEngines, true);
    assert.equal(registered.entry?.capability.persistenceImplemented, false);
    assert.equal(registered.entry?.capability.databaseUsed, false);
    assert.deepEqual(registered.entry?.capability, STRUCTURAL_REGISTRY_CAPABILITY);
  });

  it("rejeita registro duplicado por executionId", async () => {
    const port = new MockExecutionRegistryAdapter();
    const first = await port.registerExecution({ executionId: "dup-1" });
    assert.equal(first.ok, true);
    const second = await port.registerExecution({ executionId: "dup-1" });
    assert.equal(second.ok, false);
    assert.equal(second.code, "already_exists");
  });

  it("rejeita register sem executionId", async () => {
    const port = new MockExecutionRegistryAdapter();
    const result = await port.registerExecution({ executionId: "" });
    assert.equal(result.ok, false);
    assert.equal(result.code, "invalid_input");
  });
});

describe("EPC-24 Execution Registry — consulta / listagem / busca / remoção", () => {
  it("getExecution por executionRegistryId e executionId", async () => {
    const port = new MockExecutionRegistryAdapter({
      createExecutionRegistryId: () => "reg-get-1",
    });
    await port.registerExecution({ executionId: "exec-get-1", correlationId: "c1" });

    const byId = await port.getExecution({ executionRegistryId: "reg-get-1" });
    assert.equal(byId.ok, true);
    assert.equal(byId.entry?.executionId, "exec-get-1");

    const byExec = await port.getExecution({ executionId: "exec-get-1" });
    assert.equal(byExec.ok, true);
    assert.equal(byExec.entry?.executionRegistryId, "reg-get-1");

    const missing = await port.getExecution({ executionId: "missing" });
    assert.equal(missing.ok, false);
    assert.equal(missing.code, "not_found");
  });

  it("listExecutions com filtro, tags e limit", async () => {
    const port = new MockExecutionRegistryAdapter({
      createIndexId: () => "index-fixed-1",
      now: () => "2026-08-01T22:30:00.000Z",
    });

    await port.registerExecution({
      executionId: "list-1",
      correlationId: "corr-a",
      tags: ["alpha"],
    });
    await port.registerExecution({
      executionId: "list-2",
      correlationId: "corr-b",
      tags: ["beta"],
    });
    await port.registerExecution({
      executionId: "list-3",
      correlationId: "corr-a",
      tags: ["alpha", "gamma"],
    });

    const all = await port.listExecutions();
    assert.equal(all.ok, true);
    assert.equal(all.total, 3);
    assert.equal(all.index?.kind, "execution-registry-index");
    assert.equal(all.index?.entryCount, 3);

    const filtered = await port.listExecutions({
      filter: { kind: "execution-registry-filter", correlationId: "corr-a" },
    });
    assert.equal(filtered.total, 2);

    const tagged = await port.listExecutions({
      filter: { kind: "execution-registry-filter", tags: ["alpha"] },
    });
    assert.equal(tagged.total, 2);

    const limited = await port.listExecutions({ limit: 1 });
    assert.equal(limited.total, 1);
  });

  it("findExecution por query estrutural", async () => {
    const port = new MockExecutionRegistryAdapter({
      createExecutionRegistryId: () => "reg-find-1",
    });
    await port.registerExecution({
      executionId: "find-exec-1",
      correlationId: "find-corr",
      pipelineId: "pipe-find",
    });

    const found = await port.findExecution({
      query: {
        kind: "execution-registry-query",
        executionId: "find-exec-1",
      },
    });
    assert.equal(found.ok, true);
    assert.equal(found.executionRegistryId, "reg-find-1");
    assert.equal(found.entry?.pipelineId, "pipe-find");
    assert.equal(found.persistenceImplemented, false);
    assert.equal(found.databaseUsed, false);
    assert.equal(found.enginesInvoked, false);

    const notFound = await port.findExecution({
      query: {
        kind: "execution-registry-query",
        executionId: "missing",
      },
    });
    assert.equal(notFound.ok, false);
    assert.equal(notFound.code, "not_found");
  });

  it("removeExecution remove do catálogo in-memory", async () => {
    const port = new MockExecutionRegistryAdapter({
      createExecutionRegistryId: () => "reg-rm-1",
    });
    await port.registerExecution({ executionId: "rm-1" });

    const removed = await port.removeExecution({ executionRegistryId: "reg-rm-1" });
    assert.equal(removed.ok, true);
    assert.equal(removed.persistenceImplemented, false);
    assert.equal(removed.databaseUsed, false);

    const after = await port.getExecution({ executionId: "rm-1" });
    assert.equal(after.ok, false);
    assert.equal(after.code, "not_found");

    const listed = await port.listExecutions();
    assert.equal(listed.total, 0);
  });

  it("removeExecution por executionId", async () => {
    const port = new MockExecutionRegistryAdapter();
    await port.registerExecution({ executionId: "rm-by-exec" });
    const removed = await port.removeExecution({ executionId: "rm-by-exec" });
    assert.equal(removed.ok, true);
  });
});

describe("EPC-24 Execution Registry — Metadata / Capabilities / Statistics / Health", () => {
  it("statistics e health refletem o catálogo in-memory", async () => {
    const port = new MockExecutionRegistryAdapter({
      now: () => "2026-08-01T23:00:00.000Z",
    });

    await port.registerExecution({
      executionId: "stats-1",
      contextId: "ctx",
      stateMachineId: "sm",
    });
    await port.registerExecution({ executionId: "stats-2" });

    const stats = await port.statistics();
    assert.equal(stats.ok, true);
    assert.equal(stats.statistics?.kind, "execution-registry-statistics");
    assert.equal(stats.statistics?.totalEntries, 2);
    assert.equal(stats.statistics?.totalRecords, 2);
    assert.ok((stats.statistics?.totalReferences ?? 0) >= 2);
    assert.equal(stats.statistics?.totalSnapshots, 2);
    assert.equal(stats.statistics?.persistenceImplemented, false);
    assert.equal(stats.statistics?.databaseUsed, false);
    assert.equal(stats.statistics?.enginesInvoked, false);

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.storedEntryCount, 2);
    assert.equal(health.structuralHealth?.entryCount, 2);
    assert.equal(health.structuralHealth?.indexReady, true);
  });

  it("capabilities e STRUCTURAL_REGISTRY_CAPABILITY permanecem sem Engines", () => {
    const port = createExecutionRegistryPort({ provider: "mock" });
    const caps = port.capabilities();
    assert.equal(caps.enginesInvoked, false);
    assert.equal(caps.decoupledFromEngines, true);
    assert.equal(STRUCTURAL_REGISTRY_CAPABILITY.implementsPersistence, false);
  });
});

describe("EPC-24 Execution Registry — Store / Adapter / Factory / Provider", () => {
  it("Store in-memory acumula e remove entradas", async () => {
    const store = new DefaultExecutionRegistryStore();
    const port = new DefaultExecutionRegistryAdapter({ store });

    const created = await port.registerExecution({ executionId: "store-exec-1" });
    assert.equal(created.ok, true);
    assert.equal(store.entryCount(), 1);
    assert.equal(store.recordCount(), 1);
    assert.equal(store.snapshotCount(), 1);

    const byExec = store.getEntryByExecution("store-exec-1");
    assert.ok(byExec);
    assert.equal(byExec.entry.executionId, "store-exec-1");

    await port.removeExecution({ executionId: "store-exec-1" });
    assert.equal(store.entryCount(), 0);

    const health = store.health();
    assert.equal(health.ok, true);
  });

  it("Factory com store compartilhado", async () => {
    const store = new DefaultExecutionRegistryStore();
    const factory = createExecutionRegistryFactory({ store });
    const port = factory.create({ provider: "mock" });
    await port.registerExecution({ executionId: "shared-1" });
    assert.equal(store.entryCount(), 1);
  });

  it("Mock unhealthy bloqueia operações", async () => {
    const port = new MockExecutionRegistryAdapter({
      healthy: false,
      message: "registry offline",
    });
    const registered = await port.registerExecution({ executionId: "x" });
    assert.equal(registered.ok, false);
    assert.equal(registered.code, "unhealthy");

    const health = await port.health();
    assert.equal(health.ok, false);
  });
});

describe("EPC-24 Sprint 06 — Orchestrator integra Execution Registry", () => {
  it("adapters expõem ExecutionRegistryPort e flags de capabilities", async () => {
    const mock = new MockCanonicalExecutionOrchestratorAdapter({ provider: "mock" });
    const def = new DefaultCanonicalExecutionOrchestratorAdapter();

    assert.ok(mock.getExecutionRegistryPort());
    assert.ok(def.getExecutionRegistryPort());

    const caps = mock.capabilities();
    assert.equal(caps.dependsOnExecutionRegistry, true);
    assert.equal(caps.usesExecutionRegistryStructurally, true);
    assert.equal(caps.dependsOnExecutionEventBus, true);
    assert.equal(caps.dependsOnExecutionStateMachine, true);
    assert.equal(caps.dependsOnExecutionContext, true);
    assert.equal(caps.usesExecutionContextExclusively, true);
    assert.equal(caps.dependsOnPipelineResolver, true);
    assert.equal(caps.noDirectEngineCoupling, true);
  });

  it("startExecution registra Execution, anexa executionRegistryId e NÃO persiste", async () => {
    resetAllCanonicalExecutionIdSequences();
    resetAllExecutionRegistryIdSequences();

    const registry = createExecutionRegistryPort({ provider: "mock" });
    const port = new MockCanonicalExecutionOrchestratorAdapter({
      createExecutionId: () => "canonical-exec-sprint06-1",
      createResultId: () => "canonical-result-sprint06-1",
      createTraceId: () => "canonical-trace-sprint06-1",
      createCorrelationId: () => "canonical-corr-sprint06-1",
      createStepId: (() => {
        let n = 0;
        return () => `canonical-step-sprint06-${++n}`;
      })(),
      executionRegistry: registry,
      now: () => "2026-08-01T23:00:00.000Z",
    });

    const started = await port.startExecution({ intakeRef: "intake-sprint06" });
    assert.equal(started.ok, true);
    assert.ok(started.executionContext);
    assert.equal(started.executionContext?.state.phase, "finalized");
    assert.equal(started.executionContext?.state.status, "completed");
    assert.equal(started.result?.enginesInvoked, false);

    // Context permanece transporte — referência estrutural ao Registry
    const registryRef = started.executionContext?.references.find(
      (r) => r.name === "executionRegistryId",
    );
    assert.ok(registryRef);
    assert.ok(registryRef.value.length > 0);

    const busRef = started.executionContext?.references.find((r) => r.name === "eventBusId");
    assert.ok(busRef);

    const smRef = started.executionContext?.references.find((r) => r.name === "stateMachineId");
    assert.ok(smRef);

    const historyEntry = started.executionContext?.history.find(
      (h) => h.event === "execution-registry-attached",
    );
    assert.ok(historyEntry);

    const registryPort = port.getExecutionRegistryPort();
    const got = await registryPort.getExecution({ executionRegistryId: registryRef.value });
    assert.equal(got.ok, true);
    assert.equal(got.entry?.executionId, "canonical-exec-sprint06-1");
    assert.equal(got.entry?.persistenceImplemented, false);
    assert.equal(got.entry?.databaseUsed, false);
    assert.equal(got.entry?.enginesInvoked, false);

    const caps = registryPort.capabilities();
    assert.equal(caps.persistenceImplemented, false);
    assert.equal(caps.databaseUsed, false);
    assert.equal(caps.decoupledFromEngines, true);

    assert.ok(started.message?.includes("ExecutionRegistryPort"));
  });

  it("Execution Context permanece transporte; Registry só via Port", async () => {
    resetAllCanonicalExecutionIdSequences();
    const orchestrator = new MockCanonicalExecutionOrchestratorAdapter({
      createExecutionId: () => "canonical-exec-sprint06-transport",
      createResultId: () => "canonical-result-sprint06-transport",
      createTraceId: () => "canonical-trace-sprint06-transport",
      createCorrelationId: () => "canonical-corr-sprint06-transport",
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
      contextId: "canonical-exec-sprint06-transport",
    });
    assert.equal(context.ok, true);
    assert.equal(context.context?.capability.structuralTransportOnly, true);
    assert.equal(context.context?.state.processingPerformed, false);

    // Context não embute Registry de negócio — apenas refs
    assert.equal(
      (context.context as { executionRegistry?: unknown } | undefined)?.executionRegistry,
      undefined,
    );

    const registryCaps = orchestrator.getExecutionRegistryPort().capabilities();
    assert.equal(registryCaps.structuralRegistryOnly, true);
    assert.equal(registryCaps.decoupledFromEngines, true);
  });

  it("Pipeline Resolver / State Machine / Event Bus permanecem independentes do Registry", async () => {
    const resolver: PipelineResolverPort = createPipelineResolverPort({ provider: "mock" });
    const stateMachine = createExecutionStateMachinePort({ provider: "mock" });
    const eventBus = createExecutionEventBusPort({ provider: "mock" });
    const orchestrator = new MockCanonicalExecutionOrchestratorAdapter({
      pipelineResolver: resolver,
      executionStateMachine: stateMachine,
      executionEventBus: eventBus,
    });

    const resolved = await resolver.resolvePipeline();
    assert.equal(resolved.ok, true);
    assert.equal(resolved.result?.enginesInvoked, false);

    const started = await orchestrator.startExecution();
    assert.equal(started.ok, true);
    assert.equal(started.result?.enginesInvoked, false);

    assert.equal(
      (resolver as { getExecutionRegistryPort?: unknown }).getExecutionRegistryPort,
      undefined,
    );
    assert.equal(
      (stateMachine as { getExecutionRegistryPort?: unknown }).getExecutionRegistryPort,
      undefined,
    );
    assert.equal(
      (eventBus as { getExecutionRegistryPort?: unknown }).getExecutionRegistryPort,
      undefined,
    );
  });

  it("Factory do Orchestrator injeta ExecutionRegistryPort", async () => {
    const registry = createExecutionRegistryPort({ provider: "test" });
    const factory = createCanonicalExecutionOrchestratorFactory({
      executionRegistry: registry,
    });
    const port = factory.create({ provider: "mock" });
    assert.ok((port as MockCanonicalExecutionOrchestratorAdapter).getExecutionRegistryPort);
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

  it("Default orchestrator health inclui Registry", async () => {
    const port = new DefaultCanonicalExecutionOrchestratorAdapter();
    const health = await port.health();
    assert.equal(health.ok, true);
  });
});
