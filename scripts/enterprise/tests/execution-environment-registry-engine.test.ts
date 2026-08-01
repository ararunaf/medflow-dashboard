#!/usr/bin/env node
/**
 * EPC-24 Sprint 14 — Execution Environment Registry Foundation
 * Prova Application → ExecutionEnvironmentRegistryPort → Adapter → Store
 * sem tocar produto e sem invocar OCR / IA / Mapping / regras / banco / seleção de ambientes.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_EXECUTION_ENVIRONMENT_REGISTRY_ADAPTER_ID,
  DEFAULT_EXECUTION_ENVIRONMENT_REGISTRY_STORE_ID,
  DefaultExecutionEnvironmentRegistryAdapter,
  DefaultExecutionEnvironmentRegistryStore,
  MOCK_EXECUTION_ENVIRONMENT_REGISTRY_ADAPTER_ID,
  MockExecutionEnvironmentRegistryAdapter,
  STRUCTURAL_ENVIRONMENT_REGISTRY_CAPABILITY,
  createExecutionEnvironmentRegistryFactory,
  createExecutionEnvironmentRegistryPort,
  getExecutionEnvironmentRegistryHealthSummary,
  resetAllExecutionEnvironmentRegistryIdSequences,
  type ExecutionEnvironmentRegistryPort,
} from "../../../src/lib/enterprise/execution-environment-registry/index.ts";
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
import { createExecutionResourceRegistryPort } from "../../../src/lib/enterprise/execution-resource-registry/index.ts";
import { createExecutionStateMachinePort } from "../../../src/lib/enterprise/execution-state-machine/index.ts";
import { createExecutionTracePort } from "../../../src/lib/enterprise/execution-trace/index.ts";
import {
  createPipelineResolverPort,
  type PipelineResolverPort,
} from "../../../src/lib/enterprise/pipeline-resolver/index.ts";

describe("EPC-24 ExecutionEnvironmentRegistryPort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy", async () => {
    const port: ExecutionEnvironmentRegistryPort = new MockExecutionEnvironmentRegistryAdapter({
      provider: "mock",
    });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.storedRegistryCount, 0);
    assert.equal(health.storedEnvironmentCount, 0);
    assert.equal(health.structuralHealth?.kind, "execution-environment-health");
    assert.equal(health.structuralHealth?.persistenceImplemented, false);
    assert.equal(health.structuralHealth?.environmentSelectionImplemented, false);
    assert.equal(health.structuralHealth?.environmentProvisioningImplemented, false);
    assert.equal(health.structuralHealth?.environmentsActivated, false);

    const caps = port.capabilities();
    assert.equal(caps.adapterId, "mock-in-memory");
    assert.equal(caps.supportsRegisterEnvironment, true);
    assert.equal(caps.supportsGetEnvironment, true);
    assert.equal(caps.supportsListEnvironments, true);
    assert.equal(caps.supportsFindEnvironments, true);
    assert.equal(caps.supportsHealth, true);
    assert.equal(caps.supportsCapabilities, true);
    assert.equal(caps.supportsStatistics, true);
    assert.equal(caps.structuralEnvironmentRegistryOnly, true);
    assert.equal(caps.persistenceImplemented, false);
    assert.equal(caps.databaseUsed, false);
    assert.equal(caps.enginesInvoked, false);
    assert.equal(caps.environmentSelectionImplemented, false);
    assert.equal(caps.environmentProvisioningImplemented, false);
    assert.equal(caps.environmentActivationImplemented, false);
    assert.equal(caps.environmentsProvisioned, false);
    assert.equal(caps.environmentsActivated, false);
    assert.equal(caps.implementsOcr, false);
    assert.equal(caps.implementsAi, false);
    assert.equal(caps.implementsEnvironmentSelection, false);
    assert.equal(caps.implementsEnvironmentProvisioning, false);
    assert.equal(caps.noDirectEngineCoupling, true);
    assert.equal(caps.decoupledFromEngines, true);
    assert.equal(caps.workersInvoked, false);
  });

  it("DefaultExecutionEnvironmentRegistryAdapter é o default da fundação", async () => {
    const port: ExecutionEnvironmentRegistryPort = new DefaultExecutionEnvironmentRegistryAdapter();
    assert.equal(port.providerId, "default");
    const caps = port.capabilities();
    assert.equal(caps.adapterId, DEFAULT_EXECUTION_ENVIRONMENT_REGISTRY_ADAPTER_ID);
    assert.equal(caps.structuralEnvironmentRegistryOnly, true);
    assert.equal(caps.environmentSelectionImplemented, false);

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "default");
  });

  it("test adapter é resolvido pelo provider", async () => {
    const port = createExecutionEnvironmentRegistryPort({ provider: "test" });
    assert.equal(port.providerId, "test");
    const health = await port.health();
    assert.equal(health.ok, true);
  });

  it("Default usa ping opcional sem I/O externo", async () => {
    const port = new DefaultExecutionEnvironmentRegistryAdapter({
      store: new DefaultExecutionEnvironmentRegistryStore(),
      ping: async () => ({
        ok: true,
        message: "execution-environment-registry probe custom",
      }),
    });
    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.message, "execution-environment-registry probe custom");
    assert.equal(typeof health.latencyMs, "number");
  });

  it("provider default resolve DefaultExecutionEnvironmentRegistryAdapter", () => {
    const defaultPort = createExecutionEnvironmentRegistryPort();
    assert.equal(defaultPort.providerId, "default");
  });

  it("Factory materializa adapters corretos", () => {
    const factory = createExecutionEnvironmentRegistryFactory();
    assert.equal(factory.create().providerId, "default");
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
  });

  it("PoC Application depende só do Port (inversão de dependência)", async () => {
    const port = createExecutionEnvironmentRegistryPort({ provider: "mock" });
    const summary = await getExecutionEnvironmentRegistryHealthSummary(port);

    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.provider, "mock");
    assert.equal(summary.capabilities.provider, "mock");
    assert.equal(summary.health.ok, true);
  });

  it("MOCK adapter id constante está estável", () => {
    assert.equal(MOCK_EXECUTION_ENVIRONMENT_REGISTRY_ADAPTER_ID, "mock-in-memory");
    assert.equal(DEFAULT_EXECUTION_ENVIRONMENT_REGISTRY_STORE_ID, "default-in-process");
  });
});

describe("EPC-24 Execution Environment Registry — registro e modelos canônicos", () => {
  it("registerEnvironment materializa Environment, Registry, Definition, Category, Scope, Metadata", async () => {
    resetAllExecutionEnvironmentRegistryIdSequences();
    const port = new MockExecutionEnvironmentRegistryAdapter({
      createExecutionEnvironmentRegistryId: () => "execution-environment-registry-fixed-1",
      createExecutionEnvironmentId: () => "execution-environment-fixed-1",
      createDefinitionId: () => "definition-fixed-1",
      createScopeId: () => "scope-fixed-1",
      createCategoryId: () => "category-fixed-1",
      now: () => "2026-08-01T22:00:00.000Z",
    });

    const registered = await port.registerEnvironment({
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
      key: "structural-platform-environment",
      name: "Structural Platform Environment",
      category: "compute",
      scope: "platform",
      tags: ["environment", "foundation"],
      structuralNotes: "structural only",
    });

    assert.equal(registered.ok, true);
    assert.equal(registered.persistenceImplemented, false);
    assert.equal(registered.databaseUsed, false);
    assert.equal(registered.enginesInvoked, false);
    assert.equal(registered.environmentSelectionImplemented, false);
    assert.equal(registered.environmentProvisioningImplemented, false);
    assert.equal(registered.environmentsActivated, false);

    assert.equal(registered.environment?.kind, "execution-environment");
    assert.equal(registered.environment?.id, "execution-environment-fixed-1");
    assert.equal(registered.environment?.executionEnvironmentId, "execution-environment-fixed-1");
    assert.equal(
      registered.environment?.executionEnvironmentRegistryId,
      "execution-environment-registry-fixed-1",
    );
    assert.equal(registered.environment?.key, "structural-platform-environment");
    assert.equal(registered.environment?.environmentSelected, false);
    assert.equal(registered.environment?.environmentsProvisioned, false);
    assert.equal(registered.environment?.environmentsActivated, false);

    assert.equal(registered.registry?.kind, "execution-environment-registry");
    assert.equal(
      registered.registry?.executionEnvironmentRegistryId,
      "execution-environment-registry-fixed-1",
    );
    assert.equal(registered.registry?.environmentCount, 1);
    assert.deepEqual(registered.registry?.environmentKeys, ["structural-platform-environment"]);
    assert.equal(registered.registry?.environmentSelectionImplemented, false);
    assert.equal(registered.registry?.environmentProvisioningImplemented, false);
    assert.equal(registered.registry?.environmentsActivated, false);

    assert.equal(registered.environment?.definition.kind, "execution-environment-definition");
    assert.equal(registered.environment?.definition.id, "definition-fixed-1");
    assert.equal(registered.environment?.definition.environmentsActivated, false);

    assert.equal(registered.environment?.category.kind, "execution-environment-category");
    assert.equal(registered.environment?.category.id, "category-fixed-1");
    assert.equal(registered.environment?.category.category, "compute");

    assert.equal(registered.environment?.scope.kind, "execution-environment-scope");
    assert.equal(registered.environment?.scope.id, "scope-fixed-1");
    assert.equal(registered.environment?.scope.scope, "platform");
    assert.equal(registered.environment?.scope.evaluable, false);
    assert.equal(registered.environment?.scope.declared, true);

    assert.equal(registered.environment?.metadata.kind, "execution-environment-metadata");
    assert.deepEqual(registered.environment?.metadata.tags, ["environment", "foundation"]);

    assert.equal(registered.environment?.capability, STRUCTURAL_ENVIRONMENT_REGISTRY_CAPABILITY);
  });

  it("getEnvironment / listEnvironments / findEnvironments com filtros", async () => {
    resetAllExecutionEnvironmentRegistryIdSequences();
    const port = new MockExecutionEnvironmentRegistryAdapter({
      now: () => "2026-08-01T22:10:00.000Z",
    });

    await port.registerEnvironment({
      executionId: "exec-filter",
      key: "environment-a",
      name: "Environment A",
      category: "compute",
      scope: "execution",
      tags: ["alpha"],
    });
    await port.registerEnvironment({
      executionId: "exec-filter",
      key: "environment-b",
      name: "Environment B",
      category: "capacity",
      scope: "pipeline",
      tags: ["beta"],
    });

    const byKey = await port.getEnvironment({ key: "environment-a" });
    assert.equal(byKey.ok, true);
    assert.equal(byKey.environment?.name, "Environment A");

    const listed = await port.listEnvironments({
      filter: {
        kind: "execution-environment-filter",
        category: "capacity",
      },
    });
    assert.equal(listed.ok, true);
    assert.equal(listed.total, 1);
    assert.equal(listed.environments?.[0]?.key, "environment-b");

    const found = await port.findEnvironments({
      filter: {
        kind: "execution-environment-filter",
        tags: ["alpha"],
        scope: "execution",
      },
    });
    assert.equal(found.ok, true);
    assert.equal(found.environments?.length, 1);
    assert.equal(found.environment?.key, "environment-a");
  });

  it("statistics e health estruturais", async () => {
    const port = new MockExecutionEnvironmentRegistryAdapter({
      now: () => "2026-08-01T22:20:00.000Z",
    });
    await port.registerEnvironment({
      key: "stat-1",
      name: "Stat Environment",
      category: "structural",
      scope: "global",
    });

    const stats = await port.statistics();
    assert.equal(stats.ok, true);
    assert.equal(stats.statistics?.kind, "execution-environment-statistics");
    assert.equal(stats.statistics?.totalRegistries, 1);
    assert.equal(stats.statistics?.totalEnvironments, 1);
    assert.equal(stats.statistics?.totalCategories, 1);
    assert.equal(stats.statistics?.totalScopes, 1);
    assert.equal(stats.statistics?.environmentSelectionImplemented, false);
    assert.equal(stats.statistics?.environmentProvisioningImplemented, false);

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.storedEnvironmentCount, 1);
    assert.equal(health.structuralHealth?.indexReady, true);
  });

  it("Store / Factory com store compartilhado", async () => {
    const store = new DefaultExecutionEnvironmentRegistryStore();
    const factory = createExecutionEnvironmentRegistryFactory({ store });
    const port = factory.create({ provider: "mock" });
    await port.registerEnvironment({ key: "shared-1", name: "Shared" });
    assert.equal(store.environmentCount(), 1);
    assert.equal(store.registryCount(), 1);

    const health = store.health();
    assert.equal(health.ok, true);
  });

  it("Mock unhealthy bloqueia operações", async () => {
    const port = new MockExecutionEnvironmentRegistryAdapter({
      healthy: false,
      message: "environment registry offline",
    });
    const registered = await port.registerEnvironment({ key: "x", name: "X" });
    assert.equal(registered.ok, false);
    assert.equal(registered.code, "unhealthy");

    const health = await port.health();
    assert.equal(health.ok, false);
  });

  it("rejeita chave duplicada no mesmo registry", async () => {
    const port = new MockExecutionEnvironmentRegistryAdapter();
    const first = await port.registerEnvironment({
      executionId: "dup-exec",
      key: "dup-key",
      name: "First",
    });
    assert.equal(first.ok, true);

    const second = await port.registerEnvironment({
      executionId: "dup-exec",
      key: "dup-key",
      name: "Second",
    });
    assert.equal(second.ok, false);
    assert.equal(second.code, "already_exists");
  });
});

describe("EPC-24 Sprint 14 — Orchestrator integra Execution Environment Registry", () => {
  it("adapters expõem ExecutionEnvironmentRegistryPort e flags de capabilities", async () => {
    const mock = new MockCanonicalExecutionOrchestratorAdapter({ provider: "mock" });
    const def = new DefaultCanonicalExecutionOrchestratorAdapter();

    assert.ok(mock.getExecutionEnvironmentRegistryPort());
    assert.ok(def.getExecutionEnvironmentRegistryPort());

    const caps = mock.capabilities();
    assert.equal(caps.dependsOnExecutionEnvironmentRegistry, true);
    assert.equal(caps.usesExecutionEnvironmentRegistryStructurally, true);
    assert.equal(caps.dependsOnExecutionResourceRegistry, true);
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

  it("startExecution registra Environment Registry, anexa ID e NÃO seleciona/provisiona/ativa", async () => {
    resetAllCanonicalExecutionIdSequences();
    resetAllExecutionEnvironmentRegistryIdSequences();

    const environmentRegistry = createExecutionEnvironmentRegistryPort({ provider: "mock" });
    const port = new MockCanonicalExecutionOrchestratorAdapter({
      createExecutionId: () => "canonical-exec-sprint14-1",
      createResultId: () => "canonical-result-sprint14-1",
      createTraceId: () => "canonical-trace-sprint14-1",
      createCorrelationId: () => "canonical-corr-sprint14-1",
      createStepId: (() => {
        let n = 0;
        return () => `canonical-step-sprint14-${++n}`;
      })(),
      executionEnvironmentRegistry: environmentRegistry,
      now: () => "2026-08-01T23:00:00.000Z",
    });

    const started = await port.startExecution({ intakeRef: "intake-sprint14" });
    assert.equal(started.ok, true);
    assert.ok(started.executionContext);
    assert.equal(started.executionContext?.state.phase, "finalized");
    assert.equal(started.executionContext?.state.status, "completed");
    assert.equal(started.result?.enginesInvoked, false);

    const environmentRef = started.executionContext?.references.find(
      (r) => r.name === "executionEnvironmentRegistryId",
    );
    assert.ok(environmentRef);
    assert.ok(environmentRef.value.length > 0);

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

    const resourceRef = started.executionContext?.references.find(
      (r) => r.name === "executionResourceRegistryId",
    );
    assert.ok(resourceRef);

    const historyEntry = started.executionContext?.history.find(
      (h) => h.event === "execution-environment-registry-attached",
    );
    assert.ok(historyEntry);

    const environmentPort = port.getExecutionEnvironmentRegistryPort();
    const listed = await environmentPort.listEnvironments({
      filter: {
        kind: "execution-environment-filter",
        executionEnvironmentRegistryId: environmentRef.value,
      },
    });
    assert.equal(listed.ok, true);
    assert.ok((listed.total ?? 0) >= 1);
    assert.equal(listed.environments?.[0]?.environmentSelected, false);
    assert.equal(listed.environments?.[0]?.environmentsProvisioned, false);
    assert.equal(listed.environments?.[0]?.environmentsActivated, false);

    const caps = environmentPort.capabilities();
    assert.equal(caps.environmentSelectionImplemented, false);
    assert.equal(caps.environmentProvisioningImplemented, false);
    assert.equal(caps.environmentsActivated, false);
    assert.equal(caps.implementsEnvironmentProvisioning, false);
    assert.equal(caps.workersInvoked, false);
    assert.equal(caps.decoupledFromEngines, true);

    assert.ok(started.message?.includes("ExecutionEnvironmentRegistryPort"));
  });

  it("Execution Context permanece transporte; Environment Registry só via Port", async () => {
    resetAllCanonicalExecutionIdSequences();
    const orchestrator = new MockCanonicalExecutionOrchestratorAdapter({
      createExecutionId: () => "canonical-exec-sprint14-transport",
      createResultId: () => "canonical-result-sprint14-transport",
      createTraceId: () => "canonical-trace-sprint14-transport",
      createCorrelationId: () => "canonical-corr-sprint14-transport",
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
      contextId: "canonical-exec-sprint14-transport",
    });
    assert.equal(context.ok, true);
    assert.equal(context.context?.capability.structuralTransportOnly, true);
    assert.equal(context.context?.state.processingPerformed, false);

    assert.equal(
      (context.context as { executionEnvironmentRegistry?: unknown } | undefined)
        ?.executionEnvironmentRegistry,
      undefined,
    );

    const environmentCaps = orchestrator.getExecutionEnvironmentRegistryPort().capabilities();
    assert.equal(environmentCaps.structuralEnvironmentRegistryOnly, true);
    assert.equal(environmentCaps.decoupledFromEngines, true);
    assert.equal(environmentCaps.environmentSelectionImplemented, false);
  });

  it("módulos EPC-24 anteriores permanecem independentes do Environment Registry", async () => {
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
    const resourceRegistry = createExecutionResourceRegistryPort({ provider: "mock" });
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
      executionResourceRegistry: resourceRegistry,
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
      resourceRegistry,
    ] as Array<{ getExecutionEnvironmentRegistryPort?: unknown }>;

    for (const mod of priorModules) {
      assert.equal(mod.getExecutionEnvironmentRegistryPort, undefined);
    }
  });

  it("Factory do Orchestrator injeta ExecutionEnvironmentRegistryPort", async () => {
    const environmentRegistry = createExecutionEnvironmentRegistryPort({ provider: "test" });
    const factory = createCanonicalExecutionOrchestratorFactory({
      executionEnvironmentRegistry: environmentRegistry,
    });
    const port = factory.create({ provider: "mock" });
    assert.ok(
      (port as MockCanonicalExecutionOrchestratorAdapter).getExecutionEnvironmentRegistryPort,
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

  it("Default orchestrator health inclui Environment Registry", async () => {
    const port = new DefaultCanonicalExecutionOrchestratorAdapter();
    const health = await port.health();
    assert.equal(health.ok, true);
  });
});
