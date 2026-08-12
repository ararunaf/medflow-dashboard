#!/usr/bin/env node
/**
 * A7-02 — TISS-RUNTIME-04A Protocol Real Activation.
 *
 * Prova:
 *   - RealTissProtocolRuntimeAdapter ativado via provider `real-tiss`.
 *   - Reutiliza DefaultProtocolRuntimeAdapter para ciclo de vida, retry,
 *     observability, telemetry, health, capabilities, store.
 *   - ProtocolRuntimePort, QueueRuntimePort, WorkerRuntimePort, SchedulerRuntimePort,
 *     Retry, Dead Letter, ObservabilityRuntimePort reutilizados sem alteração.
 *   - BATCH_CREATED → PROTOCOL_SENT com persistence/audit não executados.
 */
process.env.MEDICFLOW_QUEUE_RUNTIME_BACKEND = "memory";

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ENTERPRISE_TISS_QUEUE_NAME,
  TISS_JOB_STATUS_BATCH_CREATED,
  TISS_JOB_STATUS_PROTOCOL_SENT,
  TISS_JOB_STATUS_XML_GENERATED,
  processTissProtocolJob,
} from "../../../src/lib/enterprise/queue-runtime/index.ts";
import { createOCRProviderPort } from "../../../src/lib/enterprise/ocr-provider/index.ts";
import {
  createBatchRuntimePort,
} from "../../../src/lib/enterprise/batch-runtime/index.ts";
import {
  createProtocolRuntimePort,
  RealTissProtocolRuntimeAdapter,
  REAL_TISS_PROTOCOL_RUNTIME_ADAPTER_ID,
  REAL_TISS_PROTOCOL_RUNTIME_VERSION,
} from "../../../src/lib/enterprise/protocol-runtime/index.ts";
import {
  createEnterpriseRuntime,
  resetEnterpriseRuntimeForTests,
  setEnterpriseRuntimeForTests,
  processTissBatchCreatedProtocolSent,
  processTissEnrichedXmlGenerated,
  processTissOcrParsed,
  processTissParsedValidated,
  processTissReceivedOcr,
  processTissValidatedEnriched,
  processTissXmlGeneratedBatchCreated,
  registerTissReceivedJob,
} from "../../../src/lib/enterprise/runtime/index.ts";
import { resetQueueRuntimeIdSequences } from "../../../src/lib/enterprise/queue-runtime/index.ts";

