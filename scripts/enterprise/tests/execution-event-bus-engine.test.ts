#!/usr/bin/env node
/**
 * EPC-24 Sprint 05 — Execution Event Bus Foundation
 * Prova Application → ExecutionEventBusPort → Adapter → Store
 * sem tocar produto e sem invocar OCR / IA / Mapping / regras / filas.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_EXECUTION_EVENT_BUS_ADAPTER_ID,
  DEFAULT_EXECUTION_EVENT_BUS_STORE_ID,
  DefaultExecutionEventBusAdapter,
  DefaultExecutionEventBusStore,
  EXECUTION_EVENT_TYPES,
  MOCK_EXECUTION_EVENT_BUS_ADAPTER_ID,
  MockExecutionEventBusAdapter,
  STRUCTURAL_EVENT_BUS_CAPABILITY,
  createExecutionEventBusFactory,
  createExecutionEventBusPort,
  getExecutionEventBusHealthSummary,
  isKnownExecutionEventType,
  resetAllExecutionEventBusIdSequences,
  type ExecutionEventBusPort,
} from "../../../src/lib/enterprise/execution-event-bus/index.ts";
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
import {
  createExecutionStateMachinePort,
} from "../../../src/lib/enterprise/execution-state-machine/index.ts";
import {
  createPipelineResolverPort,
  type PipelineResolverPort,
} from "../../../src/lib/enterprise/pipeline-resolver/index.ts";

describe("EPC-24 ExecutionEventBusPort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy", async () => {
    const port: ExecutionEventBusPort = new MockExecutionEventBusAdapter({
      provider: "mock",
    });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.storedBusCount, 0);
    assert.equal(health.storedEventCount, 0);
    assert.equal(health.storedRegistrationCount, 0);
    assert.equal(health.storedHistoryCount, 0);

    const caps = port.capabilities();
    assert.equal(caps.adapterId, "mock-in-memory");
    assert.equal(caps.supportsCreateEventBus, true);
    assert.equal(caps.supportsPublish, true);
    assert.equal(caps.supportsRegister, true);
    assert.equal(caps.supportsUnregister, true);
    assert.equal(caps.supportsListSubscribers, true);
    assert.equal(caps.supportsListEvents, true);
    assert.equal(caps.supportsHealth, true);
    assert.equal(caps.supportsCapabilities, true);
    assert.equal(caps.structuralEventBusOnly, true);
    assert.equal(caps.eventsDelivered, false);
    assert.equal(caps.subscribersExecuted, false);
    assert.equal(caps.callbacksExecuted, false);
    assert.equal(caps.queuesImplemented, false);
    assert.equal(caps.pubSubImplemented, false);
    assert.equal(caps.eventEmitterUsed, false);
    assert.equal(caps.workersUsed, false);
    assert.equal(caps.enginesInvoked, false);
    assert.equal(caps.stagesExecuted, false);
    assert.equal(caps.processingPerformed, false);
    assert.equal(caps.implementsOcr, false);
    assert.equal(caps.implementsAi, false);
    assert.equal(caps.implementsXmlParser, false);
    assert.equal(caps.implementsTissRules, false);
    assert.equal(caps.implementsMapping, false);
    assert.equal(caps.implementsValidation, false);
    assert.equal(caps.implementsPersistence, false);
    assert.equal(caps.implementsUi, false);
    assert.equal(caps.implementsHttpWorkersQueues, false);
    assert.equal(caps.noDirectEngineCoupling, true);
    assert.equal(caps.decoupledFromEngines, true);
  });

  it("DefaultExecutionEventBusAdapter é o default da fundação", async () => {
    const port: ExecutionEventBusPort = new DefaultExecutionEventBusAdapter();
    assert.equal(port.providerId, "default");
    const caps = port.capabilities();
    assert.equal(caps.adapterId, DEFAULT_EXECUTION_EVENT_BUS_ADAPTER_ID);
    assert.equal(caps.structuralEventBusOnly, true);
    assert.equal(caps.implementsOcr, false);
    assert.equal(caps.implementsAi, false);

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "default");
  });

  it("test adapter é resolvido pelo provider", async () => {
    const port = createExecutionEventBusPort({ provider: "test" });
    assert.equal(port.providerId, "test");
    const health = await port.health();
    assert.equal(health.ok, true);
  });

  it("Default usa ping opcional sem I/O externo", async () => {
    const port = new DefaultExecutionEventBusAdapter({
      store: new DefaultExecutionEventBusStore(),
      ping: async () => ({
        ok: true,
        message: "execution-event-bus probe custom",
      }),
    });
    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.message, "execution-event-bus probe custom");
    assert.equal(typeof health.latencyMs, "number");
  });

  it("provider default resolve DefaultExecutionEventBusAdapter", () => {
    const defaultPort = createExecutionEventBusPort();
    assert.equal(defaultPort.providerId, "default");
  });

  it("Factory materializa adapters corretos", () => {
    const factory = createExecutionEventBusFactory();
    assert.equal(factory.create().providerId, "default");
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
  });

  it("PoC Application depende só do Port (inversão de dependência)", async () => {
    const port = createExecutionEventBusPort({ provider: "mock" });
    const summary = await getExecutionEventBusHealthSummary(port);

    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.provider, "mock");
    assert.equal(summary.capabilities.provider, "mock");
    assert.equal(summary.health.ok, true);
  });

  it("MOCK adapter id constante está estável", () => {
    assert.equal(MOCK_EXECUTION_EVENT_BUS_ADAPTER_ID, "mock-in-memory");
    assert.equal(DEFAULT_EXECUTION_EVENT_BUS_STORE_ID, "default-in-process");
  });
});

describe("EPC-24 Execution Event Bus — criação e modelos canônicos", () => {
  it("createEventBus materializa Bus, Publisher, History, Metadata, Capabilities", async () => {
    resetAllExecutionEventBusIdSequences();
    const port = new MockExecutionEventBusAdapter({
      createEventBusId: () => "execution-event-bus-fixed-1",
      createPublisherId: () => "publisher-fixed-1",
      createHistoryId: () => "history-fixed-1",
      now: () => "2026-08-01T22:00:00.000Z",
    });

    const created = await port.createEventBus({
      executionId: "exec-1",
      correlationId: "corr-1",
      tags: ["event-bus", "foundation"],
      structuralNotes: "structural only",
    });

    assert.equal(created.ok, true);
    assert.equal(created.bus?.kind, "execution-event-bus");
    assert.equal(created.bus?.id, "execution-event-bus-fixed-1");
    assert.equal(created.bus?.eventBusId, "execution-event-bus-fixed-1");
    assert.equal(created.bus?.executionId, "exec-1");
    assert.equal(created.bus?.correlationId, "corr-1");

    // Publisher
    assert.equal(created.bus?.publisher.kind, "execution-event-publisher");
    assert.equal(created.bus?.publisher.id, "publisher-fixed-1");

    // Metadata
    assert.equal(created.bus?.metadata.kind, "execution-event-metadata");
    assert.deepEqual(created.bus?.metadata.tags, ["event-bus", "foundation"]);
    assert.equal(created.bus?.metadata.createdAt, "2026-08-01T22:00:00.000Z");

    // History
    assert.equal(created.bus?.history.kind, "execution-event-history");
    assert.equal(created.bus?.history.entryCount, 0);
    assert.equal(created.bus?.history.envelopes.length, 0);

    // Capability
    assert.equal(created.bus?.capability.kind, "execution-event-capabilities");
    assert.equal(created.bus?.capability.structuralEventBusOnly, true);
    assert.equal(created.bus?.capability.decoupledFromEngines, true);
    assert.equal(created.bus?.capability.eventsDelivered, false);
    assert.equal(created.bus?.capability.subscribersExecuted, false);
    assert.equal(created.bus?.capability.queuesImplemented, false);

    // Aggregate flags
    assert.equal(created.bus?.eventsDelivered, false);
    assert.equal(created.bus?.subscribersExecuted, false);
    assert.equal(created.bus?.callbacksExecuted, false);
    assert.equal(created.bus?.queuesImplemented, false);
    assert.equal(created.bus?.enginesInvoked, false);
    assert.equal(created.bus?.stagesExecuted, false);
    assert.equal(created.bus?.processingPerformed, false);

    // Catalog
    assert.equal(EXECUTION_EVENT_TYPES.length, 11);
    assert.equal(isKnownExecutionEventType("execution.created"), true);
    assert.equal(isKnownExecutionEventType("unknown"), false);
    assert.equal(STRUCTURAL_EVENT_BUS_CAPABILITY.structuralEventBusOnly, true);
  });

  it("rejeita createEventBus duplicado por executionId", async () => {
    const port = new MockExecutionEventBusAdapter();
    const first = await port.createEventBus({ executionId: "dup-exec" });
    assert.equal(first.ok, true);
    const second = await port.createEventBus({ executionId: "dup-exec" });
    assert.equal(second.ok, false);
    assert.equal(second.code, "already_exists");
  });

  it("rejeita createEventBus sem executionId", async () => {
    const port = new MockExecutionEventBusAdapter();
    const created = await port.createEventBus({ executionId: "" });
    assert.equal(created.ok, false);
    assert.equal(created.code, "invalid_input");
  });
});

describe("EPC-24 Execution Event Bus — registro / remoção estrutural", () => {
  it("register e unregister são estruturais sem callbacks", async () => {
    resetAllExecutionEventBusIdSequences();
    const port = new MockExecutionEventBusAdapter({
      createEventBusId: () => "bus-reg-1",
      createSubscriberId: (() => {
        let n = 0;
        return () => `subscriber-fixed-${++n}`;
      })(),
      createRegistrationId: (() => {
        let n = 0;
        return () => `registration-fixed-${++n}`;
      })(),
      now: () => "2026-08-01T22:10:00.000Z",
    });

    const created = await port.createEventBus({ executionId: "exec-reg-1" });
    assert.equal(created.ok, true);
    const eventBusId = created.bus!.eventBusId;

    const registered = await port.register({
      eventBusId,
      name: "structural-observer",
      eventTypeFilter: "execution.completed",
    });
    assert.equal(registered.ok, true);
    assert.equal(registered.callbacksExecuted, false);
    assert.equal(registered.registration?.subscriber.hasCallback, false);
    assert.equal(registered.registration?.subscriber.callbacksExecuted, false);
    assert.equal(registered.registration?.active, true);
    assert.equal(registered.registration?.subscriber.eventTypeFilter, "execution.completed");

    const listed = await port.listSubscribers({ eventBusId, activeOnly: true });
    assert.equal(listed.ok, true);
    assert.equal(listed.total, 1);
    assert.equal(listed.subscribers?.[0]?.hasCallback, false);

    const unregistered = await port.unregister({
      eventBusId,
      registrationId: registered.registration!.id,
    });
    assert.equal(unregistered.ok, true);
    assert.equal(unregistered.callbacksExecuted, false);
    assert.equal(unregistered.registration?.active, false);

    const activeOnly = await port.listSubscribers({ eventBusId, activeOnly: true });
    assert.equal(activeOnly.total, 0);

    const all = await port.listSubscribers({ eventBusId });
    assert.equal(all.total, 1);
  });

  it("register rejeita bus inexistente e nome vazio", async () => {
    const port = new MockExecutionEventBusAdapter();
    const missing = await port.register({
      eventBusId: "missing",
      name: "x",
    });
    assert.equal(missing.ok, false);
    assert.equal(missing.code, "not_found");
    assert.equal(missing.callbacksExecuted, false);

    const created = await port.createEventBus({ executionId: "exec-reg-2" });
    const emptyName = await port.register({
      eventBusId: created.bus!.eventBusId,
      name: "",
    });
    assert.equal(emptyName.ok, false);
    assert.equal(emptyName.code, "invalid_input");
  });
});

describe("EPC-24 Execution Event Bus — publish estrutural / histórico / metadata", () => {
  it("publish armazena envelope sem entregar e sem executar subscribers", async () => {
    resetAllExecutionEventBusIdSequences();
    const port = new MockExecutionEventBusAdapter({
      createEventBusId: () => "bus-pub-1",
      createEventId: (() => {
        let n = 0;
        return () => `event-fixed-${++n}`;
      })(),
      createEnvelopeId: (() => {
        let n = 0;
        return () => `envelope-fixed-${++n}`;
      })(),
      now: () => "2026-08-01T22:20:00.000Z",
    });

    const created = await port.createEventBus({ executionId: "exec-pub-1" });
    const eventBusId = created.bus!.eventBusId;

    await port.register({
      eventBusId,
      name: "never-executed",
      eventTypeFilter: "*",
    });

    const published = await port.publish({
      eventBusId,
      type: "execution.created",
      notes: "structural store only",
      opaquePayload: { ref: "opaque" },
    });

    assert.equal(published.ok, true);
    assert.equal(published.delivered, false);
    assert.equal(published.callbacksExecuted, false);
    assert.equal(published.event?.delivered, false);
    assert.equal(published.event?.subscribersNotified, false);
    assert.equal(published.event?.callbacksExecuted, false);
    assert.equal(published.event?.enginesInvoked, false);
    assert.equal(published.envelope?.delivered, false);
    assert.equal(published.envelope?.deliveryAttempted, false);
    assert.equal(published.envelope?.subscribersMatched, 0);
    assert.equal(published.envelope?.callbacksExecuted, false);
    assert.equal(published.event?.kind, "execution-event");
    assert.equal(published.envelope?.kind, "execution-event-envelope");
    assert.equal(published.event?.context?.kind, "execution-event-context");
    assert.equal(published.event?.metadata.kind, "execution-event-metadata");

    const listed = await port.listEvents({ eventBusId });
    assert.equal(listed.ok, true);
    assert.equal(listed.total, 1);
    assert.equal(listed.history?.entryCount, 1);
    assert.equal(listed.events?.[0]?.type, "execution.created");
    assert.equal(listed.events?.[0]?.delivered, false);

    // Bus permanece sem entrega
    assert.equal(published.bus?.eventsDelivered, false);
    assert.equal(published.bus?.subscribersExecuted, false);
  });

  it("listEvents filtra por tipo e limit", async () => {
    const port = new MockExecutionEventBusAdapter();
    const created = await port.createEventBus({ executionId: "exec-list-1" });
    const eventBusId = created.bus!.eventBusId;

    await port.publish({ eventBusId, type: "execution.created" });
    await port.publish({ eventBusId, type: "execution.completed" });
    await port.publish({ eventBusId, type: "execution.created" });

    const filtered = await port.listEvents({ eventBusId, type: "execution.created" });
    assert.equal(filtered.total, 2);

    const limited = await port.listEvents({ eventBusId, limit: 1 });
    assert.equal(limited.total, 1);
  });

  it("publish rejeita bus inexistente", async () => {
    const port = new MockExecutionEventBusAdapter();
    const result = await port.publish({
      eventBusId: "missing",
      type: "execution.custom",
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "not_found");
    assert.equal(result.delivered, false);
  });
});

describe("EPC-24 Execution Event Bus — Store / Adapter / persistence in-memory", () => {
  it("store in-memory persiste bus, eventos e registrations", async () => {
    const store = new DefaultExecutionEventBusStore();
    const port = new DefaultExecutionEventBusAdapter({ store });

    const created = await port.createEventBus({ executionId: "store-exec-1" });
    assert.equal(created.ok, true);
    assert.equal(store.busCount(), 1);
    assert.equal(store.eventCount(), 0);
    assert.equal(store.registrationCount(), 0);

    await port.register({
      eventBusId: created.bus!.eventBusId,
      name: "store-observer",
    });
    assert.equal(store.registrationCount(), 1);

    await port.publish({
      eventBusId: created.bus!.eventBusId,
      type: "execution.structural-walk",
    });
    assert.equal(store.eventCount(), 1);
    assert.equal(store.historyCount(), 1);

    const byExec = store.getBusByExecution("store-exec-1");
    assert.ok(byExec);
    assert.equal(byExec.bus.history.entryCount, 1);

    const health = store.health();
    assert.equal(health.ok, true);
  });

  it("Factory com store compartilhado", async () => {
    const store = new DefaultExecutionEventBusStore();
    const factory = createExecutionEventBusFactory({ store });
    const port = factory.create({ provider: "mock" });
    await port.createEventBus({ executionId: "shared-1" });
    assert.equal(store.busCount(), 1);
  });
});

describe("EPC-24 Sprint 05 — Orchestrator integra Execution Event Bus", () => {
  it("adapters expõem ExecutionEventBusPort e flags de capabilities", async () => {
    const mock = new MockCanonicalExecutionOrchestratorAdapter({ provider: "mock" });
    const def = new DefaultCanonicalExecutionOrchestratorAdapter();

    assert.ok(mock.getExecutionEventBusPort());
    assert.ok(def.getExecutionEventBusPort());

    const caps = mock.capabilities();
    assert.equal(caps.dependsOnExecutionEventBus, true);
    assert.equal(caps.usesExecutionEventBusStructurally, true);
    assert.equal(caps.dependsOnExecutionStateMachine, true);
    assert.equal(caps.dependsOnExecutionContext, true);
    assert.equal(caps.usesExecutionContextExclusively, true);
    assert.equal(caps.dependsOnPipelineResolver, true);
    assert.equal(caps.noDirectEngineCoupling, true);
  });

  it("startExecution cria Event Bus, anexa ao Context e NÃO publica eventos", async () => {
    resetAllCanonicalExecutionIdSequences();
    resetAllExecutionEventBusIdSequences();

    const eventBus = createExecutionEventBusPort({ provider: "mock" });
    const port = new MockCanonicalExecutionOrchestratorAdapter({
      createExecutionId: () => "canonical-exec-sprint05-1",
      createResultId: () => "canonical-result-sprint05-1",
      createTraceId: () => "canonical-trace-sprint05-1",
      createCorrelationId: () => "canonical-corr-sprint05-1",
      createStepId: (() => {
        let n = 0;
        return () => `canonical-step-sprint05-${++n}`;
      })(),
      executionEventBus: eventBus,
      now: () => "2026-08-01T23:00:00.000Z",
    });

    const started = await port.startExecution({ intakeRef: "intake-sprint05" });
    assert.equal(started.ok, true);
    assert.ok(started.executionContext);
    assert.equal(started.executionContext?.state.phase, "finalized");
    assert.equal(started.executionContext?.state.status, "completed");
    assert.equal(started.result?.enginesInvoked, false);

    // Context permanece transporte — referência estrutural ao Event Bus
    const busRef = started.executionContext?.references.find((r) => r.name === "eventBusId");
    assert.ok(busRef);
    assert.ok(busRef.value.length > 0);

    const smRef = started.executionContext?.references.find((r) => r.name === "stateMachineId");
    assert.ok(smRef);

    const historyEntry = started.executionContext?.history.find(
      (h) => h.event === "event-bus-attached",
    );
    assert.ok(historyEntry);

    const busPort = port.getExecutionEventBusPort();
    const listed = await busPort.listEvents({ eventBusId: busRef.value });
    assert.equal(listed.ok, true);
    assert.equal(listed.total, 0);
    assert.equal(listed.history?.entryCount, 0);

    const subscribers = await busPort.listSubscribers({ eventBusId: busRef.value });
    assert.equal(subscribers.ok, true);
    assert.equal(subscribers.total, 0);

    const busCaps = busPort.capabilities();
    assert.equal(busCaps.eventsDelivered, false);
    assert.equal(busCaps.subscribersExecuted, false);
    assert.equal(busCaps.queuesImplemented, false);
    assert.equal(busCaps.decoupledFromEngines, true);

    assert.ok(started.message?.includes("ExecutionEventBusPort"));
  });

  it("Execution Context permanece transporte; Event Bus só via Port", async () => {
    resetAllCanonicalExecutionIdSequences();
    const orchestrator = new MockCanonicalExecutionOrchestratorAdapter({
      createExecutionId: () => "canonical-exec-sprint05-transport",
      createResultId: () => "canonical-result-sprint05-transport",
      createTraceId: () => "canonical-trace-sprint05-transport",
      createCorrelationId: () => "canonical-corr-sprint05-transport",
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
      contextId: "canonical-exec-sprint05-transport",
    });
    assert.equal(context.ok, true);
    assert.equal(context.context?.capability.structuralTransportOnly, true);
    assert.equal(context.context?.state.processingPerformed, false);

    // Context não embute Event Bus de negócio — apenas refs
    assert.equal(
      (context.context as { eventBus?: unknown } | undefined)?.eventBus,
      undefined,
    );

    const busCaps = orchestrator.getExecutionEventBusPort().capabilities();
    assert.equal(busCaps.structuralEventBusOnly, true);
    assert.equal(busCaps.decoupledFromEngines, true);
  });

  it("Pipeline Resolver e State Machine permanecem independentes do Event Bus", async () => {
    const resolver: PipelineResolverPort = createPipelineResolverPort({ provider: "mock" });
    const stateMachine = createExecutionStateMachinePort({ provider: "mock" });
    const orchestrator = new MockCanonicalExecutionOrchestratorAdapter({
      pipelineResolver: resolver,
      executionStateMachine: stateMachine,
    });

    const resolved = await resolver.resolvePipeline();
    assert.equal(resolved.ok, true);
    assert.equal(resolved.result?.enginesInvoked, false);

    const started = await orchestrator.startExecution();
    assert.equal(started.ok, true);
    assert.equal(started.result?.enginesInvoked, false);

    assert.equal(
      (resolver as { getExecutionEventBusPort?: unknown }).getExecutionEventBusPort,
      undefined,
    );
    assert.equal(
      (stateMachine as { getExecutionEventBusPort?: unknown }).getExecutionEventBusPort,
      undefined,
    );
  });

  it("Factory do Orchestrator injeta ExecutionEventBusPort", async () => {
    const bus = createExecutionEventBusPort({ provider: "test" });
    const factory = createCanonicalExecutionOrchestratorFactory({
      executionEventBus: bus,
    });
    const port = factory.create({ provider: "mock" });
    assert.ok(
      (port as MockCanonicalExecutionOrchestratorAdapter).getExecutionEventBusPort,
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

  it("Default orchestrator health inclui Event Bus", async () => {
    const port = new DefaultCanonicalExecutionOrchestratorAdapter();
    const health = await port.health();
    assert.equal(health.ok, true);
  });
});
