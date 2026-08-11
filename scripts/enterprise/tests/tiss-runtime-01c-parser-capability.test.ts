#!/usr/bin/env node
/**
 * TISS-RUNTIME-01C — Capability Parser operacional.
 *
 * Prova:
 *   Job OCR_COMPLETED
 *     → getEnterpriseRuntime()
 *     → WorkerRuntimePort (QueueRuntimePort.dequeue)
 *     → DocumentExtractionRuntimePort (submitRequest / getResult)
 *     → Job PARSED reenfileirado
 *     → Validation NÃO executada
 *
 * Sem Validação / XML / Lote / Protocolo / Auditoria.
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
  TISS_JOB_STATUS_PARSED,
  processTissParserJob,
  resetQueueRuntimeIdSequences,
} from "../../../src/lib/enterprise/queue-runtime/index.ts";
import { createOCRProviderPort } from "../../../src/lib/enterprise/ocr-provider/index.ts";
import {
  createEnterpriseRuntime,
  getEnterpriseRuntime,
  processTissOcrParsed,
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

describe("TISS-RUNTIME-01C Job OCR_COMPLETED → Worker → Parser → PARSED", () => {
  it("processTissOcrParsed via getEnterpriseRuntime evolui OCR_COMPLETED para PARSED", async () => {
    resetEnterpriseRuntimeForTests();
    resetQueueRuntimeIdSequences();

    const runtime = createEnterpriseRuntime({
      runtimeId: "test-tiss-01c",
      ocrProviderPort: createOCRProviderPort({ provider: "mock" }),
    });
    setEnterpriseRuntimeForTests(runtime);

    const registered = await registerTissReceivedJob({
      source: "document-intake",
      correlationId: "corr-tiss-01c",
      sessionId: "session-tiss-01c",
      documentId: "doc-tiss-01c",
      payloadRef: "storage://clinical-documents/doc-tiss-01c",
      jobId: "job-tiss-01c",
      channel: "capture-upload",
    });
    assert.equal(registered.ok, true);
    assert.equal(registered.job?.status, "RECEIVED");

    const ocrResult = await processTissReceivedOcr({
      preferredProviderReference: "mock",
      waitTimeoutMs: 8_000,
      pollIntervalMs: 15,
    });
    assert.equal(ocrResult.ok, true);
    assert.equal(ocrResult.ocrExecuted, true);
    assert.equal(ocrResult.parserExecuted, false);
    assert.equal(ocrResult.job?.status, TISS_JOB_STATUS_OCR_COMPLETED);

    const parserResult = await processTissOcrParsed({
      waitTimeoutMs: 8_000,
      pollIntervalMs: 15,
    });
    assert.equal(parserResult.ok, true);
    assert.equal(parserResult.entry, "getEnterpriseRuntime");
    assert.equal(parserResult.runtimeId, "test-tiss-01c");
    assert.equal(parserResult.parserExecuted, true);
    assert.equal(parserResult.validationExecuted, false);
    assert.equal(parserResult.ocrExecuted, true);
    assert.ok(parserResult.job);
    assert.equal(parserResult.job!.status, TISS_JOB_STATUS_PARSED);
    assert.equal(parserResult.job!.previousJobId, "job-tiss-01c:ocr-completed");
    assert.equal(parserResult.job!.queueName, ENTERPRISE_TISS_QUEUE_NAME);
    assert.equal(parserResult.job!.correlationId, "corr-tiss-01c");

    const peeked = await runtime.getQueueRuntimePort().peek({
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
      messageId: "job-tiss-01c:ocr-completed:parsed",
    });
    assert.equal(peeked.ok, true);
    assert.equal(peeked.queueMessage?.messageId, "job-tiss-01c:ocr-completed:parsed");
    assert.equal(peeked.queueMessage?.status, "enqueued");
    assert.equal(
      peeked.queueMessage?.metadata?.customAttributes?.tissJobStatus,
      TISS_JOB_STATUS_PARSED,
    );
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.parserExecuted, true);
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.validationExecuted, false);
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.ocrExecuted, true);
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.xmlExecuted, false);

    // OCR_COMPLETED foi ACK'd — não permanece como enqueued.
    const ocrCompletedGone = await runtime.getQueueRuntimePort().peek({
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
      messageId: "job-tiss-01c:ocr-completed",
    });
    assert.notEqual(ocrCompletedGone.queueMessage?.status, "enqueued");
  });

  it("reutiliza exclusivamente Ports INF + DocumentExtractionRuntimePort (sem Validation)", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({
      runtimeId: "test-tiss-01c-infra",
      ocrProviderPort: createOCRProviderPort({ provider: "mock" }),
    });
    setEnterpriseRuntimeForTests(runtime);

    await registerTissReceivedJob({
      source: "capture-upload",
      correlationId: "corr-infra-01c",
      jobId: "job-infra-01c",
    });
    await processTissReceivedOcr({
      preferredProviderReference: "mock",
      waitTimeoutMs: 8_000,
    });

    const result = await processTissOcrParsed({
      waitTimeoutMs: 8_000,
    });

    assert.equal(result.ok, true);
    assert.equal(result.infrastructure.queueRuntimePort, true);
    assert.equal(result.infrastructure.workerRuntimePort, true);
    assert.equal(result.infrastructure.schedulerRuntimePort, true);
    assert.equal(result.infrastructure.observabilityRuntimePort, true);
    assert.equal(result.infrastructure.documentExtractionRuntimePort, true);
    assert.equal(result.infrastructure.retryInfrastructure, true);
    assert.equal(result.infrastructure.deadLetterRuntime, true);
    assert.equal(result.validationExecuted, false);
    assert.equal(result.parserExecuted, true);

    assert.equal(typeof runtime.getDocumentExtractionRuntimePort, "function");
    assert.equal(typeof runtime.getQueueRuntimePort, "function");
  });

  it("processTissParserJob ignora status != OCR_COMPLETED e marca validationExecuted=false", async () => {
    resetQueueRuntimeIdSequences();
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({
      runtimeId: "test-tiss-01c-skip",
      ocrProviderPort: createOCRProviderPort({ provider: "mock" }),
    });
    setEnterpriseRuntimeForTests(runtime);

    const queue = runtime.getQueueRuntimePort();
    const enqueued = await queue.enqueue({
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
      messageId: "job-already-parsed",
      metadata: {
        kind: "canonical-queue-metadata",
        source: "unit-test",
        tags: ["tiss-job", TISS_JOB_STATUS_PARSED],
        customAttributes: {
          status: TISS_JOB_STATUS_PARSED,
          tissJobStatus: TISS_JOB_STATUS_PARSED,
          ocrExecuted: true,
          parserExecuted: true,
          validationExecuted: false,
        },
      },
    });
    assert.equal(enqueued.ok, true);

    const result = await processTissParserJob({
      getQueueRuntimePort: () => queue,
      getDocumentExtractionRuntimePort: () => runtime.getDocumentExtractionRuntimePort(),
      message: enqueued.queueMessage!,
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
    });

    assert.equal(result.ok, false);
    assert.equal(result.settle, "nack");
    assert.equal(result.parserExecuted, false);
    assert.equal(result.validationExecuted, false);
    assert.equal(result.code, "TISS_PARSER_JOB_STATUS_NOT_OCR_COMPLETED");
  });
});

describe("TISS-RUNTIME-01C preservação arquitetural", () => {
  it("sem Port / Gateway / Runtime / Pipeline novo; Validation ausente no caminho Parser", () => {
    const processSrc = readFileSync(
      join(repoRoot, "src/lib/enterprise/queue-runtime/operational/process-tiss-parser-job.ts"),
      "utf8",
    );
    assert.match(processSrc, /TISS-RUNTIME-01C/);
    assert.match(processSrc, /DocumentExtractionRuntimePort/);
    assert.match(processSrc, /PARSED/);
    assert.match(processSrc, /NÃO cria Port/);
    assert.equal(/ValidationRuntimePort/.test(processSrc), false);
    assert.equal(/getValidationRuntimePort/.test(processSrc), false);
    assert.equal(/XMLTISSRuntimePort|XMLRuntimePort/.test(processSrc), false);
    assert.equal(
      /AutoFillRuntimePort|BatchRuntimePort|ProtocolRuntimePort/.test(processSrc),
      false,
    );
    assert.equal(/from ["']@supabase\/supabase-js["']/.test(processSrc), false);

    const entrySrc = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/process-tiss-ocr-parsed.ts"),
      "utf8",
    );
    assert.match(entrySrc, /getEnterpriseRuntime/);
    assert.match(entrySrc, /getWorkerRuntimePort/);
    assert.match(entrySrc, /getQueueRuntimePort/);
    assert.match(entrySrc, /getDocumentExtractionRuntimePort/);
    assert.match(entrySrc, /getSchedulerRuntimePort/);
    assert.match(entrySrc, /getObservabilityRuntimePort/);
    assert.equal(/ValidationRuntimePort/.test(entrySrc), false);
    assert.equal(/getValidationRuntimePort/.test(entrySrc), false);

    const enterpriseTypes = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/types.ts"),
      "utf8",
    );
    assert.equal(
      /TissParserRuntimePort|getTissParserRuntimePort|TissParserGateway/.test(enterpriseTypes),
      false,
    );

    const enterpriseRuntime = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/enterprise-runtime.ts"),
      "utf8",
    );
    assert.equal(
      /TissParserRuntimePort|createTissParserRuntimePort|TissParserPipeline/.test(
        enterpriseRuntime,
      ),
      false,
    );

    // Sem arquivo *Port novo para Job TISS.
    const operationalDir = join(repoRoot, "src/lib/enterprise/queue-runtime/operational");
    const files = collectTsFiles(operationalDir);
    assert.equal(
      files.some((f) => /tiss-.*-port\.ts$/i.test(f) || /tiss-parser-runtime-port\.ts$/i.test(f)),
      false,
    );
  });

  it("composition root permanece getEnterpriseRuntime (sem bypass)", () => {
    const entrySrc = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/process-tiss-ocr-parsed.ts"),
      "utf8",
    );
    assert.match(entrySrc, /const runtime = getEnterpriseRuntime\(\)/);
    assert.equal(/new DefaultQueueRuntimeAdapter/.test(entrySrc), false);
    assert.equal(/createDocumentExtractionRuntimePort\(/.test(entrySrc), false);
  });
});
