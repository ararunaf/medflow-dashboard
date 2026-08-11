#!/usr/bin/env node
/**
 * TISS-RUNTIME-01A — Entrada operacional do boletim TISS (Job RECEIVED).
 *
 * Prova:
 *   Documento
 *     → getEnterpriseRuntime()
 *     → QueueRuntimePort.enqueue
 *     → Job criado / persistido
 *     → status RECEIVED
 *
 * Sem OCR. Sem Parser. Sem XML. Sem regras TISS.
 * Sem novo Port / Gateway / Runtime / Pipeline.
 * Reutiliza Queue + Worker + Scheduler + Retry + Dead Letter + Observability (shape).
 */
process.env.MEDICFLOW_QUEUE_RUNTIME_BACKEND = "memory";

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  DefaultQueueRuntimeAdapter,
  ENTERPRISE_TISS_QUEUE_NAME,
  TISS_JOB_STATUS_RECEIVED,
  enqueueTissReceivedJob,
  resetQueueRuntimeIdSequences,
} from "../../../src/lib/enterprise/queue-runtime/index.ts";
import {
  createEnterpriseRuntime,
  getEnterpriseRuntime,
  registerTissReceivedJob,
  resetEnterpriseRuntimeForTests,
  setEnterpriseRuntimeForTests,
} from "../../../src/lib/enterprise/runtime/index.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "../../..");

function collectTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...collectTsFiles(full));
    else if (entry.endsWith(".ts")) out.push(full);
  }
  return out;
}

describe("TISS-RUNTIME-01A Documento → Queue → Job RECEIVED", () => {
  it("registerTissReceivedJob via getEnterpriseRuntime cria Job RECEIVED", async () => {
    resetEnterpriseRuntimeForTests();
    resetQueueRuntimeIdSequences();
    const runtime = createEnterpriseRuntime({ runtimeId: "test-tiss-01a" });
    setEnterpriseRuntimeForTests(runtime);
    assert.equal(getEnterpriseRuntime().runtimeId, runtime.runtimeId);

    const result = await registerTissReceivedJob({
      source: "document-intake",
      correlationId: "corr-tiss-01a",
      sessionId: "session-tiss-01a",
      documentId: "doc-tiss-01a",
      payloadRef: "storage://clinical-documents/doc-tiss-01a",
      jobId: "job-tiss-01a",
      channel: "capture-upload",
    });

    assert.equal(result.ok, true);
    assert.equal(result.entry, "getEnterpriseRuntime");
    assert.equal(result.runtimeId, "test-tiss-01a");
    assert.ok(result.job);
    assert.equal(result.job!.jobId, "job-tiss-01a");
    assert.equal(result.job!.status, TISS_JOB_STATUS_RECEIVED);
    assert.equal(result.job!.correlationId, "corr-tiss-01a");
    assert.equal(result.job!.source, "document-intake");
    assert.equal(result.job!.queueName, ENTERPRISE_TISS_QUEUE_NAME);
    assert.ok(result.job!.createdAt);
    assert.match(result.job!.createdAt, /^\d{4}-\d{2}-\d{2}T/);

    assert.equal(result.queueMessage?.metadata?.customAttributes?.status, "RECEIVED");
    assert.equal(result.queueMessage?.metadata?.customAttributes?.ocrExecuted, false);
    assert.equal(result.queueMessage?.metadata?.customAttributes?.parserExecuted, false);
    assert.equal(result.queueMessage?.metadata?.customAttributes?.xmlExecuted, false);

    // Persistência via Queue — mensagem recuperável por peek.
    const peeked = await runtime.getQueueRuntimePort().peek({
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
      messageId: "job-tiss-01a",
    });
    assert.equal(peeked.ok, true);
    assert.equal(peeked.queueMessage?.messageId, "job-tiss-01a");
    assert.equal(peeked.queueMessage?.status, "enqueued");
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.tissJobStatus, "RECEIVED");
  });

  it("reutiliza exclusivamente Ports INF existentes (Queue/Worker/Scheduler/Obs/Retry/DLQ)", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test-tiss-01a-infra" });
    setEnterpriseRuntimeForTests(runtime);
    const result = await registerTissReceivedJob({
      source: "capture-upload",
      correlationId: "corr-infra",
    });

    assert.equal(result.ok, true);
    assert.equal(result.infrastructure.queueRuntimePort, true);
    assert.equal(result.infrastructure.workerRuntimePort, true);
    assert.equal(result.infrastructure.schedulerRuntimePort, true);
    assert.equal(result.infrastructure.observabilityRuntimePort, true);
    assert.equal(result.infrastructure.retryInfrastructure, true);
    assert.equal(result.infrastructure.deadLetterRuntime, true);

    assert.equal(typeof runtime.getQueueRuntimePort, "function");
    assert.equal(typeof runtime.getWorkerRuntimePort, "function");
    assert.equal(typeof runtime.getSchedulerRuntimePort, "function");
    assert.equal(typeof runtime.getObservabilityRuntimePort, "function");

    const queue = runtime.getQueueRuntimePort() as DefaultQueueRuntimeAdapter;
    assert.ok(queue.getRetryInfrastructure());
    assert.ok(queue.getDeadLetterRuntimePort());
  });

  it("enqueueTissReceivedJob exige QueueRuntimePort injetado (sem DB direto)", async () => {
    resetQueueRuntimeIdSequences();
    const queue = new DefaultQueueRuntimeAdapter({
      provider: "enterprise",
      operational: true,
    });
    const result = await enqueueTissReceivedJob({
      getQueueRuntimePort: () => queue,
      source: "unit-test",
      correlationId: "c1",
    });
    assert.equal(result.ok, true);
    assert.equal(result.job?.status, "RECEIVED");
    assert.equal(result.job?.queueName, ENTERPRISE_TISS_QUEUE_NAME);

    const missingPort = await enqueueTissReceivedJob({
      getQueueRuntimePort: null as unknown as () => DefaultQueueRuntimeAdapter,
      source: "unit-test",
    });
    assert.equal(missingPort.ok, false);
    assert.equal(missingPort.code, "TISS_RECEIVED_JOB_MISSING_QUEUE_PORT");
  });
});

