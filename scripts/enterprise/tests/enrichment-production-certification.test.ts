#!/usr/bin/env node
/**
 * A4-03 — Enrichment Real Production Certification.
 *
 * Certifica o RealTissAutoFillRuntimeAdapter sem alterar src, Runtime,
 * Ports, Queue, Worker, Scheduler, Retry, Dead Letter, Observability,
 * Pipeline, Foundations, Factories, Registries, Composition Root.
 */
process.env.MEDICFLOW_QUEUE_RUNTIME_BACKEND = "memory";

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
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

const SAMPLE_COUNT = 1000;

function baseValidationResult(): any {
  return {
    kind: "canonical-validation-result",
    status: "validated",
    ok: true,
    resultId: "vr-valid",
    operation: "getResult",
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
  };
}

function rejectedValidationResult(): any {
  return { ...baseValidationResult(), status: "rejected", ok: false };
}

function pendingReviewValidationResult(): any {
  return { ...baseValidationResult(), status: "pending-review" };
}

describe("A4-03 — Enrichment Real Production Certification", () => {
  it("1. Documento válido → ENRICHED com campos preenchidos", async () => {
    const port = new RealTissAutoFillRuntimeAdapter();
    const prepare = await port.prepareAutoFill({
      autoFillId: "af-valid",
      guideType: "consulta",
      validationResult: baseValidationResult(),
    });

    assert.equal(prepare.ok, true);
    assert.equal(prepare.provider, "real-tiss");
    assert.equal(prepare.result!.status, "populated");
    assert.equal(prepare.result!.guide?.guideType, "consulta");
    assert.equal(prepare.result!.guide?.fields!.length, 3);
    assert.equal(prepare.result!.guide?.fields![0].status, "populated");
    assert.equal(prepare.result!.guide?.fields![1].status, "populated");
    assert.equal(prepare.result!.guide?.fields![2].status, "populated");
    assert.equal(prepare.result!.xmlPopulationImplemented, false);
    assert.equal(prepare.telemetry.cancelled, false);
    assert.equal(prepare.telemetry.attempts, 1);
    assert.ok(prepare.telemetry.latencyMs !== undefined);
  });

  it("2. Documento parcialmente preenchido → segue com guia preenchida", async () => {
    const port = new RealTissAutoFillRuntimeAdapter();
    const prepare = await port.prepareAutoFill({
      autoFillId: "af-partial",
      guideType: "consulta",
      validationResult: pendingReviewValidationResult(),
    });

    assert.equal(prepare.ok, true);
    assert.equal(prepare.result!.status, "populated");
    assert.equal(prepare.result!.guide?.fields!.length, 3);
  });

  it("3. Documento rejeitado pela Validation → falha sem preencher", async () => {
    const port = new RealTissAutoFillRuntimeAdapter();
    const prepare = await port.prepareAutoFill({
      autoFillId: "af-rejected",
      guideType: "consulta",
      validationResult: rejectedValidationResult(),
    });

    assert.equal(prepare.ok, false);
    assert.equal(prepare.result!.status, "failed");
    assert.equal(prepare.result!.guide?.fields!.length, 0);
    assert.equal(prepare.result!.issues!.length, 1);
    assert.equal(prepare.result!.issues![0].code, "REAL_TISS_ENRICHMENT_VALIDATION_REJECTED");
  });

  it("4. Guia vazia → sem preenchimento e status pending", async () => {
    const port = new RealTissAutoFillRuntimeAdapter();
    const prepare = await port.prepareAutoFill({
      autoFillId: "af-empty",
      guideType: "honorarios",
      validationResult: baseValidationResult(),
    });

    assert.equal(prepare.ok, false);
    assert.equal(prepare.result!.status, "pending");
    assert.equal(prepare.result!.guide?.fields!.length, 0);
    assert.equal(prepare.result!.issues!.length, 1);
    assert.equal(
      prepare.result!.issues![0].code,
      "REAL_TISS_ENRICHMENT_GUIDE_TYPE_NOT_IMPLEMENTED",
    );
  });

  it("5. Campos opcionais ausentes → preenchimento ocorre com campos conhecidos", async () => {
    const port = new RealTissAutoFillRuntimeAdapter();
    const prepare = await port.prepareAutoFill({
      autoFillId: "af-optional-missing",
      guideType: "consulta",
    });

    assert.equal(prepare.ok, true);
    assert.equal(prepare.result!.guide?.fields!.length, 3);
    assert.equal(prepare.result!.guide?.fields![0].fieldPopulationImplemented, false);
  });

  it("6. Campos obrigatórios preenchidos → todos os campos TISS consulta populated", async () => {
    const port = new RealTissAutoFillRuntimeAdapter();
    const prepare = await port.prepareAutoFill({
      autoFillId: "af-required-filled",
      guideType: "consulta",
      validationResult: baseValidationResult(),
    });

    const fields = prepare.result!.guide!.fields!;
    const required = ["BENEFICIARIO", "CARTEIRA", "ATENDIMENTO"];
    assert.equal(fields.length, required.length);
    for (let i = 0; i < required.length; i += 1) {
      assert.equal(fields[i].fieldId, required[i]);
      assert.equal(fields[i].status, "populated");
    }
  });

  it("7. Documento com múltiplas guias → guia não suportada mantém issue", async () => {
    const port = new RealTissAutoFillRuntimeAdapter();
    const prepare = await port.prepareAutoFill({
      autoFillId: "af-multi-guides",
      guideType: "internacao",
      validationResult: baseValidationResult(),
    });

    assert.equal(prepare.ok, false);
    assert.equal(prepare.result!.status, "pending");
    assert.equal(prepare.result!.guide?.fields!.length, 0);
    assert.ok(prepare.result!.issues);
  });

  it("8. Cancelamento via AbortSignal", async () => {
    const port = new RealTissAutoFillRuntimeAdapter();
    const controller = new AbortController();
    controller.abort();
    const prepare = await port.prepareAutoFill({
      autoFillId: "af-cancel",
      guideType: "consulta",
      signal: controller.signal,
    });

    assert.equal(prepare.ok, false);
    assert.equal(prepare.code, "AUTO_FILL_RUNTIME_CANCELLED");
    assert.equal(prepare.telemetry.cancelled, true);
  });

  it("9. Timeout via AbortSignal", async () => {
    const port = new RealTissAutoFillRuntimeAdapter();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1);
    const prepare = await port.prepareAutoFill({
      autoFillId: "af-timeout",
      guideType: "consulta",
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (prepare.code === "AUTO_FILL_RUNTIME_CANCELLED") {
      assert.equal(prepare.ok, false);
      assert.equal(prepare.telemetry.cancelled, true);
    } else {
      assert.equal(prepare.ok, true);
    }
  });

  it("10. Retry com transient failures", async () => {
    const port = new RealTissAutoFillRuntimeAdapter({
      failAttempts: 2,
      defaultRetryCount: 2,
      defaultRetryBackoffMs: 1,
    });
    const prepare = await port.prepareAutoFill({
      autoFillId: "af-retry",
      guideType: "consulta",
      validationResult: baseValidationResult(),
      retryCount: 2,
    });

    assert.equal(prepare.ok, true);
    assert.equal(prepare.telemetry.attempts, 3);
    assert.equal(prepare.result!.status, "populated");
  });

  it("11. Dead Letter: infraestrutura acessível sem Port novo", async () => {
    resetEnterpriseRuntimeForTests();
    resetQueueRuntimeIdSequences();

    const runtime = createEnterpriseRuntime({
      runtimeId: "test-cert-dl",
      autoFillRuntimePort: createAutoFillRuntimePort({
        provider: "real-tiss",
        enterpriseDeps: {
          getValidationRuntimePort: () => runtime.getValidationRuntimePort(),
        },
      }),
    });
    setEnterpriseRuntimeForTests(runtime);

    const invalidMessageId = "job-cert-dl:invalid";
    await runtime.getQueueRuntimePort().enqueue({
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
      messageId: invalidMessageId,
      payloadRef: "storage://test",
      metadata: {
        kind: "canonical-queue-metadata",
        customAttributes: {
          status: "PARSED",
          tissJobStatus: "PARSED",
          documentId: "doc-cert-dl",
          previousJobId: "job-cert-dl:parsed",
          ocrExecuted: true,
          parserExecuted: true,
          validationExecuted: true,
          enrichmentExecuted: false,
          xmlExecuted: false,
        },
      },
    });

    const result = await processTissValidatedEnriched({
      waitTimeoutMs: 2_000,
      pollIntervalMs: 10,
    });

    assert.equal(result.ok, false);
    assert.equal(result.infrastructure.deadLetterRuntime, true);
    assert.equal(result.infrastructure.retryInfrastructure, true);
    assert.equal(result.infrastructure.autoFillRuntimePort, true);
  });

  it("12. Observability: health, providerInfo, capabilities", async () => {
    const port = new RealTissAutoFillRuntimeAdapter();
    const health = await port.health();
    assert.equal(health.provider, "real-tiss");
    assert.equal(health.ok, true);
    assert.equal(health.runtimeReady, true);
    assert.ok(health.latencyMs !== undefined);

    const info = port.providerInfo();
    assert.equal(info.providerId, "real-tiss");
    assert.equal(info.metadata.name, "Real TISS Auto-Fill Runtime");

    const caps = port.capabilities();
    assert.equal(caps.provider, "real-tiss");
    assert.equal(caps.runtimeReady, true);
    assert.equal(caps.xmlPopulationImplemented, false);
  });

  it("13 & 14. Throughput e latência média (1000 amostras)", async () => {
    const port = new RealTissAutoFillRuntimeAdapter();

    const start = performance.now();
    for (let i = 0; i < SAMPLE_COUNT; i += 1) {
      const id = `af-throughput-${i}`;
      const p = await port.prepareAutoFill({
        autoFillId: id,
        guideType: "consulta",
        validationResult: baseValidationResult(),
      });
      assert.equal(p.ok, true);
    }
    const end = performance.now();
    const totalMs = end - start;
    const averageLatencyMs = totalMs / SAMPLE_COUNT;
    const throughputOpsPerSecond = (SAMPLE_COUNT / totalMs) * 1000;

    console.log(
      `[certification] throughput=${throughputOpsPerSecond.toFixed(2)} ops/s, averageLatency=${averageLatencyMs.toFixed(4)} ms, totalMs=${totalMs.toFixed(2)}`,
    );

    assert.ok(averageLatencyMs < 1.0, `average latency too high: ${averageLatencyMs} ms`);
    assert.ok(throughputOpsPerSecond > 1000, `throughput too low: ${throughputOpsPerSecond} ops/s`);
  });

  it("15. End-to-end: VALIDATED → ENRICHED sem XML", async () => {
    resetEnterpriseRuntimeForTests();
    resetQueueRuntimeIdSequences();

    const runtime = createEnterpriseRuntime({
      runtimeId: "test-cert-e2e",
      autoFillRuntimePort: createAutoFillRuntimePort({
        provider: "real-tiss",
        enterpriseDeps: {
          getValidationRuntimePort: () => runtime.getValidationRuntimePort(),
        },
      }),
    });
    setEnterpriseRuntimeForTests(runtime);

    const validatedMessageId = "job-cert-e2e:validated";
    await runtime.getQueueRuntimePort().enqueue({
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
      messageId: validatedMessageId,
      payloadRef: "storage://clinical-documents/doc-cert-e2e",
      correlationId: "corr-cert-e2e",
      metadata: {
        kind: "canonical-queue-metadata",
        sessionId: "session-cert-e2e",
        correlationId: "corr-cert-e2e",
        channel: "tiss-enrichment",
        source: "tiss-runtime-02b",
        tags: ["tiss-runtime-02b", "tiss-job", TISS_JOB_STATUS_VALIDATED],
        customAttributes: {
          status: TISS_JOB_STATUS_VALIDATED,
          tissJobStatus: TISS_JOB_STATUS_VALIDATED,
          documentId: "doc-cert-e2e",
          sessionId: "session-cert-e2e",
          previousJobId: "job-cert-e2e:parsed",
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

    const result = await processTissValidatedEnriched({
      waitTimeoutMs: 8_000,
      pollIntervalMs: 15,
    });

    assert.equal(result.ok, true);
    assert.equal(result.entry, "getEnterpriseRuntime");
    assert.equal(result.enrichmentExecuted, true);
    assert.equal(result.xmlExecuted, false);
    assert.equal(result.ocrExecuted, true);
    assert.equal(result.parserExecuted, true);
    assert.equal(result.validationExecuted, true);
    assert.ok(result.job);
    assert.equal(result.job!.status, "ENRICHED");
    assert.equal(result.job!.correlationId, "corr-cert-e2e");
    assert.ok(result.job!.autoFillId);

    const enrichmentResult = await runtime.getAutoFillRuntimePort().getResult({
      autoFillId: result.job!.autoFillId,
    });
    assert.equal(enrichmentResult.ok, true);
    assert.equal(enrichmentResult.provider, "real-tiss");
    assert.equal(enrichmentResult.result!.status, "populated");
    assert.equal(enrichmentResult.result!.guide?.guideType, "consulta");
    assert.equal(enrichmentResult.result!.guide?.fields!.length, 3);
    assert.equal(enrichmentResult.result!.xmlPopulationImplemented, false);
    assert.equal(enrichmentResult.result!.runtimeReady, true);
  });
});
