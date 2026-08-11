#!/usr/bin/env node
/**
 * TISS-RUNTIME-02B — Capability Enrichment operacional.
 *
 * Prova:
 *   Job VALIDATED
 *     → getEnterpriseRuntime()
 *     → WorkerRuntimePort (QueueRuntimePort.dequeue)
 *     → AutoFillRuntimePort (prepareAutoFill / getResult)
 *     → Job ENRICHED reenfileirado
 *     → XML NÃO executado
 *
 * Sem XML / Lote / Protocolo / Auditoria.
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
  TISS_JOB_STATUS_ENRICHED,
  TISS_JOB_STATUS_OCR_COMPLETED,
  TISS_JOB_STATUS_PARSED,
  TISS_JOB_STATUS_VALIDATED,
  processTissEnrichmentJob,
  resetQueueRuntimeIdSequences,
} from "../../../src/lib/enterprise/queue-runtime/index.ts";
import { createOCRProviderPort } from "../../../src/lib/enterprise/ocr-provider/index.ts";
import {
  createEnterpriseRuntime,
  getEnterpriseRuntime,
  processTissOcrParsed,
  processTissParsedValidated,
  processTissReceivedOcr,
  processTissValidatedEnriched,
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

describe("TISS-RUNTIME-02B Job VALIDATED → Worker → Enrichment → ENRICHED", () => {
  it("processTissValidatedEnriched via getEnterpriseRuntime evolui VALIDATED para ENRICHED", async () => {
    resetEnterpriseRuntimeForTests();
    resetQueueRuntimeIdSequences();

    const runtime = createEnterpriseRuntime({
      runtimeId: "test-tiss-02b",
      ocrProviderPort: createOCRProviderPort({ provider: "mock" }),
    });
    setEnterpriseRuntimeForTests(runtime);

    const registered = await registerTissReceivedJob({
      source: "document-intake",
      correlationId: "corr-tiss-02b",
      sessionId: "session-tiss-02b",
      documentId: "doc-tiss-02b",
      payloadRef: "storage://clinical-documents/doc-tiss-02b",
      jobId: "job-tiss-02b",
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
    assert.equal(validationResult.job?.status, TISS_JOB_STATUS_VALIDATED);

    const enrichmentResult = await processTissValidatedEnriched({
      waitTimeoutMs: 8_000,
      pollIntervalMs: 15,
    });
    assert.equal(enrichmentResult.ok, true);
    assert.equal(enrichmentResult.entry, "getEnterpriseRuntime");
    assert.equal(enrichmentResult.runtimeId, "test-tiss-02b");
    assert.equal(enrichmentResult.enrichmentExecuted, true);
    assert.equal(enrichmentResult.xmlExecuted, false);
    assert.equal(enrichmentResult.validationExecuted, true);
    assert.equal(enrichmentResult.parserExecuted, true);
    assert.equal(enrichmentResult.ocrExecuted, true);
    assert.ok(enrichmentResult.job);
    assert.equal(enrichmentResult.job!.status, TISS_JOB_STATUS_ENRICHED);
    assert.equal(
      enrichmentResult.job!.previousJobId,
      "job-tiss-02b:ocr-completed:parsed:validated",
    );
    assert.equal(enrichmentResult.job!.queueName, ENTERPRISE_TISS_QUEUE_NAME);
    assert.equal(enrichmentResult.job!.correlationId, "corr-tiss-02b");

    const peeked = await runtime.getQueueRuntimePort().peek({
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
      messageId: "job-tiss-02b:ocr-completed:parsed:validated:enriched",
    });
    assert.equal(peeked.ok, true);
    assert.equal(
      peeked.queueMessage?.messageId,
      "job-tiss-02b:ocr-completed:parsed:validated:enriched",
    );
    assert.equal(peeked.queueMessage?.status, "enqueued");
    assert.equal(
      peeked.queueMessage?.metadata?.customAttributes?.tissJobStatus,
      TISS_JOB_STATUS_ENRICHED,
    );
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.enrichmentExecuted, true);
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.xmlExecuted, false);
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.validationExecuted, true);
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.batchExecuted, false);
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.protocolExecuted, false);

    // VALIDATED foi ACK'd — não permanece como enqueued.
    const validatedGone = await runtime.getQueueRuntimePort().peek({
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
      messageId: "job-tiss-02b:ocr-completed:parsed:validated",
    });
    assert.notEqual(validatedGone.queueMessage?.status, "enqueued");
  });

  it("reutiliza exclusivamente Ports INF + AutoFillRuntimePort (sem XML)", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({
      runtimeId: "test-tiss-02b-infra",
      ocrProviderPort: createOCRProviderPort({ provider: "mock" }),
    });
    setEnterpriseRuntimeForTests(runtime);

    await registerTissReceivedJob({
      source: "capture-upload",
      correlationId: "corr-infra-02b",
      jobId: "job-infra-02b",
    });
    await processTissReceivedOcr({
      preferredProviderReference: "mock",
      waitTimeoutMs: 8_000,
    });
    await processTissOcrParsed({
      waitTimeoutMs: 8_000,
    });
    await processTissParsedValidated({
      waitTimeoutMs: 8_000,
    });

    const result = await processTissValidatedEnriched({
      waitTimeoutMs: 8_000,
    });

    assert.equal(result.ok, true);
    assert.equal(result.infrastructure.queueRuntimePort, true);
    assert.equal(result.infrastructure.workerRuntimePort, true);
    assert.equal(result.infrastructure.schedulerRuntimePort, true);
    assert.equal(result.infrastructure.observabilityRuntimePort, true);
    assert.equal(result.infrastructure.autoFillRuntimePort, true);
    assert.equal(result.infrastructure.retryInfrastructure, true);
    assert.equal(result.infrastructure.deadLetterRuntime, true);
    assert.equal(result.xmlExecuted, false);
    assert.equal(result.enrichmentExecuted, true);

    assert.equal(typeof runtime.getAutoFillRuntimePort, "function");
    assert.equal(typeof runtime.getQueueRuntimePort, "function");
  });

  it("processTissEnrichmentJob ignora status != VALIDATED e marca xmlExecuted=false", async () => {
    resetQueueRuntimeIdSequences();
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({
      runtimeId: "test-tiss-02b-skip",
      ocrProviderPort: createOCRProviderPort({ provider: "mock" }),
    });
    setEnterpriseRuntimeForTests(runtime);

    const queue = runtime.getQueueRuntimePort();
    const enqueued = await queue.enqueue({
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
      messageId: "job-already-enriched",
      metadata: {
        kind: "canonical-queue-metadata",
        source: "unit-test",
        tags: ["tiss-job", TISS_JOB_STATUS_ENRICHED],
        customAttributes: {
          status: TISS_JOB_STATUS_ENRICHED,
          tissJobStatus: TISS_JOB_STATUS_ENRICHED,
          validationExecuted: true,
          enrichmentExecuted: true,
          xmlExecuted: false,
        },
      },
    });
    assert.equal(enqueued.ok, true);

    const result = await processTissEnrichmentJob({
      getQueueRuntimePort: () => queue,
      getAutoFillRuntimePort: () => runtime.getAutoFillRuntimePort(),
      message: enqueued.queueMessage!,
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
    });

    assert.equal(result.ok, false);
    assert.equal(result.settle, "nack");
    assert.equal(result.enrichmentExecuted, false);
    assert.equal(result.xmlExecuted, false);
    assert.equal(result.code, "TISS_ENRICHMENT_JOB_STATUS_NOT_VALIDATED");
  });
});

describe("TISS-RUNTIME-02B preservação arquitetural", () => {
  it("sem Port / Gateway / Runtime / Pipeline novo; XML ausente no caminho Enrichment", () => {
    const processSrc = readFileSync(
      join(repoRoot, "src/lib/enterprise/queue-runtime/operational/process-tiss-enrichment-job.ts"),
      "utf8",
    );
    assert.match(processSrc, /TISS-RUNTIME-02B/);
    assert.match(processSrc, /AutoFillRuntimePort/);
    assert.match(processSrc, /ENRICHED/);
    assert.match(processSrc, /NÃO cria Port/);
    assert.equal(/XMLTISSRuntimePort|XMLRuntimePort/.test(processSrc), false);
    assert.equal(/BatchRuntimePort|ProtocolRuntimePort|AuditRuntimePort/.test(processSrc), false);
    assert.equal(/from ["']@supabase\/supabase-js["']/.test(processSrc), false);

    const entrySrc = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/process-tiss-validated-enriched.ts"),
      "utf8",
    );
    assert.match(entrySrc, /getEnterpriseRuntime/);
    assert.match(entrySrc, /getWorkerRuntimePort/);
    assert.match(entrySrc, /getQueueRuntimePort/);
    assert.match(entrySrc, /getAutoFillRuntimePort/);
    assert.match(entrySrc, /getSchedulerRuntimePort/);
    assert.match(entrySrc, /getObservabilityRuntimePort/);
    assert.equal(/XMLTISSRuntimePort|XMLRuntimePort/.test(entrySrc), false);
    assert.equal(/BatchRuntimePort|ProtocolRuntimePort|AuditRuntimePort/.test(entrySrc), false);

    const enterpriseTypes = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/types.ts"),
      "utf8",
    );
    assert.equal(
      /TissEnrichmentRuntimePort|getTissEnrichmentRuntimePort|TissEnrichmentGateway/.test(
        enterpriseTypes,
      ),
      false,
    );

    const enterpriseRuntime = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/enterprise-runtime.ts"),
      "utf8",
    );
    assert.equal(
      /TissEnrichmentRuntimePort|createTissEnrichmentRuntimePort|TissEnrichmentPipeline/.test(
        enterpriseRuntime,
      ),
      false,
    );

    // Sem arquivo *Port novo para Job TISS.
    const operationalDir = join(repoRoot, "src/lib/enterprise/queue-runtime/operational");
    const files = collectTsFiles(operationalDir);
    assert.equal(
      files.some(
        (f) => /tiss-.*-port\.ts$/i.test(f) || /tiss-enrichment-runtime-port\.ts$/i.test(f),
      ),
      false,
    );
  });

  it("composition root permanece getEnterpriseRuntime (sem bypass)", () => {
    const entrySrc = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/process-tiss-validated-enriched.ts"),
      "utf8",
    );
    assert.match(entrySrc, /const runtime = getEnterpriseRuntime\(\)/);
    assert.equal(/new DefaultQueueRuntimeAdapter/.test(entrySrc), false);
    assert.equal(/createAutoFillRuntimePort\(/.test(entrySrc), false);
  });
});
