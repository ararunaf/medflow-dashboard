#!/usr/bin/env node
/**
 * TISS-RUNTIME-02B-A4 — Enrichment Real Activation.
 *
 * Prova:
 *   Job VALIDATED
 *     → getEnterpriseRuntime()
 *     → WorkerRuntimePort
 *     → AutoFillRuntimePort (real-tiss)
 *     → RealTissAutoFillRuntimeAdapter
 *     → Enrichment TISS real
 *     → Job ENRICHED reenfileirado
 *     → XML/Enriquecimento posterior NÃO executado
 *
 * Sem alterar Port, Runtime, Gateway, Pipeline, Queue, Worker, Scheduler,
 * Retry, Dead Letter, Observability ou Foundations.
 */
process.env.MEDICFLOW_QUEUE_RUNTIME_BACKEND = "memory";

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createAutoFillRuntimePort } from "../../../src/lib/enterprise/auto-fill-runtime/index.ts";
import { RealTissAutoFillRuntimeAdapter } from "../../../src/lib/enterprise/auto-fill-runtime/index.ts";
import {
  ENTERPRISE_TISS_QUEUE_NAME,
  TISS_JOB_STATUS_VALIDATED,
  resetQueueRuntimeIdSequences,
} from "../../../src/lib/enterprise/queue-runtime/index.ts";
import {
  createEnterpriseRuntime,
  processTissValidatedEnriched,
  resetEnterpriseRuntimeForTests,
  setEnterpriseRuntimeForTests,
} from "../../../src/lib/enterprise/runtime/index.ts";

