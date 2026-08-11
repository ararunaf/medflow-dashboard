#!/usr/bin/env node
/**
 * TISS-RUNTIME-02A — Capability Validation operacional.
 *
 * Prova:
 *   Job PARSED
 *     → getEnterpriseRuntime()
 *     → WorkerRuntimePort (QueueRuntimePort.dequeue)
 *     → ValidationRuntimePort (submitRequest / getResult)
 *     → Job VALIDATED reenfileirado
 *     → Enrichment NÃO executado
 *
 * Sem Enriquecimento / XML / Lote / Protocolo / Auditoria.
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
  TISS_JOB_STATUS_VALIDATED,
  processTissValidationJob,
  resetQueueRuntimeIdSequences,
} from "../../../src/lib/enterprise/queue-runtime/index.ts";
import { createOCRProviderPort } from "../../../src/lib/enterprise/ocr-provider/index.ts";
import {
  createEnterpriseRuntime,
  getEnterpriseRuntime,
  processTissOcrParsed,
  processTissParsedValidated,
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

describe("TISS-RUNTIME-02A Job PARSED → Worker → Validation → VALIDATED", () => {
  it("processTissParsedValidated via getEnterpriseRuntime evolui PARSED para VALIDATED", async () => {
    resetEnterpriseRuntimeForTests();
    resetQueueRuntimeIdSequences();

    const runtime = createEnterpriseRuntime({
      runtimeId: "test-tiss-02a",
      ocrProviderPort: createOCRProviderPort({ provider: "mock" }),
    });
    setEnterpriseRuntimeForTests(runtime);

    const registered = await registerTissReceivedJob({
      source: "document-intake",
      correlationId: "corr-tiss-02a",
      sessionId: "session-tiss-02a",
      documentId: "doc-tiss-02a",
      payloadRef: "storage://clinical-documents/doc-tiss-02a",
      jobId: "job-tiss-02a",
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
    assert.equal(ocrResult.job?.status, TISS_JOB_STATUS_OCR_COMPLETED);

    const parserResult = await processTissOcrParsed({
      waitTimeoutMs: 8_000,
      pollIntervalMs: 15,
    });
    assert.equal(parserResult.ok, true);
    assert.equal(parserResult.job?.status, TISS_JOB_STATUS_PARSED);

    const validationResult = await processTissParsedValidated({
      waitTimeoutMs: 8_000,
      pollIntervalMs: 15,
    });
    assert.equal(validationResult.ok, true);
    assert.equal(validationResult.entry, "getEnterpriseRuntime");
    assert.equal(validationResult.runtimeId, "test-tiss-02a");
    assert.equal(validationResult.validationExecuted, true);
    assert.equal(validationResult.enrichmentExecuted, false);
    assert.equal(validationResult.parserExecuted, true);
    assert.ok(validationResult.job);
    assert.equal(validationResult.job!.status, TISS_JOB_STATUS_VALIDATED);
    assert.equal(validationResult.job!.previousJobId, "job-tiss-02a:ocr-completed:parsed");
    assert.equal(validationResult.job!.queueName, ENTERPRISE_TISS_QUEUE_NAME);
    assert.equal(validationResult.job!.correlationId, "corr-tiss-02a");

    const peeked = await runtime.getQueueRuntimePort().peek({
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
      messageId: "job-tiss-02a:ocr-completed:parsed:validated",
    });
    assert.equal(peeked.ok, true);
    assert.equal(peeked.queueMessage?.messageId, "job-tiss-02a:ocr-completed:parsed:validated");
    assert.equal(peeked.queueMessage?.status, "enqueued");
    assert.equal(
      peeked.queueMessage?.metadata?.customAttributes?.tissJobStatus,
      TISS_JOB_STATUS_VALIDATED,
    );
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.validationExecuted, true);
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.enrichmentExecuted, false);
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.parserExecuted, true);
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.xmlExecuted, false);

    // PARSED foi ACK'd — não permanece como enqueued.
    const parsedGone = await runtime.getQueueRuntimePort().peek({
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
      messageId: "job-tiss-02a:ocr-completed:parsed",
    });
    assert.notEqual(parsedGone.queueMessage?.status, "enqueued");
  });

  it("reutiliza exclusivamente Ports INF + ValidationRuntimePort (sem Enrichment)", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({
      runtimeId: "test-tiss-02a-infra",
      ocrProviderPort: createOCRProviderPort({ provider: "mock" }),
    });
    setEnterpriseRuntimeForTests(runtime);

    await registerTissReceivedJob({
      source: "capture-upload",
      correlationId: "corr-infra-02a",
      jobId: "job-infra-02a",
    });
    await processTissReceivedOcr({
      preferredProviderReference: "mock",
      waitTimeoutMs: 8_000,
    });
    await processTissOcrParsed({
      waitTimeoutMs: 8_000,
    });

    const result = await processTissParsedValidated({
      waitTimeoutMs: 8_000,
    });

    assert.equal(result.ok, true);
    assert.equal(result.infrastructure.queueRuntimePort, true);
    assert.equal(result.infrastructure.workerRuntimePort, true);
    assert.equal(result.infrastructure.schedulerRuntimePort, true);
    assert.equal(result.infrastructure.observabilityRuntimePort, true);
    assert.equal(result.infrastructure.validationRuntimePort, true);
    assert.equal(result.infrastructure.retryInfrastructure, true);
    assert.equal(result.infrastructure.deadLetterRuntime, true);
    assert.equal(result.enrichmentExecuted, false);
    assert.equal(result.validationExecuted, true);

    assert.equal(typeof runtime.getValidationRuntimePort, "function");
    assert.equal(typeof runtime.getQueueRuntimePort, "function");
  });

  it("processTissValidationJob ignora status != PARSED e marca enrichmentExecuted=false", async () => {
    resetQueueRuntimeIdSequences();
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({
      runtimeId: "test-tiss-02a-skip",
      ocrProviderPort: createOCRProviderPort({ provider: "mock" }),
    });
    setEnterpriseRuntimeForTests(runtime);

    const queue = runtime.getQueueRuntimePort();
    const enqueued = await queue.enqueue({
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
      messageId: "job-already-validated",
      metadata: {
        kind: "canonical-queue-metadata",
        source: "unit-test",
        tags: ["tiss-job", TISS_JOB_STATUS_VALIDATED],
        customAttributes: {
          status: TISS_JOB_STATUS_VALIDATED,
          tissJobStatus: TISS_JOB_STATUS_VALIDATED,
          parserExecuted: true,
          validationExecuted: true,
          enrichmentExecuted: false,
        },
      },
    });
    assert.equal(enqueued.ok, true);

    const result = await processTissValidationJob({
      getQueueRuntimePort: () => queue,
      getValidationRuntimePort: () => runtime.getValidationRuntimePort(),
      message: enqueued.queueMessage!,
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
    });

    assert.equal(result.ok, false);
    assert.equal(result.settle, "nack");
    assert.equal(result.validationExecuted, false);
    assert.equal(result.enrichmentExecuted, false);
    assert.equal(result.code, "TISS_VALIDATION_JOB_STATUS_NOT_PARSED");
  });
});

describe("TISS-RUNTIME-02A preservação arquitetural", () => {
  it("sem Port / Gateway / Runtime / Pipeline novo; Enrichment ausente no caminho Validation", () => {
    const processSrc = readFileSync(
      join(repoRoot, "src/lib/enterprise/queue-runtime/operational/process-tiss-validation-job.ts"),
      "utf8",
    );
    assert.match(processSrc, /TISS-RUNTIME-02A/);
    assert.match(processSrc, /ValidationRuntimePort/);
    assert.match(processSrc, /VALIDATED/);
    assert.match(processSrc, /NÃO cria Port/);
    assert.equal(/AutoFillRuntimePort/.test(processSrc), false);
    assert.equal(/XMLTISSRuntimePort|XMLRuntimePort/.test(processSrc), false);
    assert.equal(/BatchRuntimePort|ProtocolRuntimePort|AuditRuntimePort/.test(processSrc), false);
    assert.equal(/from ["']@supabase\/supabase-js["']/.test(processSrc), false);

    const entrySrc = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/process-tiss-parsed-validated.ts"),
      "utf8",
    );
    assert.match(entrySrc, /getEnterpriseRuntime/);
    assert.match(entrySrc, /getWorkerRuntimePort/);
    assert.match(entrySrc, /getQueueRuntimePort/);
    assert.match(entrySrc, /getValidationRuntimePort/);
    assert.match(entrySrc, /getSchedulerRuntimePort/);
    assert.match(entrySrc, /getObservabilityRuntimePort/);
    assert.equal(/AutoFillRuntimePort/.test(entrySrc), false);
    assert.equal(/XMLTISSRuntimePort|XMLRuntimePort/.test(entrySrc), false);
    assert.equal(/BatchRuntimePort|ProtocolRuntimePort|AuditRuntimePort/.test(entrySrc), false);

    const enterpriseTypes = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/types.ts"),
      "utf8",
    );
    assert.equal(
      /TissValidationRuntimePort|getTissValidationRuntimePort|TissValidationGateway/.test(
        enterpriseTypes,
      ),
      false,
    );

    const enterpriseRuntime = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/enterprise-runtime.ts"),
      "utf8",
    );
    assert.equal(
      /TissValidationRuntimePort|createTissValidationRuntimePort|TissValidationPipeline/.test(
        enterpriseRuntime,
      ),
      false,
    );

    // Sem arquivo *Port novo para Job TISS.
    const operationalDir = join(repoRoot, "src/lib/enterprise/queue-runtime/operational");
    const files = collectTsFiles(operationalDir);
    assert.equal(
      files.some(
        (f) => /tiss-.*-port\.ts$/i.test(f) || /tiss-validation-runtime-port\.ts$/i.test(f),
      ),
      false,
    );
  });

  it("composition root permanece getEnterpriseRuntime (sem bypass)", () => {
    const entrySrc = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/process-tiss-parsed-validated.ts"),
      "utf8",
    );
    assert.match(entrySrc, /const runtime = getEnterpriseRuntime\(\)/);
    assert.equal(/new DefaultQueueRuntimeAdapter/.test(entrySrc), false);
    assert.equal(/createValidationRuntimePort\(/.test(entrySrc), false);
  });
});
