#!/usr/bin/env node
/**
 * EPC-24 Sprint 03 — Execution Context Foundation
 * Prova Application → ExecutionContextPort → Adapter → Store
 * sem tocar produto e sem invocar OCR / IA / Mapping / regras.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_EXECUTION_CONTEXT_ADAPTER_ID,
  DEFAULT_EXECUTION_CONTEXT_STORE_ID,
  DefaultExecutionContextAdapter,
  DefaultExecutionContextStore,
  MOCK_EXECUTION_CONTEXT_ADAPTER_ID,
  MockExecutionContextAdapter,
  createExecutionContextFactory,
  createExecutionContextPort,
  getExecutionContextHealthSummary,
  resetAllExecutionContextIdSequences,
  type ExecutionContextPort,
} from "../../../src/lib/enterprise/execution-context/index.ts";
import {
  DefaultCanonicalExecutionOrchestratorAdapter,
  MockCanonicalExecutionOrchestratorAdapter,
  createCanonicalExecutionOrchestratorFactory,
  resetAllCanonicalExecutionIdSequences,
} from "../../../src/lib/enterprise/canonical-execution-orchestrator/index.ts";
import {
  createPipelineResolverPort,
  type PipelineResolverPort,
} from "../../../src/lib/enterprise/pipeline-resolver/index.ts";

describe("EPC-24 ExecutionContextPort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy", async () => {
    const port: ExecutionContextPort = new MockExecutionContextAdapter({ provider: "mock" });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.storedContextCount, 0);
    assert.equal(health.storedSnapshotCount, 0);
    assert.equal(health.storedHistoryCount, 0);

    const caps = port.capabilities();
    assert.equal(caps.adapterId, "mock-in-memory");
    assert.equal(caps.supportsCreateContext, true);
    assert.equal(caps.supportsUpdateContext, true);
    assert.equal(caps.supportsGetContext, true);
    assert.equal(caps.supportsListContexts, true);
    assert.equal(caps.supportsHealth, true);
    assert.equal(caps.supportsCapabilities, true);
    assert.equal(caps.structuralTransportOnly, true);
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

  it("DefaultExecutionContextAdapter é o default da fundação", async () => {
    const port: ExecutionContextPort = new DefaultExecutionContextAdapter();
    assert.equal(port.providerId, "default");
    const caps = port.capabilities();
    assert.equal(caps.adapterId, DEFAULT_EXECUTION_CONTEXT_ADAPTER_ID);
    assert.equal(caps.structuralTransportOnly, true);
    assert.equal(caps.implementsOcr, false);
    assert.equal(caps.implementsAi, false);

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "default");
  });

  it("test adapter é resolvido pelo provider", async () => {
    const port = createExecutionContextPort({ provider: "test" });
    assert.equal(port.providerId, "test");
    const health = await port.health();
    assert.equal(health.ok, true);
  });

  it("Default usa ping opcional sem I/O externo", async () => {
    const port = new DefaultExecutionContextAdapter({
      store: new DefaultExecutionContextStore(),
      ping: async () => ({
        ok: true,
        message: "execution-context probe custom",
      }),
    });
    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.message, "execution-context probe custom");
    assert.equal(typeof health.latencyMs, "number");
  });

  it("provider default resolve DefaultExecutionContextAdapter", () => {
    const defaultPort = createExecutionContextPort();
    assert.equal(defaultPort.providerId, "default");
  });

  it("Factory materializa adapters corretos", () => {
    const factory = createExecutionContextFactory();
    assert.equal(factory.create().providerId, "default");
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
  });

  it("PoC Application depende só do Port (inversão de dependência)", async () => {
    const port = createExecutionContextPort({ provider: "mock" });
    const summary = await getExecutionContextHealthSummary(port);

    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.provider, "mock");
    assert.equal(summary.capabilities.provider, "mock");
    assert.equal(summary.health.ok, true);
  });

  it("MOCK adapter id constante está estável", () => {
    assert.equal(MOCK_EXECUTION_CONTEXT_ADAPTER_ID, "mock-in-memory");
    assert.equal(DEFAULT_EXECUTION_CONTEXT_STORE_ID, "default-in-process");
  });
});

describe("EPC-24 Execution Context — criação e modelos canônicos", () => {
  it("createContext materializa Identity, Metadata, State, Snapshots, History, Trace", async () => {
    resetAllExecutionContextIdSequences();
    const port = new MockExecutionContextAdapter({
      createContextId: () => "execution-context-fixed-1",
      createReferenceId: (() => {
        let n = 0;
        return () => `ref-fixed-${++n}`;
      })(),
      createHistoryId: (() => {
        let n = 0;
        return () => `history-fixed-${++n}`;
      })(),
      createSnapshotId: (() => {
        let n = 0;
        return () => `snapshot-fixed-${++n}`;
      })(),
      createTraceId: () => "trace-fixed-1",
      now: () => "2026-08-01T18:00:00.000Z",
    });

    const created = await port.createContext({
      correlationId: "corr-1",
      tenantRef: "tenant-opaque",
      channel: "enterprise-test",
      tags: ["context", "foundation"],
      structuralNotes: "structural only",
      references: [{ name: "intakeRef", value: "intake-1", stageName: "document-intake" }],
    });

    assert.equal(created.ok, true);
    assert.equal(created.context?.kind, "execution-context");
    assert.equal(created.context?.id, "execution-context-fixed-1");

    // Identity
    assert.equal(created.context?.identity.kind, "execution-context-identity");
    assert.equal(created.context?.identity.contextId, "execution-context-fixed-1");
    assert.equal(created.context?.identity.executionId, "execution-context-fixed-1");
    assert.equal(created.context?.identity.correlationId, "corr-1");
    assert.equal(created.context?.identity.tenantRef, "tenant-opaque");
    assert.equal(created.context?.identity.channel, "enterprise-test");

    // Metadata
    assert.equal(created.context?.metadata.kind, "execution-context-metadata");
    assert.deepEqual(created.context?.metadata.tags, ["context", "foundation"]);
    assert.equal(created.context?.metadata.createdAt, "2026-08-01T18:00:00.000Z");
    assert.equal(created.context?.metadata.structuralNotes, "structural only");

    // State
    assert.equal(created.context?.state.kind, "execution-context-state");
    assert.equal(created.context?.state.status, "pending");
    assert.equal(created.context?.state.phase, "created");
    assert.equal(created.context?.state.enginesInvoked, false);
    assert.equal(created.context?.state.stagesExecuted, false);
    assert.equal(created.context?.state.processingPerformed, false);

    // References
    assert.equal(created.context?.references.length, 1);
    assert.equal(created.context?.references[0]?.kind, "execution-context-reference");
    assert.equal(created.context?.references[0]?.name, "intakeRef");

    // History
    assert.equal(created.context?.history.length, 1);
    assert.equal(created.context?.history[0]?.kind, "execution-context-history");
    assert.equal(created.context?.history[0]?.event, "context-created");

    // Capability
    assert.equal(created.context?.capability.kind, "execution-context-capability");
    assert.equal(created.context?.capability.structuralTransportOnly, true);
    assert.equal(created.context?.capability.decoupledFromEngines, true);

    // Snapshots
    assert.equal(created.context?.snapshots.length, 1);
    assert.equal(created.context?.snapshots[0]?.kind, "execution-context-snapshot");
    assert.equal(created.context?.snapshots[0]?.phase, "created");

    // Trace
    assert.equal(created.context?.trace?.kind, "execution-context-trace");
    assert.equal(created.context?.trace?.structuralOnly, true);
    assert.equal(created.context?.trace?.status, "pending");

    // Stages vazios na criação
    assert.equal(created.context?.stages.length, 0);
  });

  it("updateContext enriquece Stages, History, Snapshots e References", async () => {
    const port = new MockExecutionContextAdapter({
      createContextId: () => "ctx-update-1",
      now: () => "2026-08-01T18:30:00.000Z",
    });

    await port.createContext({ correlationId: "corr-upd" });

    const updated = await port.updateContext({
      contextId: "ctx-update-1",
      status: "ready",
      phase: "pipeline-attached",
      pipeline: {
        pipelineId: "canonical-enterprise-pipeline",
        pipelineName: "Canonical Enterprise Pipeline",
        stageCount: 11,
        nodeCount: 11,
        officialPortRefs: ["document-intake", "ai-auditor"],
        officialPortContracts: ["DocumentIntakePort", "AIAuditorPort"],
        enginesInvoked: false,
        stagesExecuted: false,
        attachedAt: "2026-08-01T18:30:00.000Z",
      },
      stages: [
        {
          kind: "execution-context-stage",
          id: "stage-1",
          name: "document-intake",
          order: 0,
          portRef: "document-intake",
          portContract: "DocumentIntakePort",
          status: "ready",
        },
      ],
      appendReferences: [{ name: "processingRef", value: "proc-1" }],
      appendHistory: [
        {
          event: "pipeline-attached",
          phase: "pipeline-attached",
          status: "ready",
          occurredAt: "2026-08-01T18:30:00.000Z",
        },
      ],
      appendSnapshot: {
        status: "ready",
        phase: "pipeline-attached",
        stageCount: 1,
        referenceCount: 1,
        historyCount: 2,
        capturedAt: "2026-08-01T18:30:00.000Z",
      },
    });

    assert.equal(updated.ok, true);
    assert.equal(updated.context?.state.status, "ready");
    assert.equal(updated.context?.state.phase, "pipeline-attached");
    assert.equal(updated.context?.stages.length, 1);
    assert.equal(updated.context?.stages[0]?.kind, "execution-context-stage");
    assert.equal(updated.context?.pipeline?.pipelineId, "canonical-enterprise-pipeline");
    assert.equal(updated.context?.pipeline?.enginesInvoked, false);
    assert.ok(updated.context!.history.length >= 2);
    assert.ok(updated.context!.snapshots.length >= 2);
    assert.ok(updated.context!.references.some((r) => r.name === "processingRef"));
  });

  it("getContext e listContexts cobrem consulta estrutural", async () => {
    const port = new MockExecutionContextAdapter({
      createContextId: () => "ctx-list-1",
    });

    await port.createContext({ channel: "list-test" });

    const got = await port.getContext({ contextId: "ctx-list-1" });
    assert.equal(got.ok, true);
    assert.equal(got.context?.id, "ctx-list-1");

    const listed = await port.listContexts({ status: "pending" });
    assert.equal(listed.ok, true);
    assert.equal(listed.total, 1);

    const missing = await port.getContext({ contextId: "missing" });
    assert.equal(missing.ok, false);
    assert.equal(missing.code, "not_found");
  });

  it("mock unhealthy bloqueia operações", async () => {
    const port = new MockExecutionContextAdapter({
      healthy: false,
      message: "offline for homologation",
    });
    const health = await port.health();
    assert.equal(health.ok, false);

    const created = await port.createContext({});
    assert.equal(created.ok, false);
    assert.equal(created.code, "unhealthy");
  });

  it("Factory / Provider / Adapter / Store / Port cobertos", () => {
    const store = new DefaultExecutionContextStore();
    assert.equal(store.storeId, DEFAULT_EXECUTION_CONTEXT_STORE_ID);
    assert.equal(store.health().ok, true);

    const factory = createExecutionContextFactory({ store });
    const port = factory.create({ provider: "mock" });
    assert.equal(port.providerId, "mock");
    assert.equal(typeof port.createContext, "function");
    assert.equal(typeof port.updateContext, "function");
    assert.equal(typeof port.getContext, "function");
    assert.equal(typeof port.listContexts, "function");
    assert.equal(typeof port.health, "function");
    assert.equal(typeof port.capabilities, "function");
  });
});

describe("EPC-24 Sprint 03 — integração estrutural Orchestrator + Execution Context", () => {
  it("Orchestrator cria e utiliza exclusivamente ExecutionContextPort", async () => {
    resetAllCanonicalExecutionIdSequences();
    resetAllExecutionContextIdSequences();

    const contextPort = createExecutionContextPort({ provider: "mock" });
    const port = new MockCanonicalExecutionOrchestratorAdapter({
      executionContext: contextPort,
      createExecutionId: () => "canonical-exec-ctx-1",
      createResultId: () => "canonical-result-ctx-1",
      createTraceId: () => "canonical-trace-ctx-1",
      createCorrelationId: () => "canonical-corr-ctx-1",
      createStepId: (() => {
        let n = 0;
        return () => `canonical-step-ctx-${++n}`;
      })(),
      now: () => "2026-08-01T19:00:00.000Z",
    });

    assert.ok(port.getExecutionContextPort());
    const caps = port.capabilities();
    assert.equal(caps.dependsOnExecutionContext, true);
    assert.equal(caps.usesExecutionContextExclusively, true);
    assert.equal(caps.dependsOnPipelineResolver, true);

    const started = await port.startExecution({ intakeRef: "intake-ctx-1" });
    assert.equal(started.ok, true);
    assert.ok(started.executionContext);
    assert.equal(started.executionContext?.kind, "execution-context");
    assert.equal(started.executionContext?.id, "canonical-exec-ctx-1");
    assert.equal(started.executionContext?.state.status, "completed");
    assert.equal(started.executionContext?.state.phase, "finalized");
    assert.equal(started.executionContext?.state.enginesInvoked, false);
    assert.equal(started.executionContext?.state.processingPerformed, false);
    assert.equal(started.executionContext?.stages.length, 11);
    assert.ok(started.executionContext?.pipeline);
    assert.equal(started.executionContext?.pipeline?.enginesInvoked, false);
    assert.equal(started.executionContext?.pipeline?.stagesExecuted, false);
    assert.ok(started.executionContext!.history.length >= 3);
    assert.ok(started.executionContext!.snapshots.length >= 2);
    assert.equal(started.result?.enginesInvoked, false);

    const stored = await contextPort.getContext({ contextId: "canonical-exec-ctx-1" });
    assert.equal(stored.ok, true);
    assert.equal(stored.context?.state.phase, "finalized");
  });

  it("Pipeline Resolver permanece independente do conteúdo do Context", async () => {
    const resolver: PipelineResolverPort = createPipelineResolverPort({ provider: "mock" });
    const contextPort = createExecutionContextPort({ provider: "mock" });

    // Resolver NÃO importa / não recebe ExecutionContext — apenas ResolvePipelineInput canônico.
    const resolved = await resolver.resolvePipeline({
      correlationId: "corr-independent",
      tenantRef: "tenant-x",
      channel: "test",
    });
    assert.equal(resolved.ok, true);
    assert.equal(resolved.result?.stagesExecuted, false);
    assert.equal(resolved.result?.enginesInvoked, false);

    // Context criado e enriquecido pelo Orchestrator — Resolver não conhece o Context.
    const created = await contextPort.createContext({ correlationId: "corr-independent" });
    assert.equal(created.ok, true);

    const orchestrator = new DefaultCanonicalExecutionOrchestratorAdapter({
      pipelineResolver: resolver,
      executionContext: contextPort,
      createExecutionId: () => "canonical-exec-independent-1",
      now: () => "2026-08-01T19:30:00.000Z",
    });

    // Novo context id para a execução (store do contextPort já tem corr-independent).
    const started = await orchestrator.startExecution({
      correlationId: "corr-orch-indep",
      intakeRef: "intake-indep",
    });
    assert.equal(started.ok, true);
    assert.equal(started.executionContext?.pipeline?.pipelineId, "canonical-enterprise-pipeline");
    assert.equal(orchestrator.capabilities().noDirectEngineCoupling, true);

    // Factory aceita DI estrutural.
    const factory = createCanonicalExecutionOrchestratorFactory({
      pipelineResolver: resolver,
      executionContext: contextPort,
    });
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
  });

  it("Default Orchestrator enriquece Context sem processamento real", async () => {
    resetAllCanonicalExecutionIdSequences();
    const port = new DefaultCanonicalExecutionOrchestratorAdapter({
      now: () => "2026-08-01T20:00:00.000Z",
    });

    const started = await port.startExecution({ intakeRef: "intake-default-ctx" });
    assert.equal(started.ok, true);
    assert.ok(started.executionContext);
    assert.equal(started.executionContext?.capability.implementsOcr, false);
    assert.equal(started.executionContext?.capability.implementsAi, false);
    assert.equal(started.executionContext?.capability.implementsTissRules, false);
    assert.equal(
      started.executionContext?.stages.every((s) => s.portRef.length > 0),
      true,
    );
    assert.equal(started.result?.enginesInvoked, false);

    const got = await port.getExecution({ executionId: started.context!.executionId });
    assert.equal(got.ok, true);
    assert.ok(got.executionContext);
    assert.equal(got.executionContext?.id, started.context?.executionId);
  });
});
