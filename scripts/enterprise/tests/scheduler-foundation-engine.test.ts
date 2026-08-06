#!/usr/bin/env node
/**
 * INF-03 — Scheduler Foundation
 * Prova Application → ExecutionSchedulerPort → Adapter → Store
 * sem tocar produto e sem invocar OCR / IA / Mapping / regras / banco / cron / execução.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  AI_SCHEDULER_FOUNDATION_CONSUMER_REFERENCE,
  DEFAULT_EXECUTION_SCHEDULER_ADAPTER_ID,
  DefaultExecutionSchedulerAdapter,
  ExecutionSchedulerProvider,
  IN_MEMORY_EXECUTION_SCHEDULER_STORE_ID,
  InMemoryExecutionSchedulerStore,
  MOCK_EXECUTION_SCHEDULER_ADAPTER_ID,
  MockExecutionSchedulerAdapter,
  OCR_PIPELINE_SCHEDULER_FOUNDATION_CONSUMER_REFERENCE,
  STRUCTURAL_SCHEDULER_FOUNDATION_CAPABILITY,
  TISS_SCHEDULER_FOUNDATION_CONSUMER_REFERENCE,
  createExecutionSchedulerFactory,
  createExecutionSchedulerPort,
  getSchedulerFoundationHealthSummary,
  resetAllSchedulerFoundationIdSequences,
  type ExecutionSchedulerPort,
} from "../../../src/lib/enterprise/scheduler-foundation/index.ts";
import {
  createExecutionWorkerPort,
  resetAllWorkerFoundationIdSequences,
} from "../../../src/lib/enterprise/worker-foundation/index.ts";
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
import {
  createPipelineResolverPort,
  type PipelineResolverPort,
} from "../../../src/lib/enterprise/pipeline-resolver/index.ts";

describe("INF-03 ExecutionSchedulerPort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy", async () => {
    const port: ExecutionSchedulerPort = new MockExecutionSchedulerAdapter({
      provider: "mock",
    });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.storedScheduleCount, 0);
    assert.equal(health.structuralHealth?.kind, "canonical-schedule-health");
    assert.equal(health.structuralHealth?.persistenceImplemented, false);
    assert.equal(health.structuralHealth?.executionPerformed, false);
    assert.equal(health.structuralHealth?.scheduleExecuted, false);
    assert.equal(health.structuralHealth?.cronUsed, false);
    assert.equal(health.structuralHealth?.timersUsed, false);
    assert.equal(health.structuralHealth?.realSchedulerBackend, false);

    const caps = port.capabilities();
    assert.equal(caps.adapterId, "mock-in-memory");
    assert.equal(caps.supportsRegisterSchedule, true);
    assert.equal(caps.supportsUnregisterSchedule, true);
    assert.equal(caps.supportsEnableSchedule, true);
    assert.equal(caps.supportsDisableSchedule, true);
    assert.equal(caps.supportsPauseSchedule, true);
    assert.equal(caps.supportsResumeSchedule, true);
    assert.equal(caps.supportsGetSchedule, true);
    assert.equal(caps.supportsListSchedules, true);
    assert.equal(caps.supportsStatistics, true);
    assert.equal(caps.supportsHealth, true);
    assert.equal(caps.supportsCapabilities, true);
    assert.equal(caps.structuralSchedulerOnly, true);
    assert.equal(caps.persistenceImplemented, false);
    assert.equal(caps.databaseUsed, false);
    assert.equal(caps.enginesInvoked, false);
    assert.equal(caps.executionPerformed, false);
    assert.equal(caps.scheduleExecuted, false);
    assert.equal(caps.cronUsed, false);
    assert.equal(caps.timersUsed, false);
    assert.equal(caps.jobsDispatched, false);
    assert.equal(caps.workersStarted, false);
    assert.equal(caps.realSchedulerBackend, false);
    assert.equal(caps.implementsOcr, false);
    assert.equal(caps.implementsAi, false);
    assert.equal(caps.implementsTiss, false);
    assert.equal(caps.implementsNodeCron, false);
    assert.equal(caps.implementsBullMqScheduler, false);
    assert.equal(caps.implementsQuartz, false);
    assert.equal(caps.implementsHangfire, false);
    assert.equal(caps.implementsAzureScheduler, false);
    assert.equal(caps.implementsCloudflareCron, false);
    assert.equal(caps.implementsKubernetesCronJobs, false);
    assert.equal(caps.implementsSetInterval, false);
    assert.equal(caps.implementsSetTimeout, false);
    assert.equal(caps.usesExecutionWorkerPortOnly, true);
    assert.equal(caps.noDirectEngineCoupling, true);
    assert.equal(caps.decoupledFromEngines, true);
  });

  it("DefaultExecutionSchedulerAdapter é o default da fundação", async () => {
    const port: ExecutionSchedulerPort = new DefaultExecutionSchedulerAdapter();
    assert.equal(port.providerId, "default");
    const caps = port.capabilities();
    assert.equal(caps.adapterId, DEFAULT_EXECUTION_SCHEDULER_ADAPTER_ID);
    assert.equal(caps.structuralSchedulerOnly, true);
    assert.equal(caps.realSchedulerBackend, false);

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "default");
  });

  it("test adapter é resolvido pelo provider", async () => {
    const port = createExecutionSchedulerPort({ provider: "test" });
    assert.equal(port.providerId, "test");
    const health = await port.health();
    assert.equal(health.ok, true);
  });

  it("Default usa ping opcional sem I/O externo", async () => {
    const port = new DefaultExecutionSchedulerAdapter({
      store: new InMemoryExecutionSchedulerStore(),
      ping: async () => ({
        ok: true,
        message: "scheduler-foundation probe custom",
      }),
    });
    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.message, "scheduler-foundation probe custom");
    assert.equal(typeof health.latencyMs, "number");
  });

  it("provider default resolve DefaultExecutionSchedulerAdapter", () => {
    const defaultPort = createExecutionSchedulerPort();
    assert.equal(defaultPort.providerId, "default");
  });

  it("Factory materializa adapters corretos", () => {
    const factory = createExecutionSchedulerFactory();
    assert.equal(factory.create().providerId, "default");
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
  });

  it("ExecutionSchedulerProvider resolve adapters via Factory", () => {
    const provider = new ExecutionSchedulerProvider();
    assert.equal(provider.resolve().providerId, "default");
    assert.equal(provider.resolve({ provider: "mock" }).providerId, "mock");
  });

  it("PoC Application depende só do Port (inversão de dependência)", async () => {
    const port = createExecutionSchedulerPort({ provider: "mock" });
    const summary = await getSchedulerFoundationHealthSummary(port);

    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.provider, "mock");
    assert.equal(summary.capabilities.provider, "mock");
    assert.equal(summary.health.ok, true);
  });

  it("MOCK adapter id constante está estável", () => {
    assert.equal(MOCK_EXECUTION_SCHEDULER_ADAPTER_ID, "mock-in-memory");
    assert.equal(IN_MEMORY_EXECUTION_SCHEDULER_STORE_ID, "in-memory-execution-scheduler");
  });
});

describe("INF-03 Scheduler Foundation — modelos canônicos e store", () => {
  it("registerSchedule materializa CanonicalSchedule e modelos canônicos", async () => {
    resetAllSchedulerFoundationIdSequences();
    const port = new MockExecutionSchedulerAdapter({
      createExecutionSchedulerId: () => "execution-scheduler-fixed-1",
      now: () => "2026-08-01T22:00:00.000Z",
    });

    const resolved = await port.registerSchedule({
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
      pipelineId: "pipe-1",
      key: "structural-execution-scheduler",
      name: "Structural Execution Scheduler",
      tags: ["scheduler-foundation", "foundation"],
      structuralNotes: "structural only",
    });

    assert.equal(resolved.ok, true);
    assert.equal(resolved.executionPerformed, false);
    assert.equal(resolved.scheduleExecuted, false);
    assert.equal(resolved.cronUsed, false);
    assert.equal(resolved.timersUsed, false);
    assert.equal(resolved.jobsDispatched, false);
    assert.equal(resolved.workersStarted, false);
    assert.equal(resolved.processingPerformed, false);
    assert.equal(resolved.realSchedulerBackend, false);
    assert.equal(resolved.enginesInvoked, false);

    assert.equal(resolved.schedule?.kind, "canonical-schedule");
    assert.equal(resolved.schedule?.id, "execution-scheduler-fixed-1");
    assert.equal(resolved.schedule?.executionSchedulerId, "execution-scheduler-fixed-1");
    assert.equal(resolved.schedule?.identity.kind, "canonical-schedule-identity");
    assert.equal(resolved.schedule?.status.kind, "canonical-schedule-status");
    assert.equal(resolved.schedule?.status.value, "registered-structural");
    assert.equal(resolved.schedule?.configuration.kind, "canonical-schedule-configuration");
    assert.equal(resolved.schedule?.configuration.backendConnected, false);
    assert.equal(resolved.schedule?.configuration.workerPortContract, "ExecutionWorkerPort");
    assert.equal(resolved.schedule?.capability.kind, "canonical-schedule-capabilities");
    assert.equal(resolved.schedule?.capability, STRUCTURAL_SCHEDULER_FOUNDATION_CAPABILITY);
    assert.equal(resolved.schedule?.executionWorkerId, "execution-worker-1");
    assert.equal(resolved.schedule?.executionPerformed, false);
    assert.equal(resolved.schedule?.realSchedulerBackend, false);
  });

  it("operações estruturais NÃO executam / NÃO usam cron / NÃO criam timers", async () => {
    resetAllSchedulerFoundationIdSequences();
    const port = new DefaultExecutionSchedulerAdapter({
      createExecutionSchedulerId: () => "execution-scheduler-ops-1",
      now: () => "2026-08-01T22:10:00.000Z",
    });

    const registered = await port.registerSchedule({ executionId: "exec-ops" });
    assert.equal(registered.ok, true);
    assert.equal(registered.executionPerformed, false);
    assert.equal(registered.cronUsed, false);

    const enabled = await port.enableSchedule({
      executionSchedulerId: registered.schedule!.executionSchedulerId,
    });
    assert.equal(enabled.ok, true);
    assert.equal(enabled.executionPerformed, false);
    assert.equal(enabled.scheduleExecuted, false);
    assert.equal(enabled.cronUsed, false);
    assert.equal(enabled.timersUsed, false);
    assert.equal(enabled.jobsDispatched, false);
    assert.equal(enabled.schedule?.status.value, "enabled-structural");

    const paused = await port.pauseSchedule({
      executionSchedulerId: registered.schedule!.executionSchedulerId,
    });
    assert.equal(paused.ok, true);
    assert.equal(paused.executionPerformed, false);
    assert.equal(paused.schedule?.status.value, "paused-structural");

    const resumed = await port.resumeSchedule({
      executionSchedulerId: registered.schedule!.executionSchedulerId,
    });
    assert.equal(resumed.ok, true);
    assert.equal(resumed.timersUsed, false);
    assert.equal(resumed.schedule?.status.value, "resumed-structural");

    const disabled = await port.disableSchedule({
      executionSchedulerId: registered.schedule!.executionSchedulerId,
    });
    assert.equal(disabled.ok, true);
    assert.equal(disabled.jobsDispatched, false);
    assert.equal(disabled.schedule?.status.value, "disabled-structural");

    const got = await port.getSchedule({
      executionSchedulerId: registered.schedule!.executionSchedulerId,
      createIfMissing: false,
    });
    assert.equal(got.ok, true);
    assert.equal(got.executionPerformed, false);

    const listed = await port.listSchedules({ executionId: "exec-ops" });
    assert.equal(listed.ok, true);
    assert.equal(listed.schedules.length, 1);
    assert.equal(listed.cronUsed, false);

    const stats = await port.statistics();
    assert.equal(stats.ok, true);
    assert.equal(stats.statistics?.kind, "canonical-schedule-statistics");
    assert.equal(stats.statistics?.executionPerformed, false);
    assert.equal(stats.statistics?.cronUsed, false);
    assert.equal(stats.statistics?.timersUsed, false);
    assert.equal(stats.statistics?.realSchedulerBackend, false);

    const unregistered = await port.unregisterSchedule({
      executionSchedulerId: registered.schedule!.executionSchedulerId,
    });
    assert.equal(unregistered.ok, true);
    assert.equal(unregistered.executionPerformed, false);
  });

  it("InMemoryExecutionSchedulerStore é estrutural e sem persistência", () => {
    const store = new InMemoryExecutionSchedulerStore();
    assert.equal(store.storeId, IN_MEMORY_EXECUTION_SCHEDULER_STORE_ID);
    assert.equal(store.scheduleCount(), 0);
    const health = store.health();
    assert.equal(health.ok, true);
  });

  it("referência estrutural OCR Pipeline NÃO utiliza Schedulers", () => {
    const ref = OCR_PIPELINE_SCHEDULER_FOUNDATION_CONSUMER_REFERENCE;
    assert.equal(ref.kind, "ocr-pipeline-scheduler-foundation-consumer-reference");
    assert.equal(ref.portContract, "ExecutionSchedulerPort");
    assert.equal(ref.workerPortContract, "ExecutionWorkerPort");
    assert.equal(ref.willUseSchedulerFoundationViaPort, true);
    assert.equal(ref.currentlyUsesScheduler, false);
    assert.equal(ref.executionPerformed, false);
    assert.equal(ref.cronUsed, false);
    assert.equal(ref.ocrInvoked, false);
    assert.equal(ref.implementsOcr, false);
    assert.equal(ref.structuralReferenceOnly, true);
  });

  it("referência estrutural IA NÃO utiliza Schedulers", () => {
    const ref = AI_SCHEDULER_FOUNDATION_CONSUMER_REFERENCE;
    assert.equal(ref.kind, "ai-scheduler-foundation-consumer-reference");
    assert.equal(ref.portContract, "ExecutionSchedulerPort");
    assert.equal(ref.workerPortContract, "ExecutionWorkerPort");
    assert.equal(ref.willUseSchedulerFoundationViaPort, true);
    assert.equal(ref.currentlyUsesScheduler, false);
    assert.equal(ref.executionPerformed, false);
    assert.equal(ref.aiInvoked, false);
    assert.equal(ref.implementsAi, false);
    assert.equal(ref.structuralReferenceOnly, true);
  });

  it("referência estrutural TISS NÃO utiliza Schedulers", () => {
    const ref = TISS_SCHEDULER_FOUNDATION_CONSUMER_REFERENCE;
    assert.equal(ref.kind, "tiss-scheduler-foundation-consumer-reference");
    assert.equal(ref.portContract, "ExecutionSchedulerPort");
    assert.equal(ref.workerPortContract, "ExecutionWorkerPort");
    assert.equal(ref.willUseSchedulerFoundationViaPort, true);
    assert.equal(ref.currentlyUsesScheduler, false);
    assert.equal(ref.executionPerformed, false);
    assert.equal(ref.tissInvoked, false);
    assert.equal(ref.implementsTiss, false);
    assert.equal(ref.structuralReferenceOnly, true);
  });

  it("ausência de dependências externas de Scheduler / cron / timers", () => {
    const caps = createExecutionSchedulerPort().capabilities();
    assert.equal(caps.implementsNodeCron, false);
    assert.equal(caps.implementsBullMqScheduler, false);
    assert.equal(caps.implementsQuartz, false);
    assert.equal(caps.implementsHangfire, false);
    assert.equal(caps.implementsAzureScheduler, false);
    assert.equal(caps.implementsCloudflareCron, false);
    assert.equal(caps.implementsKubernetesCronJobs, false);
    assert.equal(caps.implementsSetInterval, false);
    assert.equal(caps.implementsSetTimeout, false);
    assert.equal(caps.implementsHttpSchedulers, false);
    assert.equal(caps.realSchedulerBackend, false);
    assert.equal(caps.cronUsed, false);
    assert.equal(caps.timersUsed, false);
    assert.equal(caps.scheduleExecuted, false);
  });
});

describe("INF-03 Scheduler Foundation — integração estrutural com Worker Foundation", () => {
  it("Scheduler utiliza exclusivamente ExecutionWorkerPort", async () => {
    resetAllWorkerFoundationIdSequences();
    resetAllSchedulerFoundationIdSequences();

    const workerPort = createExecutionWorkerPort({ provider: "mock" });
    const worker = await workerPort.registerWorker({
      executionId: "exec-worker-link",
      key: "structural-execution-worker",
    });
    assert.equal(worker.ok, true);

    const schedulerPort = new MockExecutionSchedulerAdapter({
      provider: "mock",
      executionWorker: workerPort,
      createExecutionSchedulerId: () => "execution-scheduler-worker-1",
    });

    assert.equal(schedulerPort.getExecutionWorkerPort(), workerPort);
    assert.equal(schedulerPort.capabilities().usesExecutionWorkerPortOnly, true);

    const registered = await schedulerPort.registerSchedule({
      executionId: "exec-worker-link",
      executionWorkerId: worker.worker!.executionWorkerId,
    });
    assert.equal(registered.ok, true);
    assert.equal(registered.schedule?.executionWorkerId, worker.worker!.executionWorkerId);
    assert.equal(registered.workersStarted, false);
    assert.equal(registered.jobsDispatched, false);
    assert.equal(registered.executionPerformed, false);

    // Nenhum Worker iniciado via Worker Port.
    const gotWorker = await workerPort.getWorker({
      executionWorkerId: worker.worker!.executionWorkerId,
      createIfMissing: false,
    });
    assert.equal(gotWorker.ok, true);
    assert.equal(gotWorker.worker?.status.value, "registered-structural");
    assert.equal(gotWorker.worker?.executionPerformed, false);
  });

  it("Scheduler NÃO acessa adapters/stores do Worker Foundation diretamente", () => {
    const schedulerPort = createExecutionSchedulerPort({
      provider: "mock",
    }) as MockExecutionSchedulerAdapter;
    const workerPort = schedulerPort.getExecutionWorkerPort();
    assert.ok(workerPort);
    assert.equal(typeof workerPort.getWorker, "function");
    assert.equal(typeof workerPort.registerWorker, "function");
    assert.equal(schedulerPort.capabilities().usesExecutionWorkerPortOnly, true);
    assert.equal((schedulerPort as { workerStore?: unknown }).workerStore, undefined);
  });
});

describe("INF-03 Scheduler Foundation — integração estrutural com Orchestrator", () => {
  it("Orchestrator anexa executionSchedulerId sem executar Schedules", async () => {
    resetAllCanonicalExecutionIdSequences();
    resetAllSchedulerFoundationIdSequences();
    resetAllWorkerFoundationIdSequences();

    const port = new MockCanonicalExecutionOrchestratorAdapter({
      createExecutionId: () => "canonical-exec-inf03",
      createResultId: () => "canonical-result-inf03",
      createTraceId: () => "canonical-trace-inf03",
      createCorrelationId: () => "canonical-corr-inf03",
      createStepId: (() => {
        let n = 0;
        return () => `canonical-step-inf03-${++n}`;
      })(),
      now: () => "2026-08-01T23:00:00.000Z",
    });

    const started = await port.startExecution({ intakeRef: "intake-inf03" });
    assert.equal(started.ok, true);
    assert.ok(started.executionContext);
    assert.equal(started.executionContext?.state.phase, "finalized");
    assert.equal(started.executionContext?.state.status, "completed");
    assert.equal(started.result?.enginesInvoked, false);

    const schedulerRef = started.executionContext?.references.find(
      (r) => r.name === "executionSchedulerId",
    );
    assert.ok(schedulerRef);
    assert.ok(schedulerRef.value.length > 0);

    const workerRef = started.executionContext?.references.find(
      (r) => r.name === "executionWorkerId",
    );
    assert.ok(workerRef);

    const queueRef = started.executionContext?.references.find(
      (r) => r.name === "executionMessageQueueId",
    );
    assert.ok(queueRef);

    const historyEntry = started.executionContext?.history.find(
      (h) => h.event === "execution-scheduler-attached",
    );
    assert.ok(historyEntry);
    assert.equal(historyEntry.attributes?.executionPerformed, false);
    assert.equal(historyEntry.attributes?.scheduleExecuted, false);
    assert.equal(historyEntry.attributes?.cronUsed, false);
    assert.equal(historyEntry.attributes?.timersUsed, false);
    assert.equal(historyEntry.attributes?.jobsDispatched, false);

    const schedulerPort = port.getExecutionSchedulerPort();
    const schedule = await schedulerPort.getSchedule({
      executionSchedulerId: schedulerRef.value,
      createIfMissing: false,
    });
    assert.equal(schedule.ok, true);
    assert.equal(schedule.schedule?.executionPerformed, false);
    assert.equal(schedule.schedule?.cronUsed, false);
    assert.equal(schedule.schedule?.timersUsed, false);
    assert.equal(schedule.schedule?.status.value, "registered-structural");
    assert.equal(schedule.schedule?.executionWorkerId, workerRef.value);

    const caps = schedulerPort.capabilities();
    assert.equal(caps.executionPerformed, false);
    assert.equal(caps.cronUsed, false);
    assert.equal(caps.timersUsed, false);
    assert.equal(caps.decoupledFromEngines, true);
    assert.equal(caps.usesExecutionWorkerPortOnly, true);

    assert.ok(started.message?.includes("ExecutionSchedulerPort"));
    assert.ok(started.message?.includes("no execution/cron/timers/jobs"));
  });

  it("Orchestrator capabilities declaram dependência estrutural do Scheduler Foundation", () => {
    const port = new DefaultCanonicalExecutionOrchestratorAdapter();
    const caps = port.capabilities();
    assert.equal(caps.dependsOnExecutionScheduler, true);
    assert.equal(caps.usesExecutionSchedulerStructurally, true);
    assert.equal(caps.dependsOnExecutionWorker, true);
    assert.equal(caps.usesExecutionWorkerStructurally, true);
    assert.equal(caps.dependsOnExecutionQueue, true);
    assert.equal(caps.usesExecutionQueueStructurally, true);
    assert.equal(caps.implementsHttpWorkersQueues, false);
    assert.equal(caps.implementsOcr, false);
    assert.equal(caps.noDirectEngineCoupling, true);
  });

  it("Execution Context permanece transporte; Scheduler só via Port", async () => {
    resetAllCanonicalExecutionIdSequences();
    const orchestrator = new MockCanonicalExecutionOrchestratorAdapter({
      createExecutionId: () => "canonical-exec-inf03-transport",
      createResultId: () => "canonical-result-inf03-transport",
      createTraceId: () => "canonical-trace-inf03-transport",
      createCorrelationId: () => "canonical-corr-inf03-transport",
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
      contextId: "canonical-exec-inf03-transport",
    });
    assert.equal(context.ok, true);
    assert.equal(context.context?.capability.structuralTransportOnly, true);
    assert.equal(context.context?.state.processingPerformed, false);

    assert.equal((context.context as { scheduler?: unknown } | undefined)?.scheduler, undefined);

    const schedulerCaps = orchestrator.getExecutionSchedulerPort().capabilities();
    assert.equal(schedulerCaps.structuralSchedulerOnly, true);
    assert.equal(schedulerCaps.decoupledFromEngines, true);
    assert.equal(schedulerCaps.executionPerformed, false);
    assert.equal(schedulerCaps.cronUsed, false);
  });

  it("módulos anteriores permanecem independentes do Scheduler Foundation", async () => {
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
    ] as Array<{ getExecutionSchedulerPort?: unknown }>;

    for (const mod of priorModules) {
      assert.equal(mod.getExecutionSchedulerPort, undefined);
    }
  });

  it("Factory do Orchestrator injeta ExecutionSchedulerPort", async () => {
    const executionScheduler = createExecutionSchedulerPort({ provider: "test" });
    const factory = createCanonicalExecutionOrchestratorFactory({
      executionScheduler,
    });
    const port = factory.create({ provider: "mock" });
    assert.ok((port as MockCanonicalExecutionOrchestratorAdapter).getExecutionSchedulerPort);
    const started = await port.startExecution();
    assert.equal(started.ok, true);
  });

  it("Default orchestrator health inclui Scheduler Foundation", async () => {
    const port = new DefaultCanonicalExecutionOrchestratorAdapter();
    const health = await port.health();
    assert.equal(health.ok, true);
  });

  it("ausência de acoplamento direto com OCR / IA / TISS", () => {
    const schedulerCaps = createExecutionSchedulerPort().capabilities();
    const orchCaps = new DefaultCanonicalExecutionOrchestratorAdapter().capabilities();
    assert.equal(schedulerCaps.implementsOcr, false);
    assert.equal(schedulerCaps.implementsAi, false);
    assert.equal(schedulerCaps.implementsTiss, false);
    assert.equal(schedulerCaps.decoupledFromEngines, true);
    assert.equal(orchCaps.implementsOcr, false);
    assert.equal(orchCaps.implementsAi, false);
    assert.equal(orchCaps.implementsTissRules, false);
    assert.equal(orchCaps.noDirectEngineCoupling, true);
  });
});
