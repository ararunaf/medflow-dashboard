#!/usr/bin/env node
/**
 * EPC-24 Sprint 08 — Execution Capability Registry Foundation
 * Prova Application → ExecutionCapabilityRegistryPort → Adapter → Store
 * sem tocar produto e sem invocar OCR / IA / Mapping / regras / banco / descoberta.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_EXECUTION_CAPABILITY_REGISTRY_ADAPTER_ID,
  DEFAULT_EXECUTION_CAPABILITY_REGISTRY_STORE_ID,
  DefaultExecutionCapabilityRegistryAdapter,
  DefaultExecutionCapabilityRegistryStore,
  MOCK_EXECUTION_CAPABILITY_REGISTRY_ADAPTER_ID,
  MockExecutionCapabilityRegistryAdapter,
  STRUCTURAL_CAPABILITY_REGISTRY_CAPABILITY,
  createExecutionCapabilityRegistryFactory,
  createExecutionCapabilityRegistryPort,
  getExecutionCapabilityRegistryHealthSummary,
  resetAllExecutionCapabilityRegistryIdSequences,
  type ExecutionCapabilityRegistryPort,
} from "../../../src/lib/enterprise/execution-capability-registry/index.ts";
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
import { createExecutionTracePort } from "../../../src/lib/enterprise/execution-trace/index.ts";
import {
  createPipelineResolverPort,
  type PipelineResolverPort,
} from "../../../src/lib/enterprise/pipeline-resolver/index.ts";

describe("EPC-24 ExecutionCapabilityRegistryPort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy", async () => {
    const port: ExecutionCapabilityRegistryPort = new MockExecutionCapabilityRegistryAdapter({
      provider: "mock",
    });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.storedRegistryCount, 0);
    assert.equal(health.storedCapabilityCount, 0);
    assert.equal(health.structuralHealth?.kind, "execution-capability-health");
    assert.equal(health.structuralHealth?.persistenceImplemented, false);
    assert.equal(health.structuralHealth?.autoDiscoveryImplemented, false);
    assert.equal(health.structuralHealth?.dynamicLoadingImplemented, false);

    const caps = port.capabilities();
    assert.equal(caps.adapterId, "mock-in-memory");
    assert.equal(caps.supportsRegisterCapability, true);
    assert.equal(caps.supportsGetCapability, true);
    assert.equal(caps.supportsListCapabilities, true);
    assert.equal(caps.supportsFindCapabilities, true);
    assert.equal(caps.supportsHealth, true);
    assert.equal(caps.supportsCapabilities, true);
    assert.equal(caps.supportsStatistics, true);
    assert.equal(caps.structuralCapabilityRegistryOnly, true);
    assert.equal(caps.persistenceImplemented, false);
    assert.equal(caps.databaseUsed, false);
    assert.equal(caps.enginesInvoked, false);
    assert.equal(caps.autoDiscoveryImplemented, false);
    assert.equal(caps.dynamicLoadingImplemented, false);
    assert.equal(caps.reflectionUsed, false);
    assert.equal(caps.pluginsUsed, false);
    assert.equal(caps.capabilitiesExecuted, false);
    assert.equal(caps.implementsOcr, false);
    assert.equal(caps.implementsAi, false);
    assert.equal(caps.noDirectEngineCoupling, true);
    assert.equal(caps.decoupledFromEngines, true);
  });

  it("DefaultExecutionCapabilityRegistryAdapter é o default da fundação", async () => {
    const port: ExecutionCapabilityRegistryPort = new DefaultExecutionCapabilityRegistryAdapter();
    assert.equal(port.providerId, "default");
    const caps = port.capabilities();
    assert.equal(caps.adapterId, DEFAULT_EXECUTION_CAPABILITY_REGISTRY_ADAPTER_ID);
    assert.equal(caps.structuralCapabilityRegistryOnly, true);
    assert.equal(caps.autoDiscoveryImplemented, false);

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "default");
  });

  it("test adapter é resolvido pelo provider", async () => {
    const port = createExecutionCapabilityRegistryPort({ provider: "test" });
    assert.equal(port.providerId, "test");
    const health = await port.health();
    assert.equal(health.ok, true);
  });

  it("Default usa ping opcional sem I/O externo", async () => {
    const port = new DefaultExecutionCapabilityRegistryAdapter({
      store: new DefaultExecutionCapabilityRegistryStore(),
      ping: async () => ({
        ok: true,
        message: "execution-capability-registry probe custom",
      }),
    });
    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.message, "execution-capability-registry probe custom");
    assert.equal(typeof health.latencyMs, "number");
  });

  it("provider default resolve DefaultExecutionCapabilityRegistryAdapter", () => {
    const defaultPort = createExecutionCapabilityRegistryPort();
    assert.equal(defaultPort.providerId, "default");
  });

  it("Factory materializa adapters corretos", () => {
    const factory = createExecutionCapabilityRegistryFactory();
    assert.equal(factory.create().providerId, "default");
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
  });

  it("PoC Application depende só do Port (inversão de dependência)", async () => {
    const port = createExecutionCapabilityRegistryPort({ provider: "mock" });
    const summary = await getExecutionCapabilityRegistryHealthSummary(port);

    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.provider, "mock");
    assert.equal(summary.capabilities.provider, "mock");
    assert.equal(summary.health.ok, true);
  });

  it("MOCK adapter id constante está estável", () => {
    assert.equal(MOCK_EXECUTION_CAPABILITY_REGISTRY_ADAPTER_ID, "mock-in-memory");
    assert.equal(DEFAULT_EXECUTION_CAPABILITY_REGISTRY_STORE_ID, "default-in-process");
  });
});

describe("EPC-24 Execution Capability Registry — registro e modelos canônicos", () => {
  it("registerCapability materializa Capability, Registry, Definition, Descriptor, Category, Metadata", async () => {
    resetAllExecutionCapabilityRegistryIdSequences();
    const port = new MockExecutionCapabilityRegistryAdapter({
      createExecutionCapabilityRegistryId: () => "execution-capability-registry-fixed-1",
      createExecutionCapabilityId: () => "execution-capability-fixed-1",
      createDefinitionId: () => "definition-fixed-1",
      createDescriptorId: () => "descriptor-fixed-1",
      createCategoryId: () => "category-fixed-1",
      now: () => "2026-08-01T22:00:00.000Z",
    });

    const registered = await port.registerCapability({
      executionId: "exec-1",
      correlationId: "corr-1",
      contextId: "ctx-1",
      stateMachineId: "sm-1",
      eventBusId: "bus-1",
      executionRegistryId: "reg-1",
      executionTraceId: "trace-1",
      pipelineId: "pipe-1",
      key: "structural-pipeline",
      name: "Structural Pipeline Capability",
      category: "pipeline",
      tags: ["capability", "foundation"],
      structuralNotes: "structural only",
    });

    assert.equal(registered.ok, true);
    assert.equal(registered.persistenceImplemented, false);
    assert.equal(registered.databaseUsed, false);
    assert.equal(registered.enginesInvoked, false);
    assert.equal(registered.autoDiscoveryImplemented, false);
    assert.equal(registered.dynamicLoadingImplemented, false);
    assert.equal(registered.capabilitiesExecuted, false);

    assert.equal(registered.capability?.kind, "execution-capability");
    assert.equal(registered.capability?.id, "execution-capability-fixed-1");
    assert.equal(registered.capability?.executionCapabilityId, "execution-capability-fixed-1");
    assert.equal(
      registered.capability?.executionCapabilityRegistryId,
      "execution-capability-registry-fixed-1",
    );
    assert.equal(registered.capability?.key, "structural-pipeline");
    assert.equal(registered.capability?.autoDiscovered, false);
    assert.equal(registered.capability?.dynamicallyLoaded, false);
    assert.equal(registered.capability?.capabilitiesExecuted, false);

    assert.equal(registered.registry?.kind, "execution-capability-registry");
    assert.equal(
      registered.registry?.executionCapabilityRegistryId,
      "execution-capability-registry-fixed-1",
    );
    assert.equal(registered.registry?.capabilityCount, 1);
    assert.deepEqual(registered.registry?.capabilityKeys, ["structural-pipeline"]);
    assert.equal(registered.registry?.autoDiscoveryImplemented, false);
    assert.equal(registered.registry?.dynamicLoadingImplemented, false);

    assert.equal(registered.capability?.definition.kind, "execution-capability-definition");
    assert.equal(registered.capability?.definition.id, "definition-fixed-1");
    assert.equal(registered.capability?.definition.autoDiscovered, false);
    assert.equal(registered.capability?.definition.reflectionUsed, false);

    assert.equal(registered.capability?.descriptor.kind, "execution-capability-descriptor");
    assert.equal(registered.capability?.descriptor.id, "descriptor-fixed-1");
    assert.equal(registered.capability?.descriptor.available, true);
    assert.equal(registered.capability?.descriptor.executable, false);

    assert.equal(registered.capability?.category.kind, "execution-capability-category");
    assert.equal(registered.capability?.category.id, "category-fixed-1");
    assert.equal(registered.capability?.category.category, "pipeline");

    assert.equal(registered.capability?.metadata.kind, "execution-capability-metadata");
    assert.deepEqual(registered.capability?.metadata.tags, ["capability", "foundation"]);

    assert.equal(registered.capability?.capability, STRUCTURAL_CAPABILITY_REGISTRY_CAPABILITY);
  });

  it("getCapability / listCapabilities / findCapabilities com filtros", async () => {
    resetAllExecutionCapabilityRegistryIdSequences();
    const port = new MockExecutionCapabilityRegistryAdapter({
      now: () => "2026-08-01T22:10:00.000Z",
    });

    await port.registerCapability({
      executionId: "exec-filter",
      key: "cap-a",
      name: "Capability A",
      category: "structural",
      tags: ["alpha"],
    });
    await port.registerCapability({
      executionId: "exec-filter",
      key: "cap-b",
      name: "Capability B",
      category: "pipeline",
      tags: ["beta"],
    });

    const byKey = await port.getCapability({ key: "cap-a" });
    assert.equal(byKey.ok, true);
    assert.equal(byKey.capability?.name, "Capability A");

    const listed = await port.listCapabilities({
      filter: {
        kind: "execution-capability-filter",
        category: "pipeline",
      },
    });
    assert.equal(listed.ok, true);
    assert.equal(listed.total, 1);
    assert.equal(listed.capabilities?.[0]?.key, "cap-b");

    const found = await port.findCapabilities({
      filter: {
        kind: "execution-capability-filter",
        tags: ["alpha"],
      },
    });
    assert.equal(found.ok, true);
    assert.equal(found.capabilities?.length, 1);
    assert.equal(found.capability?.key, "cap-a");
  });

  it("statistics e health estruturais", async () => {
    const port = new MockExecutionCapabilityRegistryAdapter({
      now: () => "2026-08-01T22:20:00.000Z",
    });
    await port.registerCapability({
      key: "stat-1",
      name: "Stat Capability",
      category: "catalog",
    });

    const stats = await port.statistics();
    assert.equal(stats.ok, true);
    assert.equal(stats.statistics?.kind, "execution-capability-statistics");
    assert.equal(stats.statistics?.totalRegistries, 1);
    assert.equal(stats.statistics?.totalCapabilities, 1);
    assert.equal(stats.statistics?.autoDiscoveryImplemented, false);
    assert.equal(stats.statistics?.dynamicLoadingImplemented, false);

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.storedCapabilityCount, 1);
    assert.equal(health.structuralHealth?.indexReady, true);
  });

  it("Store / Factory com store compartilhado", async () => {
    const store = new DefaultExecutionCapabilityRegistryStore();
    const factory = createExecutionCapabilityRegistryFactory({ store });
    const port = factory.create({ provider: "mock" });
    await port.registerCapability({ key: "shared-1", name: "Shared" });
    assert.equal(store.capabilityCount(), 1);
    assert.equal(store.registryCount(), 1);

    const health = store.health();
    assert.equal(health.ok, true);
  });

  it("Mock unhealthy bloqueia operações", async () => {
    const port = new MockExecutionCapabilityRegistryAdapter({
      healthy: false,
      message: "capability registry offline",
    });
    const registered = await port.registerCapability({ key: "x", name: "X" });
    assert.equal(registered.ok, false);
    assert.equal(registered.code, "unhealthy");

    const health = await port.health();
    assert.equal(health.ok, false);
  });

  it("rejeita chave duplicada no mesmo registry", async () => {
    const port = new MockExecutionCapabilityRegistryAdapter();
    const first = await port.registerCapability({
      executionId: "dup-exec",
      key: "dup-key",
      name: "First",
    });
    assert.equal(first.ok, true);

    const second = await port.registerCapability({
      executionId: "dup-exec",
      key: "dup-key",
      name: "Second",
    });
    assert.equal(second.ok, false);
    assert.equal(second.code, "already_exists");
  });
});

describe("EPC-24 Sprint 08 — Orchestrator integra Execution Capability Registry", () => {
  it("adapters expõem ExecutionCapabilityRegistryPort e flags de capabilities", async () => {
    const mock = new MockCanonicalExecutionOrchestratorAdapter({ provider: "mock" });
    const def = new DefaultCanonicalExecutionOrchestratorAdapter();

    assert.ok(mock.getExecutionCapabilityRegistryPort());
    assert.ok(def.getExecutionCapabilityRegistryPort());

    const caps = mock.capabilities();
    assert.equal(caps.dependsOnExecutionCapabilityRegistry, true);
    assert.equal(caps.usesExecutionCapabilityRegistryStructurally, true);
    assert.equal(caps.dependsOnExecutionTrace, true);
    assert.equal(caps.dependsOnExecutionRegistry, true);
    assert.equal(caps.dependsOnExecutionEventBus, true);
    assert.equal(caps.dependsOnExecutionStateMachine, true);
    assert.equal(caps.dependsOnExecutionContext, true);
    assert.equal(caps.usesExecutionContextExclusively, true);
    assert.equal(caps.dependsOnPipelineResolver, true);
    assert.equal(caps.noDirectEngineCoupling, true);
  });

  it("startExecution registra Capability Registry, anexa ID e NÃO executa/descobre", async () => {
    resetAllCanonicalExecutionIdSequences();
    resetAllExecutionCapabilityRegistryIdSequences();

    const capabilityRegistry = createExecutionCapabilityRegistryPort({ provider: "mock" });
    const port = new MockCanonicalExecutionOrchestratorAdapter({
      createExecutionId: () => "canonical-exec-sprint08-1",
      createResultId: () => "canonical-result-sprint08-1",
      createTraceId: () => "canonical-trace-sprint08-1",
      createCorrelationId: () => "canonical-corr-sprint08-1",
      createStepId: (() => {
        let n = 0;
        return () => `canonical-step-sprint08-${++n}`;
      })(),
      executionCapabilityRegistry: capabilityRegistry,
      now: () => "2026-08-01T23:00:00.000Z",
    });

    const started = await port.startExecution({ intakeRef: "intake-sprint08" });
    assert.equal(started.ok, true);
    assert.ok(started.executionContext);
    assert.equal(started.executionContext?.state.phase, "finalized");
    assert.equal(started.executionContext?.state.status, "completed");
    assert.equal(started.result?.enginesInvoked, false);

    const capabilityRef = started.executionContext?.references.find(
      (r) => r.name === "executionCapabilityRegistryId",
    );
    assert.ok(capabilityRef);
    assert.ok(capabilityRef.value.length > 0);

    const traceRef = started.executionContext?.references.find(
      (r) => r.name === "executionTraceId",
    );
    assert.ok(traceRef);

    const registryRef = started.executionContext?.references.find(
      (r) => r.name === "executionRegistryId",
    );
    assert.ok(registryRef);

    const historyEntry = started.executionContext?.history.find(
      (h) => h.event === "execution-capability-registry-attached",
    );
    assert.ok(historyEntry);

    const capabilityPort = port.getExecutionCapabilityRegistryPort();
    const listed = await capabilityPort.listCapabilities({
      filter: {
        kind: "execution-capability-filter",
        executionCapabilityRegistryId: capabilityRef.value,
      },
    });
    assert.equal(listed.ok, true);
    assert.ok((listed.total ?? 0) >= 1);
    assert.equal(listed.capabilities?.[0]?.capabilitiesExecuted, false);
    assert.equal(listed.capabilities?.[0]?.autoDiscovered, false);
    assert.equal(listed.capabilities?.[0]?.dynamicallyLoaded, false);

    const caps = capabilityPort.capabilities();
    assert.equal(caps.autoDiscoveryImplemented, false);
    assert.equal(caps.dynamicLoadingImplemented, false);
    assert.equal(caps.capabilitiesExecuted, false);
    assert.equal(caps.decoupledFromEngines, true);

    assert.ok(started.message?.includes("ExecutionCapabilityRegistryPort"));
  });

  it("Execution Context permanece transporte; Capability Registry só via Port", async () => {
    resetAllCanonicalExecutionIdSequences();
    const orchestrator = new MockCanonicalExecutionOrchestratorAdapter({
      createExecutionId: () => "canonical-exec-sprint08-transport",
      createResultId: () => "canonical-result-sprint08-transport",
      createTraceId: () => "canonical-trace-sprint08-transport",
      createCorrelationId: () => "canonical-corr-sprint08-transport",
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
      contextId: "canonical-exec-sprint08-transport",
    });
    assert.equal(context.ok, true);
    assert.equal(context.context?.capability.structuralTransportOnly, true);
    assert.equal(context.context?.state.processingPerformed, false);

    assert.equal(
      (context.context as { executionCapabilityRegistry?: unknown } | undefined)
        ?.executionCapabilityRegistry,
      undefined,
    );

    const capabilityCaps = orchestrator.getExecutionCapabilityRegistryPort().capabilities();
    assert.equal(capabilityCaps.structuralCapabilityRegistryOnly, true);
    assert.equal(capabilityCaps.decoupledFromEngines, true);
    assert.equal(capabilityCaps.autoDiscoveryImplemented, false);
  });

  it("módulos EPC-24 anteriores permanecem independentes do Capability Registry", async () => {
    const resolver: PipelineResolverPort = createPipelineResolverPort({ provider: "mock" });
    const stateMachine = createExecutionStateMachinePort({ provider: "mock" });
    const eventBus = createExecutionEventBusPort({ provider: "mock" });
    const registry = createExecutionRegistryPort({ provider: "mock" });
    const trace = createExecutionTracePort({ provider: "mock" });
    const orchestrator = new MockCanonicalExecutionOrchestratorAdapter({
      pipelineResolver: resolver,
      executionStateMachine: stateMachine,
      executionEventBus: eventBus,
      executionRegistry: registry,
      executionTrace: trace,
    });

    const started = await orchestrator.startExecution();
    assert.equal(started.ok, true);
    assert.equal(started.result?.enginesInvoked, false);

    assert.equal(
      (resolver as { getExecutionCapabilityRegistryPort?: unknown })
        .getExecutionCapabilityRegistryPort,
      undefined,
    );
    assert.equal(
      (stateMachine as { getExecutionCapabilityRegistryPort?: unknown })
        .getExecutionCapabilityRegistryPort,
      undefined,
    );
    assert.equal(
      (eventBus as { getExecutionCapabilityRegistryPort?: unknown })
        .getExecutionCapabilityRegistryPort,
      undefined,
    );
    assert.equal(
      (registry as { getExecutionCapabilityRegistryPort?: unknown })
        .getExecutionCapabilityRegistryPort,
      undefined,
    );
    assert.equal(
      (trace as { getExecutionCapabilityRegistryPort?: unknown })
        .getExecutionCapabilityRegistryPort,
      undefined,
    );
  });

  it("Factory do Orchestrator injeta ExecutionCapabilityRegistryPort", async () => {
    const capabilityRegistry = createExecutionCapabilityRegistryPort({ provider: "test" });
    const factory = createCanonicalExecutionOrchestratorFactory({
      executionCapabilityRegistry: capabilityRegistry,
    });
    const port = factory.create({ provider: "mock" });
    assert.ok(
      (port as MockCanonicalExecutionOrchestratorAdapter).getExecutionCapabilityRegistryPort,
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

  it("Default orchestrator health inclui Capability Registry", async () => {
    const port = new DefaultCanonicalExecutionOrchestratorAdapter();
    const health = await port.health();
    assert.equal(health.ok, true);
  });
});
