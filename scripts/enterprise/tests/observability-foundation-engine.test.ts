#!/usr/bin/env node
/**
 * INF-04 — Observability Foundation
 * Prova Application → ExecutionObservabilityPort → Adapter → Store
 * sem tocar produto e sem invocar OCR / IA / Mapping / regras / banco / logs / métricas / tracing.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  AI_OBSERVABILITY_FOUNDATION_CONSUMER_REFERENCE,
  AUDITORIA_OBSERVABILITY_FOUNDATION_CONSUMER_REFERENCE,
  DEFAULT_EXECUTION_OBSERVABILITY_ADAPTER_ID,
  DefaultExecutionObservabilityAdapter,
  ExecutionObservabilityProvider,
  IMPORTACAO_OBSERVABILITY_FOUNDATION_CONSUMER_REFERENCE,
  IN_MEMORY_EXECUTION_OBSERVABILITY_STORE_ID,
  InMemoryExecutionObservabilityStore,
  MOCK_EXECUTION_OBSERVABILITY_ADAPTER_ID,
  MockExecutionObservabilityAdapter,
  OCR_PIPELINE_OBSERVABILITY_FOUNDATION_CONSUMER_REFERENCE,
  RULE_ENGINE_OBSERVABILITY_FOUNDATION_CONSUMER_REFERENCE,
  STRUCTURAL_OBSERVABILITY_FOUNDATION_CAPABILITY,
  TISS_OBSERVABILITY_FOUNDATION_CONSUMER_REFERENCE,
  WORKFLOW_OBSERVABILITY_FOUNDATION_CONSUMER_REFERENCE,
  createExecutionObservabilityFactory,
  createExecutionObservabilityPort,
  getObservabilityFoundationHealthSummary,
  resetAllObservabilityFoundationIdSequences,
  type ExecutionObservabilityPort,
} from "../../../src/lib/enterprise/observability-foundation/index.ts";
import {
  createExecutionSchedulerPort,
  resetAllSchedulerFoundationIdSequences,
} from "../../../src/lib/enterprise/scheduler-foundation/index.ts";
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
import {
  createPipelineResolverPort,
  type PipelineResolverPort,
} from "../../../src/lib/enterprise/pipeline-resolver/index.ts";

describe("INF-04 ExecutionObservabilityPort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy", async () => {
    const port: ExecutionObservabilityPort = new MockExecutionObservabilityAdapter({
      provider: "mock",
    });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.storedObservationCount, 0);
    assert.equal(health.structuralHealth?.kind, "canonical-observation-health");
    assert.equal(health.structuralHealth?.persistenceImplemented, false);
    assert.equal(health.structuralHealth?.loggingPerformed, false);
    assert.equal(health.structuralHealth?.metricsCollected, false);
    assert.equal(health.structuralHealth?.tracingPerformed, false);
    assert.equal(health.structuralHealth?.eventsTransmitted, false);
    assert.equal(health.structuralHealth?.realObservabilityBackend, false);

    const caps = port.capabilities();
    assert.equal(caps.adapterId, "mock-in-memory");
    assert.equal(caps.supportsRegisterObservation, true);
    assert.equal(caps.supportsUnregisterObservation, true);
    assert.equal(caps.supportsGetObservation, true);
    assert.equal(caps.supportsListObservations, true);
    assert.equal(caps.supportsStatistics, true);
    assert.equal(caps.supportsHealth, true);
    assert.equal(caps.supportsCapabilities, true);
    assert.equal(caps.structuralObservabilityOnly, true);
    assert.equal(caps.persistenceImplemented, false);
    assert.equal(caps.databaseUsed, false);
    assert.equal(caps.enginesInvoked, false);
    assert.equal(caps.loggingPerformed, false);
    assert.equal(caps.metricsCollected, false);
    assert.equal(caps.tracingPerformed, false);
    assert.equal(caps.eventsTransmitted, false);
    assert.equal(caps.externalIntegrationUsed, false);
    assert.equal(caps.realObservabilityBackend, false);
    assert.equal(caps.implementsOcr, false);
    assert.equal(caps.implementsAi, false);
    assert.equal(caps.implementsTiss, false);
    assert.equal(caps.implementsOpenTelemetry, false);
    assert.equal(caps.implementsPrometheus, false);
    assert.equal(caps.implementsGrafana, false);
    assert.equal(caps.implementsAzureMonitor, false);
    assert.equal(caps.implementsCloudWatch, false);
    assert.equal(caps.implementsDatadog, false);
    assert.equal(caps.implementsElasticApm, false);
    assert.equal(caps.usesExecutionSchedulerPortOnly, true);
    assert.equal(caps.noDirectEngineCoupling, true);
    assert.equal(caps.decoupledFromEngines, true);
  });

  it("DefaultExecutionObservabilityAdapter é o default da fundação", async () => {
    const port: ExecutionObservabilityPort = new DefaultExecutionObservabilityAdapter();
    assert.equal(port.providerId, "default");
    const caps = port.capabilities();
    assert.equal(caps.adapterId, DEFAULT_EXECUTION_OBSERVABILITY_ADAPTER_ID);
    assert.equal(caps.structuralObservabilityOnly, true);
    assert.equal(caps.realObservabilityBackend, false);

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "default");
  });

  it("test adapter é resolvido pelo provider", async () => {
    const port = createExecutionObservabilityPort({ provider: "test" });
    assert.equal(port.providerId, "test");
    const health = await port.health();
    assert.equal(health.ok, true);
  });

  it("Default usa ping opcional sem I/O externo", async () => {
    const port = new DefaultExecutionObservabilityAdapter({
      store: new InMemoryExecutionObservabilityStore(),
      ping: async () => ({
        ok: true,
        message: "observability-foundation probe custom",
      }),
    });
    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.message, "observability-foundation probe custom");
    assert.equal(typeof health.latencyMs, "number");
  });

  it("provider default resolve DefaultExecutionObservabilityAdapter", () => {
    const defaultPort = createExecutionObservabilityPort();
    assert.equal(defaultPort.providerId, "default");
  });

  it("Factory materializa adapters corretos", () => {
    const factory = createExecutionObservabilityFactory();
    assert.equal(factory.create().providerId, "default");
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
  });

  it("ExecutionObservabilityProvider resolve adapters via Factory", () => {
    const provider = new ExecutionObservabilityProvider();
    assert.equal(provider.resolve().providerId, "default");
    assert.equal(provider.resolve({ provider: "mock" }).providerId, "mock");
  });

  it("PoC Application depende só do Port (inversão de dependência)", async () => {
    const port = createExecutionObservabilityPort({ provider: "mock" });
    const summary = await getObservabilityFoundationHealthSummary(port);

    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.provider, "mock");
    assert.equal(summary.capabilities.provider, "mock");
    assert.equal(summary.health.ok, true);
  });

  it("MOCK adapter id constante está estável", () => {
    assert.equal(MOCK_EXECUTION_OBSERVABILITY_ADAPTER_ID, "mock-in-memory");
    assert.equal(IN_MEMORY_EXECUTION_OBSERVABILITY_STORE_ID, "in-memory-execution-observability");
  });
});

describe("INF-04 Observability Foundation — modelos canônicos e store", () => {
  it("registerObservation materializa CanonicalObservation e modelos canônicos", async () => {
    resetAllObservabilityFoundationIdSequences();
    const port = new MockExecutionObservabilityAdapter({
      createExecutionObservabilityId: () => "execution-observability-fixed-1",
      now: () => "2026-08-01T22:00:00.000Z",
    });

    const resolved = await port.registerObservation({
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
      pipelineId: "pipe-1",
      key: "structural-execution-observability",
      name: "Structural Execution Observability",
      tags: ["observability-foundation", "foundation"],
      structuralNotes: "structural only",
    });

    assert.equal(resolved.ok, true);
    assert.equal(resolved.loggingPerformed, false);
    assert.equal(resolved.metricsCollected, false);
    assert.equal(resolved.tracingPerformed, false);
    assert.equal(resolved.eventsTransmitted, false);
    assert.equal(resolved.externalIntegrationUsed, false);
    assert.equal(resolved.processingPerformed, false);
    assert.equal(resolved.realObservabilityBackend, false);
    assert.equal(resolved.enginesInvoked, false);

    assert.equal(resolved.observation?.kind, "canonical-observation");
    assert.equal(resolved.observation?.id, "execution-observability-fixed-1");
    assert.equal(resolved.observation?.executionObservabilityId, "execution-observability-fixed-1");
    assert.equal(resolved.observation?.identity.kind, "canonical-observation-identity");
    assert.equal(resolved.observation?.metadata.kind, "canonical-observation-metadata");
    assert.equal(resolved.observation?.metadata.value, "registered-structural");
    assert.equal(resolved.observation?.configuration.kind, "canonical-observation-configuration");
    assert.equal(resolved.observation?.configuration.backendConnected, false);
    assert.equal(
      resolved.observation?.configuration.schedulerPortContract,
      "ExecutionSchedulerPort",
    );
    assert.equal(resolved.observation?.capability.kind, "canonical-observation-capabilities");
    assert.equal(resolved.observation?.capability, STRUCTURAL_OBSERVABILITY_FOUNDATION_CAPABILITY);
    assert.equal(resolved.observation?.executionSchedulerId, "execution-scheduler-1");
    assert.equal(resolved.observation?.loggingPerformed, false);
    assert.equal(resolved.observation?.realObservabilityBackend, false);
  });

  it("operações estruturais NÃO geram logs / métricas / tracing / transmissão", async () => {
    resetAllObservabilityFoundationIdSequences();
    const port = new DefaultExecutionObservabilityAdapter({
      createExecutionObservabilityId: () => "execution-observability-ops-1",
      now: () => "2026-08-01T22:10:00.000Z",
    });

    const registered = await port.registerObservation({ executionId: "exec-ops" });
    assert.equal(registered.ok, true);
    assert.equal(registered.loggingPerformed, false);
    assert.equal(registered.metricsCollected, false);
    assert.equal(registered.tracingPerformed, false);
    assert.equal(registered.eventsTransmitted, false);

    const got = await port.getObservation({
      executionObservabilityId: registered.observation!.executionObservabilityId,
      createIfMissing: false,
    });
    assert.equal(got.ok, true);
    assert.equal(got.loggingPerformed, false);
    assert.equal(got.metricsCollected, false);

    const listed = await port.listObservations({ executionId: "exec-ops" });
    assert.equal(listed.ok, true);
    assert.equal(listed.observations.length, 1);
    assert.equal(listed.tracingPerformed, false);
    assert.equal(listed.eventsTransmitted, false);

    const stats = await port.statistics();
    assert.equal(stats.ok, true);
    assert.equal(stats.statistics?.kind, "canonical-observation-statistics");
    assert.equal(stats.statistics?.loggingPerformed, false);
    assert.equal(stats.statistics?.metricsCollected, false);
    assert.equal(stats.statistics?.tracingPerformed, false);
    assert.equal(stats.statistics?.realObservabilityBackend, false);

    const unregistered = await port.unregisterObservation({
      executionObservabilityId: registered.observation!.executionObservabilityId,
    });
    assert.equal(unregistered.ok, true);
    assert.equal(unregistered.loggingPerformed, false);
    assert.equal(unregistered.externalIntegrationUsed, false);
  });

  it("InMemoryExecutionObservabilityStore é estrutural e sem persistência", () => {
    const store = new InMemoryExecutionObservabilityStore();
    assert.equal(store.storeId, IN_MEMORY_EXECUTION_OBSERVABILITY_STORE_ID);
    assert.equal(store.observationCount(), 0);
    const health = store.health();
    assert.equal(health.ok, true);
  });

  it("referências estruturais de consumidores NÃO utilizam Observability", () => {
    const consumers = [
      OCR_PIPELINE_OBSERVABILITY_FOUNDATION_CONSUMER_REFERENCE,
      AI_OBSERVABILITY_FOUNDATION_CONSUMER_REFERENCE,
      RULE_ENGINE_OBSERVABILITY_FOUNDATION_CONSUMER_REFERENCE,
      WORKFLOW_OBSERVABILITY_FOUNDATION_CONSUMER_REFERENCE,
      TISS_OBSERVABILITY_FOUNDATION_CONSUMER_REFERENCE,
      IMPORTACAO_OBSERVABILITY_FOUNDATION_CONSUMER_REFERENCE,
      AUDITORIA_OBSERVABILITY_FOUNDATION_CONSUMER_REFERENCE,
    ];

    for (const ref of consumers) {
      assert.equal(ref.portContract, "ExecutionObservabilityPort");
      assert.equal(ref.schedulerPortContract, "ExecutionSchedulerPort");
      assert.equal(ref.willUseObservabilityFoundationViaPort, true);
      assert.equal(ref.currentlyUsesObservability, false);
      assert.equal(ref.loggingPerformed, false);
      assert.equal(ref.metricsCollected, false);
      assert.equal(ref.tracingPerformed, false);
      assert.equal(ref.eventsTransmitted, false);
      assert.equal(ref.structuralReferenceOnly, true);
    }
  });
});

describe("INF-04 Observability Foundation — integração estrutural com Scheduler", () => {
  it("Observability utiliza exclusivamente ExecutionSchedulerPort", async () => {
    resetAllObservabilityFoundationIdSequences();
    resetAllSchedulerFoundationIdSequences();

    const schedulerPort = createExecutionSchedulerPort({ provider: "mock" });
    const schedule = await schedulerPort.registerSchedule({
      executionId: "exec-scheduler-link",
    });
    assert.equal(schedule.ok, true);

    const observabilityPort = new MockExecutionObservabilityAdapter({
      executionScheduler: schedulerPort,
      createExecutionObservabilityId: () => "execution-observability-link-1",
    });

    const registered = await observabilityPort.registerObservation({
      executionId: "exec-scheduler-link",
      executionSchedulerId: schedule.schedule!.executionSchedulerId,
    });
    assert.equal(registered.ok, true);
    assert.equal(
      registered.observation?.executionSchedulerId,
      schedule.schedule!.executionSchedulerId,
    );
    assert.equal(registered.loggingPerformed, false);
    assert.equal(registered.metricsCollected, false);
    assert.equal(registered.tracingPerformed, false);
    assert.equal(registered.eventsTransmitted, false);

    const gotSchedule = await schedulerPort.getSchedule({
      executionSchedulerId: schedule.schedule!.executionSchedulerId,
      createIfMissing: false,
    });
    assert.equal(gotSchedule.ok, true);
    assert.equal(gotSchedule.schedule?.status.value, "registered-structural");
    assert.equal(gotSchedule.schedule?.executionPerformed, false);
  });

  it("Observability NÃO acessa adapters/stores do Scheduler Foundation diretamente", () => {
    const observabilityPort = createExecutionObservabilityPort({
      provider: "mock",
    }) as MockExecutionObservabilityAdapter;
    const schedulerPort = observabilityPort.getExecutionSchedulerPort();
    assert.ok(schedulerPort);
    assert.equal(typeof schedulerPort.getSchedule, "function");
    assert.equal(typeof schedulerPort.registerSchedule, "function");
    assert.equal(observabilityPort.capabilities().usesExecutionSchedulerPortOnly, true);
    assert.equal((observabilityPort as { schedulerStore?: unknown }).schedulerStore, undefined);
  });
});

describe("INF-04 Observability Foundation — integração estrutural com Orchestrator", () => {
  it("Orchestrator anexa executionObservabilityId sem gerar logs/métricas/tracing", async () => {
    resetAllCanonicalExecutionIdSequences();
    resetAllObservabilityFoundationIdSequences();
    resetAllSchedulerFoundationIdSequences();

    const port = new MockCanonicalExecutionOrchestratorAdapter({
      createExecutionId: () => "canonical-exec-inf04",
      createResultId: () => "canonical-result-inf04",
      createTraceId: () => "canonical-trace-inf04",
      createCorrelationId: () => "canonical-corr-inf04",
      createStepId: (() => {
        let n = 0;
        return () => `canonical-step-inf04-${++n}`;
      })(),
      now: () => "2026-08-01T23:00:00.000Z",
    });

    const started = await port.startExecution({ intakeRef: "intake-inf04" });
    assert.equal(started.ok, true);
    assert.ok(started.executionContext);
    assert.equal(started.executionContext?.state.phase, "finalized");
    assert.equal(started.executionContext?.state.status, "completed");
    assert.equal(started.result?.enginesInvoked, false);

    const observabilityRef = started.executionContext?.references.find(
      (r) => r.name === "executionObservabilityId",
    );
    assert.ok(observabilityRef);
    assert.ok(observabilityRef.value.length > 0);

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
      (h) => h.event === "execution-observability-attached",
    );
    assert.ok(historyEntry);
    assert.equal(historyEntry.attributes?.loggingPerformed, false);
    assert.equal(historyEntry.attributes?.metricsCollected, false);
    assert.equal(historyEntry.attributes?.tracingPerformed, false);
    assert.equal(historyEntry.attributes?.eventsTransmitted, false);
    assert.equal(historyEntry.attributes?.externalIntegrationUsed, false);

    const observabilityPort = port.getExecutionObservabilityPort();
    const observation = await observabilityPort.getObservation({
      executionObservabilityId: observabilityRef.value,
      createIfMissing: false,
    });
    assert.equal(observation.ok, true);
    assert.equal(observation.observation?.loggingPerformed, false);
    assert.equal(observation.observation?.metricsCollected, false);
    assert.equal(observation.observation?.tracingPerformed, false);
    assert.equal(observation.observation?.eventsTransmitted, false);
    assert.equal(observation.observation?.metadata.value, "registered-structural");
    assert.equal(observation.observation?.executionSchedulerId, schedulerRef.value);

    const caps = observabilityPort.capabilities();
    assert.equal(caps.loggingPerformed, false);
    assert.equal(caps.metricsCollected, false);
    assert.equal(caps.tracingPerformed, false);
    assert.equal(caps.decoupledFromEngines, true);
    assert.equal(caps.usesExecutionSchedulerPortOnly, true);

    assert.ok(started.message?.includes("ExecutionObservabilityPort"));
    assert.ok(started.message?.includes("no logs/metrics/tracing/transmission"));
  });

  it("Orchestrator capabilities declaram dependência estrutural do Observability Foundation", () => {
    const port = new DefaultCanonicalExecutionOrchestratorAdapter();
    const caps = port.capabilities();
    assert.equal(caps.dependsOnExecutionObservability, true);
    assert.equal(caps.usesExecutionObservabilityStructurally, true);
    assert.equal(caps.dependsOnExecutionScheduler, true);
    assert.equal(caps.usesExecutionSchedulerStructurally, true);
    assert.equal(caps.dependsOnExecutionWorker, true);
    assert.equal(caps.dependsOnExecutionQueue, true);
    assert.equal(caps.implementsHttpWorkersQueues, false);
    assert.equal(caps.implementsOcr, false);
    assert.equal(caps.noDirectEngineCoupling, true);
  });

  it("Execution Context permanece transporte; Observability só via Port", async () => {
    resetAllCanonicalExecutionIdSequences();
    const orchestrator = new MockCanonicalExecutionOrchestratorAdapter({
      createExecutionId: () => "canonical-exec-inf04-transport",
      createResultId: () => "canonical-result-inf04-transport",
      createTraceId: () => "canonical-trace-inf04-transport",
      createCorrelationId: () => "canonical-corr-inf04-transport",
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
      contextId: "canonical-exec-inf04-transport",
    });
    assert.equal(context.ok, true);
    assert.equal(context.context?.capability.structuralTransportOnly, true);
    assert.equal(context.context?.state.processingPerformed, false);

    assert.equal(
      (context.context as { observability?: unknown } | undefined)?.observability,
      undefined,
    );

    const observabilityCaps = orchestrator.getExecutionObservabilityPort().capabilities();
    assert.equal(observabilityCaps.structuralObservabilityOnly, true);
    assert.equal(observabilityCaps.decoupledFromEngines, true);
    assert.equal(observabilityCaps.loggingPerformed, false);
    assert.equal(observabilityCaps.metricsCollected, false);
    assert.equal(observabilityCaps.tracingPerformed, false);
  });

  it("módulos anteriores permanecem independentes do Observability Foundation", async () => {
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
    ] as Array<{ getExecutionObservabilityPort?: unknown }>;

    for (const mod of priorModules) {
      assert.equal(mod.getExecutionObservabilityPort, undefined);
    }
  });

  it("Factory do Orchestrator injeta ExecutionObservabilityPort", async () => {
    const executionObservability = createExecutionObservabilityPort({ provider: "test" });
    const factory = createCanonicalExecutionOrchestratorFactory({
      executionObservability,
    });
    const port = factory.create({ provider: "mock" });
    assert.ok((port as MockCanonicalExecutionOrchestratorAdapter).getExecutionObservabilityPort);
    const started = await port.startExecution();
    assert.equal(started.ok, true);
  });

  it("Default orchestrator health inclui Observability Foundation", async () => {
    const port = new DefaultCanonicalExecutionOrchestratorAdapter();
    const health = await port.health();
    assert.equal(health.ok, true);
  });

  it("ausência de acoplamento direto com OCR / IA / Workflow / TISS", () => {
    const observabilityCaps = createExecutionObservabilityPort().capabilities();
    const orchCaps = new DefaultCanonicalExecutionOrchestratorAdapter().capabilities();
    assert.equal(observabilityCaps.implementsOcr, false);
    assert.equal(observabilityCaps.implementsAi, false);
    assert.equal(observabilityCaps.implementsTiss, false);
    assert.equal(observabilityCaps.decoupledFromEngines, true);
    assert.equal(orchCaps.implementsOcr, false);
    assert.equal(orchCaps.implementsAi, false);
    assert.equal(orchCaps.implementsTissRules, false);
    assert.equal(orchCaps.noDirectEngineCoupling, true);
  });

  it("ausência de integrações externas de observabilidade", () => {
    const caps = createExecutionObservabilityPort().capabilities();
    assert.equal(caps.implementsOpenTelemetry, false);
    assert.equal(caps.implementsPrometheus, false);
    assert.equal(caps.implementsGrafana, false);
    assert.equal(caps.implementsAzureMonitor, false);
    assert.equal(caps.implementsCloudWatch, false);
    assert.equal(caps.implementsDatadog, false);
    assert.equal(caps.implementsElasticApm, false);
    assert.equal(caps.externalIntegrationUsed, false);
    assert.equal(caps.eventsTransmitted, false);
    assert.equal(caps.realObservabilityBackend, false);
  });
});
