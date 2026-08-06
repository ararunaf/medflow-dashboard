#!/usr/bin/env node
/**
 * EPC-24 Sprint 10 — Execution Policy Registry Foundation
 * Prova Application → ExecutionPolicyRegistryPort → Adapter → Store
 * sem tocar produto e sem invocar OCR / IA / Mapping / regras / banco / avaliação.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_EXECUTION_POLICY_REGISTRY_ADAPTER_ID,
  DEFAULT_EXECUTION_POLICY_REGISTRY_STORE_ID,
  DefaultExecutionPolicyRegistryAdapter,
  DefaultExecutionPolicyRegistryStore,
  MOCK_EXECUTION_POLICY_REGISTRY_ADAPTER_ID,
  MockExecutionPolicyRegistryAdapter,
  STRUCTURAL_POLICY_REGISTRY_CAPABILITY,
  createExecutionPolicyRegistryFactory,
  createExecutionPolicyRegistryPort,
  getExecutionPolicyRegistryHealthSummary,
  resetAllExecutionPolicyRegistryIdSequences,
  type ExecutionPolicyRegistryPort,
} from "../../../src/lib/enterprise/execution-policy-registry/index.ts";
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

describe("EPC-24 ExecutionPolicyRegistryPort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy", async () => {
    const port: ExecutionPolicyRegistryPort = new MockExecutionPolicyRegistryAdapter({
      provider: "mock",
    });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.storedRegistryCount, 0);
    assert.equal(health.storedPolicyCount, 0);
    assert.equal(health.structuralHealth?.kind, "execution-policy-health");
    assert.equal(health.structuralHealth?.persistenceImplemented, false);
    assert.equal(health.structuralHealth?.policyInterpretationImplemented, false);
    assert.equal(health.structuralHealth?.ruleEngineInvoked, false);
    assert.equal(health.structuralHealth?.policiesEvaluated, false);

    const caps = port.capabilities();
    assert.equal(caps.adapterId, "mock-in-memory");
    assert.equal(caps.supportsRegisterPolicy, true);
    assert.equal(caps.supportsGetPolicy, true);
    assert.equal(caps.supportsListPolicies, true);
    assert.equal(caps.supportsFindPolicies, true);
    assert.equal(caps.supportsHealth, true);
    assert.equal(caps.supportsCapabilities, true);
    assert.equal(caps.supportsStatistics, true);
    assert.equal(caps.structuralPolicyRegistryOnly, true);
    assert.equal(caps.persistenceImplemented, false);
    assert.equal(caps.databaseUsed, false);
    assert.equal(caps.enginesInvoked, false);
    assert.equal(caps.policyInterpretationImplemented, false);
    assert.equal(caps.ruleEngineInvoked, false);
    assert.equal(caps.decisionEngineInvoked, false);
    assert.equal(caps.rulesApplied, false);
    assert.equal(caps.policiesEvaluated, false);
    assert.equal(caps.implementsOcr, false);
    assert.equal(caps.implementsAi, false);
    assert.equal(caps.implementsPolicyEvaluation, false);
    assert.equal(caps.implementsRuleExecution, false);
    assert.equal(caps.noDirectEngineCoupling, true);
    assert.equal(caps.decoupledFromEngines, true);
  });

  it("DefaultExecutionPolicyRegistryAdapter é o default da fundação", async () => {
    const port: ExecutionPolicyRegistryPort = new DefaultExecutionPolicyRegistryAdapter();
    assert.equal(port.providerId, "default");
    const caps = port.capabilities();
    assert.equal(caps.adapterId, DEFAULT_EXECUTION_POLICY_REGISTRY_ADAPTER_ID);
    assert.equal(caps.structuralPolicyRegistryOnly, true);
    assert.equal(caps.policyInterpretationImplemented, false);

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "default");
  });

  it("test adapter é resolvido pelo provider", async () => {
    const port = createExecutionPolicyRegistryPort({ provider: "test" });
    assert.equal(port.providerId, "test");
    const health = await port.health();
    assert.equal(health.ok, true);
  });

  it("Default usa ping opcional sem I/O externo", async () => {
    const port = new DefaultExecutionPolicyRegistryAdapter({
      store: new DefaultExecutionPolicyRegistryStore(),
      ping: async () => ({
        ok: true,
        message: "execution-policy-registry probe custom",
      }),
    });
    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.message, "execution-policy-registry probe custom");
    assert.equal(typeof health.latencyMs, "number");
  });

  it("provider default resolve DefaultExecutionPolicyRegistryAdapter", () => {
    const defaultPort = createExecutionPolicyRegistryPort();
    assert.equal(defaultPort.providerId, "default");
  });

  it("Factory materializa adapters corretos", () => {
    const factory = createExecutionPolicyRegistryFactory();
    assert.equal(factory.create().providerId, "default");
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
  });

  it("PoC Application depende só do Port (inversão de dependência)", async () => {
    const port = createExecutionPolicyRegistryPort({ provider: "mock" });
    const summary = await getExecutionPolicyRegistryHealthSummary(port);

    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.provider, "mock");
    assert.equal(summary.capabilities.provider, "mock");
    assert.equal(summary.health.ok, true);
  });

  it("MOCK adapter id constante está estável", () => {
    assert.equal(MOCK_EXECUTION_POLICY_REGISTRY_ADAPTER_ID, "mock-in-memory");
    assert.equal(DEFAULT_EXECUTION_POLICY_REGISTRY_STORE_ID, "default-in-process");
  });
});

describe("EPC-24 Execution Policy Registry — registro e modelos canônicos", () => {
  it("registerPolicy materializa Policy, Registry, Definition, Category, Scope, Metadata", async () => {
    resetAllExecutionPolicyRegistryIdSequences();
    const port = new MockExecutionPolicyRegistryAdapter({
      createExecutionPolicyRegistryId: () => "execution-policy-registry-fixed-1",
      createExecutionPolicyId: () => "execution-policy-fixed-1",
      createDefinitionId: () => "definition-fixed-1",
      createScopeId: () => "scope-fixed-1",
      createCategoryId: () => "category-fixed-1",
      now: () => "2026-08-01T22:00:00.000Z",
    });

    const registered = await port.registerPolicy({
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
      key: "structural-platform-policy",
      name: "Structural Platform Policy",
      category: "governance",
      scope: "platform",
      tags: ["policy", "foundation"],
      structuralNotes: "structural only",
    });

    assert.equal(registered.ok, true);
    assert.equal(registered.persistenceImplemented, false);
    assert.equal(registered.databaseUsed, false);
    assert.equal(registered.enginesInvoked, false);
    assert.equal(registered.policyInterpretationImplemented, false);
    assert.equal(registered.ruleEngineInvoked, false);
    assert.equal(registered.policiesEvaluated, false);

    assert.equal(registered.policy?.kind, "execution-policy");
    assert.equal(registered.policy?.id, "execution-policy-fixed-1");
    assert.equal(registered.policy?.executionPolicyId, "execution-policy-fixed-1");
    assert.equal(registered.policy?.executionPolicyRegistryId, "execution-policy-registry-fixed-1");
    assert.equal(registered.policy?.key, "structural-platform-policy");
    assert.equal(registered.policy?.policyInterpreted, false);
    assert.equal(registered.policy?.rulesApplied, false);
    assert.equal(registered.policy?.policiesEvaluated, false);

    assert.equal(registered.registry?.kind, "execution-policy-registry");
    assert.equal(
      registered.registry?.executionPolicyRegistryId,
      "execution-policy-registry-fixed-1",
    );
    assert.equal(registered.registry?.policyCount, 1);
    assert.deepEqual(registered.registry?.policyKeys, ["structural-platform-policy"]);
    assert.equal(registered.registry?.policyInterpretationImplemented, false);
    assert.equal(registered.registry?.ruleEngineInvoked, false);
    assert.equal(registered.registry?.policiesEvaluated, false);

    assert.equal(registered.policy?.definition.kind, "execution-policy-definition");
    assert.equal(registered.policy?.definition.id, "definition-fixed-1");
    assert.equal(registered.policy?.definition.policiesEvaluated, false);

    assert.equal(registered.policy?.category.kind, "execution-policy-category");
    assert.equal(registered.policy?.category.id, "category-fixed-1");
    assert.equal(registered.policy?.category.category, "governance");

    assert.equal(registered.policy?.scope.kind, "execution-policy-scope");
    assert.equal(registered.policy?.scope.id, "scope-fixed-1");
    assert.equal(registered.policy?.scope.scope, "platform");
    assert.equal(registered.policy?.scope.evaluable, false);
    assert.equal(registered.policy?.scope.declared, true);

    assert.equal(registered.policy?.metadata.kind, "execution-policy-metadata");
    assert.deepEqual(registered.policy?.metadata.tags, ["policy", "foundation"]);

    assert.equal(registered.policy?.capability, STRUCTURAL_POLICY_REGISTRY_CAPABILITY);
  });

  it("getPolicy / listPolicies / findPolicies com filtros", async () => {
    resetAllExecutionPolicyRegistryIdSequences();
    const port = new MockExecutionPolicyRegistryAdapter({
      now: () => "2026-08-01T22:10:00.000Z",
    });

    await port.registerPolicy({
      executionId: "exec-filter",
      key: "policy-a",
      name: "Policy A",
      category: "governance",
      scope: "execution",
      tags: ["alpha"],
    });
    await port.registerPolicy({
      executionId: "exec-filter",
      key: "policy-b",
      name: "Policy B",
      category: "compliance",
      scope: "pipeline",
      tags: ["beta"],
    });

    const byKey = await port.getPolicy({ key: "policy-a" });
    assert.equal(byKey.ok, true);
    assert.equal(byKey.policy?.name, "Policy A");

    const listed = await port.listPolicies({
      filter: {
        kind: "execution-policy-filter",
        category: "compliance",
      },
    });
    assert.equal(listed.ok, true);
    assert.equal(listed.total, 1);
    assert.equal(listed.policies?.[0]?.key, "policy-b");

    const found = await port.findPolicies({
      filter: {
        kind: "execution-policy-filter",
        tags: ["alpha"],
        scope: "execution",
      },
    });
    assert.equal(found.ok, true);
    assert.equal(found.policies?.length, 1);
    assert.equal(found.policy?.key, "policy-a");
  });

  it("statistics e health estruturais", async () => {
    const port = new MockExecutionPolicyRegistryAdapter({
      now: () => "2026-08-01T22:20:00.000Z",
    });
    await port.registerPolicy({
      key: "stat-1",
      name: "Stat Policy",
      category: "structural",
      scope: "global",
    });

    const stats = await port.statistics();
    assert.equal(stats.ok, true);
    assert.equal(stats.statistics?.kind, "execution-policy-statistics");
    assert.equal(stats.statistics?.totalRegistries, 1);
    assert.equal(stats.statistics?.totalPolicies, 1);
    assert.equal(stats.statistics?.totalCategories, 1);
    assert.equal(stats.statistics?.totalScopes, 1);
    assert.equal(stats.statistics?.policyInterpretationImplemented, false);
    assert.equal(stats.statistics?.ruleEngineInvoked, false);

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.storedPolicyCount, 1);
    assert.equal(health.structuralHealth?.indexReady, true);
  });

  it("Store / Factory com store compartilhado", async () => {
    const store = new DefaultExecutionPolicyRegistryStore();
    const factory = createExecutionPolicyRegistryFactory({ store });
    const port = factory.create({ provider: "mock" });
    await port.registerPolicy({ key: "shared-1", name: "Shared" });
    assert.equal(store.policyCount(), 1);
    assert.equal(store.registryCount(), 1);

    const health = store.health();
    assert.equal(health.ok, true);
  });

  it("Mock unhealthy bloqueia operações", async () => {
    const port = new MockExecutionPolicyRegistryAdapter({
      healthy: false,
      message: "policy registry offline",
    });
    const registered = await port.registerPolicy({ key: "x", name: "X" });
    assert.equal(registered.ok, false);
    assert.equal(registered.code, "unhealthy");

    const health = await port.health();
    assert.equal(health.ok, false);
  });

  it("rejeita chave duplicada no mesmo registry", async () => {
    const port = new MockExecutionPolicyRegistryAdapter();
    const first = await port.registerPolicy({
      executionId: "dup-exec",
      key: "dup-key",
      name: "First",
    });
    assert.equal(first.ok, true);

    const second = await port.registerPolicy({
      executionId: "dup-exec",
      key: "dup-key",
      name: "Second",
    });
    assert.equal(second.ok, false);
    assert.equal(second.code, "already_exists");
  });
});

describe("EPC-24 Sprint 10 — Orchestrator integra Execution Policy Registry", () => {
  it("adapters expõem ExecutionPolicyRegistryPort e flags de capabilities", async () => {
    const mock = new MockCanonicalExecutionOrchestratorAdapter({ provider: "mock" });
    const def = new DefaultCanonicalExecutionOrchestratorAdapter();

    assert.ok(mock.getExecutionPolicyRegistryPort());
    assert.ok(def.getExecutionPolicyRegistryPort());

    const caps = mock.capabilities();
    assert.equal(caps.dependsOnExecutionPolicyRegistry, true);
    assert.equal(caps.usesExecutionPolicyRegistryStructurally, true);
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

  it("startExecution registra Policy Registry, anexa ID e NÃO interpreta/avalia", async () => {
    resetAllCanonicalExecutionIdSequences();
    resetAllExecutionPolicyRegistryIdSequences();

    const policyRegistry = createExecutionPolicyRegistryPort({ provider: "mock" });
    const port = new MockCanonicalExecutionOrchestratorAdapter({
      createExecutionId: () => "canonical-exec-sprint10-1",
      createResultId: () => "canonical-result-sprint10-1",
      createTraceId: () => "canonical-trace-sprint10-1",
      createCorrelationId: () => "canonical-corr-sprint10-1",
      createStepId: (() => {
        let n = 0;
        return () => `canonical-step-sprint10-${++n}`;
      })(),
      executionPolicyRegistry: policyRegistry,
      now: () => "2026-08-01T23:00:00.000Z",
    });

    const started = await port.startExecution({ intakeRef: "intake-sprint10" });
    assert.equal(started.ok, true);
    assert.ok(started.executionContext);
    assert.equal(started.executionContext?.state.phase, "finalized");
    assert.equal(started.executionContext?.state.status, "completed");
    assert.equal(started.result?.enginesInvoked, false);

    const policyRef = started.executionContext?.references.find(
      (r) => r.name === "executionPolicyRegistryId",
    );
    assert.ok(policyRef);
    assert.ok(policyRef.value.length > 0);

    const dependencyRef = started.executionContext?.references.find(
      (r) => r.name === "executionDependencyRegistryId",
    );
    assert.ok(dependencyRef);

    const capabilityRef = started.executionContext?.references.find(
      (r) => r.name === "executionCapabilityRegistryId",
    );
    assert.ok(capabilityRef);

    const historyEntry = started.executionContext?.history.find(
      (h) => h.event === "execution-policy-registry-attached",
    );
    assert.ok(historyEntry);

    const policyPort = port.getExecutionPolicyRegistryPort();
    const listed = await policyPort.listPolicies({
      filter: {
        kind: "execution-policy-filter",
        executionPolicyRegistryId: policyRef.value,
      },
    });
    assert.equal(listed.ok, true);
    assert.ok((listed.total ?? 0) >= 1);
    assert.equal(listed.policies?.[0]?.policyInterpreted, false);
    assert.equal(listed.policies?.[0]?.rulesApplied, false);
    assert.equal(listed.policies?.[0]?.policiesEvaluated, false);

    const caps = policyPort.capabilities();
    assert.equal(caps.policyInterpretationImplemented, false);
    assert.equal(caps.ruleEngineInvoked, false);
    assert.equal(caps.policiesEvaluated, false);
    assert.equal(caps.decoupledFromEngines, true);

    assert.ok(started.message?.includes("ExecutionPolicyRegistryPort"));
  });

  it("Execution Context permanece transporte; Policy Registry só via Port", async () => {
    resetAllCanonicalExecutionIdSequences();
    const orchestrator = new MockCanonicalExecutionOrchestratorAdapter({
      createExecutionId: () => "canonical-exec-sprint10-transport",
      createResultId: () => "canonical-result-sprint10-transport",
      createTraceId: () => "canonical-trace-sprint10-transport",
      createCorrelationId: () => "canonical-corr-sprint10-transport",
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
      contextId: "canonical-exec-sprint10-transport",
    });
    assert.equal(context.ok, true);
    assert.equal(context.context?.capability.structuralTransportOnly, true);
    assert.equal(context.context?.state.processingPerformed, false);

    assert.equal(
      (context.context as { executionPolicyRegistry?: unknown } | undefined)
        ?.executionPolicyRegistry,
      undefined,
    );

    const policyCaps = orchestrator.getExecutionPolicyRegistryPort().capabilities();
    assert.equal(policyCaps.structuralPolicyRegistryOnly, true);
    assert.equal(policyCaps.decoupledFromEngines, true);
    assert.equal(policyCaps.policyInterpretationImplemented, false);
  });

  it("módulos EPC-24 anteriores permanecem independentes do Policy Registry", async () => {
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
      (resolver as { getExecutionPolicyRegistryPort?: unknown }).getExecutionPolicyRegistryPort,
      undefined,
    );
    assert.equal(
      (stateMachine as { getExecutionPolicyRegistryPort?: unknown }).getExecutionPolicyRegistryPort,
      undefined,
    );
    assert.equal(
      (eventBus as { getExecutionPolicyRegistryPort?: unknown }).getExecutionPolicyRegistryPort,
      undefined,
    );
    assert.equal(
      (registry as { getExecutionPolicyRegistryPort?: unknown }).getExecutionPolicyRegistryPort,
      undefined,
    );
    assert.equal(
      (trace as { getExecutionPolicyRegistryPort?: unknown }).getExecutionPolicyRegistryPort,
      undefined,
    );
    assert.equal(
      (capabilityRegistry as { getExecutionPolicyRegistryPort?: unknown })
        .getExecutionPolicyRegistryPort,
      undefined,
    );
    assert.equal(
      (dependencyRegistry as { getExecutionPolicyRegistryPort?: unknown })
        .getExecutionPolicyRegistryPort,
      undefined,
    );
  });

  it("Factory do Orchestrator injeta ExecutionPolicyRegistryPort", async () => {
    const policyRegistry = createExecutionPolicyRegistryPort({ provider: "test" });
    const factory = createCanonicalExecutionOrchestratorFactory({
      executionPolicyRegistry: policyRegistry,
    });
    const port = factory.create({ provider: "mock" });
    assert.ok((port as MockCanonicalExecutionOrchestratorAdapter).getExecutionPolicyRegistryPort);
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

  it("Default orchestrator health inclui Policy Registry", async () => {
    const port = new DefaultCanonicalExecutionOrchestratorAdapter();
    const health = await port.health();
    assert.equal(health.ok, true);
  });
});
