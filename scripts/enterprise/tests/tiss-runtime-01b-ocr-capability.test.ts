#!/usr/bin/env node
/**
 * TISS-RUNTIME-01B — Capability OCR operacional.
 *
 * Prova:
 *   Job RECEIVED
 *     → getEnterpriseRuntime()
 *     → WorkerRuntimePort (QueueRuntimePort.dequeue)
 *     → OCRRuntimePort.process
 *     → Job OCR_COMPLETED reenfileirado
 *     → Parser NÃO executado
 *
 * Sem Parser / Validação / XML / Lote / Protocolo / Auditoria.
 * Sem novo Port / Gateway / Runtime / Pipeline.
 */
process.env.MEDICFLOW_QUEUE_RUNTIME_BACKEND = "memory";

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ENTERPRISE_TISS_QUEUE_NAME,
  TISS_JOB_STATUS_OCR_COMPLETED,
  TISS_JOB_STATUS_RECEIVED,
  processTissOcrJob,
  resetQueueRuntimeIdSequences,
} from "../../../src/lib/enterprise/queue-runtime/index.ts";
import { createOCRProviderPort } from "../../../src/lib/enterprise/ocr-provider/index.ts";
import {
  createEnterpriseRuntime,
  getEnterpriseRuntime,
  processTissReceivedOcr,
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

describe("TISS-RUNTIME-01B Job RECEIVED → Worker → OCR → OCR_COMPLETED", () => {
  it("processTissReceivedOcr via getEnterpriseRuntime evolui RECEIVED para OCR_COMPLETED", async () => {
    resetEnterpriseRuntimeForTests();
    resetQueueRuntimeIdSequences();

    const runtime = createEnterpriseRuntime({
      runtimeId: "test-tiss-01b",
      ocrProviderPort: createOCRProviderPort({ provider: "mock" }),
    });
    setEnterpriseRuntimeForTests(runtime);
    assert.equal(getEnterpriseRuntime().runtimeId, runtime.runtimeId);

    const registered = await registerTissReceivedJob({
      source: "document-intake",
      correlationId: "corr-tiss-01b",
      sessionId: "session-tiss-01b",
      documentId: "doc-tiss-01b",
      payloadRef: "storage://clinical-documents/doc-tiss-01b",
      jobId: "job-tiss-01b",
      channel: "capture-upload",
    });
    assert.equal(registered.ok, true);
    assert.equal(registered.job?.status, TISS_JOB_STATUS_RECEIVED);

    const result = await processTissReceivedOcr({
      preferredProviderReference: "mock",
      waitTimeoutMs: 8_000,
      pollIntervalMs: 15,
    });

    assert.equal(result.ok, true);
    assert.equal(result.entry, "getEnterpriseRuntime");
    assert.equal(result.runtimeId, "test-tiss-01b");
    assert.equal(result.ocrExecuted, true);
    assert.equal(result.parserExecuted, false);
    assert.ok(result.job);
    assert.equal(result.job!.status, TISS_JOB_STATUS_OCR_COMPLETED);
    assert.equal(result.job!.previousJobId, "job-tiss-01b");
    assert.equal(result.job!.queueName, ENTERPRISE_TISS_QUEUE_NAME);
    assert.equal(result.job!.correlationId, "corr-tiss-01b");

    const peeked = await runtime.getQueueRuntimePort().peek({
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
      messageId: "job-tiss-01b:ocr-completed",
    });
    assert.equal(peeked.ok, true);
    assert.equal(peeked.queueMessage?.messageId, "job-tiss-01b:ocr-completed");
    assert.equal(peeked.queueMessage?.status, "enqueued");
    assert.equal(
      peeked.queueMessage?.metadata?.customAttributes?.tissJobStatus,
      TISS_JOB_STATUS_OCR_COMPLETED,
    );
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.ocrExecuted, true);
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.parserExecuted, false);
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.xmlExecuted, false);

    // RECEIVED foi ACK'd — não permanece como enqueued.
    const receivedGone = await runtime.getQueueRuntimePort().peek({
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
      messageId: "job-tiss-01b",
    });
    assert.notEqual(receivedGone.queueMessage?.status, "enqueued");
  });

  it("reutiliza exclusivamente Ports INF + OCRRuntimePort (sem Parser)", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({
      runtimeId: "test-tiss-01b-infra",
      ocrProviderPort: createOCRProviderPort({ provider: "mock" }),
    });
    setEnterpriseRuntimeForTests(runtime);

    await registerTissReceivedJob({
      source: "capture-upload",
      correlationId: "corr-infra-01b",
      jobId: "job-infra-01b",
    });

    const result = await processTissReceivedOcr({
      preferredProviderReference: "mock",
      waitTimeoutMs: 8_000,
    });

    assert.equal(result.ok, true);
    assert.equal(result.infrastructure.queueRuntimePort, true);
    assert.equal(result.infrastructure.workerRuntimePort, true);
    assert.equal(result.infrastructure.schedulerRuntimePort, true);
    assert.equal(result.infrastructure.observabilityRuntimePort, true);
    assert.equal(result.infrastructure.ocrRuntimePort, true);
    assert.equal(result.infrastructure.retryInfrastructure, true);
    assert.equal(result.infrastructure.deadLetterRuntime, true);
    assert.equal(result.parserExecuted, false);

    assert.equal(typeof runtime.getOCRRuntimePort, "function");
    assert.equal(typeof runtime.getDocumentExtractionRuntimePort, "function");
  });

  it("processTissOcrJob ignora status != RECEIVED e marca parserExecuted=false", async () => {
    resetQueueRuntimeIdSequences();
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({
      runtimeId: "test-tiss-01b-skip",
      ocrProviderPort: createOCRProviderPort({ provider: "mock" }),
    });
    setEnterpriseRuntimeForTests(runtime);

    const queue = runtime.getQueueRuntimePort();
    const enqueued = await queue.enqueue({
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
      messageId: "job-already-ocr",
      metadata: {
        kind: "canonical-queue-metadata",
        source: "unit-test",
        tags: ["tiss-job", TISS_JOB_STATUS_OCR_COMPLETED],
        customAttributes: {
          status: TISS_JOB_STATUS_OCR_COMPLETED,
          tissJobStatus: TISS_JOB_STATUS_OCR_COMPLETED,
          ocrExecuted: true,
          parserExecuted: false,
        },
      },
    });
    assert.equal(enqueued.ok, true);

    const result = await processTissOcrJob({
      getQueueRuntimePort: () => queue,
      getOCRRuntimePort: () => runtime.getOCRRuntimePort(),
      message: enqueued.queueMessage!,
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
    });

    assert.equal(result.ok, false);
    assert.equal(result.settle, "nack");
    assert.equal(result.ocrExecuted, false);
    assert.equal(result.parserExecuted, false);
    assert.equal(result.code, "TISS_OCR_JOB_STATUS_NOT_RECEIVED");
  });
});

