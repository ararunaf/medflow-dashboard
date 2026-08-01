#!/usr/bin/env node
/**
 * EPC-24 Sprint 11 — Execution Constraint Registry Foundation
 * Prova Application → ExecutionConstraintRegistryPort → Adapter → Store
 * sem tocar produto e sem invocar OCR / IA / Mapping / regras / banco / avaliação.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_EXECUTION_CONSTRAINT_REGISTRY_ADAPTER_ID,
  DEFAULT_EXECUTION_CONSTRAINT_REGISTRY_STORE_ID,
  DefaultExecutionConstraintRegistryAdapter,
  DefaultExecutionConstraintRegistryStore,
  MOCK_EXECUTION_CONSTRAINT_REGISTRY_ADAPTER_ID,
  MockExecutionConstraintRegistryAdapter,
  STRUCTURAL_CONSTRAINT_REGISTRY_CAPABILITY,
  createExecutionConstraintRegistryFactory,
  createExecutionConstraintRegistryPort,
  getExecutionConstraintRegistryHealthSummary,
  resetAllExecutionConstraintRegistryIdSequences,
  type ExecutionConstraintRegistryPort,
} from "../../../src/lib/enterprise/execution-constraint-registry/index.ts";
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
import { createExecutionDependencyRegistryPort } from "../../../src/lib/enterprise/execution-dependency-registry/index.ts";
import { createExecutionEventBusPort } from "../../../src/lib/enterprise/execution-event-bus/index.ts";
import { createExecutionRegistryPort } from "../../../src/lib/enterprise/execution-registry/index.ts";
import { createExecutionStateMachinePort } from "../../../src/lib/enterprise/execution-state-machine/index.ts";
import { createExecutionTracePort } from "../../../src/lib/enterprise/execution-trace/index.ts";
import {
  createPipelineResolverPort,
  type PipelineResolverPort,
} from "../../../src/lib/enterprise/pipeline-resolver/index.ts";

describe("EPC-24 ExecutionConstraintRegistryPort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy", async () => {
    const port: ExecutionConstraintRegistryPort = new MockExecutionConstraintRegistryAdapter({
      provider: "mock",
    });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.storedRegistryCount, 0);
    assert.equal(health.storedConstraintCount, 0);
    assert.equal(health.structuralHealth?.kind, "execution-constraint-health");
    assert.equal(health.structuralHealth?.persistenceImplemented, false);
    assert.equal(health.structuralHealth?.constraintValidationImplemented, false);
    assert.equal(health.structuralHealth?.ruleEngineInvoked, false);
    assert.equal(health.structuralHealth?.constraintsValidated, false);

    const caps = port.capabilities();
    assert.equal(caps.adapterId, "mock-in-memory");
    assert.equal(caps.supportsRegisterConstraint, true);
    assert.equal(caps.supportsGetConstraint, true);
    assert.equal(caps.supportsListConstraints, true);
    assert.equal(caps.supportsFindConstraints, true);
    assert.equal(caps.supportsHealth, true);
    assert.equal(caps.supportsCapabilities, true);
    assert.equal(caps.supportsStatistics, true);
    assert.equal(caps.structuralConstraintRegistryOnly, true);
    assert.equal(caps.persistenceImplemented, false);
    assert.equal(caps.databaseUsed, false);
    assert.equal(caps.enginesInvoked, false);
    assert.equal(caps.constraintValidationImplemented, false);
    assert.equal(caps.ruleEngineInvoked, false);
    assert.equal(caps.decisionEngineInvoked, false);
    assert.equal(caps.rulesApplied, false);
    assert.equal(caps.constraintsValidated, false);
    assert.equal(caps.implementsOcr, false);
    assert.equal(caps.implementsAi, false);
    assert.equal(caps.implementsConstraintValidation, false);
    assert.equal(caps.implementsExecutionBlocking, false);
    assert.equal(caps.implementsRuleExecution, false);
    assert.equal(caps.noDirectEngineCoupling, true);
    assert.equal(caps.decoupledFromEngines, true);
    assert.equal(caps.executionBlocked, false);
  });

  it("DefaultExecutionConstraintRegistryAdapter é o default da fundação", async () => {
    const port: ExecutionConstraintRegistryPort = new DefaultExecutionConstraintRegistryAdapter();
    assert.equal(port.providerId, "default");
    const caps = port.capabilities();
    assert.equal(caps.adapterId, DEFAULT_EXECUTION_CONSTRAINT_REGISTRY_ADAPTER_ID);
    assert.equal(caps.structuralConstraintRegistryOnly, true);
    assert.equal(caps.constraintValidationImplemented, false);

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "default");
  });

  it("test adapter é resolvido pelo provider", async () => {
    const port = createExecutionConstraintRegistryPort({ provider: "test" });
    assert.equal(port.providerId, "test");
    const health = await port.health();
    assert.equal(health.ok, true);
  });

  it("Default usa ping opcional sem I/O externo", async () => {
    const port = new DefaultExecutionConstraintRegistryAdapter({
      store: new DefaultExecutionConstraintRegistryStore(),
      ping: async () => ({
        ok: true,
        message: "execution-constraint-registry probe custom",
      }),
    });
    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.message, "execution-constraint-registry probe custom");
    assert.equal(typeof health.latencyMs, "number");
  });

  it("provider default resolve DefaultExecutionConstraintRegistryAdapter", () => {
    const defaultPort = createExecutionConstraintRegistryPort();
    assert.equal(defaultPort.providerId, "default");
  });

  it("Factory materializa adapters corretos", () => {
    const factory = createExecutionConstraintRegistryFactory();
    assert.equal(factory.create().providerId, "default");
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
  });

  it("PoC Application depende só do Port (inversão de dependência)", async () => {
    const port = createExecutionConstraintRegistryPort({ provider: "mock" });
    const summary = await getExecutionConstraintRegistryHealthSummary(port);

    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.provider, "mock");
    assert.equal(summary.capabilities.provider, "mock");
    assert.equal(summary.health.ok, true);
  });

  it("MOCK adapter id constante está estável", () => {
    assert.equal(MOCK_EXECUTION_CONSTRAINT_REGISTRY_ADAPTER_ID, "mock-in-memory");
    assert.equal(DEFAULT_EXECUTION_CONSTRAINT_REGISTRY_STORE_ID, "default-in-process");
  });
});

describe("EPC-24 Execution Constraint Registry — registro e modelos canônicos", () => {
  it("registerConstraint materializa Constraint, Registry, Definition, Category, Scope, Metadata", async () => {
    resetAllExecutionConstraintRegistryIdSequences();
    const port = new MockExecutionConstraintRegistryAdapter({
      createExecutionConstraintRegistryId: () => "execution-constraint-registry-fixed-1",
      createExecutionConstraintId: () => "execution-constraint-fixed-1",
      createDefinitionId: () => "definition-fixed-1",
      createScopeId: () => "scope-fixed-1",
      createCategoryId: () => "category-fixed-1",
      now: () => "2026-08-01T22:00:00.000Z",
    });

    const registered = await port.registerConstraint({
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
      key: "structural-platform-constraint",
      name: "Structural Platform Constraint",
      category: "governance",
      scope: "platform",
      tags: ["constraint", "foundation"],
      structuralNotes: "structural only",
    });

    assert.equal(registered.ok, true);
    assert.equal(registered.persistenceImplemented, false);
    assert.equal(registered.databaseUsed, false);
    assert.equal(registered.enginesInvoked, false);
    assert.equal(registered.constraintValidationImplemented, false);
    assert.equal(registered.ruleEngineInvoked, false);
    assert.equal(registered.constraintsValidated, false);

    assert.equal(registered.constraint?.kind, "execution-constraint");
    assert.equal(registered.constraint?.id, "execution-constraint-fixed-1");
    assert.equal(registered.constraint?.executionConstraintId, "execution-constraint-fixed-1");
    assert.equal(
      registered.constraint?.executionConstraintRegistryId,
      "execution-constraint-registry-fixed-1",
    );
    assert.equal(registered.constraint?.key, "structural-platform-constraint");
    assert.equal(registered.constraint?.constraintValidated, false);
    assert.equal(registered.constraint?.rulesApplied, false);
    assert.equal(registered.constraint?.constraintsValidated, false);

    assert.equal(registered.registry?.kind, "execution-constraint-registry");
    assert.equal(
      registered.registry?.executionConstraintRegistryId,
      "execution-constraint-registry-fixed-1",
    );
    assert.equal(registered.registry?.constraintCount, 1);
    assert.deepEqual(registered.registry?.constraintKeys, ["structural-platform-constraint"]);
    assert.equal(registered.registry?.constraintValidationImplemented, false);
    assert.equal(registered.registry?.ruleEngineInvoked, false);
    assert.equal(registered.registry?.constraintsValidated, false);

    assert.equal(registered.constraint?.definition.kind, "execution-constraint-definition");
    assert.equal(registered.constraint?.definition.id, "definition-fixed-1");
    assert.equal(registered.constraint?.definition.constraintsValidated, false);

    assert.equal(registered.constraint?.category.kind, "execution-constraint-category");
    assert.equal(registered.constraint?.category.id, "category-fixed-1");
    assert.equal(registered.constraint?.category.category, "governance");

    assert.equal(registered.constraint?.scope.kind, "execution-constraint-scope");
    assert.equal(registered.constraint?.scope.id, "scope-fixed-1");
    assert.equal(registered.constraint?.scope.scope, "platform");
    assert.equal(registered.constraint?.scope.evaluable, false);
    assert.equal(registered.constraint?.scope.declared, true);

    assert.equal(registered.constraint?.metadata.kind, "execution-constraint-metadata");
    assert.deepEqual(registered.constraint?.metadata.tags, ["constraint", "foundation"]);

    assert.equal(registered.constraint?.capability, STRUCTURAL_CONSTRAINT_REGISTRY_CAPABILITY);
  });

  it("getConstraint / listConstraints / findConstraints com filtros", async () => {
    resetAllExecutionConstraintRegistryIdSequences();
    const port = new MockExecutionConstraintRegistryAdapter({
      now: () => "2026-08-01T22:10:00.000Z",
    });

    await port.registerConstraint({
      executionId: "exec-filter",
      key: "constraint-a",
      name: "Constraint A",
      category: "governance",
      scope: "execution",
      tags: ["alpha"],
    });
    await port.registerConstraint({
      executionId: "exec-filter",
      key: "constraint-b",
      name: "Constraint B",
      category: "compliance",
      scope: "pipeline",
      tags: ["beta"],
    });

    const byKey = await port.getConstraint({ key: "constraint-a" });
    assert.equal(byKey.ok, true);
    assert.equal(byKey.constraint?.name, "Constraint A");

    const listed = await port.listConstraints({
      filter: {
        kind: "execution-constraint-filter",
        category: "compliance",
      },
    });
    assert.equal(listed.ok, true);
    assert.equal(listed.total, 1);
    assert.equal(listed.constraints?.[0]?.key, "constraint-b");

    const found = await port.findConstraints({
      filter: {
        kind: "execution-constraint-filter",
        tags: ["alpha"],
        scope: "execution",
      },
    });
    assert.equal(found.ok, true);
    assert.equal(found.constraints?.length, 1);
    assert.equal(found.constraint?.key, "constraint-a");
  });

  it("statistics e health estruturais", async () => {
    const port = new MockExecutionConstraintRegistryAdapter({
      now: () => "2026-08-01T22:20:00.000Z",
    });
    await port.registerConstraint({
      key: "stat-1",
      name: "Stat Constraint",
      category: "structural",
      scope: "global",
    });

    const stats = await port.statistics();
    assert.equal(stats.ok, true);
    assert.equal(stats.statistics?.kind, "execution-constraint-statistics");
    assert.equal(stats.statistics?.totalRegistries, 1);
    assert.equal(stats.statistics?.totalConstraints, 1);
    assert.equal(stats.statistics?.totalCategories, 1);
    assert.equal(stats.statistics?.totalScopes, 1);
    assert.equal(stats.statistics?.constraintValidationImplemented, false);
    assert.equal(stats.statistics?.ruleEngineInvoked, false);

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.storedConstraintCount, 1);
    assert.equal(health.structuralHealth?.indexReady, true);
  });

  it("Store / Factory com store compartilhado", async () => {
    const store = new DefaultExecutionConstraintRegistryStore();
    const factory = createExecutionConstraintRegistryFactory({ store });
    const port = factory.create({ provider: "mock" });
    await port.registerConstraint({ key: "shared-1", name: "Shared" });
    assert.equal(store.constraintCount(), 1);
    assert.equal(store.registryCount(), 1);

    const health = store.health();
    assert.equal(health.ok, true);
  });

  it("Mock unhealthy bloqueia operações", async () => {
    const port = new MockExecutionConstraintRegistryAdapter({
      healthy: false,
      message: "constraint registry offline",
    });
    const registered = await port.registerConstraint({ key: "x", name: "X" });
    assert.equal(registered.ok, false);
    assert.equal(registered.code, "unhealthy");

    const health = await port.health();
    assert.equal(health.ok, false);
  });

  it("rejeita chave duplicada no mesmo registry", async () => {
    const port = new MockExecutionConstraintRegistryAdapter();
    const first = await port.registerConstraint({
      executionId: "dup-exec",
      key: "dup-key",
      name: "First",
    });
    assert.equal(first.ok, true);

    const second = await port.registerConstraint({
      executionId: "dup-exec",
      key: "dup-key",
      name: "Second",
    });
    assert.equal(second.ok, false);
    assert.equal(second.code, "already_exists");
  });
});

describe("EPC-24 Sprint 11 — Orchestrator integra Execution Constraint Registry", () => {
  it("adapters expõem ExecutionConstraintRegistryPort e flags de capabilities", async () => {
    const mock = new MockCanonicalExecutionOrchestratorAdapter({ provider: "mock" });
    const def = new DefaultCanonicalExecutionOrchestratorAdapter();

    assert.ok(mock.getExecutionConstraintRegistryPort());
    assert.ok(def.getExecutionConstraintRegistryPort());

    const caps = mock.capabilities();
    assert.equal(caps.dependsOnExecutionConstraintRegistry, true);
    assert.equal(caps.usesExecutionConstraintRegistryStructurally, true);
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

  it("startExecution registra Constraint Registry, anexa ID e NÃO valida/bloqueia", async () => {
    resetAllCanonicalExecutionIdSequences();
    resetAllExecutionConstraintRegistryIdSequences();

    const constraintRegistry = createExecutionConstraintRegistryPort({ provider: "mock" });
    const port = new MockCanonicalExecutionOrchestratorAdapter({
      createExecutionId: () => "canonical-exec-sprint11-1",
      createResultId: () => "canonical-result-sprint11-1",
      createTraceId: () => "canonical-trace-sprint11-1",
      createCorrelationId: () => "canonical-corr-sprint11-1",
      createStepId: (() => {
        let n = 0;
        return () => `canonical-step-sprint11-${++n}`;
      })(),
      executionConstraintRegistry: constraintRegistry,
      now: () => "2026-08-01T23:00:00.000Z",
    });

    const started = await port.startExecution({ intakeRef: "intake-sprint11" });
    assert.equal(started.ok, true);
    assert.ok(started.executionContext);
    assert.equal(started.executionContext?.state.phase, "finalized");
    assert.equal(started.executionContext?.state.status, "completed");
    assert.equal(started.result?.enginesInvoked, false);

    const constraintRef = started.executionContext?.references.find(
      (r) => r.name === "executionConstraintRegistryId",
    );
    assert.ok(constraintRef);
    assert.ok(constraintRef.value.length > 0);

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

    const historyEntry = started.executionContext?.history.find(
      (h) => h.event === "execution-constraint-registry-attached",
    );
    assert.ok(historyEntry);

    const constraintPort = port.getExecutionConstraintRegistryPort();
    const listed = await constraintPort.listConstraints({
      filter: {
        kind: "execution-constraint-filter",
        executionConstraintRegistryId: constraintRef.value,
      },
    });
    assert.equal(listed.ok, true);
    assert.ok((listed.total ?? 0) >= 1);
    assert.equal(listed.constraints?.[0]?.constraintValidated, false);
    assert.equal(listed.constraints?.[0]?.rulesApplied, false);
    assert.equal(listed.constraints?.[0]?.constraintsValidated, false);

    const caps = constraintPort.capabilities();
    assert.equal(caps.constraintValidationImplemented, false);
    assert.equal(caps.ruleEngineInvoked, false);
    assert.equal(caps.constraintsValidated, false);
    assert.equal(caps.implementsExecutionBlocking, false);
    assert.equal(caps.executionBlocked, false);
    assert.equal(caps.decoupledFromEngines, true);

    assert.ok(started.message?.includes("ExecutionConstraintRegistryPort"));
  });

  it("Execution Context permanece transporte; Constraint Registry só via Port", async () => {
    resetAllCanonicalExecutionIdSequences();
    const orchestrator = new MockCanonicalExecutionOrchestratorAdapter({
      createExecutionId: () => "canonical-exec-sprint11-transport",
      createResultId: () => "canonical-result-sprint11-transport",
      createTraceId: () => "canonical-trace-sprint11-transport",
      createCorrelationId: () => "canonical-corr-sprint11-transport",
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
      contextId: "canonical-exec-sprint11-transport",
    });
    assert.equal(context.ok, true);
    assert.equal(context.context?.capability.structuralTransportOnly, true);
    assert.equal(context.context?.state.processingPerformed, false);

    assert.equal(
      (context.context as { executionConstraintRegistry?: unknown } | undefined)
        ?.executionConstraintRegistry,
      undefined,
    );

    const constraintCaps = orchestrator.getExecutionConstraintRegistryPort().capabilities();
    assert.equal(constraintCaps.structuralConstraintRegistryOnly, true);
    assert.equal(constraintCaps.decoupledFromEngines, true);
    assert.equal(constraintCaps.constraintValidationImplemented, false);
  });

  it("módulos EPC-24 anteriores permanecem independentes do Constraint Registry", async () => {
    const resolver: PipelineResolverPort = createPipelineResolverPort({ provider: "mock" });
    const stateMachine = createExecutionStateMachinePort({ provider: "mock" });
    const eventBus = createExecutionEventBusPort({ provider: "mock" });
    const registry = createExecutionRegistryPort({ provider: "mock" });
    const trace = createExecutionTracePort({ provider: "mock" });
    const capabilityRegistry = createExecutionCapabilityRegistryPort({ provider: "mock" });
    const dependencyRegistry = createExecutionDependencyRegistryPort({ provider: "mock" });
    const orchestrator = new MockCanonicalExecutionOrchestratorAdapter({
      pipelineResolver: resolver,
      executionStateMachine: stateMachine,
      executionEventBus: eventBus,
      executionRegistry: registry,
      executionTrace: trace,
      executionCapabilityRegistry: capabilityRegistry,
      executionDependencyRegistry: dependencyRegistry,
    });

    const started = await orchestrator.startExecution();
    assert.equal(started.ok, true);
    assert.equal(started.result?.enginesInvoked, false);

    assert.equal(
      (resolver as { getExecutionConstraintRegistryPort?: unknown }).getExecutionConstraintRegistryPort,
      undefined,
    );
    assert.equal(
      (stateMachine as { getExecutionConstraintRegistryPort?: unknown })
        .getExecutionConstraintRegistryPort,
      undefined,
    );
    assert.equal(
      (eventBus as { getExecutionConstraintRegistryPort?: unknown }).getExecutionConstraintRegistryPort,
      undefined,
    );
    assert.equal(
      (registry as { getExecutionConstraintRegistryPort?: unknown }).getExecutionConstraintRegistryPort,
      undefined,
    );
    assert.equal(
      (trace as { getExecutionConstraintRegistryPort?: unknown }).getExecutionConstraintRegistryPort,
      undefined,
    );
    assert.equal(
      (capabilityRegistry as { getExecutionConstraintRegistryPort?: unknown })
        .getExecutionConstraintRegistryPort,
      undefined,
    );
    assert.equal(
      (dependencyRegistry as { getExecutionConstraintRegistryPort?: unknown })
        .getExecutionConstraintRegistryPort,
      undefined,
    );
  });

  it("Factory do Orchestrator injeta ExecutionConstraintRegistryPort", async () => {
    const constraintRegistry = createExecutionConstraintRegistryPort({ provider: "test" });
    const factory = createCanonicalExecutionOrchestratorFactory({
      executionConstraintRegistry: constraintRegistry,
    });
    const port = factory.create({ provider: "mock" });
    assert.ok(
      (port as MockCanonicalExecutionOrchestratorAdapter).getExecutionConstraintRegistryPort,
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

  it("Default orchestrator health inclui Constraint Registry", async () => {
    const port = new DefaultCanonicalExecutionOrchestratorAdapter();
    const health = await port.health();
    assert.equal(health.ok, true);
  });
});