describe("TISS-RUNTIME-02B-A4 — Enrichment Real Activation", () => {
  it("VALIDATED → RealTissAutoFillRuntimeAdapter → ENRICHED com preenchimento real", async () => {
    resetEnterpriseRuntimeForTests();
    resetQueueRuntimeIdSequences();

    const runtimeRef = { current: undefined as any };
    const autoFillRuntimePort = createAutoFillRuntimePort({
      provider: "real-tiss",
      enterpriseDeps: {
        getValidationRuntimePort: () => runtimeRef.current.getValidationRuntimePort(),
      },
    });

    const runtime = createEnterpriseRuntime({
      runtimeId: "test-tiss-02b-real",
      autoFillRuntimePort,
    });
    runtimeRef.current = runtime;
    setEnterpriseRuntimeForTests(runtime);

    const validatedMessageId = "job-tiss-02b-real:validated";
    const enqueue = await runtime.getQueueRuntimePort().enqueue({
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
      messageId: validatedMessageId,
      payloadRef: "storage://clinical-documents/doc-tiss-02b-real",
      correlationId: "corr-tiss-02b-real",
      metadata: {
        kind: "canonical-queue-metadata",
        sessionId: "session-tiss-02b-real",
        correlationId: "corr-tiss-02b-real",
        channel: "tiss-enrichment",
        source: "tiss-runtime-02b",
        tags: ["tiss-runtime-02b", "tiss-job", TISS_JOB_STATUS_VALIDATED],
        customAttributes: {
          status: TISS_JOB_STATUS_VALIDATED,
          tissJobStatus: TISS_JOB_STATUS_VALIDATED,
          documentId: "doc-tiss-02b-real",
          sessionId: "session-tiss-02b-real",
          previousJobId: "job-tiss-02b-real:parsed",
          ocrExecuted: true,
          parserExecuted: true,
          validationExecuted: true,
          enrichmentExecuted: false,
          xmlExecuted: false,
          batchExecuted: false,
          protocolExecuted: false,
          persistenceExecuted: false,
          auditExecuted: false,
        },
      },
    });
    assert.equal(enqueue.ok, true);

    const result = await processTissValidatedEnriched({
      waitTimeoutMs: 8_000,
      pollIntervalMs: 15,
    });

    assert.equal(result.ok, true);
    assert.equal(result.entry, "getEnterpriseRuntime");
    assert.equal(result.runtimeId, "test-tiss-02b-real");
    assert.equal(result.enrichmentExecuted, true);
    assert.equal(result.xmlExecuted, false);
    assert.equal(result.validationExecuted, true);
    assert.equal(result.parserExecuted, true);
    assert.equal(result.ocrExecuted, true);
    assert.ok(result.job);
    assert.equal(result.job!.status, "ENRICHED");
    assert.equal(result.job!.previousJobId, "job-tiss-02b-real:validated");
    assert.equal(result.job!.correlationId, "corr-tiss-02b-real");
    assert.ok(result.job!.autoFillId);

    const enrichmentResult = await runtime.getAutoFillRuntimePort().getResult({
      autoFillId: result.job!.autoFillId,
    });
    assert.equal(enrichmentResult.ok, true);
    assert.equal(enrichmentResult.provider, "real-tiss");
    assert.ok(enrichmentResult.result);
    assert.equal(enrichmentResult.result!.status, "populated");
    assert.equal(enrichmentResult.result!.guide?.guideType, "consulta");
    assert.ok(enrichmentResult.result!.guide?.fields);
    assert.equal(enrichmentResult.result!.guide!.fields!.length, 3);
    assert.equal(enrichmentResult.result!.guide!.fields![0].status, "populated");
  });

  it("RealTissAutoFillRuntimeAdapter rejeita guia com ValidationResult rejeitado", async () => {
    const port = new RealTissAutoFillRuntimeAdapter();
    const validationResult = {
      kind: "canonical-validation-result",
      status: "rejected" as const,
      ok: false,
      resultId: "vr-1",
      operation: "getResult" as const,
      runtimeReady: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      autoFillEngineImplemented: false,
      guideGenerationImplemented: false,
      fieldPopulationImplemented: false,
      templatePopulationImplemented: false,
      operatorPopulationImplemented: false,
      xmlPopulationImplemented: false,
      validationIntegrationImplemented: false,
      auditIntegrationImplemented: false,
      qualityIntegrationImplemented: false,
      automaticCompletionImplemented: false,
    } as any;

    const prepare = await port.prepareAutoFill({
      autoFillId: "af-1",
      guideType: "consulta",
      validationResult,
    });
    assert.equal(prepare.ok, false);
    assert.equal(prepare.result!.status, "failed");
    assert.equal(prepare.result!.issues!.length, 1);
    assert.equal(prepare.result!.issues![0].code, "REAL_TISS_ENRICHMENT_VALIDATION_REJECTED");
  });

  it("RealTissAutoFillRuntimeAdapter preenche guia de consulta", async () => {
    const port = new RealTissAutoFillRuntimeAdapter();
    const prepare = await port.prepareAutoFill({
      autoFillId: "af-2",
      guideType: "consulta",
    });
    assert.equal(prepare.ok, true);
    assert.equal(prepare.provider, "real-tiss");
    assert.equal(prepare.result!.status, "populated");
    assert.equal(prepare.result!.guide?.guideType, "consulta");
    assert.equal(prepare.result!.guide?.fields!.length, 3);

    const get = await port.getResult({ autoFillId: "af-2" });
    assert.equal(get.ok, true);
    assert.equal(get.provider, "real-tiss");
    assert.equal(get.result!.status, "populated");
    assert.ok(get.telemetry);
    assert.equal(get.telemetry.attempts, 1);
    assert.equal(get.telemetry.cancelled, false);
  });

  it("RealTissAutoFillRuntimeAdapter expõe observability", async () => {
    const port = new RealTissAutoFillRuntimeAdapter();
    const health = await port.health();
    assert.equal(health.provider, "real-tiss");
    assert.equal(health.ok, true);
    assert.equal(health.runtimeReady, true);

    const info = port.providerInfo();
    assert.equal(info.providerId, "real-tiss");
    assert.equal(info.metadata.name, "Real TISS Auto-Fill Runtime");

    const caps = port.capabilities();
    assert.equal(caps.provider, "real-tiss");
    assert.equal(caps.runtimeReady, true);
  });
});