describe("TISS-RUNTIME-01B preservação arquitetural", () => {
  it("sem Port / Gateway / Runtime / Pipeline novo; Parser ausente no caminho OCR", () => {
    const processSrc = readFileSync(
      join(repoRoot, "src/lib/enterprise/queue-runtime/operational/process-tiss-ocr-job.ts"),
      "utf8",
    );
    assert.match(processSrc, /TISS-RUNTIME-01B/);
    assert.match(processSrc, /OCRRuntimePort/);
    assert.match(processSrc, /OCR_COMPLETED/);
    assert.match(processSrc, /NÃO cria Port/);
    assert.equal(/DocumentExtractionRuntimePort/.test(processSrc), false);
    assert.equal(/runCaptureParserViaEnterprise|process-parser-via-enterprise/.test(processSrc), false);
    assert.equal(/XMLTISSRuntimePort|XMLRuntimePort/.test(processSrc), false);
    assert.equal(/ValidationRuntimePort|AutoFillRuntimePort|BatchRuntimePort/.test(processSrc), false);
    assert.equal(/from ["']@supabase\/supabase-js["']/.test(processSrc), false);

    const entrySrc = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/process-tiss-received-ocr.ts"),
      "utf8",
    );
    assert.match(entrySrc, /getEnterpriseRuntime/);
    assert.match(entrySrc, /getWorkerRuntimePort/);
    assert.match(entrySrc, /getOCRRuntimePort/);
    assert.match(entrySrc, /getQueueRuntimePort/);
    assert.match(entrySrc, /getSchedulerRuntimePort/);
    assert.match(entrySrc, /getObservabilityRuntimePort/);
    assert.equal(/DocumentExtractionRuntimePort|getDocumentExtractionRuntimePort/.test(entrySrc), false);
    assert.equal(/runCaptureParserViaEnterprise/.test(entrySrc), false);

    const enterpriseTypes = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/types.ts"),
      "utf8",
    );
    assert.equal(/TissOcrRuntimePort|getTissOcrRuntimePort|TissOcrGateway/.test(enterpriseTypes), false);

    const enterpriseRuntime = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/enterprise-runtime.ts"),
      "utf8",
    );
    assert.equal(/TissOcrRuntimePort|createTissOcrRuntimePort|TissOcrPipeline/.test(enterpriseRuntime), false);

    const operationalDir = join(repoRoot, "src/lib/enterprise/queue-runtime/operational");
    const files = collectTsFiles(operationalDir);
    assert.equal(
      files.some((f) => /tiss-.*-port\.ts$/i.test(f) || /tiss-ocr-runtime-port\.ts$/i.test(f)),
      false,
    );

    const consumerSrc = readFileSync(
      join(repoRoot, "src/lib/enterprise/worker-runtime/operational/worker-queue-consumer.ts"),
      "utf8",
    );
    assert.match(consumerSrc, /processMessage/);
    assert.equal(/OCRRuntimePort|DocumentExtractionRuntimePort/.test(consumerSrc), false);
  });

  it("composition root permanece getEnterpriseRuntime (sem bypass)", () => {
    const entrySrc = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/process-tiss-received-ocr.ts"),
      "utf8",
    );
    assert.match(entrySrc, /const runtime = getEnterpriseRuntime\(\)/);
    assert.equal(/new DefaultQueueRuntimeAdapter/.test(entrySrc), false);
    assert.equal(/createOCRRuntimePort\(/.test(entrySrc), false);
    assert.equal(/createOCRProviderPort\(/.test(entrySrc), false);
  });
});
