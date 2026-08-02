#!/usr/bin/env node
/**
 * INF-05 — Health Center Foundation
 * Prova Application → ExecutionHealthCenterPort → Adapter → Store
 * sem tocar produto e sem invocar OCR / IA / Mapping / regras / banco / monitoramento.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_EXECUTION_HEALTH_CENTER_ADAPTER_ID,
  DefaultExecutionHealthCenterAdapter,
  ExecutionHealthCenterProvider,
  IN_MEMORY_EXECUTION_HEALTH_CENTER_STORE_ID,
  InMemoryExecutionHealthCenterStore,
  MOCK_EXECUTION_HEALTH_CENTER_ADAPTER_ID,
  MockExecutionHealthCenterAdapter,
  STRUCTURAL_HEALTH_CENTER_FOUNDATION_CAPABILITY,
  STRUCTURAL_MONITORABLE_COMPONENT_CATALOG,
  createExecutionHealthCenterFactory,
  createExecutionHealthCenterPort,
  getHealthCenterFoundationHealthSummary,
  resetAllHealthCenterFoundationIdSequences,
  type ExecutionHealthCenterPort,
} from "../../../src/lib/enterprise/health-center-foundation/index.ts";
import {
  createExecutionObservabilityPort,
  resetAllObservabilityFoundationIdSequences,
} from "../../../src/lib/enterprise/observability-foundation/index.ts";
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
import { createExecutionEnvironmentRegistryPort } from "../../../src/lib/enterprise/execution-environment-registry/index.ts";
import { createExecutionEventBusPort } from "../../../src/lib/enterprise/execution-event-bus/index.ts";
import { createExecutionPolicyRegistryPort } from "../../../src/lib/enterprise/execution-policy-registry/index.ts";
import { createExecutionRegistryPort } from "../../../src/lib/enterprise/execution-registry/index.ts";
import { createExecutionRequirementRegistryPort } from "../../../src/lib/enterprise/execution-requirement-registry/index.ts";
import { createExecutionResourceRegistryPort } from "../../../src/lib/enterprise/execution-resource-registry/index.ts";
import { createExecutionStateMachinePort } from "../../../src/lib/enterprise/execution-state-machine/index.ts";
import { createExecutionTracePort } from "../../../src/lib/enterprise/execution-trace/index.ts";
import { createExecutionQueuePort } from "../../../src/lib/enterprise/message-queue/index.ts";
import { createExecutionWorkerPort } from "../../../src/lib/enterprise/worker-foundation/index.ts";
import { createExecutionSchedulerPort } from "../../../src/lib/enterprise/scheduler-foundation/index.ts";
import {
  createPipelineResolverPort,
  type PipelineResolverPort,
} from "../../../src/lib/enterprise/pipeline-resolver/index.ts";

describe("INF-05 ExecutionHealthCenterPort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy", async () => {
    const port: ExecutionHealthCenterPort = new MockExecutionHealthCenterAdapter({
      provider: "mock",
    });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.storedComponentCount, 0);
    assert.equal(health.structuralHealth?.kind, "canonical-health-component-health");
    assert.equal(health.structuralHealth?.persistenceImplemented, false);
    assert.equal(health.structuralHealth?.monitoringPerformed, false);
    assert.equal(health.structuralHealth?.healthCheckPerformed, false);
    assert.equal(health.structuralHealth?.externalQueryPerformed, false);
    assert.equal(health.structuralHealth?.realHealthBackend, false);

    const caps = port.capabilities();
    assert.equal(caps.adapterId, "mock-in-memory");
    assert.equal(caps.supportsRegisterComponent, true);
    assert.equal(caps.supportsUnregisterComponent, true);
    assert.equal(caps.supportsGetComponent, true);
    assert.equal(caps.supportsListComponents, true);
    assert.equal(caps.supportsStatistics, true);
    assert.equal(caps.supportsHealth, true);
    assert.equal(caps.supportsCapabilities, true);
    assert.equal(caps.structuralHealthCenterOnly, true);
    assert.equal(caps.persistenceImplemented, false);
    assert.equal(caps.databaseUsed, false);
    assert.equal(caps.enginesInvoked, false);
    assert.equal(caps.monitoringPerformed, false);
    assert.equal(caps.healthCheckPerformed, false);
    assert.equal(caps.probingPerformed, false);
    assert.equal(caps.diagnosticsExecuted, false);
    assert.equal(caps.pollingPerformed, false);
    assert.equal(caps.dashboardRendered, false);
    assert.equal(caps.externalQueryPerformed, false);
    assert.equal(caps.componentConsulted, false);
    assert.equal(caps.externalIntegrationUsed, false);
    assert.equal(caps.realHealthBackend, false);
    assert.equal(caps.implementsOcr, false);
    assert.equal(caps.implementsAi, false);
    assert.equal(caps.implementsTiss, false);
    assert.equal(caps.implementsRealMonitoring, false);
    assert.equal(caps.implementsRealHealthChecks, false);
    assert.equal(caps.usesExecutionObservabilityPortOnly, true);
    assert.equal(caps.noDirectEngineCoupling, true);
    assert.equal(caps.decoupledFromEngines, true);
  });

  it("DefaultExecutionHealthCenterAdapter é o default da fundação", async () => {
    const port: ExecutionHealthCenterPort = new DefaultExecutionHealthCenterAdapter();
    assert.equal(port.providerId, "default");
    const caps = port.capabilities();
    assert.equal(caps.adapterId, DEFAULT_EXECUTION_HEALTH_CENTER_ADAPTER_ID);
    assert.equal(caps.structuralHealthCenterOnly, true);
    assert.equal(caps.realHealthBackend, false);

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "default");
  });

  it("test adapter é resolvido pelo provider", async () => {
    const port = createExecutionHealthCenterPort({ provider: "test" });
    assert.equal(port.providerId, "test");
    const health = await port.health();
    assert.equal(health.ok, true);
  });

  it("Default usa ping opcional sem I/O externo", async () => {
    const port = new DefaultExecutionHealthCenterAdapter({
      store: new InMemoryExecutionHealthCenterStore(),
      ping: async () => ({
        ok: true,
        message: "health-center-foundation probe custom",
      }),
    });
    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.message, "health-center-foundation probe custom");
    assert.equal(typeof health.latencyMs, "number");
  });

  it("provider default resolve DefaultExecutionHealthCenterAdapter", () => {
    const defaultPort = createExecutionHealthCenterPort();
    assert.equal(defaultPort.providerId, "default");
  });

  it("Factory materializa adapters corretos", () => {
    const factory = createExecutionHealthCenterFactory();
    assert.equal(factory.create().providerId, "default");
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
  });

  it("ExecutionHealthCenterProvider resolve adapters via Factory", () => {
    const provider = new ExecutionHealthCenterProvider();
    assert.equal(provider.resolve().providerId, "default");
    assert.equal(provider.resolve({ provider: "mock" }).providerId, "mock");
  });

  it("PoC Application depende só do Port (inversão de dependência)", async () => {
    const port = createExecutionHealthCenterPort({ provider: "mock" });
    const summary = await getHealthCenterFoundationHealthSummary(port);

    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.provider, "mock");
    assert.equal(summary.capabilities.provider, "mock");
    assert.equal(summary.health.ok, true);
  });

  it("MOCK adapter id constante está estável", () => {
    assert.equal(MOCK_EXECUTION_HEALTH_CENTER_ADAPTER_ID, "mock-in-memory");
    assert.equal(IN_MEMORY_EXECUTION_HEALTH_CENTER_STORE_ID, "in-memory-execution-health-center");
  });
});

describe("INF-05 Health Center Foundation — modelos canônicos e store", () => {
  it("registerComponent materializa CanonicalHealthComponent e modelos canônicos", async () => {
    resetAllHealthCenterFoundationIdSequences();
    const port = new MockExecutionHealthCenterAdapter({
      createExecutionHealthCenterId: () => "execution-health-center-fixed-1",
      createHealthComponentId: () => "health-component-fixed-1",
      now: () => "2026-08-01T22:00:00.000Z",
    });

    const resolved = await port.registerComponent({
      executionId: "exec-1",
      correlationId: "corr-1",
      contextId: "ctx-1",
      stateMachineId: "sm-1",
      eventBusId: "bus-1",
      executionRegistryId: "reg-1",
      executionTraceId: "trace-1",
      executionCapabilityRegistryId: "cap-reg-1",
      executionDependencyRegistryId: "dep-reg-1",
      executionEnvironmentRegistryId: "env-reg-1",
      executionMessageQueueId: "execution-message-queue-1",
      executionWorkerId: "execution-worker-1",
      executionSchedulerId: "execution-scheduler-1",
      executionObservabilityId: "execution-observability-1",
      pipelineId: "pipe-1",
      key: "message-queue",
      name: "Message Queue",
      tags: ["health-center-foundation", "foundation"],
      structuralNotes: "structural only",
    });

    assert.equal(resolved.ok, true);
    assert.equal(resolved.monitoringPerformed, false);
    assert.equal(resolved.healthCheckPerformed, false);
    assert.equal(resolved.probingPerformed, false);
    assert.equal(resolved.diagnosticsExecuted, false);
    assert.equal(resolved.pollingPerformed, false);
    assert.equal(resolved.dashboardRendered, false);
    assert.equal(resolved.externalQueryPerformed, false);
    assert.equal(resolved.componentConsulted, false);
    assert.equal(resolved.externalIntegrationUsed, false);
    assert.equal(resolved.processingPerformed, false);
    assert.equal(resolved.realHealthBackend, false);
    assert.equal(resolved.enginesInvoked, false);

    assert.equal(resolved.component?.kind, "canonical-health-component");
    assert.equal(resolved.component?.id, "health-component-fixed-1");
    assert.equal(resolved.component?.healthComponentId, "health-component-fixed-1");
    assert.equal(resolved.component?.executionHealthCenterId, "execution-health-center-fixed-1");
    assert.equal(resolved.component?.identity.kind, "canonical-health-component-identity");
    assert.equal(resolved.component?.status.kind, "canonical-health-component-status");
    assert.equal(resolved.component?.status.value, "registered-structural");
    assert.equal(resolved.component?.configuration.kind, "canonical-health-component-configuration");
    assert.equal(resolved.component?.configuration.backendConnected, false);
    assert.equal(
      resolved.component?.configuration.observabilityPortContract,
      "ExecutionObservabilityPort",
    );
    assert.equal(resolved.component?.capability.kind, "canonical-health-component-capabilities");
    assert.equal(resolved.component?.capability, STRUCTURAL_HEALTH_CENTER_FOUNDATION_CAPABILITY);
    assert.equal(resolved.component?.executionObservabilityId, "execution-observability-1");
    assert.equal(resolved.component?.monitoringPerformed, false);
    assert.equal(resolved.component?.realHealthBackend, false);
  });

  it("operações estruturais NÃO geram monitoramento / health checks / consultas", async () => {
    resetAllHealthCenterFoundationIdSequences();
    const port = new DefaultExecutionHealthCenterAdapter({
      createExecutionHealthCenterId: () => "execution-health-center-ops-1",
      createHealthComponentId: () => "health-component-ops-1",
      now: () => "2026-08-01T22:10:00.000Z",
    });

    const registered = await port.registerComponent({
      executionId: "exec-ops",
      key: "ocr",
      name: "OCR",
    });
    assert.equal(registered.ok, true);
    assert.equal(registered.monitoringPerformed, false);
    assert.equal(registered.healthCheckPerformed, false);
    assert.equal(registered.externalQueryPerformed, false);
    assert.equal(registered.componentConsulted, false);

    const got = await port.getComponent({
      healthComponentId: registered.component!.healthComponentId,
      createIfMissing: false,
    });
    assert.equal(got.ok, true);
    assert.equal(got.monitoringPerformed, false);
    assert.equal(got.healthCheckPerformed, false);

    const listed = await port.listComponents({ executionId: "exec-ops" });
    assert.equal(listed.ok, true);
    assert.equal(listed.components.length, 1);
    assert.equal(listed.pollingPerformed, false);
    assert.equal(listed.dashboardRendered, false);

    const stats = await port.statistics();
    assert.equal(stats.ok, true);
    assert.equal(stats.statistics?.kind, "canonical-health-component-statistics");
    assert.equal(stats.statistics?.monitoringPerformed, false);
    assert.equal(stats.statistics?.healthCheckPerformed, false);
    assert.equal(stats.statistics?.realHealthBackend, false);

    const unregistered = await port.unregisterComponent({
      healthComponentId: registered.component!.healthComponentId,
    });
    assert.equal(unregistered.ok, true);
    assert.equal(unregistered.monitoringPerformed, false);
    assert.equal(unregistered.externalIntegrationUsed, false);
  });

  it("InMemoryExecutionHealthCenterStore é estrutural e sem persistência", () => {
    const store = new InMemoryExecutionHealthCenterStore();
    assert.equal(store.storeId, IN_MEMORY_EXECUTION_HEALTH_CENTER_STORE_ID);
    assert.equal(store.componentCount(), 0);
    const health = store.health();
    assert.equal(health.ok, true);
  });

  it("catálogo estrutural declara 12 componentes monitoráveis futuros", () => {
    assert.equal(STRUCTURAL_MONITORABLE_COMPONENT_CATALOG.length, 12);
    const keys = STRUCTURAL_MONITORABLE_COMPONENT_CATALOG.map((c) => c.key);
    assert.ok(keys.includes("message-queue"));
    assert.ok(keys.includes("worker-foundation"));
    assert.ok(keys.includes("scheduler-foundation"));
    assert.ok(keys.includes("observability-foundation"));
    assert.ok(keys.includes("ocr"));
    assert.ok(keys.includes("ia"));
    assert.ok(keys.includes("rule-engine"));
    assert.ok(keys.includes("workflow"));
    assert.ok(keys.includes("tiss"));
    assert.ok(keys.includes("storage"));
    assert.ok(keys.includes("database"));
    assert.ok(keys.includes("importacao"));
  });
});

describe("INF-05 Health Center Foundation — integração estrutural com Observability", () => {
  it("Health Center utiliza exclusivamente ExecutionObservabilityPort", async () => {
    resetAllHealthCenterFoundationIdSequences();
    resetAllObservabilityFoundationIdSequences();

    const observabilityPort = createExecutionObservabilityPort({ provider: "mock" });
    const observation = await observabilityPort.registerObservation({
      executionId: "exec-observability-link",
    });
    assert.equal(observation.ok, true);

    const healthCenterPort = new MockExecutionHealthCenterAdapter({
      executionObservability: observabilityPort,
      createExecutionHealthCenterId: () => "execution-health-center-link-1",
      createHealthComponentId: () => "health-component-link-1",
    });

    const registered = await healthCenterPort.registerComponent({
      executionId: "exec-observability-link",
      executionObservabilityId: observation.observation!.executionObservabilityId,
      key: "observability-foundation",
      name: "Observability Foundation",
    });
    assert.equal(registered.ok, true);
    assert.equal(
      registered.component?.executionObservabilityId,
      observation.observation!.executionObservabilityId,
    );
    assert.equal(registered.monitoringPerformed, false);
    assert.equal(registered.healthCheckPerformed, false);
    assert.equal(registered.externalQueryPerformed, false);
    assert.equal(registered.componentConsulted, false);
  });

  it("Health Center NÃO acessa adapters/stores do Observability Foundation diretamente", () => {
    const healthCenterPort = createExecutionHealthCenterPort({
      provider: "mock",
    }) as MockExecutionHealthCenterAdapter;
    const observabilityPort = healthCenterPort.getExecutionObservabilityPort();
    assert.ok(observabilityPort);
    assert.equal(typeof observabilityPort.getObservation, "function");
    assert.equal(typeof observabilityPort.registerObservation, "function");
    assert.equal(healthCenterPort.capabilities().usesExecutionObservabilityPortOnly, true);
    assert.equal(
      (healthCenterPort as { observabilityStore?: unknown }).observabilityStore,
      undefined,
    );
  });

  it("Health Center NÃO consulta observations via ExecutionObservabilityPort", async () => {
    resetAllHealthCenterFoundationIdSequences();
    const observabilityPort = createExecutionObservabilityPort({ provider: "mock" });
    let getObservationCalls = 0;
    const originalGetObservation = observabilityPort.getObservation.bind(observabilityPort);
    observabilityPort.getObservation = async (input) => {
      getObservationCalls += 1;
      return originalGetObservation(input);
    };

    const healthCenterPort = new MockExecutionHealthCenterAdapter({
      executionObservability: observabilityPort,
      createExecutionHealthCenterId: () => "execution-health-center-no-query-1",
      createHealthComponentId: () => "health-component-no-query-1",
    });

    await healthCenterPort.registerComponent({
      executionId: "exec-no-query",
      executionObservabilityId: "opaque-observability-id",
      key: "storage",
      name: "Storage",
    });
    await healthCenterPort.listComponents({ executionId: "exec-no-query" });
    await healthCenterPort.statistics();

    assert.equal(getObservationCalls, 0);
  });
});

describe("INF-05 Health Center Foundation — integração estrutural com Orchestrator", () => {
  it("Orchestrator anexa executionHealthCenterId sem monitoramento/health checks", async () => {
    resetAllCanonicalExecutionIdSequences();
    resetAllHealthCenterFoundationIdSequences();
    resetAllObservabilityFoundationIdSequences();

    const port = new MockCanonicalExecutionOrchestratorAdapter({
      createExecutionId: () => "canonical-exec-inf05",
      createResultId: () => "canonical-result-inf05",
      createTraceId: () => "canonical-trace-inf05",
      createCorrelationId: () => "canonical-corr-inf05",
      createStepId: (() => {
        let n = 0;
        return () => `canonical-step-inf05-${++n}`;
      })(),
      now: () => "2026-08-01T23:00:00.000Z",
    });

    const started = await port.startExecution({ intakeRef: "intake-inf05" });
    assert.equal(started.ok, true);
    assert.ok(started.executionContext);
    assert.equal(started.executionContext?.state.phase, "finalized");
    assert.equal(started.executionContext?.state.status, "completed");
    assert.equal(started.result?.enginesInvoked, false);

    const healthCenterRef = started.executionContext?.references.find(
      (r) => r.name === "executionHealthCenterId",
    );
    assert.ok(healthCenterRef);
    assert.ok(healthCenterRef.value.length > 0);

    const observabilityRef = started.executionContext?.references.find(
      (r) => r.name === "executionObservabilityId",
    );
    assert.ok(observabilityRef);

    const schedulerRef = started.executionContext?.references.find(
      (r) => r.name === "executionSchedulerId",
    );
    assert.ok(schedulerRef);

    const workerRef = started.executionContext?.references.find(
      (r) => r.name === "executionWorkerId",
    );
    assert.ok(workerRef);

    const queueRef = started.executionContext?.references.find(
      (r) => r.name === "executionMessageQueueId",
    );
    assert.ok(queueRef);

    const historyEntry = started.executionContext?.history.find(
      (h) => h.event === "execution-health-center-attached",
    );
    assert.ok(historyEntry);
    assert.equal(historyEntry.attributes?.monitoringPerformed, false);
    assert.equal(historyEntry.attributes?.healthCheckPerformed, false);
    assert.equal(historyEntry.attributes?.probingPerformed, false);
    assert.equal(historyEntry.attributes?.diagnosticsExecuted, false);
    assert.equal(historyEntry.attributes?.pollingPerformed, false);
    assert.equal(historyEntry.attributes?.dashboardRendered, false);
    assert.equal(historyEntry.attributes?.externalQueryPerformed, false);
    assert.equal(historyEntry.attributes?.componentConsulted, false);

    const healthCenterPort = port.getExecutionHealthCenterPort();
    const components = await healthCenterPort.listComponents({
      executionHealthCenterId: healthCenterRef.value,
    });
    assert.equal(components.ok, true);
    assert.equal(components.components.length, 12);
    assert.equal(components.monitoringPerformed, false);
    assert.equal(components.healthCheckPerformed, false);

    for (const component of components.components) {
      assert.equal(component.executionHealthCenterId, healthCenterRef.value);
      assert.equal(component.executionObservabilityId, observabilityRef.value);
      assert.equal(component.monitoringPerformed, false);
      assert.equal(component.healthCheckPerformed, false);
      assert.equal(component.status.value, "registered-structural");
    }

    const caps = healthCenterPort.capabilities();
    assert.equal(caps.monitoringPerformed, false);
    assert.equal(caps.healthCheckPerformed, false);
    assert.equal(caps.decoupledFromEngines, true);
    assert.equal(caps.usesExecutionObservabilityPortOnly, true);

    assert.ok(started.message?.includes("ExecutionHealthCenterPort"));
    assert.ok(started.message?.includes("no monitoring/health-checks/queries"));
  });

  it("Orchestrator capabilities declaram dependência estrutural do Health Center Foundation", () => {
    const port = new DefaultCanonicalExecutionOrchestratorAdapter();
    const caps = port.capabilities();
    assert.equal(caps.dependsOnExecutionHealthCenter, true);
    assert.equal(caps.usesExecutionHealthCenterStructurally, true);
    assert.equal(caps.dependsOnExecutionObservability, true);
    assert.equal(caps.usesExecutionObservabilityStructurally, true);
    assert.equal(caps.dependsOnExecutionScheduler, true);
    assert.equal(caps.dependsOnExecutionWorker, true);
    assert.equal(caps.dependsOnExecutionQueue, true);
    assert.equal(caps.implementsHttpWorkersQueues, false);
    assert.equal(caps.implementsOcr, false);
    assert.equal(caps.noDirectEngineCoupling, true);
  });

  it("Execution Context permanece transporte; Health Center só via Port", async () => {
    resetAllCanonicalExecutionIdSequences();
    const orchestrator = new MockCanonicalExecutionOrchestratorAdapter({
      createExecutionId: () => "canonical-exec-inf05-transport",
      createResultId: () => "canonical-result-inf05-transport",
      createTraceId: () => "canonical-trace-inf05-transport",
      createCorrelationId: () => "canonical-corr-inf05-transport",
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
      contextId: "canonical-exec-inf05-transport",
    });
    assert.equal(context.ok, true);
    assert.equal(context.context?.capability.structuralTransportOnly, true);
    assert.equal(context.context?.state.processingPerformed, false);

    assert.equal(
      (context.context as { healthCenter?: unknown } | undefined)?.healthCenter,
      undefined,
    );

    const healthCenterCaps = orchestrator.getExecutionHealthCenterPort().capabilities();
    assert.equal(healthCenterCaps.structuralHealthCenterOnly, true);
    assert.equal(healthCenterCaps.decoupledFromEngines, true);
    assert.equal(healthCenterCaps.monitoringPerformed, false);
    assert.equal(healthCenterCaps.healthCheckPerformed, false);
  });

  it("módulos anteriores permanecem independentes do Health Center Foundation", async () => {
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
    const environmentRegistry = createExecutionEnvironmentRegistryPort({ provider: "mock" });
    const messageQueue = createExecutionQueuePort({ provider: "mock" });
    const worker = createExecutionWorkerPort({ provider: "mock" });
    const scheduler = createExecutionSchedulerPort({ provider: "mock" });
    const observability = createExecutionObservabilityPort({ provider: "mock" });
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
      executionEnvironmentRegistry: environmentRegistry,
      executionQueue: messageQueue,
      executionWorker: worker,
      executionScheduler: scheduler,
      executionObservability: observability,
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
      environmentRegistry,
      messageQueue,
      worker,
      scheduler,
      observability,
    ] as Array<{ getExecutionHealthCenterPort?: unknown }>;

    for (const mod of priorModules) {
      assert.equal(mod.getExecutionHealthCenterPort, undefined);
    }
  });

  it("Factory do Orchestrator injeta ExecutionHealthCenterPort", async () => {
    const executionHealthCenter = createExecutionHealthCenterPort({ provider: "test" });
    const factory = createCanonicalExecutionOrchestratorFactory({
      executionHealthCenter,
    });
    const port = factory.create({ provider: "mock" });
    assert.ok(
      (port as MockCanonicalExecutionOrchestratorAdapter).getExecutionHealthCenterPort,
    );
    const started = await port.startExecution();
    assert.equal(started.ok, true);
  });

  it("Default orchestrator health inclui Health Center Foundation", async () => {
    const port = new DefaultCanonicalExecutionOrchestratorAdapter();
    const health = await port.health();
    assert.equal(health.ok, true);
  });

  it("ausência de acoplamento direto com OCR / IA / Workflow / TISS", () => {
    const healthCenterCaps = createExecutionHealthCenterPort().capabilities();
    const orchCaps = new DefaultCanonicalExecutionOrchestratorAdapter().capabilities();
    assert.equal(healthCenterCaps.implementsOcr, false);
    assert.equal(healthCenterCaps.implementsAi, false);
    assert.equal(healthCenterCaps.implementsTiss, false);
    assert.equal(healthCenterCaps.decoupledFromEngines, true);
    assert.equal(orchCaps.implementsOcr, false);
    assert.equal(orchCaps.implementsAi, false);
    assert.equal(orchCaps.implementsTissRules, false);
    assert.equal(orchCaps.noDirectEngineCoupling, true);
  });

  it("ausência de monitoramento real / health checks / polling / dashboards", () => {
    const caps = createExecutionHealthCenterPort().capabilities();
    assert.equal(caps.implementsRealMonitoring, false);
    assert.equal(caps.implementsRealHealthChecks, false);
    assert.equal(caps.monitoringPerformed, false);
    assert.equal(caps.healthCheckPerformed, false);
    assert.equal(caps.probingPerformed, false);
    assert.equal(caps.diagnosticsExecuted, false);
    assert.equal(caps.pollingPerformed, false);
    assert.equal(caps.dashboardRendered, false);
    assert.equal(caps.externalQueryPerformed, false);
    assert.equal(caps.componentConsulted, false);
    assert.equal(caps.externalIntegrationUsed, false);
    assert.equal(caps.realHealthBackend, false);
    assert.equal(caps.processingPerformed, false);
  });
});