describe("TISS-RUNTIME-01A preservação arquitetural", () => {
  it("sem Port / Gateway / Runtime / Pipeline novo; sem OCR/Parser/XML no enqueue", () => {
    const enqueueSrc = readFileSync(
      join(repoRoot, "src/lib/enterprise/queue-runtime/operational/enqueue-tiss-received-job.ts"),
      "utf8",
    );
    assert.match(enqueueSrc, /TISS-RUNTIME-01A/);
    assert.match(enqueueSrc, /QueueRuntimePort/);
    assert.match(enqueueSrc, /RECEIVED/);
    assert.match(enqueueSrc, /NÃO cria Port/);
    assert.equal(/OCRRuntimePort/.test(enqueueSrc), false);
    assert.equal(/DocumentExtractionRuntimePort/.test(enqueueSrc), false);
    assert.equal(/XMLTISSRuntimePort|XMLRuntimePort/.test(enqueueSrc), false);
    assert.equal(/from ["']@supabase\/supabase-js["']/.test(enqueueSrc), false);
    assert.equal(/createClient\(/.test(enqueueSrc), false);

    const entrySrc = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/register-tiss-received-job.ts"),
      "utf8",
    );
    assert.match(entrySrc, /getEnterpriseRuntime/);
    assert.match(entrySrc, /getQueueRuntimePort/);
    assert.match(entrySrc, /getWorkerRuntimePort/);
    assert.match(entrySrc, /getSchedulerRuntimePort/);
    assert.match(entrySrc, /getObservabilityRuntimePort/);
    assert.equal(/processOcr|runCaptureOcr|OCRRuntimePort\.process/.test(entrySrc), false);

    const enterpriseTypes = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/types.ts"),
      "utf8",
    );
    assert.equal(/TissReceivedJobPort|TissJobRuntimePort|getTissJobRuntimePort/.test(enterpriseTypes), false);
    assert.equal(/TissReceivedGateway/.test(enterpriseTypes), false);

    const enterpriseRuntime = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/enterprise-runtime.ts"),
      "utf8",
    );
    assert.equal(/TissJobRuntimePort|createTissJobRuntimePort/.test(enterpriseRuntime), false);
    assert.equal(/TissReceivedPipeline|TissDualPath/.test(enterpriseRuntime), false);

    // Sem arquivo *Port novo para Job TISS.
    const operationalDir = join(repoRoot, "src/lib/enterprise/queue-runtime/operational");
    const files = collectTsFiles(operationalDir);
    assert.equal(
      files.some((f) => /tiss-.*-port\.ts$/i.test(f) || /tiss-job-runtime-port\.ts$/i.test(f)),
      false,
    );

    const bridgeSrc = readFileSync(
      join(repoRoot, "src/lib/capture/enterprise/register-capture-intake.ts"),
      "utf8",
    );
    assert.match(bridgeSrc, /registerTissReceivedJob/);
    assert.match(bridgeSrc, /TISS-RUNTIME-01A/);
    assert.equal(/runCaptureOcrViaEnterprise/.test(bridgeSrc), false);
    assert.equal(/runCaptureParserViaEnterprise/.test(bridgeSrc), false);
  });

  it("composition root permanece getEnterpriseRuntime (sem bypass)", () => {
    const entrySrc = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/register-tiss-received-job.ts"),
      "utf8",
    );
    assert.match(entrySrc, /const runtime = getEnterpriseRuntime\(\)/);
    assert.equal(/new DefaultQueueRuntimeAdapter/.test(entrySrc), false);
    assert.equal(/createQueueRuntimePort\(/.test(entrySrc), false);
  });
});