describe("A7-02 — TISS-RUNTIME-04A Protocol Real Activation", () => {
  it("1. RealTissProtocolRuntimeAdapter resolve via provider real-tiss e implementa ProtocolRuntimePort", () => {
    const port = createProtocolRuntimePort({ provider: "real-tiss" });
    assert.ok(port instanceof RealTissProtocolRuntimeAdapter);
    assert.equal(port.providerId, "real-tiss");

    const caps = port.capabilities();
    assert.equal(caps.provider, "real-tiss");
    assert.equal(caps.adapterId, REAL_TISS_PROTOCOL_RUNTIME_ADAPTER_ID);
    assert.equal(caps.supportsPrepareProfile, true);
    assert.equal(caps.supportsGetProfile, true);
    assert.equal(caps.supportsResolveProtocol, true);
    assert.equal(caps.runtimeReady, true);
    assert.equal(caps.soapImplemented, false);
    assert.equal(caps.protocolResolutionImplemented, false);

    const info = port.providerInfo();
    assert.equal(info.providerId, "real-tiss");
    assert.equal(info.metadata.version, REAL_TISS_PROTOCOL_RUNTIME_VERSION);
    assert.equal(info.metadata.vendor, "medicflow-enterprise");
    assert.equal(info.providerType, "PROTOCOL_RUNTIME");
  });

  it("2. RealTissProtocolRuntimeAdapter gera perfil real a partir de BATCH_CREATED", async () => {
    const port = createProtocolRuntimePort({ provider: "real-tiss" });

    const prepared = await port.prepareProfile({
      profileName: "TISS real protocol",
      protocolContext: {
        kind: "canonical-protocol-context",
        contextId: "ctx-tiss-real-04a",
        correlationId: "corr-tiss-real-04a",
        structuralNotes: "Real TISS protocol profile",
      },
    });

    assert.equal(prepared.ok, true);
    assert.equal(prepared.provider, "real-tiss");
    assert.equal(prepared.protocolResolved, false);
    assert.ok(prepared.profile?.profileId);
    assert.equal(prepared.profile?.state, "PENDING_RESOLUTION");
    assert.equal(prepared.profile?.abstractProtocolRef, "tiss-ans-3.05.00");
    assert.equal(prepared.profile?.owner, "real-tiss");
    assert.ok(prepared.profile?.tags?.includes("real-tiss"));
    assert.ok(prepared.profile?.tags?.includes("tiss-protocol"));
    assert.ok(prepared.protocolContext);
    assert.equal(prepared.protocolContext?.kind, "canonical-protocol-context");

    const loaded = await port.getProfile({ profileId: prepared.profile!.profileId! });
    assert.equal(loaded.ok, true);
    assert.equal(loaded.provider, "real-tiss");
    assert.equal(loaded.profile?.profileId, prepared.profile?.profileId);
    assert.equal(loaded.profile?.state, "PENDING_RESOLUTION");
  });

  it("3. resolveProtocol gera resolver real TISS sem resolução funcional", async () => {
    const port = createProtocolRuntimePort({ provider: "real-tiss" });

    const resolved = await port.resolveProtocol({});
    assert.equal(resolved.ok, true);
    assert.equal(resolved.provider, "real-tiss");
    assert.equal(resolved.protocolResolved, false);
    assert.equal(resolved.protocolResolutionImplemented, false);
    assert.ok(resolved.resolver?.notes?.includes("ANS SOAP"));
    assert.equal(resolved.resolver?.soapImplemented, false);
    assert.equal(resolved.resolver?.restImplemented, false);
  });

  it("4. End-to-end: BATCH_CREATED → PROTOCOL_SENT via RealTissProtocolRuntimeAdapter", async () => {
    resetEnterpriseRuntimeForTests();
    resetQueueRuntimeIdSequences();

    const runtime = createEnterpriseRuntime({
      runtimeId: "test-tiss-04a-real",
      ocrProviderPort: createOCRProviderPort({ provider: "mock" }),
      batchRuntimePort: createBatchRuntimePort({ provider: "real-tiss" }),
      protocolRuntimePort: createProtocolRuntimePort({ provider: "real-tiss" }),
    });
    setEnterpriseRuntimeForTests(runtime);

    await registerTissReceivedJob({
      source: "document-intake",
      correlationId: "corr-tiss-04a-real",
      documentId: "doc-tiss-04a-real",
      jobId: "job-tiss-04a-real",
      payloadRef: "storage://clinical-documents/doc-tiss-04a-real",
    });

    await processTissReceivedOcr({ preferredProviderReference: "mock", waitTimeoutMs: 8_000, pollIntervalMs: 15 });
    await processTissOcrParsed({ waitTimeoutMs: 8_000, pollIntervalMs: 15 });
    await processTissParsedValidated({ waitTimeoutMs: 8_000, pollIntervalMs: 15 });
    await processTissValidatedEnriched({ waitTimeoutMs: 8_000, pollIntervalMs: 15 });

    const xmlResult = await processTissEnrichedXmlGenerated({ waitTimeoutMs: 8_000, pollIntervalMs: 15 });
    assert.equal(xmlResult.ok, true);
    assert.equal(xmlResult.job?.status, TISS_JOB_STATUS_XML_GENERATED);

    const batchResult = await processTissXmlGeneratedBatchCreated({ waitTimeoutMs: 8_000, pollIntervalMs: 15 });
    assert.equal(batchResult.ok, true);
    assert.equal(batchResult.batchCreated, true);
    assert.equal(batchResult.protocolExecuted, false);
    assert.equal(batchResult.persistenceExecuted, false);
    assert.equal(batchResult.auditExecuted, false);

    const protocolResult = await processTissBatchCreatedProtocolSent({ waitTimeoutMs: 8_000, pollIntervalMs: 15 });

    assert.equal(protocolResult.ok, true);
    assert.equal(protocolResult.entry, "getEnterpriseRuntime");
    assert.equal(protocolResult.runtimeId, "test-tiss-04a-real");
    assert.equal(protocolResult.protocolSent, true);
    assert.equal(protocolResult.protocolResolved, false);
    assert.equal(protocolResult.persistenceExecuted, false);
    assert.equal(protocolResult.auditExecuted, false);
    assert.equal(protocolResult.batchCreated, true);
    assert.equal(protocolResult.xmlGenerated, true);
    assert.equal(protocolResult.infrastructure.protocolRuntimePort, true);
    assert.equal(protocolResult.infrastructure.queueRuntimePort, true);
    assert.equal(protocolResult.infrastructure.workerRuntimePort, true);
    assert.equal(protocolResult.infrastructure.schedulerRuntimePort, true);
    assert.equal(protocolResult.infrastructure.observabilityRuntimePort, true);
    assert.equal(protocolResult.infrastructure.retryInfrastructure, true);
    assert.equal(protocolResult.infrastructure.deadLetterRuntime, true);
    assert.equal(protocolResult.job?.status, TISS_JOB_STATUS_PROTOCOL_SENT);

    assert.equal(runtime.getProtocolRuntimePort().providerId, "real-tiss");

    const queue = runtime.getQueueRuntimePort();
    const peeked = await queue.peek({
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
      messageId: protocolResult.job!.jobId,
    });
    assert.equal(peeked.ok, true);
    assert.equal(peeked.queueMessage?.status, "enqueued");
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.tissJobStatus, TISS_JOB_STATUS_PROTOCOL_SENT);
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.protocolSent, true);
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.protocolExecuted, true);
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.protocolResolved, false);
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.persistenceExecuted, false);
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.auditExecuted, false);
  });

  it("5. Observability: health, providerInfo e capabilities reportam real-tiss", async () => {
    const port = createProtocolRuntimePort({ provider: "real-tiss" });

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "real-tiss");
    assert.equal(health.runtimeReady, true);
    assert.equal(health.soapImplemented, false);
    assert.equal(health.protocolResolutionImplemented, false);

    const caps = port.capabilities();
    assert.equal(caps.provider, "real-tiss");
    assert.equal(caps.adapterId, REAL_TISS_PROTOCOL_RUNTIME_ADAPTER_ID);

    const info = port.providerInfo();
    assert.equal(info.providerId, "real-tiss");
    assert.equal(info.status, "ready");
    assert.equal(info.providerType, "PROTOCOL_RUNTIME");
  });

  it("6. Retry com transient failures funciona via DefaultProtocolRuntimeAdapter subjacente", async () => {
    const port = new RealTissProtocolRuntimeAdapter({
      provider: "real-tiss",
      failAttempts: 2,
      defaultRetryCount: 2,
      defaultRetryBackoffMs: 10,
    });

    const prepared = await port.prepareProfile({
      profileName: "TISS real protocol with retry",
      protocolContext: {
        kind: "canonical-protocol-context",
        contextId: "ctx-tiss-real-retry",
        structuralNotes: "Real TISS protocol retry",
      },
    });

    assert.equal(prepared.ok, true);
    assert.equal(prepared.provider, "real-tiss");
    assert.ok(prepared.telemetry!.attempts > 1, `expected >1 attempts, got ${prepared.telemetry?.attempts}`);
  });

  it("7. Dead Letter: processTissProtocolJob rejeita status != BATCH_CREATED e devolve nack", async () => {
    resetQueueRuntimeIdSequences();
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({
      runtimeId: "test-tiss-04a-dl",
      ocrProviderPort: createOCRProviderPort({ provider: "mock" }),
      protocolRuntimePort: createProtocolRuntimePort({ provider: "real-tiss" }),
    });
    setEnterpriseRuntimeForTests(runtime);

    const queue = runtime.getQueueRuntimePort();
    const enqueued = await queue.enqueue({
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
      messageId: "job-already-protocol",
      metadata: {
        kind: "canonical-queue-metadata",
        source: "unit-test",
        tags: ["tiss-job", TISS_JOB_STATUS_PROTOCOL_SENT],
        customAttributes: {
          status: TISS_JOB_STATUS_PROTOCOL_SENT,
          tissJobStatus: TISS_JOB_STATUS_PROTOCOL_SENT,
          batchCreated: true,
          protocolSent: true,
          protocolExecuted: false,
          persistenceExecuted: false,
          auditExecuted: false,
        },
      },
    });
    assert.equal(enqueued.ok, true);

    const result = await processTissProtocolJob({
      getQueueRuntimePort: () => queue,
      getProtocolRuntimePort: () => runtime.getProtocolRuntimePort(),
      message: enqueued.queueMessage!,
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
    });

    assert.equal(result.ok, false);
    assert.equal(result.settle, "nack");
    assert.equal(result.protocolSent, false);
    assert.equal(result.protocolResolved, false);
    assert.equal(result.persistenceExecuted, false);
    assert.equal(result.auditExecuted, false);
    assert.equal(result.code, "TISS_PROTOCOL_JOB_STATUS_NOT_BATCH_CREATED");

    const missingPort = await processTissProtocolJob({
      getQueueRuntimePort: undefined as any,
      getProtocolRuntimePort: () => runtime.getProtocolRuntimePort(),
      message: enqueued.queueMessage!,
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
    });
    assert.equal(missingPort.ok, false);
    assert.equal(missingPort.settle, "nack-error");
    assert.equal(missingPort.code, "TISS_PROTOCOL_JOB_MISSING_QUEUE_PORT");
  });

  it("8. Cancelamento via AbortSignal", async () => {
    const port = createProtocolRuntimePort({ provider: "real-tiss" });
    const controller = new AbortController();
    controller.abort();

    const prepared = await port.prepareProfile({
      profileName: "TISS real protocol cancelled",
      signal: controller.signal,
    });

    assert.equal(prepared.ok, false);
    assert.equal(prepared.provider, "real-tiss");
    assert.ok(prepared.code === "PROTOCOL_RUNTIME_CANCELLED" || prepared.code?.includes("CANCELLED"));
  });
});
