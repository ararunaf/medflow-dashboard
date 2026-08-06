#!/usr/bin/env node
/**
 * EPC-24 Sprint 13 — Execution Resource Registry Foundation
 * Prova Application → ExecutionResourceRegistryPort → Adapter → Store
 * sem tocar produto e sem invocar OCR / IA / Mapping / regras / banco / alocação de recursos.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_EXECUTION_RESOURCE_REGISTRY_ADAPTER_ID,
  DEFAULT_EXECUTION_RESOURCE_REGISTRY_STORE_ID,
  DefaultExecutionResourceRegistryAdapter,
  DefaultExecutionResourceRegistryStore,
  MOCK_EXECUTION_RESOURCE_REGISTRY_ADAPTER_ID,
  MockExecutionResourceRegistryAdapter,
  STRUCTURAL_RESOURCE_REGISTRY_CAPABILITY,
  createExecutionResourceRegistryFactory,
  createExecutionResourceRegistryPort,
  getExecutionResourceRegistryHealthSummary,
  resetAllExecutionResourceRegistryIdSequences,
  type ExecutionResourceRegistryPort,
} from "../../../src/lib/enterprise/execution-resource-registry/index.ts";
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
import { createExecutionConstraintRegistryPort } from "../../../src/lib/enterprise/execution-constraint-registry/index.ts";
import { createExecutionDependencyRegistryPort } from "../../../src/lib/enterprise/execution-dependency-registry/index.ts";
import { createExecutionEventBusPort } from "../../../src/lib/enterprise/execution-event-bus/index.ts";
import { createExecutionPolicyRegistryPort } from "../../../src/lib/enterprise/execution-policy-registry/index.ts";
import { createExecutionRegistryPort } from "../../../src/lib/enterprise/execution-registry/index.ts";
import { createExecutionRequirementRegistryPort } from "../../../src/lib/enterprise/execution-requirement-registry/index.ts";
import { createExecutionStateMachinePort } from "../../../src/lib/enterprise/execution-state-machine/index.ts";
import { createExecutionTracePort } from "../../../src/lib/enterprise/execution-trace/index.ts";
import {
  createPipelineResolverPort,
  type PipelineResolverPort,
} from "../../../src/lib/enterprise/pipeline-resolver/index.ts";

describe("EPC-24 ExecutionResourceRegistryPort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy", async () => {
    const port: ExecutionResourceRegistryPort = new MockExecutionResourceRegistryAdapter({
      provider: "mock",
    });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.storedRegistryCount, 0);
    assert.equal(health.storedResourceCount, 0);
    assert.equal(health.structuralHealth?.kind, "execution-resource-health");
    assert.equal(health.structuralHealth?.persistenceImplemented, false);
    assert.equal(health.structuralHealth?.resourceAllocationImplemented, false);
    assert.equal(health.structuralHealth?.resourceReservationImplemented, false);
    assert.equal(health.structuralHealth?.resourcesAllocated, false);

    const caps = port.capabilities();
    assert.equal(caps.adapterId, "mock-in-memory");
    assert.equal(caps.supportsRegisterResource, true);
    assert.equal(caps.supportsGetResource, true);
    assert.equal(caps.supportsListResources, true);
    assert.equal(caps.supportsFindResources, true);
    assert.equal(caps.supportsHealth, true);
    assert.equal(caps.supportsCapabilities, true);
    assert.equal(caps.supportsStatistics, true);
    assert.equal(caps.structuralResourceRegistryOnly, true);
    assert.equal(caps.persistenceImplemented, false);
    assert.equal(caps.databaseUsed, false);
    assert.equal(caps.enginesInvoked, false);
    assert.equal(caps.resourceAllocationImplemented, false);
    assert.equal(caps.resourceReservationImplemented, false);
    assert.equal(caps.loadBalancingImplemented, false);
    assert.equal(caps.schedulingImplemented, false);
    assert.equal(caps.resourcesAllocated, false);
    assert.equal(caps.implementsOcr, false);
    assert.equal(caps.implementsAi, false);
    assert.equal(caps.implementsResourceAllocation, false);
    assert.equal(caps.implementsResourceReservation, false);
    assert.equal(caps.implementsScheduling, false);
    assert.equal(caps.noDirectEngineCoupling, true);
    assert.equal(caps.decoupledFromEngines, true);
    assert.equal(caps.workersInvoked, false);
  });

  it("DefaultExecutionResourceRegistryAdapter é o default da fundação", async () => {
    const port: ExecutionResourceRegistryPort = new DefaultExecutionResourceRegistryAdapter();
    assert.equal(port.providerId, "default");
    const caps = port.capabilities();
    assert.equal(caps.adapterId, DEFAULT_EXECUTION_RESOURCE_REGISTRY_ADAPTER_ID);
    assert.equal(caps.structuralResourceRegistryOnly, true);
    assert.equal(caps.resourceAllocationImplemented, false);

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "default");
  });

  it("test adapter é resolvido pelo provider", async () => {
    const port = createExecutionResourceRegistryPort({ provider: "test" });
    assert.equal(port.providerId, "test");
    const health = await port.health();
    assert.equal(health.ok, true);
  });

  it("Default usa ping opcional sem I/O externo", async () => {
    const port = new DefaultExecutionResourceRegistryAdapter({
      store: new DefaultExecutionResourceRegistryStore(),
      ping: async () => ({
        ok: true,
        message: "execution-resource-registry probe custom",
      }),
    });
    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.message, "execution-resource-registry probe custom");
    assert.equal(typeof health.latencyMs, "number");
  });

  it("provider default resolve DefaultExecutionResourceRegistryAdapter", () => {
    const defaultPort = createExecutionResourceRegistryPort();
    assert.equal(defaultPort.providerId, "default");
  });

  it("Factory materializa adapters corretos", () => {
    const factory = createExecutionResourceRegistryFactory();
    assert.equal(factory.create().providerId, "default");
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
  });

  it("PoC Application depende só do Port (inversão de dependência)", async () => {
    const port = createExecutionResourceRegistryPort({ provider: "mock" });
    const summary = await getExecutionResourceRegistryHealthSummary(port);

    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.provider, "mock");
    assert.equal(summary.capabilities.provider, "mock");
    assert.equal(summary.health.ok, true);
  });

  it("MOCK adapter id constante está estável", () => {
    assert.equal(MOCK_EXECUTION_RESOURCE_REGISTRY_ADAPTER_ID, "mock-in-memory");
    assert.equal(DEFAULT_EXECUTION_RESOURCE_REGISTRY_STORE_ID, "default-in-process");
  });
});

describe("EPC-24 Execution Resource Registry — registro e modelos canônicos", () => {
  it("registerResource materializa Resource, Registry, Definition, Category, Scope, Metadata", async () => {
    resetAllExecutionResourceRegistryIdSequences();
    const port = new MockExecutionResourceRegistryAdapter({
      createExecutionResourceRegistryId: () => "execution-resource-registry-fixed-1",
      createExecutionResourceId: () => "execution-resource-fixed-1",
      createDefinitionId: () => "definition-fixed-1",
      createScopeId: () => "scope-fixed-1",
      createCategoryId: () => "category-fixed-1",
      now: () => "2026-08-01T22:00:00.000Z",
    });

    const registered = await port.registerResource({
      executionId: "exec-1",
      correlationId: "corr-1",
      contextId: "ctx-1",
      stateMachineId: "sm-1",
      eventBusId: "bus-1",
      executionRegistryId: "reg-1",
      executionTraceId: "trace-1",
      executionCapabilityRegistryId: "cap-reg-1",
      executionDependencyRegistryId: "dep-reg-1",
      pipelineId: "pipe-1",
      key: "structural-platform-resource",
      name: "Structural Platform Resource",
      category: "compute",
      scope: "platform",
      tags: ["resource", "foundation"],
      structuralNotes: "structural only",
    });

    assert.equal(registered.ok, true);
    assert.equal(registered.persistenceImplemented, false);
    assert.equal(registered.databaseUsed, false);
    assert.equal(registered.enginesInvoked, false);
    assert.equal(registered.resourceAllocationImplemented, false);
    assert.equal(registered.resourceReservationImplemented, false);
    assert.equal(registered.resourcesAllocated, false);

    assert.equal(registered.resource?.kind, "execution-resource");
    assert.equal(registered.resource?.id, "execution-resource-fixed-1");
    assert.equal(registered.resource?.executionResourceId, "execution-resource-fixed-1");
    assert.equal(
      registered.resource?.executionResourceRegistryId,
      "execution-resource-registry-fixed-1",
    );
    assert.equal(registered.resource?.key, "structural-platform-resource");
    assert.equal(registered.resource?.resourceAllocated, false);
    assert.equal(registered.resource?.schedulingImplemented, false);
    assert.equal(registered.resource?.resourcesAllocated, false);

    assert.equal(registered.registry?.kind, "execution-resource-registry");
    assert.equal(
      registered.registry?.executionResourceRegistryId,
      "execution-resource-registry-fixed-1",
    );
    assert.equal(registered.registry?.resourceCount, 1);
    assert.deepEqual(registered.registry?.resourceKeys, ["structural-platform-resource"]);
    assert.equal(registered.registry?.resourceAllocationImplemented, false);
    assert.equal(registered.registry?.resourceReservationImplemented, false);
    assert.equal(registered.registry?.resourcesAllocated, false);

    assert.equal(registered.resource?.definition.kind, "execution-resource-definition");
    assert.equal(registered.resource?.definition.id, "definition-fixed-1");
    assert.equal(registered.resource?.definition.resourcesAllocated, false);

    assert.equal(registered.resource?.category.kind, "execution-resource-category");
    assert.equal(registered.resource?.category.id, "category-fixed-1");
    assert.equal(registered.resource?.category.category, "compute");

    assert.equal(registered.resource?.scope.kind, "execution-resource-scope");
    assert.equal(registered.resource?.scope.id, "scope-fixed-1");
    assert.equal(registered.resource?.scope.scope, "platform");
    assert.equal(registered.resource?.scope.evaluable, false);
    assert.equal(registered.resource?.scope.declared, true);

    assert.equal(registered.resource?.metadata.kind, "execution-resource-metadata");
    assert.deepEqual(registered.resource?.metadata.tags, ["resource", "foundation"]);

    assert.equal(registered.resource?.capability, STRUCTURAL_RESOURCE_REGISTRY_CAPABILITY);
  });

  it("getResource / listResources / findResources com filtros", async () => {
    resetAllExecutionResourceRegistryIdSequences();
    const port = new MockExecutionResourceRegistryAdapter({
      now: () => "2026-08-01T22:10:00.000Z",
    });

    await port.registerResource({
      executionId: "exec-filter",
      key: "resource-a",
      name: "Resource A",
      category: "compute",
      scope: "execution",
      tags: ["alpha"],
    });
    await port.registerResource({
      executionId: "exec-filter",
      key: "resource-b",
      name: "Resource B",
      category: "capacity",
      scope: "pipeline",
      tags: ["beta"],
    });

    const byKey = await port.getResource({ key: "resource-a" });
    assert.equal(byKey.ok, true);
    assert.equal(byKey.resource?.name, "Resource A");

    const listed = await port.listResources({
      filter: {
        kind: "execution-resource-filter",
        category: "capacity",
      },
    });
    assert.equal(listed.ok, true);
    assert.equal(listed.total, 1);
    assert.equal(listed.resources?.[0]?.key, "resource-b");

    const found = await port.findResources({
      filter: {
        kind: "execution-resource-filter",
        tags: ["alpha"],
        scope: "execution",
      },
    });
    assert.equal(found.ok, true);
    assert.equal(found.resources?.length, 1);
    assert.equal(found.resource?.key, "resource-a");
  });

  it("statistics e health estruturais", async () => {
    const port = new MockExecutionResourceRegistryAdapter({
      now: () => "2026-08-01T22:20:00.000Z",
    });
    await port.registerResource({
      key: "stat-1",
      name: "Stat Resource",
      category: "structural",
      scope: "global",
    });

    const stats = await port.statistics();
    assert.equal(stats.ok, true);
    assert.equal(stats.statistics?.kind, "execution-resource-statistics");
    assert.equal(stats.statistics?.totalRegistries, 1);
    assert.equal(stats.statistics?.totalResources, 1);
    assert.equal(stats.statistics?.totalCategories, 1);
    assert.equal(stats.statistics?.totalScopes, 1);
    assert.equal(stats.statistics?.resourceAllocationImplemented, false);
    assert.equal(stats.statistics?.resourceReservationImplemented, false);

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.storedResourceCount, 1);
    assert.equal(health.structuralHealth?.indexReady, true);
  });

  it("Store / Factory com store compartilhado", async () => {
    const store = new DefaultExecutionResourceRegistryStore();
    const factory = createExecutionResourceRegistryFactory({ store });
    const port = factory.create({ provider: "mock" });
    await port.registerResource({ key: "shared-1", name: "Shared" });
    assert.equal(store.resourceCount(), 1);
    assert.equal(store.registryCount(), 1);

    const health = store.health();
    assert.equal(health.ok, true);
  });

  it("Mock unhealthy bloqueia operações", async () => {
    const port = new MockExecutionResourceRegistryAdapter({
      healthy: false,
      message: "resource registry offline",
    });
    const registered = await port.registerResource({ key: "x", name: "X" });
    assert.equal(registered.ok, false);
    assert.equal(registered.code, "unhealthy");

    const health = await port.health();
    assert.equal(health.ok, false);
  });

  it("rejeita chave duplicada no mesmo registry", async () => {
    const port = new MockExecutionResourceRegistryAdapter();
    const first = await port.registerResource({
      executionId: "dup-exec",
      key: "dup-key",
      name: "First",
    });
    assert.equal(first.ok, true);

    const second = await port.registerResource({
      executionId: "dup-exec",
      key: "dup-key",
      name: "Second",
    });
    assert.equal(second.ok, false);
    assert.equal(second.code, "already_exists");
  });
});

describe("EPC-24 Sprint 13 — Orchestrator integra Execution Resource Registry", () => {
  it("adapters expõem ExecutionResourceRegistryPort e flags de capabilities", async () => {
    const mock = new MockCanonicalExecutionOrchestratorAdapter({ provider: "mock" });
    const def = new DefaultCanonicalExecutionOrchestratorAdapter();

    assert.ok(mock.getExecutionResourceRegistryPort());
    assert.ok(def.getExecutionResourceRegistryPort());

    const caps = mock.capabilities();
    assert.equal(caps.dependsOnExecutionResourceRegistry, true);
    assert.equal(caps.usesExecutionResourceRegistryStructurally, true);
    assert.equal(caps.dependsOnExecutionRequirementRegistry, true);
    assert.equal(caps.dependsOnExecutionConstraintRegistry, true);
    assert.equal(caps.dependsOnExecutionPolicyRegistry, true);
    assert.equal(caps.dependsOnExecutionDependencyRegistry, true);
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

  it("startExecution registra Resource Registry, anexa ID e NÃO aloca/reserva/balanceia", async () => {
    resetAllCanonicalExecutionIdSequences();
    resetAllExecutionResourceRegistryIdSequences();

    const resourceRegistry = createExecutionResourceRegistryPort({ provider: "mock" });
    const port = new MockCanonicalExecutionOrchestratorAdapter({
      createExecutionId: () => "canonical-exec-sprint13-1",
      createResultId: () => "canonical-result-sprint13-1",
      createTraceId: () => "canonical-trace-sprint13-1",
      createCorrelationId: () => "canonical-corr-sprint13-1",
      createStepId: (() => {
        let n = 0;
        return () => `canonical-step-sprint13-${++n}`;
      })(),
      executionResourceRegistry: resourceRegistry,
      now: () => "2026-08-01T23:00:00.000Z",
    });

    const started = await port.startExecution({ intakeRef: "intake-sprint13" });
    assert.equal(started.ok, true);
    assert.ok(started.executionContext);
    assert.equal(started.executionContext?.state.phase, "finalized");
    assert.equal(started.executionContext?.state.status, "completed");
    assert.equal(started.result?.enginesInvoked, false);

    const resourceRef = started.executionContext?.references.find(
      (r) => r.name === "executionResourceRegistryId",
    );
    assert.ok(resourceRef);
    assert.ok(resourceRef.value.length > 0);

    const policyRef = started.executionContext?.references.find(
      (r) => r.name === "executionPolicyRegistryId",
    );
    assert.ok(policyRef);

    const dependencyRef = started.executionContext?.references.find(
      (r) => r.name === "executionDependencyRegistryId",
    );
    assert.ok(dependencyRef);

    const capabilityRef = started.executionContext?.references.find(
      (r) => r.name === "executionCapabilityRegistryId",
    );
    assert.ok(capabilityRef);

    const constraintRef = started.executionContext?.references.find(
      (r) => r.name === "executionConstraintRegistryId",
    );
    assert.ok(constraintRef);

    const requirementRef = started.executionContext?.references.find(
      (r) => r.name === "executionRequirementRegistryId",
    );
    assert.ok(requirementRef);

    const historyEntry = started.executionContext?.history.find(
      (h) => h.event === "execution-resource-registry-attached",
    );
    assert.ok(historyEntry);

    const resourcePort = port.getExecutionResourceRegistryPort();
    const listed = await resourcePort.listResources({
      filter: {
        kind: "execution-resource-filter",
        executionResourceRegistryId: resourceRef.value,
      },
    });
    assert.equal(listed.ok, true);
    assert.ok((listed.total ?? 0) >= 1);
    assert.equal(listed.resources?.[0]?.resourceAllocated, false);
    assert.equal(listed.resources?.[0]?.schedulingImplemented, false);
    assert.equal(listed.resources?.[0]?.resourcesAllocated, false);

    const caps = resourcePort.capabilities();
    assert.equal(caps.resourceAllocationImplemented, false);
    assert.equal(caps.resourceReservationImplemented, false);
    assert.equal(caps.resourcesAllocated, false);
    assert.equal(caps.implementsResourceReservation, false);
    assert.equal(caps.workersInvoked, false);
    assert.equal(caps.decoupledFromEngines, true);

    assert.ok(started.message?.includes("ExecutionResourceRegistryPort"));
  });

  it("Execution Context permanece transporte; Resource Registry só via Port", async () => {
    resetAllCanonicalExecutionIdSequences();
    const orchestrator = new MockCanonicalExecutionOrchestratorAdapter({
      createExecutionId: () => "canonical-exec-sprint13-transport",
      createResultId: () => "canonical-result-sprint13-transport",
      createTraceId: () => "canonical-trace-sprint13-transport",
      createCorrelationId: () => "canonical-corr-sprint13-transport",
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
      contextId: "canonical-exec-sprint13-transport",
    });
    assert.equal(context.ok, true);
    assert.equal(context.context?.capability.structuralTransportOnly, true);
    assert.equal(context.context?.state.processingPerformed, false);

    assert.equal(
      (context.context as { executionResourceRegistry?: unknown } | undefined)
        ?.executionResourceRegistry,
      undefined,
    );

    const resourceCaps = orchestrator.getExecutionResourceRegistryPort().capabilities();
    assert.equal(resourceCaps.structuralResourceRegistryOnly, true);
    assert.equal(resourceCaps.decoupledFromEngines, true);
    assert.equal(resourceCaps.resourceAllocationImplemented, false);
  });

  it("módulos EPC-24 anteriores permanecem independentes do Resource Registry", async () => {
    const resolver: PipelineResolverPort = createPipelineResolverPort({ provider: "mock" });
    const stateMachine = createExecutionStateMachinePort({ provider: "mock" });
    const eventBus = createExecutionEventBusPort({ provider: "mock" });
    const registry = createExecutionRegistryPort({ provider: "mock" });
    const trace = createExecutionTracePort({ provider: "mock" });
    const capabilityRegistry = createExecutionCapabilityRegistryPort({ provider: "mock" });
    const dependencyRegistry = createExecutionDependencyRegistryPort({ provider: "mock" });
    const policyRegistry = createExecutionPolicyRegistryPort({ provider: "mock" });
    const constraintRegistry = createExecutionConstraintRegistryPort({ provider: "mock" });
    const requirementRegistry = createExecutionRequirementRegistryPort({ provider: "mock" });
    const orchestrator = new MockCanonicalExecutionOrchestratorAdapter({
      pipelineResolver: resolver,
      executionStateMachine: stateMachine,
      executionEventBus: eventBus,
      executionRegistry: registry,
      executionTrace: trace,
      executionCapabilityRegistry: capabilityRegistry,
      executionDependencyRegistry: dependencyRegistry,
      executionPolicyRegistry: policyRegistry,
      executionConstraintRegistry: constraintRegistry,
      executionRequirementRegistry: requirementRegistry,
    });

    const started = await orchestrator.startExecution();
    assert.equal(started.ok, true);
    assert.equal(started.result?.enginesInvoked, false);

    const priorModules = [
      resolver,
      stateMachine,
      eventBus,
      registry,
      trace,
      capabilityRegistry,
      dependencyRegistry,
      policyRegistry,
      constraintRegistry,
      requirementRegistry,
    ] as Array<{ getExecutionResourceRegistryPort?: unknown }>;

    for (const mod of priorModules) {
      assert.equal(mod.getExecutionResourceRegistryPort, undefined);
    }
  });

  it("Factory do Orchestrator injeta ExecutionResourceRegistryPort", async () => {
    const resourceRegistry = createExecutionResourceRegistryPort({ provider: "test" });
    const factory = createCanonicalExecutionOrchestratorFactory({
      executionResourceRegistry: resourceRegistry,
    });
    const port = factory.create({ provider: "mock" });
    assert.ok((port as MockCanonicalExecutionOrchestratorAdapter).getExecutionResourceRegistryPort);
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

  it("Default orchestrator health inclui Resource Registry", async () => {
    const port = new DefaultCanonicalExecutionOrchestratorAdapter();
    const health = await port.health();
    assert.equal(health.ok, true);
  });
});
