#!/usr/bin/env node
/**
 * EPC-24 Sprint 09 — Execution Dependency Registry Foundation
 * Prova Application → ExecutionDependencyRegistryPort → Adapter → Store
 * sem tocar produto e sem invocar OCR / IA / Mapping / regras / banco / resolução.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_EXECUTION_DEPENDENCY_REGISTRY_ADAPTER_ID,
  DEFAULT_EXECUTION_DEPENDENCY_REGISTRY_STORE_ID,
  DefaultExecutionDependencyRegistryAdapter,
  DefaultExecutionDependencyRegistryStore,
  MOCK_EXECUTION_DEPENDENCY_REGISTRY_ADAPTER_ID,
  MockExecutionDependencyRegistryAdapter,
  STRUCTURAL_DEPENDENCY_REGISTRY_CAPABILITY,
  createExecutionDependencyRegistryFactory,
  createExecutionDependencyRegistryPort,
  getExecutionDependencyRegistryHealthSummary,
  resetAllExecutionDependencyRegistryIdSequences,
  type ExecutionDependencyRegistryPort,
} from "../../../src/lib/enterprise/execution-dependency-registry/index.ts";
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
import { createExecutionCapabilityRegistryPort } from "../../../src/lib/enterprise/execution-capability-registry/index.ts";
import { createExecutionEventBusPort } from "../../../src/lib/enterprise/execution-event-bus/index.ts";
import { createExecutionRegistryPort } from "../../../src/lib/enterprise/execution-registry/index.ts";
import { createExecutionStateMachinePort } from "../../../src/lib/enterprise/execution-state-machine/index.ts";
import { createExecutionTracePort } from "../../../src/lib/enterprise/execution-trace/index.ts";
import {
  createPipelineResolverPort,
  type PipelineResolverPort,
} from "../../../src/lib/enterprise/pipeline-resolver/index.ts";

describe("EPC-24 ExecutionDependencyRegistryPort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy", async () => {
    const port: ExecutionDependencyRegistryPort = new MockExecutionDependencyRegistryAdapter({
      provider: "mock",
    });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.storedRegistryCount, 0);
    assert.equal(health.storedDependencyCount, 0);
    assert.equal(health.structuralHealth?.kind, "execution-dependency-health");
    assert.equal(health.structuralHealth?.persistenceImplemented, false);
    assert.equal(health.structuralHealth?.dependencyResolutionImplemented, false);
    assert.equal(health.structuralHealth?.topologicalSortImplemented, false);
    assert.equal(health.structuralHealth?.dagSolverImplemented, false);

    const caps = port.capabilities();
    assert.equal(caps.adapterId, "mock-in-memory");
    assert.equal(caps.supportsRegisterDependency, true);
    assert.equal(caps.supportsGetDependency, true);
    assert.equal(caps.supportsListDependencies, true);
    assert.equal(caps.supportsFindDependencies, true);
    assert.equal(caps.supportsHealth, true);
    assert.equal(caps.supportsCapabilities, true);
    assert.equal(caps.supportsStatistics, true);
    assert.equal(caps.structuralDependencyRegistryOnly, true);
    assert.equal(caps.persistenceImplemented, false);
    assert.equal(caps.databaseUsed, false);
    assert.equal(caps.enginesInvoked, false);
    assert.equal(caps.dependencyResolutionImplemented, false);
    assert.equal(caps.topologicalSortImplemented, false);
    assert.equal(caps.dagSolverImplemented, false);
    assert.equal(caps.automaticOrderingImplemented, false);
    assert.equal(caps.implementsOcr, false);
    assert.equal(caps.implementsAi, false);
    assert.equal(caps.noDirectEngineCoupling, true);
    assert.equal(caps.decoupledFromEngines, true);
  });

  it("DefaultExecutionDependencyRegistryAdapter é o default da fundação", async () => {
    const port: ExecutionDependencyRegistryPort = new DefaultExecutionDependencyRegistryAdapter();
    assert.equal(port.providerId, "default");
    const caps = port.capabilities();
    assert.equal(caps.adapterId, DEFAULT_EXECUTION_DEPENDENCY_REGISTRY_ADAPTER_ID);
    assert.equal(caps.structuralDependencyRegistryOnly, true);
    assert.equal(caps.dependencyResolutionImplemented, false);

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "default");
  });

  it("test adapter é resolvido pelo provider", async () => {
    const port = createExecutionDependencyRegistryPort({ provider: "test" });
    assert.equal(port.providerId, "test");
    const health = await port.health();
    assert.equal(health.ok, true);
  });

  it("Default usa ping opcional sem I/O externo", async () => {
    const port = new DefaultExecutionDependencyRegistryAdapter({
      store: new DefaultExecutionDependencyRegistryStore(),
      ping: async () => ({
        ok: true,
        message: "execution-dependency-registry probe custom",
      }),
    });
    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.message, "execution-dependency-registry probe custom");
    assert.equal(typeof health.latencyMs, "number");
  });

  it("provider default resolve DefaultExecutionDependencyRegistryAdapter", () => {
    const defaultPort = createExecutionDependencyRegistryPort();
    assert.equal(defaultPort.providerId, "default");
  });

  it("Factory materializa adapters corretos", () => {
    const factory = createExecutionDependencyRegistryFactory();
    assert.equal(factory.create().providerId, "default");
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
  });

  it("PoC Application depende só do Port (inversão de dependência)", async () => {
    const port = createExecutionDependencyRegistryPort({ provider: "mock" });
    const summary = await getExecutionDependencyRegistryHealthSummary(port);

    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.provider, "mock");
    assert.equal(summary.capabilities.provider, "mock");
    assert.equal(summary.health.ok, true);
  });

  it("MOCK adapter id constante está estável", () => {
    assert.equal(MOCK_EXECUTION_DEPENDENCY_REGISTRY_ADAPTER_ID, "mock-in-memory");
    assert.equal(DEFAULT_EXECUTION_DEPENDENCY_REGISTRY_STORE_ID, "default-in-process");
  });
});

describe("EPC-24 Execution Dependency Registry — registro e modelos canônicos", () => {
  it("registerDependency materializa Dependency, Registry, Definition, Graph, Node, Edge, Metadata", async () => {
    resetAllExecutionDependencyRegistryIdSequences();
    const port = new MockExecutionDependencyRegistryAdapter({
      createExecutionDependencyRegistryId: () => "execution-dependency-registry-fixed-1",
      createExecutionDependencyId: () => "execution-dependency-fixed-1",
      createDefinitionId: () => "definition-fixed-1",
      createGraphId: () => "graph-fixed-1",
      createNodeId: (() => {
        let n = 0;
        return () => `node-fixed-${++n}`;
      })(),
      createEdgeId: () => "edge-fixed-1",
      now: () => "2026-08-01T22:00:00.000Z",
    });

    const registered = await port.registerDependency({
      executionId: "exec-1",
      correlationId: "corr-1",
      contextId: "ctx-1",
      stateMachineId: "sm-1",
      eventBusId: "bus-1",
      executionRegistryId: "reg-1",
      executionTraceId: "trace-1",
      executionCapabilityRegistryId: "cap-reg-1",
      pipelineId: "pipe-1",
      key: "structural-pipeline-dep",
      name: "Structural Pipeline Dependency",
      sourceKey: "cap-a",
      targetKey: "cap-b",
      tags: ["dependency", "foundation"],
      structuralNotes: "structural only",
    });

    assert.equal(registered.ok, true);
    assert.equal(registered.persistenceImplemented, false);
    assert.equal(registered.databaseUsed, false);
    assert.equal(registered.enginesInvoked, false);
    assert.equal(registered.dependencyResolutionImplemented, false);
    assert.equal(registered.topologicalSortImplemented, false);
    assert.equal(registered.dagSolverImplemented, false);

    assert.equal(registered.dependency?.kind, "execution-dependency");
    assert.equal(registered.dependency?.id, "execution-dependency-fixed-1");
    assert.equal(registered.dependency?.executionDependencyId, "execution-dependency-fixed-1");
    assert.equal(
      registered.dependency?.executionDependencyRegistryId,
      "execution-dependency-registry-fixed-1",
    );
    assert.equal(registered.dependency?.key, "structural-pipeline-dep");
    assert.equal(registered.dependency?.dependencyResolved, false);
    assert.equal(registered.dependency?.ordered, false);
    assert.equal(registered.dependency?.dagComputed, false);
    assert.equal(registered.dependency?.topologicalSortApplied, false);

    assert.equal(registered.registry?.kind, "execution-dependency-registry");
    assert.equal(
      registered.registry?.executionDependencyRegistryId,
      "execution-dependency-registry-fixed-1",
    );
    assert.equal(registered.registry?.dependencyCount, 1);
    assert.deepEqual(registered.registry?.dependencyKeys, ["structural-pipeline-dep"]);
    assert.equal(registered.registry?.dependencyResolutionImplemented, false);
    assert.equal(registered.registry?.topologicalSortImplemented, false);
    assert.equal(registered.registry?.dagSolverImplemented, false);

    assert.equal(registered.dependency?.definition.kind, "execution-dependency-definition");
    assert.equal(registered.dependency?.definition.id, "definition-fixed-1");
    assert.equal(registered.dependency?.definition.dependencyResolved, false);

    assert.equal(registered.dependency?.graph.kind, "execution-dependency-graph");
    assert.equal(registered.dependency?.graph.id, "graph-fixed-1");
    assert.equal(registered.dependency?.graph.nodeCount, 2);
    assert.equal(registered.dependency?.graph.edgeCount, 1);
    assert.equal(registered.dependency?.graph.dependencyResolved, false);
    assert.equal(registered.dependency?.graph.ordered, false);
    assert.equal(registered.dependency?.graph.dagComputed, false);
    assert.equal(registered.dependency?.graph.topologicalSortApplied, false);

    assert.equal(registered.dependency?.sourceNode.kind, "execution-dependency-node");
    assert.equal(registered.dependency?.sourceNode.id, "node-fixed-1");
    assert.equal(registered.dependency?.targetNode.id, "node-fixed-2");
    assert.equal(registered.dependency?.edge.kind, "execution-dependency-edge");
    assert.equal(registered.dependency?.edge.id, "edge-fixed-1");

    assert.equal(registered.dependency?.metadata.kind, "execution-dependency-metadata");
    assert.deepEqual(registered.dependency?.metadata.tags, ["dependency", "foundation"]);

    assert.equal(registered.dependency?.capability, STRUCTURAL_DEPENDENCY_REGISTRY_CAPABILITY);
  });

  it("getDependency / listDependencies / findDependencies com filtros", async () => {
    resetAllExecutionDependencyRegistryIdSequences();
    const port = new MockExecutionDependencyRegistryAdapter({
      now: () => "2026-08-01T22:10:00.000Z",
    });

    await port.registerDependency({
      executionId: "exec-filter",
      key: "dep-a",
      name: "Dependency A",
      sourceKey: "src-a",
      targetKey: "tgt-a",
      tags: ["alpha"],
    });
    await port.registerDependency({
      executionId: "exec-filter",
      key: "dep-b",
      name: "Dependency B",
      sourceKey: "src-b",
      targetKey: "tgt-b",
      tags: ["beta"],
    });

    const byKey = await port.getDependency({ key: "dep-a" });
    assert.equal(byKey.ok, true);
    assert.equal(byKey.dependency?.name, "Dependency A");

    const listed = await port.listDependencies({
      filter: {
        kind: "execution-dependency-filter",
        sourceKey: "src-b",
      },
    });
    assert.equal(listed.ok, true);
    assert.equal(listed.total, 1);
    assert.equal(listed.dependencies?.[0]?.key, "dep-b");

    const found = await port.findDependencies({
      filter: {
        kind: "execution-dependency-filter",
        tags: ["alpha"],
      },
    });
    assert.equal(found.ok, true);
    assert.equal(found.dependencies?.length, 1);
    assert.equal(found.dependency?.key, "dep-a");
  });

  it("statistics e health estruturais", async () => {
    const port = new MockExecutionDependencyRegistryAdapter({
      now: () => "2026-08-01T22:20:00.000Z",
    });
    await port.registerDependency({
      key: "stat-1",
      name: "Stat Dependency",
      sourceKey: "a",
      targetKey: "b",
    });

    const stats = await port.statistics();
    assert.equal(stats.ok, true);
    assert.equal(stats.statistics?.kind, "execution-dependency-statistics");
    assert.equal(stats.statistics?.totalRegistries, 1);
    assert.equal(stats.statistics?.totalDependencies, 1);
    assert.equal(stats.statistics?.totalNodes, 2);
    assert.equal(stats.statistics?.totalEdges, 1);
    assert.equal(stats.statistics?.dependencyResolutionImplemented, false);
    assert.equal(stats.statistics?.topologicalSortImplemented, false);
    assert.equal(stats.statistics?.dagSolverImplemented, false);

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.storedDependencyCount, 1);
    assert.equal(health.structuralHealth?.indexReady, true);
  });

  it("Store / Factory com store compartilhado", async () => {
    const store = new DefaultExecutionDependencyRegistryStore();
    const factory = createExecutionDependencyRegistryFactory({ store });
    const port = factory.create({ provider: "mock" });
    await port.registerDependency({ key: "shared-1", name: "Shared" });
    assert.equal(store.dependencyCount(), 1);
    assert.equal(store.registryCount(), 1);

    const health = store.health();
    assert.equal(health.ok, true);
  });

  it("Mock unhealthy bloqueia operações", async () => {
    const port = new MockExecutionDependencyRegistryAdapter({
      healthy: false,
      message: "dependency registry offline",
    });
    const registered = await port.registerDependency({ key: "x", name: "X" });
    assert.equal(registered.ok, false);
    assert.equal(registered.code, "unhealthy");

    const health = await port.health();
    assert.equal(health.ok, false);
  });

  it("rejeita chave duplicada no mesmo registry", async () => {
    const port = new MockExecutionDependencyRegistryAdapter();
    const first = await port.registerDependency({
      executionId: "dup-exec",
      key: "dup-key",
      name: "First",
    });
    assert.equal(first.ok, true);

    const second = await port.registerDependency({
      executionId: "dup-exec",
      key: "dup-key",
      name: "Second",
    });
    assert.equal(second.ok, false);
    assert.equal(second.code, "already_exists");
  });
});

describe("EPC-24 Sprint 09 — Orchestrator integra Execution Dependency Registry", () => {
  it("adapters expõem ExecutionDependencyRegistryPort e flags de capabilities", async () => {
    const mock = new MockCanonicalExecutionOrchestratorAdapter({ provider: "mock" });
    const def = new DefaultCanonicalExecutionOrchestratorAdapter();

    assert.ok(mock.getExecutionDependencyRegistryPort());
    assert.ok(def.getExecutionDependencyRegistryPort());

    const caps = mock.capabilities();
    assert.equal(caps.dependsOnExecutionDependencyRegistry, true);
    assert.equal(caps.usesExecutionDependencyRegistryStructurally, true);
    assert.equal(caps.dependsOnExecutionCapabilityRegistry, true);
    assert.equal(caps.dependsOnExecutionTrace, true);
    assert.equal(caps.dependsOnExecutionRegistry, true);
    assert.equal(caps.dependsOnExecutionEventBus, true);
    assert.equal(caps.dependsOnExecutionStateMachine, true);
    assert.equal(caps.dependsOnExecutionContext, true);
    assert.equal(caps.usesExecutionContextExclusively, true);
    assert.equal(caps.dependsOnPipelineResolver, true);
    assert.equal(caps.noDirectEngineCoupling, true);
  });

  it("startExecution registra Dependency Registry, anexa ID e NÃO resolve/ordena", async () => {
    resetAllCanonicalExecutionIdSequences();
    resetAllExecutionDependencyRegistryIdSequences();

    const dependencyRegistry = createExecutionDependencyRegistryPort({ provider: "mock" });
    const port = new MockCanonicalExecutionOrchestratorAdapter({
      createExecutionId: () => "canonical-exec-sprint09-1",
      createResultId: () => "canonical-result-sprint09-1",
      createTraceId: () => "canonical-trace-sprint09-1",
      createCorrelationId: () => "canonical-corr-sprint09-1",
      createStepId: (() => {
        let n = 0;
        return () => `canonical-step-sprint09-${++n}`;
      })(),
      executionDependencyRegistry: dependencyRegistry,
      now: () => "2026-08-01T23:00:00.000Z",
    });

    const started = await port.startExecution({ intakeRef: "intake-sprint09" });
    assert.equal(started.ok, true);
    assert.ok(started.executionContext);
    assert.equal(started.executionContext?.state.phase, "finalized");
    assert.equal(started.executionContext?.state.status, "completed");
    assert.equal(started.result?.enginesInvoked, false);

    const dependencyRef = started.executionContext?.references.find(
      (r) => r.name === "executionDependencyRegistryId",
    );
    assert.ok(dependencyRef);
    assert.ok(dependencyRef.value.length > 0);

    const capabilityRef = started.executionContext?.references.find(
      (r) => r.name === "executionCapabilityRegistryId",
    );
    assert.ok(capabilityRef);

    const historyEntry = started.executionContext?.history.find(
      (h) => h.event === "execution-dependency-registry-attached",
    );
    assert.ok(historyEntry);

    const dependencyPort = port.getExecutionDependencyRegistryPort();
    const listed = await dependencyPort.listDependencies({
      filter: {
        kind: "execution-dependency-filter",
        executionDependencyRegistryId: dependencyRef.value,
      },
    });
    assert.equal(listed.ok, true);
    assert.ok((listed.total ?? 0) >= 1);
    assert.equal(listed.dependencies?.[0]?.dependencyResolved, false);
    assert.equal(listed.dependencies?.[0]?.ordered, false);
    assert.equal(listed.dependencies?.[0]?.dagComputed, false);

    const caps = dependencyPort.capabilities();
    assert.equal(caps.dependencyResolutionImplemented, false);
    assert.equal(caps.topologicalSortImplemented, false);
    assert.equal(caps.dagSolverImplemented, false);
    assert.equal(caps.decoupledFromEngines, true);

    assert.ok(started.message?.includes("ExecutionDependencyRegistryPort"));
  });

  it("Execution Context permanece transporte; Dependency Registry só via Port", async () => {
    resetAllCanonicalExecutionIdSequences();
    const orchestrator = new MockCanonicalExecutionOrchestratorAdapter({
      createExecutionId: () => "canonical-exec-sprint09-transport",
      createResultId: () => "canonical-result-sprint09-transport",
      createTraceId: () => "canonical-trace-sprint09-transport",
      createCorrelationId: () => "canonical-corr-sprint09-transport",
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
      contextId: "canonical-exec-sprint09-transport",
    });
    assert.equal(context.ok, true);
    assert.equal(context.context?.capability.structuralTransportOnly, true);
    assert.equal(context.context?.state.processingPerformed, false);

    assert.equal(
      (context.context as { executionDependencyRegistry?: unknown } | undefined)
        ?.executionDependencyRegistry,
      undefined,
    );

    const dependencyCaps = orchestrator.getExecutionDependencyRegistryPort().capabilities();
    assert.equal(dependencyCaps.structuralDependencyRegistryOnly, true);
    assert.equal(dependencyCaps.decoupledFromEngines, true);
    assert.equal(dependencyCaps.dependencyResolutionImplemented, false);
  });

  it("módulos EPC-24 anteriores permanecem independentes do Dependency Registry", async () => {
    const resolver: PipelineResolverPort = createPipelineResolverPort({ provider: "mock" });
    const stateMachine = createExecutionStateMachinePort({ provider: "mock" });
    const eventBus = createExecutionEventBusPort({ provider: "mock" });
    const registry = createExecutionRegistryPort({ provider: "mock" });
    const trace = createExecutionTracePort({ provider: "mock" });
    const capabilityRegistry = createExecutionCapabilityRegistryPort({ provider: "mock" });
    const orchestrator = new MockCanonicalExecutionOrchestratorAdapter({
      pipelineResolver: resolver,
      executionStateMachine: stateMachine,
      executionEventBus: eventBus,
      executionRegistry: registry,
      executionTrace: trace,
      executionCapabilityRegistry: capabilityRegistry,
    });

    const started = await orchestrator.startExecution();
    assert.equal(started.ok, true);
    assert.equal(started.result?.enginesInvoked, false);

    assert.equal(
      (resolver as { getExecutionDependencyRegistryPort?: unknown })
        .getExecutionDependencyRegistryPort,
      undefined,
    );
    assert.equal(
      (stateMachine as { getExecutionDependencyRegistryPort?: unknown })
        .getExecutionDependencyRegistryPort,
      undefined,
    );
    assert.equal(
      (eventBus as { getExecutionDependencyRegistryPort?: unknown })
        .getExecutionDependencyRegistryPort,
      undefined,
    );
    assert.equal(
      (registry as { getExecutionDependencyRegistryPort?: unknown })
        .getExecutionDependencyRegistryPort,
      undefined,
    );
    assert.equal(
      (trace as { getExecutionDependencyRegistryPort?: unknown })
        .getExecutionDependencyRegistryPort,
      undefined,
    );
    assert.equal(
      (capabilityRegistry as { getExecutionDependencyRegistryPort?: unknown })
        .getExecutionDependencyRegistryPort,
      undefined,
    );
  });

  it("Factory do Orchestrator injeta ExecutionDependencyRegistryPort", async () => {
    const dependencyRegistry = createExecutionDependencyRegistryPort({ provider: "test" });
    const factory = createCanonicalExecutionOrchestratorFactory({
      executionDependencyRegistry: dependencyRegistry,
    });
    const port = factory.create({ provider: "mock" });
    assert.ok(
      (port as MockCanonicalExecutionOrchestratorAdapter).getExecutionDependencyRegistryPort,
    );
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

  it("Default orchestrator health inclui Dependency Registry", async () => {
    const port = new DefaultCanonicalExecutionOrchestratorAdapter();
    const health = await port.health();
    assert.equal(health.ok, true);
  });
});
