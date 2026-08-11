#!/usr/bin/env node
/**
 * TISS-RUNTIME-03A — Capability XML TISS Generation operacional.
 *
 * Prova:
 *   Job ENRICHED
 *     → getEnterpriseRuntime()
 *     → WorkerRuntimePort (QueueRuntimePort.dequeue)
 *     → XMLTISSRuntimePort (prepareXMLDocument / getResult)
 *     → Job XML_GENERATED reenfileirado
 *     → Batch / Protocol / Persistence / Audit NÃO executados
 *
 * Sem Batch / Protocolo / Persistência / Auditoria.
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
  TISS_JOB_STATUS_XML_GENERATED,
  processTissXmlJob,
  resetQueueRuntimeIdSequences,
} from "../../../src/lib/enterprise/queue-runtime/index.ts";
import { createOCRProviderPort } from "../../../src/lib/enterprise/ocr-provider/index.ts";
import {
  createEnterpriseRuntime,
  getEnterpriseRuntime,
  processTissEnrichedXmlGenerated,
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

describe("TISS-RUNTIME-03A Job ENRICHED → Worker → XML → XML_GENERATED", () => {
  it("processTissEnrichedXmlGenerated via getEnterpriseRuntime evolui ENRICHED para XML_GENERATED", async () => {
    resetEnterpriseRuntimeForTests();
    resetQueueRuntimeIdSequences();

    const runtime = createEnterpriseRuntime({
      runtimeId: "test-tiss-03a",
      ocrProviderPort: createOCRProviderPort({ provider: "mock" }),
    });
    setEnterpriseRuntimeForTests(runtime);

    const registered = await registerTissReceivedJob({
      source: "document-intake",
      correlationId: "corr-tiss-03a",
      sessionId: "session-tiss-03a",
      documentId: "doc-tiss-03a",
      payloadRef: "storage://clinical-documents/doc-tiss-03a",
      jobId: "job-tiss-03a",
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
    assert.equal(enrichmentResult.job?.status, TISS_JOB_STATUS_ENRICHED);

    const xmlResult = await processTissEnrichedXmlGenerated({
      waitTimeoutMs: 8_000,
      pollIntervalMs: 15,
    });
    assert.equal(xmlResult.ok, true);
    assert.equal(xmlResult.entry, "getEnterpriseRuntime");
    assert.equal(xmlResult.runtimeId, "test-tiss-03a");
    assert.equal(xmlResult.xmlGenerated, true);
    assert.equal(xmlResult.batchExecuted, false);
    assert.equal(xmlResult.protocolExecuted, false);
    assert.equal(xmlResult.persistenceExecuted, false);
    assert.equal(xmlResult.auditExecuted, false);
    assert.equal(xmlResult.enrichmentExecuted, true);
    assert.equal(xmlResult.validationExecuted, true);
    assert.equal(xmlResult.parserExecuted, true);
    assert.equal(xmlResult.ocrExecuted, true);
    assert.ok(xmlResult.job);
    assert.equal(xmlResult.job!.status, TISS_JOB_STATUS_XML_GENERATED);
    assert.equal(
      xmlResult.job!.previousJobId,
      "job-tiss-03a:ocr-completed:parsed:validated:enriched",
    );
    assert.equal(xmlResult.job!.queueName, ENTERPRISE_TISS_QUEUE_NAME);
    assert.equal(xmlResult.job!.correlationId, "corr-tiss-03a");

    const peeked = await runtime.getQueueRuntimePort().peek({
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
      messageId: "job-tiss-03a:ocr-completed:parsed:validated:enriched:xml-generated",
    });
    assert.equal(peeked.ok, true);
    assert.equal(
      peeked.queueMessage?.messageId,
      "job-tiss-03a:ocr-completed:parsed:validated:enriched:xml-generated",
    );
    assert.equal(peeked.queueMessage?.status, "enqueued");
    assert.equal(
      peeked.queueMessage?.metadata?.customAttributes?.tissJobStatus,
      TISS_JOB_STATUS_XML_GENERATED,
    );
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.xmlGenerated, true);
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.xmlExecuted, true);
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.batchExecuted, false);
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.protocolExecuted, false);
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.persistenceExecuted, false);
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.auditExecuted, false);

    // ENRICHED foi ACK'd — não permanece como enqueued.
    const enrichedGone = await runtime.getQueueRuntimePort().peek({
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
      messageId: "job-tiss-03a:ocr-completed:parsed:validated:enriched",
    });
    assert.notEqual(enrichedGone.queueMessage?.status, "enqueued");
  });

  it("reutiliza exclusivamente Ports INF + XMLTISSRuntimePort (sem Batch)", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({
      runtimeId: "test-tiss-03a-infra",
      ocrProviderPort: createOCRProviderPort({ provider: "mock" }),
    });
    setEnterpriseRuntimeForTests(runtime);

    await registerTissReceivedJob({
      source: "capture-upload",
      correlationId: "corr-infra-03a",
      jobId: "job-infra-03a",
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
    await processTissValidatedEnriched({
      waitTimeoutMs: 8_000,
    });

    const result = await processTissEnrichedXmlGenerated({
      waitTimeoutMs: 8_000,
    });

    assert.equal(result.ok, true);
    assert.equal(result.infrastructure.queueRuntimePort, true);
    assert.equal(result.infrastructure.workerRuntimePort, true);
    assert.equal(result.infrastructure.schedulerRuntimePort, true);
    assert.equal(result.infrastructure.observabilityRuntimePort, true);
    assert.equal(result.infrastructure.xmlTissRuntimePort, true);
    assert.equal(result.infrastructure.retryInfrastructure, true);
    assert.equal(result.infrastructure.deadLetterRuntime, true);
    assert.equal(result.batchExecuted, false);
    assert.equal(result.xmlGenerated, true);

    assert.equal(typeof runtime.getXMLTISSRuntimePort, "function");
    assert.equal(typeof runtime.getQueueRuntimePort, "function");
  });

  it("processTissXmlJob ignora status != ENRICHED e marca batchExecuted=false", async () => {
    resetQueueRuntimeIdSequences();
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({
      runtimeId: "test-tiss-03a-skip",
      ocrProviderPort: createOCRProviderPort({ provider: "mock" }),
    });
    setEnterpriseRuntimeForTests(runtime);

    const queue = runtime.getQueueRuntimePort();
    const enqueued = await queue.enqueue({
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
      messageId: "job-already-xml",
      metadata: {
        kind: "canonical-queue-metadata",
        source: "unit-test",
        tags: ["tiss-job", TISS_JOB_STATUS_XML_GENERATED],
        customAttributes: {
          status: TISS_JOB_STATUS_XML_GENERATED,
          tissJobStatus: TISS_JOB_STATUS_XML_GENERATED,
          enrichmentExecuted: true,
          xmlGenerated: true,
          batchExecuted: false,
          protocolExecuted: false,
        },
      },
    });
    assert.equal(enqueued.ok, true);

    const result = await processTissXmlJob({
      getQueueRuntimePort: () => queue,
      getXMLTISSRuntimePort: () => runtime.getXMLTISSRuntimePort(),
      message: enqueued.queueMessage!,
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
    });

    assert.equal(result.ok, false);
    assert.equal(result.settle, "nack");
    assert.equal(result.xmlGenerated, false);
    assert.equal(result.batchExecuted, false);
    assert.equal(result.protocolExecuted, false);
    assert.equal(result.persistenceExecuted, false);
    assert.equal(result.auditExecuted, false);
    assert.equal(result.code, "TISS_XML_JOB_STATUS_NOT_ENRICHED");
  });
});

describe("TISS-RUNTIME-03A preservação arquitetural", () => {
  it("sem Port / Gateway / Runtime / Pipeline novo; Batch ausente no caminho XML", () => {
    const processSrc = readFileSync(
      join(repoRoot, "src/lib/enterprise/queue-runtime/operational/process-tiss-xml-job.ts"),
      "utf8",
    );
    assert.match(processSrc, /TISS-RUNTIME-03A/);
    assert.match(processSrc, /XMLTISSRuntimePort/);
    assert.match(processSrc, /XML_GENERATED/);
    assert.match(processSrc, /NÃO cria Port/);
    assert.equal(/BatchRuntimePort/.test(processSrc), false);
    assert.equal(/ProtocolRuntimePort/.test(processSrc), false);
    assert.equal(/PersistenceRuntimePort|AuditRuntimePort/.test(processSrc), false);
    assert.equal(/from ["']@supabase\/supabase-js["']/.test(processSrc), false);

    const entrySrc = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/process-tiss-enriched-xml-generated.ts"),
      "utf8",
    );
    assert.match(entrySrc, /getEnterpriseRuntime/);
    assert.match(entrySrc, /getWorkerRuntimePort/);
    assert.match(entrySrc, /getQueueRuntimePort/);
    assert.match(entrySrc, /getXMLTISSRuntimePort/);
    assert.match(entrySrc, /getSchedulerRuntimePort/);
    assert.match(entrySrc, /getObservabilityRuntimePort/);
    assert.equal(/BatchRuntimePort/.test(entrySrc), false);
    assert.equal(/ProtocolRuntimePort/.test(entrySrc), false);
    assert.equal(/PersistenceRuntimePort|AuditRuntimePort/.test(entrySrc), false);

    const enterpriseTypes = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/types.ts"),
      "utf8",
    );
    assert.equal(
      /TissXmlRuntimePort|getTissXmlRuntimePort|TissXmlGateway/.test(enterpriseTypes),
      false,
    );

    const enterpriseRuntime = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/enterprise-runtime.ts"),
      "utf8",
    );
    assert.equal(
      /TissXmlRuntimePort|createTissXmlRuntimePort|TissXmlPipeline/.test(enterpriseRuntime),
      false,
    );

    // Sem arquivo *Port novo para Job TISS.
    const operationalDir = join(repoRoot, "src/lib/enterprise/queue-runtime/operational");
    const files = collectTsFiles(operationalDir);
    assert.equal(
      files.some((f) => /tiss-.*-port\.ts$/i.test(f) || /tiss-xml-runtime-port\.ts$/i.test(f)),
      false,
    );
  });

  it("composition root permanece getEnterpriseRuntime (sem bypass)", () => {
    const entrySrc = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/process-tiss-enriched-xml-generated.ts"),
      "utf8",
    );
    assert.match(entrySrc, /const runtime = getEnterpriseRuntime\(\)/);
    assert.equal(/new DefaultQueueRuntimeAdapter/.test(entrySrc), false);
    assert.equal(/createXMLTISSRuntimePort\(/.test(entrySrc), false);
  });
});
