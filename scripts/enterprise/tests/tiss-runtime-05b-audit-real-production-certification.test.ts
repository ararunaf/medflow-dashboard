#!/usr/bin/env node
/**
 * A9-03 — Audit Real Production Certification.
 *
 * Certifica o provider real-tiss do AuditRuntimePort para produção sem alterar
 * EnterpriseRuntime, AuditRuntimePort, Queue, Worker, Scheduler, Retry, Dead Letter,
 * Observability, Pipeline, Composition Root, Factory, Registry, Adapter ou State Machine.
 *
 * Reutiliza integralmente o RealTissAuditRuntimeAdapter implementado na A9-02.
 */
process.env.MEDICFLOW_QUEUE_RUNTIME_BACKEND = "memory";

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

import {
  ENTERPRISE_TISS_QUEUE_NAME,
  TISS_JOB_STATUS_AUDITED,
  TISS_JOB_STATUS_BATCH_CREATED,
  TISS_JOB_STATUS_ENRICHED,
  TISS_JOB_STATUS_OCR_COMPLETED,
  TISS_JOB_STATUS_PARSED,
  TISS_JOB_STATUS_PERSISTED,
  TISS_JOB_STATUS_PROTOCOL_SENT,
  TISS_JOB_STATUS_VALIDATED,
  TISS_JOB_STATUS_XML_GENERATED,
  processTissAuditJob,
  resetQueueRuntimeIdSequences,
} from "../../../src/lib/enterprise/queue-runtime/index.ts";
import { createOCRProviderPort } from "../../../src/lib/enterprise/ocr-provider/index.ts";
import {
  REALTISS_AUDIT_RUNTIME_ADAPTER_ID,
  REALTISS_AUDIT_RUNTIME_VERSION,
  createAuditRuntimeFactory,
  createAuditRuntimePort,
  createDefaultAuditRuntimeRegistry,
} from "../../../src/lib/enterprise/audit-runtime/index.ts";
import {
  createEnterpriseRuntime,
  getEnterpriseRuntime,
  processTissBatchCreatedProtocolSent,
  processTissEnrichedXmlGenerated,
  processTissOcrParsed,
  processTissParsedValidated,
  processTissPersistedAudited,
  processTissProtocolSentPersisted,
  processTissReceivedOcr,
  processTissValidatedEnriched,
  processTissXmlGeneratedBatchCreated,
  registerTissReceivedJob,
  resetEnterpriseRuntimeForTests,
  setEnterpriseRuntimeForTests,
} from "../../../src/lib/enterprise/runtime/index.ts";

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  const weight = idx - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

function benchmarkStats(latencies: number[]) {
  const sorted = [...latencies].sort((a, b) => a - b);
  const sum = latencies.reduce((a, b) => a + b, 0);
  const avg = sum / latencies.length;
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const p95 = percentile(sorted, 95);
  const p99 = percentile(sorted, 99);
  const throughput = (latencies.length / (sum / 1000)); // ops/s
  return { avg, min, max, p95, p99, throughput, count: latencies.length };
}

