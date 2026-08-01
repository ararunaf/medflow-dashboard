#!/usr/bin/env node
/**
 * INF-01 — Message Queue Foundation
 * Prova Application → ExecutionQueuePort → Adapter → Store
 * sem tocar produto e sem invocar OCR / IA / Mapping / regras / banco / workers.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_MESSAGE_QUEUE_ADAPTER_ID,
  DefaultMessageQueueAdapter,
  IN_MEMORY_MESSAGE_QUEUE_STORE_ID,
  InMemoryMessageQueueStore,
  MOCK_MESSAGE_QUEUE_ADAPTER_ID,
  MockMessageQueueAdapter,
  MessageQueueProvider,
  OCR_PIPELINE_MESSAGE_QUEUE_CONSUMER_REFERENCE,
  STRUCTURAL_MESSAGE_QUEUE_CAPABILITY,
  createExecutionQueuePort,
  createMessageQueueFactory,
  getMessageQueueHealthSummary,
  resetAllMessageQueueIdSequences,
  type ExecutionQueuePort,
} from "../../../src/lib/enterprise/message-queue/index.ts";
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
import {
  createPipelineResolverPort,
  type PipelineResolverPort,
} from "../../../src/lib/enterprise/pipeline-resolver/index.ts";

describe("INF-01 ExecutionQueuePort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy", async () => {
    const port: ExecutionQueuePort = new MockMessageQueueAdapter({
      provider: "mock",
    });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.storedQueueCount, 0);
    assert.equal(health.storedMessageCount, 0);
    assert.equal(health.structuralHealth?.kind, "canonical-queue-health");
    assert.equal(health.structuralHealth?.persistenceImplemented, false);
    assert.equal(health.structuralHealth?.messagesPublished, false);
    assert.equal(health.structuralHealth?.messagesConsumed, false);
    assert.equal(health.structuralHealth?.workersInvoked, false);
    assert.equal(health.structuralHealth?.realQueueBackend, false);

    const caps = port.capabilities();
    assert.equal(caps.adapterId, "mock-in-memory");
    assert.equal(caps.supportsEnqueue, true);
    assert.equal(caps.supportsDequeue, true);
    assert.equal(caps.supportsPeek, true);
    assert.equal(caps.supportsAcknowledge, true);
    assert.equal(caps.supportsReject, true);
    assert.equal(caps.supportsRetry, true);
    assert.equal(caps.supportsGetQueue, true);
    assert.equal(caps.supportsGetStatistics, true);
    assert.equal(caps.supportsHealth, true);
    assert.equal(caps.supportsCapabilities, true);
    assert.equal(caps.structuralMessageQueueOnly, true);
    assert.equal(caps.persistenceImplemented, false);
    assert.equal(caps.databaseUsed, false);
    assert.equal(caps.enginesInvoked, false);
    assert.equal(caps.messagesPublished, false);
    assert.equal(caps.messagesConsumed, false);
    assert.equal(caps.workersInvoked, false);
    assert.equal(caps.realQueueBackend, false);
    assert.equal(caps.implementsOcr, false);
    assert.equal(caps.implementsAi, false);
    assert.equal(caps.implementsTiss, false);
    assert.equal(caps.implementsRabbitMq, false);
    assert.equal(caps.implementsRedis, false);
    assert.equal(caps.implementsAzureQueue, false);
    assert.equal(caps.implementsAwsSqs, false);
    assert.equal(caps.implementsGooglePubSub, false);
    assert.equal(caps.implementsCloudflareQueues, false);
    assert.equal(caps.noDirectEngineCoupling, true);
    assert.equal(caps.decoupledFromEngines, true);
  });

  it("DefaultMessageQueueAdapter é o default da fundação", async () => {
    const port: ExecutionQueuePort = new DefaultMessageQueueAdapter();
    assert.equal(port.providerId, "default");
    const caps = port.capabilities();
    assert.equal(caps.adapterId, DEFAULT_MESSAGE_QUEUE_ADAPTER_ID);
    assert.equal(caps.structuralMessageQueueOnly, true);
    assert.equal(caps.realQueueBackend, false);

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "default");
  });

  it("test adapter é resolvido pelo provider", async () => {
    const port = createExecutionQueuePort({ provider: "test" });
    assert.equal(port.providerId, "test");
    const health = await port.health();
    assert.equal(health.ok, true);
  });

  it("Default usa ping opcional sem I/O externo", async () => {
    const port = new DefaultMessageQueueAdapter({
      store: new InMemoryMessageQueueStore(),
      ping: async () => ({
        ok: true,
        message: "message-queue probe custom",
      }),
    });
    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.message, "message-queue probe custom");
    assert.equal(typeof health.latencyMs, "number");
  });

  it("provider default resolve DefaultMessageQueueAdapter", () => {
    const defaultPort = createExecutionQueuePort();
    assert.equal(defaultPort.providerId, "default");
  });

  it("Factory materializa adapters corretos", () => {
    const factory = createMessageQueueFactory();
    assert.equal(factory.create().providerId, "default");
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
  });

  it("MessageQueueProvider resolve adapters via Factory", () => {
    const provider = new MessageQueueProvider();
    assert.equal(provider.resolve().providerId, "default");
    assert.equal(provider.resolve({ provider: "mock" }).providerId, "mock");
  });

  it("PoC Application depende só do Port (inversão de dependência)", async () => {
    const port = createExecutionQueuePort({ provider: "mock" });
    const summary = await getMessageQueueHealthSummary(port);

    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.provider, "mock");
    assert.equal(summary.capabilities.provider, "mock");
    assert.equal(summary.health.ok, true);
  });

  it("MOCK adapter id constante está estável", () => {
    assert.equal(MOCK_MESSAGE_QUEUE_ADAPTER_ID, "mock-in-memory");
    assert.equal(IN_MEMORY_MESSAGE_QUEUE_STORE_ID, "in-memory-message-queue");
  });
});

describe("INF-01 Message Queue — modelos canônicos e store", () => {
  it("getQueue materializa CanonicalQueue e modelos canônicos", async () => {
    resetAllMessageQueueIdSequences();
    const port = new MockMessageQueueAdapter({
      createExecutionMessageQueueId: () => "execution-message-queue-fixed-1",
      now: () => "2026-08-01T22:00:00.000Z",
    });

    const resolved = await port.getQueue({
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
      pipelineId: "pipe-1",
      key: "structural-execution-queue",
      name: "Structural Execution Message Queue",
      tags: ["message-queue", "foundation"],
      structuralNotes: "structural only",
    });

    assert.equal(resolved.ok, true);
    assert.equal(resolved.messagesPublished, false);
    assert.equal(resolved.messagesConsumed, false);
    assert.equal(resolved.workersInvoked, false);
    assert.equal(resolved.processingPerformed, false);
    assert.equal(resolved.realQueueBackend, false);
    assert.equal(resolved.enginesInvoked, false);

    assert.equal(resolved.queue?.kind, "canonical-queue");
    assert.equal(resolved.queue?.id, "execution-message-queue-fixed-1");
    assert.equal(resolved.queue?.executionMessageQueueId, "execution-message-queue-fixed-1");
    assert.equal(resolved.queue?.configuration.kind, "canonical-queue-configuration");
    assert.equal(resolved.queue?.configuration.backendConnected, false);
    assert.equal(resolved.queue?.metadata.kind, "canonical-queue-metadata");
    assert.equal(resolved.queue?.capability.kind, "canonical-queue-capabilities");
    assert.equal(resolved.queue?.capability, STRUCTURAL_MESSAGE_QUEUE_CAPABILITY);
    assert.equal(resolved.queue?.messageCount, 0);
    assert.equal(resolved.queue?.messagesPublished, false);
    assert.equal(resolved.queue?.realQueueBackend, false);
  });

  it("operações estruturais NÃO publicam / NÃO processam / NÃO invocam workers", async () => {
    resetAllMessageQueueIdSequences();
    const port = new DefaultMessageQueueAdapter({
      createExecutionMessageQueueId: () => "execution-message-queue-ops-1",
      createMessageId: () => "canonical-queue-message-ops-1",
      now: () => "2026-08-01T22:10:00.000Z",
    });

    const queue = await port.getQueue({ executionId: "exec-ops" });
    assert.equal(queue.ok, true);

    const enqueued = await port.enqueue({
      executionMessageQueueId: queue.queue!.executionMessageQueueId,
      payloadRef: "structural-payload-ref",
    });
    assert.equal(enqueued.ok, true);
    assert.equal(enqueued.messagesPublished, false);
    assert.equal(enqueued.messagesConsumed, false);
    assert.equal(enqueued.workersInvoked, false);
    assert.equal(enqueued.processingPerformed, false);
    assert.equal(enqueued.queueMessage?.status, "enqueued-structural");
    assert.equal(enqueued.queueMessage?.messagesPublished, false);
    assert.equal(enqueued.queueMessage?.messagesConsumed, false);

    const peeked = await port.peek({
      executionMessageQueueId: queue.queue!.executionMessageQueueId,
    });
    assert.equal(peeked.ok, true);
    assert.equal(peeked.messagesConsumed, false);
    assert.equal(peeked.processingPerformed, false);

    const dequeued = await port.dequeue({
      executionMessageQueueId: queue.queue!.executionMessageQueueId,
    });
    assert.equal(dequeued.ok, true);
    assert.equal(dequeued.messagesConsumed, false);
    assert.equal(dequeued.queueMessage?.status, "dequeued-structural");

    const acked = await port.acknowledge({
      executionMessageQueueId: queue.queue!.executionMessageQueueId,
      messageId: "canonical-queue-message-ops-1",
    });
    assert.equal(acked.ok, true);
    assert.equal(acked.workersInvoked, false);

    const rejected = await port.reject({
      executionMessageQueueId: queue.queue!.executionMessageQueueId,
      messageId: "canonical-queue-message-ops-1",
    });
    assert.equal(rejected.ok, true);
    assert.equal(rejected.realQueueBackend, false);

    const retried = await port.retry({
      executionMessageQueueId: queue.queue!.executionMessageQueueId,
      messageId: "canonical-queue-message-ops-1",
    });
    assert.equal(retried.ok, true);
    assert.equal(retried.processingPerformed, false);

    const stats = await port.getStatistics();
    assert.equal(stats.ok, true);
    assert.equal(stats.statistics?.kind, "canonical-queue-statistics");
    assert.equal(stats.statistics?.messagesPublished, false);
    assert.equal(stats.statistics?.workersInvoked, false);
    assert.equal(stats.statistics?.realQueueBackend, false);
  });

  it("InMemoryMessageQueueStore é estrutural e sem persistência", () => {
    const store = new InMemoryMessageQueueStore();
    assert.equal(store.storeId, IN_MEMORY_MESSAGE_QUEUE_STORE_ID);
    assert.equal(store.queueCount(), 0);
    assert.equal(store.messageCount(), 0);
    const health = store.health();
    assert.equal(health.ok, true);
  });

  it("referência estrutural OCR Pipeline NÃO consome a fila", () => {
    const ref = OCR_PIPELINE_MESSAGE_QUEUE_CONSUMER_REFERENCE;
    assert.equal(ref.kind, "ocr-pipeline-message-queue-consumer-reference");
    assert.equal(ref.portContract, "ExecutionQueuePort");
    assert.equal(ref.willUseMessageQueueViaPort, true);
    assert.equal(ref.currentlyUsesQueue, false);
    assert.equal(ref.messagesPublished, false);
    assert.equal(ref.messagesConsumed, false);
    assert.equal(ref.workersInvoked, false);
    assert.equal(ref.processingPerformed, false);
    assert.equal(ref.ocrInvoked, false);
    assert.equal(ref.implementsOcr, false);
    assert.equal(ref.structuralReferenceOnly, true);
  });

  it("ausência de dependências externas de mensageria", () => {
    const caps = createExecutionQueuePort().capabilities();
    assert.equal(caps.implementsRabbitMq, false);
    assert.equal(caps.implementsRedis, false);
    assert.equal(caps.implementsAzureQueue, false);
    assert.equal(caps.implementsAwsSqs, false);
    assert.equal(caps.implementsGooglePubSub, false);
    assert.equal(caps.implementsCloudflareQueues, false);
    assert.equal(caps.implementsHttpWorkersQueues, false);
    assert.equal(caps.realQueueBackend, false);
  });
});

describe("INF-01 Message Queue — integração estrutural com Orchestrator", () => {
  it("Orchestrator anexa executionMessageQueueId sem publicar mensagens", async () => {
    resetAllCanonicalExecutionIdSequences();
    resetAllMessageQueueIdSequences();

    const port = new MockCanonicalExecutionOrchestratorAdapter({
      createExecutionId: () => "canonical-exec-inf01",
      createResultId: () => "canonical-result-inf01",
      createTraceId: () => "canonical-trace-inf01",
      createCorrelationId: () => "canonical-corr-inf01",
      createStepId: (() => {
        let n = 0;
        return () => `canonical-step-inf01-${++n}`;
      })(),
      now: () => "2026-08-01T23:00:00.000Z",
    });

    const started = await port.startExecution({ intakeRef: "intake-inf01" });
    assert.equal(started.ok, true);
    assert.ok(started.executionContext);
    assert.equal(started.executionContext?.state.phase, "finalized");
    assert.equal(started.executionContext?.state.status, "completed");
    assert.equal(started.result?.enginesInvoked, false);

    const queueRef = started.executionContext?.references.find(
      (r) => r.name === "executionMessageQueueId",
    );
    assert.ok(queueRef);
    assert.ok(queueRef.value.length > 0);

    const environmentRef = started.executionContext?.references.find(
      (r) => r.name === "executionEnvironmentRegistryId",
    );
    assert.ok(environmentRef);

    const historyEntry = started.executionContext?.history.find(
      (h) => h.event === "execution-message-queue-attached",
    );
    assert.ok(historyEntry);
    assert.equal(historyEntry.attributes?.messagesPublished, false);
    assert.equal(historyEntry.attributes?.messagesConsumed, false);
    assert.equal(historyEntry.attributes?.workersInvoked, false);

    const queuePort = port.getExecutionQueuePort();
    const queue = await queuePort.getQueue({
      executionMessageQueueId: queueRef.value,
      createIfMissing: false,
    });
    assert.equal(queue.ok, true);
    assert.equal(queue.queue?.messageCount, 0);
    assert.equal(queue.queue?.messagesPublished, false);
    assert.equal(queue.messagesPublished, false);

    const caps = queuePort.capabilities();
    assert.equal(caps.messagesPublished, false);
    assert.equal(caps.messagesConsumed, false);
    assert.equal(caps.workersInvoked, false);
    assert.equal(caps.decoupledFromEngines, true);

    assert.ok(started.message?.includes("ExecutionQueuePort"));
    assert.ok(started.message?.includes("no publishing"));
  });

  it("Orchestrator capabilities declaram dependência estrutural do Message Queue", () => {
    const port = new DefaultCanonicalExecutionOrchestratorAdapter();
    const caps = port.capabilities();
    assert.equal(caps.dependsOnExecutionQueue, true);
    assert.equal(caps.usesExecutionQueueStructurally, true);
    assert.equal(caps.dependsOnExecutionEnvironmentRegistry, true);
    assert.equal(caps.implementsHttpWorkersQueues, false);
    assert.equal(caps.implementsOcr, false);
    assert.equal(caps.noDirectEngineCoupling, true);
  });

  it("Execution Context permanece transporte; Message Queue só via Port", async () => {
    resetAllCanonicalExecutionIdSequences();
    const orchestrator = new MockCanonicalExecutionOrchestratorAdapter({
      createExecutionId: () => "canonical-exec-inf01-transport",
      createResultId: () => "canonical-result-inf01-transport",
      createTraceId: () => "canonical-trace-inf01-transport",
      createCorrelationId: () => "canonical-corr-inf01-transport",
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
      contextId: "canonical-exec-inf01-transport",
    });
    assert.equal(context.ok, true);
    assert.equal(context.context?.capability.structuralTransportOnly, true);
    assert.equal(context.context?.state.processingPerformed, false);

    assert.equal(
      (context.context as { messageQueue?: unknown } | undefined)?.messageQueue,
      undefined,
    );

    const queueCaps = orchestrator.getExecutionQueuePort().capabilities();
    assert.equal(queueCaps.structuralMessageQueueOnly, true);
    assert.equal(queueCaps.decoupledFromEngines, true);
    assert.equal(queueCaps.messagesPublished, false);
  });

  it("módulos EPC-24 anteriores permanecem independentes do Message Queue", async () => {
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
    ] as Array<{ getExecutionQueuePort?: unknown }>;

    for (const mod of priorModules) {
      assert.equal(mod.getExecutionQueuePort, undefined);
    }
  });

  it("Factory do Orchestrator injeta ExecutionQueuePort", async () => {
    const executionQueue = createExecutionQueuePort({ provider: "test" });
    const factory = createCanonicalExecutionOrchestratorFactory({
      executionQueue,
    });
    const port = factory.create({ provider: "mock" });
    assert.ok((port as MockCanonicalExecutionOrchestratorAdapter).getExecutionQueuePort);
    const started = await port.startExecution();
    assert.equal(started.ok, true);
  });

  it("Default orchestrator health inclui Message Queue", async () => {
    const port = new DefaultCanonicalExecutionOrchestratorAdapter();
    const health = await port.health();
    assert.equal(health.ok, true);
  });

  it("ausência de acoplamento direto com OCR / IA / TISS", () => {
    const queueCaps = createExecutionQueuePort().capabilities();
    const orchCaps = new DefaultCanonicalExecutionOrchestratorAdapter().capabilities();
    assert.equal(queueCaps.implementsOcr, false);
    assert.equal(queueCaps.implementsAi, false);
    assert.equal(queueCaps.implementsTiss, false);
    assert.equal(queueCaps.decoupledFromEngines, true);
    assert.equal(orchCaps.implementsOcr, false);
    assert.equal(orchCaps.implementsAi, false);
    assert.equal(orchCaps.implementsTissRules, false);
    assert.equal(orchCaps.noDirectEngineCoupling, true);
  });
});
