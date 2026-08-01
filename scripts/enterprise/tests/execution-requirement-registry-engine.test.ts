#!/usr/bin/env node
/**
 * EPC-24 Sprint 12 — Execution Requirement Registry Foundation
 * Prova Application → ExecutionRequirementRegistryPort → Adapter → Store
 * sem tocar produto e sem invocar OCR / IA / Mapping / regras / banco / validação de requisitos.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_EXECUTION_REQUIREMENT_REGISTRY_ADAPTER_ID,
  DEFAULT_EXECUTION_REQUIREMENT_REGISTRY_STORE_ID,
  DefaultExecutionRequirementRegistryAdapter,
  DefaultExecutionRequirementRegistryStore,
  MOCK_EXECUTION_REQUIREMENT_REGISTRY_ADAPTER_ID,
  MockExecutionRequirementRegistryAdapter,
  STRUCTURAL_REQUIREMENT_REGISTRY_CAPABILITY,
  createExecutionRequirementRegistryFactory,
  createExecutionRequirementRegistryPort,
  getExecutionRequirementRegistryHealthSummary,
  resetAllExecutionRequirementRegistryIdSequences,
  type ExecutionRequirementRegistryPort,
} from "../../../src/lib/enterprise/execution-requirement-registry/index.ts";
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
import { createExecutionStateMachinePort } from "../../../src/lib/enterprise/execution-state-machine/index.ts";
import { createExecutionTracePort } from "../../../src/lib/enterprise/execution-trace/index.ts";
import {
  createPipelineResolverPort,
  type PipelineResolverPort,
} from "../../../src/lib/enterprise/pipeline-resolver/index.ts";

describe("EPC-24 ExecutionRequirementRegistryPort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy", async () => {
    const port: ExecutionRequirementRegistryPort = new MockExecutionRequirementRegistryAdapter({
      provider: "mock",
    });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.storedRegistryCount, 0);
    assert.equal(health.storedRequirementCount, 0);
    assert.equal(health.structuralHealth?.kind, "execution-requirement-health");
    assert.equal(health.structuralHealth?.persistenceImplemented, false);
    assert.equal(health.structuralHealth?.requirementValidationImplemented, false);
    assert.equal(health.structuralHealth?.ruleEngineInvoked, false);
    assert.equal(health.structuralHealth?.requirementsValidated, false);

    const caps = port.capabilities();
    assert.equal(caps.adapterId, "mock-in-memory");
    assert.equal(caps.supportsRegisterRequirement, true);
    assert.equal(caps.supportsGetRequirement, true);
    assert.equal(caps.supportsListRequirements, true);
    assert.equal(caps.supportsFindRequirements, true);
    assert.equal(caps.supportsHealth, true);
    assert.equal(caps.supportsCapabilities, true);
    assert.equal(caps.supportsStatistics, true);
    assert.equal(caps.structuralRequirementRegistryOnly, true);
    assert.equal(caps.persistenceImplemented, false);
    assert.equal(caps.databaseUsed, false);
    assert.equal(caps.enginesInvoked, false);
    assert.equal(caps.requirementValidationImplemented, false);
    assert.equal(caps.ruleEngineInvoked, false);
    assert.equal(caps.decisionEngineInvoked, false);
    assert.equal(caps.rulesApplied, false);
    assert.equal(caps.requirementsValidated, false);
    assert.equal(caps.implementsOcr, false);
    assert.equal(caps.implementsAi, false);
    assert.equal(caps.implementsRequirementValidation, false);
    assert.equal(caps.implementsExecutionBlocking, false);
    assert.equal(caps.implementsRuleExecution, false);
    assert.equal(caps.noDirectEngineCoupling, true);
    assert.equal(caps.decoupledFromEngines, true);
    assert.equal(caps.executionBlocked, false);
  });

  it("DefaultExecutionRequirementRegistryAdapter é o default da fundação", async () => {
    const port: ExecutionRequirementRegistryPort = new DefaultExecutionRequirementRegistryAdapter();
    assert.equal(port.providerId, "default");
    const caps = port.capabilities();
    assert.equal(caps.adapterId, DEFAULT_EXECUTION_REQUIREMENT_REGISTRY_ADAPTER_ID);
    assert.equal(caps.structuralRequirementRegistryOnly, true);
    assert.equal(caps.requirementValidationImplemented, false);

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "default");
  });

  it("test adapter é resolvido pelo provider", async () => {
    const port = createExecutionRequirementRegistryPort({ provider: "test" });
    assert.equal(port.providerId, "test");
    const health = await port.health();
    assert.equal(health.ok, true);
  });

  it("Default usa ping opcional sem I/O externo", async () => {
    const port = new DefaultExecutionRequirementRegistryAdapter({
      store: new DefaultExecutionRequirementRegistryStore(),
      ping: async () => ({
        ok: true,
        message: "execution-requirement-registry probe custom",
      }),
    });
    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.message, "execution-requirement-registry probe custom");
    assert.equal(typeof health.latencyMs, "number");
  });

  it("provider default resolve DefaultExecutionRequirementRegistryAdapter", () => {
    const defaultPort = createExecutionRequirementRegistryPort();
    assert.equal(defaultPort.providerId, "default");
  });

  it("Factory materializa adapters corretos", () => {
    const factory = createExecutionRequirementRegistryFactory();
    assert.equal(factory.create().providerId, "default");
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
  });

  it("PoC Application depende só do Port (inversão de dependência)", async () => {
    const port = createExecutionRequirementRegistryPort({ provider: "mock" });
    const summary = await getExecutionRequirementRegistryHealthSummary(port);

    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.provider, "mock");
    assert.equal(summary.capabilities.provider, "mock");
    assert.equal(summary.health.ok, true);
  });

  it("MOCK adapter id constante está estável", () => {
    assert.equal(MOCK_EXECUTION_REQUIREMENT_REGISTRY_ADAPTER_ID, "mock-in-memory");
    assert.equal(DEFAULT_EXECUTION_REQUIREMENT_REGISTRY_STORE_ID, "default-in-process");
  });
});

describe("EPC-24 Execution Requirement Registry — registro e modelos canônicos", () => {
  it("registerRequirement materializa Requirement, Registry, Definition, Category, Scope, Metadata", async () => {
    resetAllExecutionRequirementRegistryIdSequences();
    const port = new MockExecutionRequirementRegistryAdapter({
      createExecutionRequirementRegistryId: () => "execution-requirement-registry-fixed-1",
      createExecutionRequirementId: () => "execution-requirement-fixed-1",
      createDefinitionId: () => "definition-fixed-1",
      createScopeId: () => "scope-fixed-1",
      createCategoryId: () => "category-fixed-1",
      now: () => "2026-08-01T22:00:00.000Z",
    });

    const registered = await port.registerRequirement({
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
      key: "structural-platform-requirement",
      name: "Structural Platform Requirement",
      category: "governance",
      scope: "platform",
      tags: ["requirement", "foundation"],
      structuralNotes: "structural only",
    });

    assert.equal(registered.ok, true);
    assert.equal(registered.persistenceImplemented, false);
    assert.equal(registered.databaseUsed, false);
    assert.equal(registered.enginesInvoked, false);
    assert.equal(registered.requirementValidationImplemented, false);
    assert.equal(registered.ruleEngineInvoked, false);
    assert.equal(registered.requirementsValidated, false);

    assert.equal(registered.requirement?.kind, "execution-requirement");
    assert.equal(registered.requirement?.id, "execution-requirement-fixed-1");
    assert.equal(registered.requirement?.executionRequirementId, "execution-requirement-fixed-1");
    assert.equal(
      registered.requirement?.executionRequirementRegistryId,
      "execution-requirement-registry-fixed-1",
    );
    assert.equal(registered.requirement?.key, "structural-platform-requirement");
    assert.equal(registered.requirement?.requirementValidated, false);
    assert.equal(registered.requirement?.rulesApplied, false);
    assert.equal(registered.requirement?.requirementsValidated, false);

    assert.equal(registered.registry?.kind, "execution-requirement-registry");
    assert.equal(
      registered.registry?.executionRequirementRegistryId,
      "execution-requirement-registry-fixed-1",
    );
    assert.equal(registered.registry?.requirementCount, 1);
    assert.deepEqual(registered.registry?.requirementKeys, ["structural-platform-requirement"]);
    assert.equal(registered.registry?.requirementValidationImplemented, false);
    assert.equal(registered.registry?.ruleEngineInvoked, false);
    assert.equal(registered.registry?.requirementsValidated, false);

    assert.equal(registered.requirement?.definition.kind, "execution-requirement-definition");
    assert.equal(registered.requirement?.definition.id, "definition-fixed-1");
    assert.equal(registered.requirement?.definition.requirementsValidated, false);

    assert.equal(registered.requirement?.category.kind, "execution-requirement-category");
    assert.equal(registered.requirement?.category.id, "category-fixed-1");
    assert.equal(registered.requirement?.category.category, "governance");

    assert.equal(registered.requirement?.scope.kind, "execution-requirement-scope");
    assert.equal(registered.requirement?.scope.id, "scope-fixed-1");
    assert.equal(registered.requirement?.scope.scope, "platform");
    assert.equal(registered.requirement?.scope.evaluable, false);
    assert.equal(registered.requirement?.scope.declared, true);

    assert.equal(registered.requirement?.metadata.kind, "execution-requirement-metadata");
    assert.deepEqual(registered.requirement?.metadata.tags, ["requirement", "foundation"]);

    assert.equal(registered.requirement?.capability, STRUCTURAL_REQUIREMENT_REGISTRY_CAPABILITY);
  });

  it("getRequirement / listRequirements / findRequirements com filtros", async () => {
    resetAllExecutionRequirementRegistryIdSequences();
    const port = new MockExecutionRequirementRegistryAdapter({
      now: () => "2026-08-01T22:10:00.000Z",
    });

    await port.registerRequirement({
      executionId: "exec-filter",
      key: "requirement-a",
      name: "Requirement A",
      category: "governance",
      scope: "execution",
      tags: ["alpha"],
    });
    await port.registerRequirement({
      executionId: "exec-filter",
      key: "requirement-b",
      name: "Requirement B",
      category: "compliance",
      scope: "pipeline",
      tags: ["beta"],
    });

    const byKey = await port.getRequirement({ key: "requirement-a" });
    assert.equal(byKey.ok, true);
    assert.equal(byKey.requirement?.name, "Requirement A");

    const listed = await port.listRequirements({
      filter: {
        kind: "execution-requirement-filter",
        category: "compliance",
      },
    });
    assert.equal(listed.ok, true);
    assert.equal(listed.total, 1);
    assert.equal(listed.requirements?.[0]?.key, "requirement-b");

    const found = await port.findRequirements({
      filter: {
        kind: "execution-requirement-filter",
        tags: ["alpha"],
        scope: "execution",
      },
    });
    assert.equal(found.ok, true);
    assert.equal(found.requirements?.length, 1);
    assert.equal(found.requirement?.key, "requirement-a");
  });

  it("statistics e health estruturais", async () => {
    const port = new MockExecutionRequirementRegistryAdapter({
      now: () => "2026-08-01T22:20:00.000Z",
    });
    await port.registerRequirement({
      key: "stat-1",
      name: "Stat Requirement",
      category: "structural",
      scope: "global",
    });

    const stats = await port.statistics();
    assert.equal(stats.ok, true);
    assert.equal(stats.statistics?.kind, "execution-requirement-statistics");
    assert.equal(stats.statistics?.totalRegistries, 1);
    assert.equal(stats.statistics?.totalRequirements, 1);
    assert.equal(stats.statistics?.totalCategories, 1);
    assert.equal(stats.statistics?.totalScopes, 1);
    assert.equal(stats.statistics?.requirementValidationImplemented, false);
    assert.equal(stats.statistics?.ruleEngineInvoked, false);

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.storedRequirementCount, 1);
    assert.equal(health.structuralHealth?.indexReady, true);
  });

  it("Store / Factory com store compartilhado", async () => {
    const store = new DefaultExecutionRequirementRegistryStore();
    const factory = createExecutionRequirementRegistryFactory({ store });
    const port = factory.create({ provider: "mock" });
    await port.registerRequirement({ key: "shared-1", name: "Shared" });
    assert.equal(store.requirementCount(), 1);
    assert.equal(store.registryCount(), 1);

    const health = store.health();
    assert.equal(health.ok, true);
  });

  it("Mock unhealthy bloqueia operações", async () => {
    const port = new MockExecutionRequirementRegistryAdapter({
      healthy: false,
      message: "requirement registry offline",
    });
    const registered = await port.registerRequirement({ key: "x", name: "X" });
    assert.equal(registered.ok, false);
    assert.equal(registered.code, "unhealthy");

    const health = await port.health();
    assert.equal(health.ok, false);
  });

  it("rejeita chave duplicada no mesmo registry", async () => {
    const port = new MockExecutionRequirementRegistryAdapter();
    const first = await port.registerRequirement({
      executionId: "dup-exec",
      key: "dup-key",
      name: "First",
    });
    assert.equal(first.ok, true);

    const second = await port.registerRequirement({
      executionId: "dup-exec",
      key: "dup-key",
      name: "Second",
    });
    assert.equal(second.ok, false);
    assert.equal(second.code, "already_exists");
  });
});

describe("EPC-24 Sprint 12 — Orchestrator integra Execution Requirement Registry", () => {
  it("adapters expõem ExecutionRequirementRegistryPort e flags de capabilities", async () => {
    const mock = new MockCanonicalExecutionOrchestratorAdapter({ provider: "mock" });
    const def = new DefaultCanonicalExecutionOrchestratorAdapter();

    assert.ok(mock.getExecutionRequirementRegistryPort());
    assert.ok(def.getExecutionRequirementRegistryPort());

    const caps = mock.capabilities();
    assert.equal(caps.dependsOnExecutionRequirementRegistry, true);
    assert.equal(caps.usesExecutionRequirementRegistryStructurally, true);
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

  it("startExecution registra Requirement Registry, anexa ID e NÃO valida/verifica pré-condições", async () => {
    resetAllCanonicalExecutionIdSequences();
    resetAllExecutionRequirementRegistryIdSequences();

    const requirementRegistry = createExecutionRequirementRegistryPort({ provider: "mock" });
    const port = new MockCanonicalExecutionOrchestratorAdapter({
      createExecutionId: () => "canonical-exec-sprint12-1",
      createResultId: () => "canonical-result-sprint12-1",
      createTraceId: () => "canonical-trace-sprint12-1",
      createCorrelationId: () => "canonical-corr-sprint12-1",
      createStepId: (() => {
        let n = 0;
        return () => `canonical-step-sprint12-${++n}`;
      })(),
      executionRequirementRegistry: requirementRegistry,
      now: () => "2026-08-01T23:00:00.000Z",
    });

    const started = await port.startExecution({ intakeRef: "intake-sprint12" });
    assert.equal(started.ok, true);
    assert.ok(started.executionContext);
    assert.equal(started.executionContext?.state.phase, "finalized");
    assert.equal(started.executionContext?.state.status, "completed");
    assert.equal(started.result?.enginesInvoked, false);

    const requirementRef = started.executionContext?.references.find(
      (r) => r.name === "executionRequirementRegistryId",
    );
    assert.ok(requirementRef);
    assert.ok(requirementRef.value.length > 0);

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

    const historyEntry = started.executionContext?.history.find(
      (h) => h.event === "execution-requirement-registry-attached",
    );
    assert.ok(historyEntry);

    const requirementPort = port.getExecutionRequirementRegistryPort();
    const listed = await requirementPort.listRequirements({
      filter: {
        kind: "execution-requirement-filter",
        executionRequirementRegistryId: requirementRef.value,
      },
    });
    assert.equal(listed.ok, true);
    assert.ok((listed.total ?? 0) >= 1);
    assert.equal(listed.requirements?.[0]?.requirementValidated, false);
    assert.equal(listed.requirements?.[0]?.rulesApplied, false);
    assert.equal(listed.requirements?.[0]?.requirementsValidated, false);

    const caps = requirementPort.capabilities();
    assert.equal(caps.requirementValidationImplemented, false);
    assert.equal(caps.ruleEngineInvoked, false);
    assert.equal(caps.requirementsValidated, false);
    assert.equal(caps.implementsExecutionBlocking, false);
    assert.equal(caps.executionBlocked, false);
    assert.equal(caps.decoupledFromEngines, true);

    assert.ok(started.message?.includes("ExecutionRequirementRegistryPort"));
  });

  it("Execution Context permanece transporte; Requirement Registry só via Port", async () => {
    resetAllCanonicalExecutionIdSequences();
    const orchestrator = new MockCanonicalExecutionOrchestratorAdapter({
      createExecutionId: () => "canonical-exec-sprint12-transport",
      createResultId: () => "canonical-result-sprint12-transport",
      createTraceId: () => "canonical-trace-sprint12-transport",
      createCorrelationId: () => "canonical-corr-sprint12-transport",
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
      contextId: "canonical-exec-sprint12-transport",
    });
    assert.equal(context.ok, true);
    assert.equal(context.context?.capability.structuralTransportOnly, true);
    assert.equal(context.context?.state.processingPerformed, false);

    assert.equal(
      (context.context as { executionRequirementRegistry?: unknown } | undefined)
        ?.executionRequirementRegistry,
      undefined,
    );

    const requirementCaps = orchestrator.getExecutionRequirementRegistryPort().capabilities();
    assert.equal(requirementCaps.structuralRequirementRegistryOnly, true);
    assert.equal(requirementCaps.decoupledFromEngines, true);
    assert.equal(requirementCaps.requirementValidationImplemented, false);
  });

  it("módulos EPC-24 anteriores permanecem independentes do Requirement Registry", async () => {
    const resolver: PipelineResolverPort = createPipelineResolverPort({ provider: "mock" });
    const stateMachine = createExecutionStateMachinePort({ provider: "mock" });
    const eventBus = createExecutionEventBusPort({ provider: "mock" });
    const registry = createExecutionRegistryPort({ provider: "mock" });
    const trace = createExecutionTracePort({ provider: "mock" });
    const capabilityRegistry = createExecutionCapabilityRegistryPort({ provider: "mock" });
    const dependencyRegistry = createExecutionDependencyRegistryPort({ provider: "mock" });
    const policyRegistry = createExecutionPolicyRegistryPort({ provider: "mock" });
    const constraintRegistry = createExecutionConstraintRegistryPort({ provider: "mock" });
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
    ] as Array<{ getExecutionRequirementRegistryPort?: unknown }>;

    for (const mod of priorModules) {
      assert.equal(mod.getExecutionRequirementRegistryPort, undefined);
    }
  });

  it("Factory do Orchestrator injeta ExecutionRequirementRegistryPort", async () => {
    const requirementRegistry = createExecutionRequirementRegistryPort({ provider: "test" });
    const factory = createCanonicalExecutionOrchestratorFactory({
      executionRequirementRegistry: requirementRegistry,
    });
    const port = factory.create({ provider: "mock" });
    assert.ok(
      (port as MockCanonicalExecutionOrchestratorAdapter).getExecutionRequirementRegistryPort,
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

  it("Default orchestrator health inclui Requirement Registry", async () => {
    const port = new DefaultCanonicalExecutionOrchestratorAdapter();
    const health = await port.health();
    assert.equal(health.ok, true);
  });
});