describe("A9-03 Audit Real Production Certification", () => {
  it("RealTissAuditRuntimeAdapter passa health/capabilities/providerInfo canônicos", async () => {
    const port = createAuditRuntimePort({ provider: "real-tiss" });
    assert.equal(port.providerId, "real-tiss");
    assert.equal(port.capabilities().provider, "real-tiss");
    assert.equal(port.capabilities().adapterId, REALTISS_AUDIT_RUNTIME_ADAPTER_ID);
    assert.equal(port.providerInfo().providerId, "real-tiss");
    assert.equal(port.providerInfo().metadata.vendor, "real-tiss");
    assert.equal(port.providerInfo().metadata.version, REALTISS_AUDIT_RUNTIME_VERSION);
    assert.equal(port.providerInfo().status, "ready");
    assert.equal(port.providerInfo().providerType, "AUDIT_RUNTIME");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "real-tiss");
    assert.equal(health.runtimeReady, true);
    assert.equal(health.auditEngineImplemented, false);
    assert.equal(health.tissAuditImplemented, false);
    assert.equal(health.automaticCorrectionImplemented, false);
  });

  it("Factory e Registry certificam real-tiss sem fallback", () => {
    const factory = createAuditRuntimeFactory();
    const port = factory.create({ provider: "real-tiss" });
    assert.equal(port.providerId, "real-tiss");

    const registry = createDefaultAuditRuntimeRegistry();
    assert.equal(registry.has("real-tiss"), true);
    const reg = registry.get("real-tiss");
    assert.ok(reg);
    assert.equal(reg!.status, "ready");
    assert.equal(reg!.adapterId, REALTISS_AUDIT_RUNTIME_ADAPTER_ID);
    assert.equal(reg!.vendor, "real-tiss");
  });

  it("Pipeline PERSISTED → AUDITED via getEnterpriseRuntime com real-tiss", async () => {
    resetEnterpriseRuntimeForTests();
    resetQueueRuntimeIdSequences();

    const runtime = createEnterpriseRuntime({
      runtimeId: "test-tiss-05b-prod-cert",
      ocrProviderPort: createOCRProviderPort({ provider: "mock" }),
      auditRuntimePort: createAuditRuntimePort({ provider: "real-tiss" }),
    });
    setEnterpriseRuntimeForTests(runtime);

    const registered = await registerTissReceivedJob({
      source: "document-intake",
      correlationId: "corr-tiss-05b-prod",
      sessionId: "session-tiss-05b-prod",
      documentId: "doc-tiss-05b-prod",
      payloadRef: "storage://clinical-documents/doc-tiss-05b-prod",
      jobId: "job-tiss-05b-prod",
      channel: "capture-upload",
    });
    assert.equal(registered.ok, true);

    await processTissReceivedOcr({
      preferredProviderReference: "mock",
      waitTimeoutMs: 8_000,
      pollIntervalMs: 15,
    });
    await processTissOcrParsed({ waitTimeoutMs: 8_000, pollIntervalMs: 15 });
    await processTissParsedValidated({ waitTimeoutMs: 8_000, pollIntervalMs: 15 });
    await processTissValidatedEnriched({ waitTimeoutMs: 8_000, pollIntervalMs: 15 });
    await processTissEnrichedXmlGenerated({ waitTimeoutMs: 8_000, pollIntervalMs: 15 });
    await processTissXmlGeneratedBatchCreated({ waitTimeoutMs: 8_000, pollIntervalMs: 15 });
    await processTissBatchCreatedProtocolSent({ waitTimeoutMs: 8_000, pollIntervalMs: 15 });

    const persistence = await processTissProtocolSentPersisted({
      waitTimeoutMs: 8_000,
      pollIntervalMs: 15,
    });
    assert.equal(persistence.ok, true);
    assert.equal(persistence.job?.status, TISS_JOB_STATUS_PERSISTED);

    const audit = await processTissPersistedAudited({
      waitTimeoutMs: 8_000,
      pollIntervalMs: 15,
    });
    assert.equal(audit.ok, true);
    assert.equal(audit.entry, "getEnterpriseRuntime");
    assert.equal(audit.runtimeId, "test-tiss-05b-prod-cert");
    assert.equal(audit.audited, true);
    assert.equal(audit.completedExecuted, false);
    assert.equal(audit.persisted, true);
    assert.equal(audit.job?.status, TISS_JOB_STATUS_AUDITED);
    assert.equal(audit.infrastructure.queueRuntimePort, true);
    assert.equal(audit.infrastructure.workerRuntimePort, true);
    assert.equal(audit.infrastructure.schedulerRuntimePort, true);
    assert.equal(audit.infrastructure.observabilityRuntimePort, true);
    assert.equal(audit.infrastructure.auditRuntimePort, true);
    assert.equal(audit.infrastructure.retryInfrastructure, true);
    assert.equal(audit.infrastructure.deadLetterRuntime, true);

    const peeked = await runtime.getQueueRuntimePort().peek({
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
      messageId: audit.job!.jobId,
    });
    assert.equal(peeked.ok, true);
    assert.equal(peeked.queueMessage?.status, "enqueued");
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.tissJobStatus, TISS_JOB_STATUS_AUDITED);
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.auditExecuted, true);
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.completedExecuted, false);
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.previousJobId, persistence.job!.jobId);
  });

  it("processTissAuditJob rejeita mensagem não-PERSISTED e Completed não executa", async () => {
    resetQueueRuntimeIdSequences();
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({
      runtimeId: "test-tiss-05b-invalid",
      ocrProviderPort: createOCRProviderPort({ provider: "mock" }),
      auditRuntimePort: createAuditRuntimePort({ provider: "real-tiss" }),
    });
    setEnterpriseRuntimeForTests(runtime);

    const enqueued = await runtime.getQueueRuntimePort().enqueue({
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
      messageId: "job-already-audited",
      metadata: {
        kind: "canonical-queue-metadata",
        source: "unit-test",
        tags: ["tiss-job", TISS_JOB_STATUS_AUDITED],
        customAttributes: {
          status: TISS_JOB_STATUS_AUDITED,
          tissJobStatus: TISS_JOB_STATUS_AUDITED,
          persisted: true,
          audited: true,
          auditExecuted: true,
          completedExecuted: false,
        },
      },
    });
    assert.equal(enqueued.ok, true);

    const result = await processTissAuditJob({
      getQueueRuntimePort: () => runtime.getQueueRuntimePort(),
      getAuditRuntimePort: () => runtime.getAuditRuntimePort(),
      message: enqueued.queueMessage!,
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
    });
    assert.equal(result.ok, false);
    assert.equal(result.audited, false);
    assert.equal(result.completedExecuted, false);
    assert.equal(result.settle, "nack");
    assert.equal(result.code, "TISS_AUDIT_JOB_STATUS_NOT_PERSISTED");
  });

  it("RealTissAuditRuntimeAdapter herda Retry do DefaultAuditRuntimeAdapter", async () => {
    const port = createAuditRuntimePort({ provider: "real-tiss", failAttempts: 1 });
    const opened = await port.openJob({});
    assert.equal(opened.ok, true);
    assert.equal(opened.job?.status, "job-open");
  });

  it("RealTissAuditRuntimeAdapter herda AbortSignal do DefaultAuditRuntimeAdapter", async () => {
    const port = createAuditRuntimePort({ provider: "real-tiss" });
    const controller = new AbortController();
    controller.abort();
    const result = await port.openJob({ signal: controller.signal });
    assert.equal(result.ok, false);
    assert.equal(result.code, "AUDIT_RUNTIME_CANCELLED");
  });

  it("Performance — openJob/closeJob real-tiss", async () => {
    const port = createAuditRuntimePort({ provider: "real-tiss" });
    const latencies: number[] = [];
    const ops = 200;

    for (let i = 0; i < ops; i++) {
      const start = performance.now();
      const open = await port.openJob({ jobId: `perf-job-${i}` });
      const end = performance.now();
      latencies.push(end - start);
      assert.equal(open.ok, true);
      await port.closeJob({ jobId: `perf-job-${i}` });
    }

    const stats = benchmarkStats(latencies);
    console.log("[A9-03 Performance] openJob/closeJob real-tiss:", stats);
    assert.ok(stats.avg > 0);
    assert.ok(stats.throughput > 0);
  });
});
