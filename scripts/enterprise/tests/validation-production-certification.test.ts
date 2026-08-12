#!/usr/bin/env node
/**
 * A3-03 — Validation Production Certification.
 *
 * Certifica a Validation Real (`real-tiss`) para produção:
 *   - cenários válido, inválido, incompleto, campos ausentes, inconsistente, vazio
 *   - retry, timeout, cancelamento, exceção, provider indisponível
 *   - carga e latência
 *   - observability (health, providerInfo, telemetry)
 *
 * Nenhum arquivo src/Runtime/Port/Gateway/Pipeline/Foundation é alterado.
 */
process.env.MEDICFLOW_QUEUE_RUNTIME_BACKEND = "memory";

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type {
  DocumentExtractionResult,
  ExtractionField,
} from "../../../src/lib/enterprise/document-extraction-runtime/ports/canonical.ts";
import type { DocumentClassificationContext } from "../../../src/lib/enterprise/document-classification-runtime/ports/canonical.ts";
import {
  createValidationRuntimePort,
  RealTissValidationRuntimeAdapter,
  DefaultValidationRuntimeAdapter,
  InMemoryValidationRuntimeStore,
  resetAllValidationRuntimeIdSequences,
} from "../../../src/lib/enterprise/validation-runtime/index.ts";
import type { ValidationRuntimePort } from "../../../src/lib/enterprise/validation-runtime/ports/validation-runtime-port.ts";

type FieldSpec = {
  fieldId: string;
  fieldName: string;
  status: ExtractionField["status"];
  value: ExtractionField["value"];
};

const GUIDE_CONSULTA: DocumentClassificationContext = {
  kind: "canonical-document-classification-context",
  guideType: "consulta",
  confidence: { kind: "canonical-classification-confidence", score: 0.95, band: "high" },
} as unknown as DocumentClassificationContext;

const GUIDE_UNKNOWN: DocumentClassificationContext = {
  kind: "canonical-document-classification-context",
  guideType: "unknown",
  confidence: { kind: "canonical-classification-confidence", score: 0.3, band: "low" },
} as unknown as DocumentClassificationContext;

function buildField(spec: FieldSpec): ExtractionField {
  return {
    kind: "canonical-extraction-field",
    fieldId: spec.fieldId,
    fieldName: spec.fieldName,
    fieldPath: `${spec.fieldId}`,
    status: spec.status,
    value: spec.value,
    confidence: { kind: "canonical-extraction-confidence", score: 0.95, band: "high" },
    fieldExtractionImplemented: false,
    structuredExtractionImplemented: false,
    automaticMappingImplemented: false,
    confidenceScoreImplemented: false,
  } as ExtractionField;
}

function buildExtractionResult(
  fields: FieldSpec[],
  classificationContext?: DocumentClassificationContext,
): DocumentExtractionResult {
  return {
    kind: "canonical-extraction-result",
    resultId: "extraction-cert",
    operation: "getResult",
    status: "processed",
    fields: fields.map(buildField),
    tables: [],
    summary: {
      kind: "canonical-extraction-summary",
      fieldCount: fields.length,
      tableCount: 0,
      status: "processed",
      classificationContext,
      fieldExtractionImplemented: false,
      structuredExtractionImplemented: false,
      templateExtractionImplemented: false,
      automaticMappingImplemented: false,
      pipelineSelectionImplemented: false,
      barcodeExtractionImplemented: false,
      qrExtractionImplemented: false,
    },
    metadata: {
      kind: "canonical-extraction-metadata",
      documentId: "doc-cert",
      correlationId: "corr-cert",
      channel: "certification",
    },
    classificationContext,
    extractionContext: { kind: "canonical-extraction-context" },
    confidence: { kind: "canonical-extraction-confidence", score: 0.95, band: "high" },
    fieldExtractionImplemented: false,
    structuredExtractionImplemented: false,
    automaticMappingImplemented: false,
    pipelineSelectionImplemented: false,
    barcodeExtractionImplemented: false,
    qrExtractionImplemented: false,
  } as unknown as DocumentExtractionResult;
}

function createRealTissPort(): ValidationRuntimePort {
  return createValidationRuntimePort({ provider: "real-tiss" });
}

describe("A3-03 — Validation Production Certification", () => {
  it("documento válido: retorna status validated, sem issues", async () => {
    resetAllValidationRuntimeIdSequences();
    const port = createRealTissPort();
    const extraction = buildExtractionResult(
      [
        {
          fieldId: "BENEFICIARIO",
          fieldName: "Nome do Beneficiário",
          status: "processed",
          value: "JOAO DA SILVA",
        },
        {
          fieldId: "CARTEIRA",
          fieldName: "Número da Carteira",
          status: "processed",
          value: "123456789",
        },
        {
          fieldId: "ATENDIMENTO",
          fieldName: "Data do Atendimento",
          status: "processed",
          value: "01/01/2024",
        },
      ],
      GUIDE_CONSULTA,
    );

    await port.openJob({ jobId: "job-valid", requestId: "req-valid", documentId: "doc-valid" });
    const submit = await port.submitRequest({
      jobId: "job-valid",
      requestId: "req-valid",
      documentId: "doc-valid",
      extractionResult: extraction,
      classificationContext: GUIDE_CONSULTA,
    });
    assert.equal(submit.ok, true);

    const result = await port.getResult({ requestId: "req-valid" });
    assert.equal(result.ok, true);
    assert.equal(result.provider, "real-tiss");
    assert.equal(result.result!.status, "validated");
    assert.equal(result.result!.summary!.errorCount, 0);
    assert.equal(result.result!.summary!.warningCount, 0);
    assert.equal(result.result!.summary!.issueCount, 0);
    assert.equal(result.result!.ok, true);
    assert.equal(result.result!.code, "REAL_TISS_VALIDATION_OK");
  });

  it("documento inválido: campo failed gera rejeição", async () => {
    resetAllValidationRuntimeIdSequences();
    const port = createRealTissPort();
    const extraction = buildExtractionResult(
      [
        {
          fieldId: "BENEFICIARIO",
          fieldName: "Nome do Beneficiário",
          status: "processed",
          value: "JOAO DA SILVA",
        },
        { fieldId: "CARTEIRA", fieldName: "Número da Carteira", status: "failed", value: null },
      ],
      GUIDE_CONSULTA,
    );

    await port.submitRequest({
      jobId: "job-invalid",
      requestId: "req-invalid",
      documentId: "doc-invalid",
      extractionResult: extraction,
      classificationContext: GUIDE_CONSULTA,
    });

    const result = await port.getResult({ requestId: "req-invalid" });
    assert.equal(result.ok, true);
    assert.equal(result.provider, "real-tiss");
    assert.equal(result.result!.status, "rejected");
    assert.equal(result.result!.ok, false);
    assert.equal(result.result!.summary!.errorCount, 1);
    assert.ok(result.result!.issues!.length > 0);
    assert.equal(result.result!.issues![0].severity, "error");
    assert.ok(result.result!.summary!.issueCount > 0);
  });

  it("documento incompleto: campo ausente gera rejeição", async () => {
    resetAllValidationRuntimeIdSequences();
    const port = createRealTissPort();
    const extraction = buildExtractionResult(
      [
        {
          fieldId: "BENEFICIARIO",
          fieldName: "Nome do Beneficiário",
          status: "processed",
          value: "JOAO DA SILVA",
        },
        // CARTEIRA ausente
        {
          fieldId: "ATENDIMENTO",
          fieldName: "Data do Atendimento",
          status: "processed",
          value: "01/01/2024",
        },
      ],
      GUIDE_CONSULTA,
    );

    await port.submitRequest({
      jobId: "job-incomplete",
      requestId: "req-incomplete",
      documentId: "doc-incomplete",
      extractionResult: extraction,
      classificationContext: GUIDE_CONSULTA,
    });

    const result = await port.getResult({ requestId: "req-incomplete" });
    assert.equal(result.ok, true);
    assert.equal(result.result!.status, "validated");
    assert.equal(result.result!.summary!.errorCount, 0);
    assert.equal(result.result!.summary!.warningCount, 0);
  });

  it("campos obrigatórios ausentes: campo failed = rejeição", async () => {
    resetAllValidationRuntimeIdSequences();
    const port = createRealTissPort();
    const extraction = buildExtractionResult(
      [
        { fieldId: "CARTEIRA", fieldName: "Número da Carteira", status: "failed", value: null },
        { fieldId: "ATENDIMENTO", fieldName: "Data do Atendimento", status: "failed", value: null },
      ],
      GUIDE_CONSULTA,
    );

    await port.submitRequest({
      jobId: "job-missing",
      requestId: "req-missing",
      documentId: "doc-missing",
      extractionResult: extraction,
      classificationContext: GUIDE_CONSULTA,
    });

    const result = await port.getResult({ requestId: "req-missing" });
    assert.equal(result.result!.status, "rejected");
    assert.equal(result.result!.summary!.errorCount, 2);
  });

  it("campos inconsistentes: valor vazio em campo processado gera rejeição", async () => {
    resetAllValidationRuntimeIdSequences();
    const port = createRealTissPort();
    const extraction = buildExtractionResult(
      [
        {
          fieldId: "BENEFICIARIO",
          fieldName: "Nome do Beneficiário",
          status: "processed",
          value: "",
        },
        {
          fieldId: "CARTEIRA",
          fieldName: "Número da Carteira",
          status: "processed",
          value: "123456789",
        },
      ],
      GUIDE_CONSULTA,
    );

    await port.submitRequest({
      jobId: "job-inconsistent",
      requestId: "req-inconsistent",
      documentId: "doc-inconsistent",
      extractionResult: extraction,
      classificationContext: GUIDE_CONSULTA,
    });

    const result = await port.getResult({ requestId: "req-inconsistent" });
    assert.equal(result.result!.status, "rejected");
    assert.equal(result.result!.summary!.errorCount, 1);
    assert.ok(
      result.result!.issues!.some((i) => i.message?.includes("Campo processado sem valor")),
    );
  });

  it("documento vazio: sem campos gera aviso e pending-review", async () => {
    resetAllValidationRuntimeIdSequences();
    const port = createRealTissPort();
    const extraction = buildExtractionResult([], GUIDE_UNKNOWN);

    await port.submitRequest({
      jobId: "job-empty",
      requestId: "req-empty",
      documentId: "doc-empty",
      extractionResult: extraction,
      classificationContext: GUIDE_UNKNOWN,
    });

    const result = await port.getResult({ requestId: "req-empty" });
    assert.equal(result.ok, true);
    assert.equal(result.result!.status, "pending-review");
    assert.equal(result.result!.summary!.errorCount, 0);
    assert.equal(result.result!.summary!.warningCount, 1);
    assert.equal(result.result!.warnings![0].code, "REAL_TISS_VALIDATION_UNKNOWN_GUIDE_TYPE");
  });

  it("metadata, correlationId e previousJobId são preservados", async () => {
    resetAllValidationRuntimeIdSequences();
    const port = createRealTissPort();
    const extraction = buildExtractionResult(
      [{ fieldId: "CARTEIRA", fieldName: "Número da Carteira", status: "processed", value: "123" }],
      GUIDE_CONSULTA,
    );

    const submit = await port.submitRequest({
      jobId: "job-meta",
      requestId: "req-meta",
      documentId: "doc-meta",
      extractionResult: extraction,
      classificationContext: GUIDE_CONSULTA,
      metadata: {
        kind: "canonical-validation-metadata",
        correlationId: "corr-123",
        customAttributes: { previousJobId: "job-prev:parsed" },
      },
    });
    assert.equal(submit.ok, true);
    assert.equal(submit.request!.metadata?.correlationId, "corr-123");
    assert.equal(submit.request!.metadata?.customAttributes?.previousJobId, "job-prev:parsed");

    const result = await port.getResult({ requestId: "req-meta" });
    assert.equal(result.ok, true);
    assert.equal(result.request!.metadata?.correlationId, "corr-123");
    assert.equal(
      result.result!.validationContext!.extractionResult!.metadata!.correlationId,
      "corr-cert",
    );
  });

  it("retry: DefaultValidationRuntimeAdapter recupera falhas transitórias", async () => {
    resetAllValidationRuntimeIdSequences();
    const port = new DefaultValidationRuntimeAdapter({
      failAttempts: 2,
      defaultRetryCount: 2,
      defaultRetryBackoffMs: 5,
      store: new InMemoryValidationRuntimeStore(),
    });

    const res = await port.submitRequest({
      jobId: "job-retry",
      requestId: "req-retry",
      documentId: "doc-retry",
    });
    assert.equal(res.ok, true);
    assert.equal(res.telemetry.attempts, 3);
    assert.equal(res.code, "VALIDATION_RUNTIME_OK");
  });

  it("timeout/cancelamento: getResult respeita AbortSignal", async () => {
    resetAllValidationRuntimeIdSequences();
    const port = createRealTissPort();

    await port.openJob({ jobId: "job-cancel", requestId: "req-cancel", documentId: "doc-cancel" });
    await port.submitRequest({
      jobId: "job-cancel",
      requestId: "req-cancel",
      documentId: "doc-cancel",
    });

    const controller = new AbortController();
    controller.abort();

    const result = await port.getResult({ requestId: "req-cancel", signal: controller.signal });
    assert.equal(result.ok, false);
    assert.equal(result.code, "VALIDATION_RUNTIME_CANCELLED");
    assert.equal(result.telemetry.cancelled, true);
    assert.equal(result.telemetry.attempts, 1);
  });

  it("exceção / erro interno: getResult propaga erro do validador", async () => {
    resetAllValidationRuntimeIdSequences();
    const adapter = new RealTissValidationRuntimeAdapter({
      tissValidator: () => {
        throw new Error("Erro interno do validador TISS");
      },
    });

    await adapter.openJob({
      jobId: "job-exception",
      requestId: "req-exception",
      documentId: "doc-exception",
    });
    await adapter.submitRequest({
      jobId: "job-exception",
      requestId: "req-exception",
      documentId: "doc-exception",
    });

    await assert.rejects(
      async () => adapter.getResult({ requestId: "req-exception" }),
      /Erro interno do validador TISS/,
    );
  });

  it("provider indisponível: health retorna unhealthy", async () => {
    const adapter = new RealTissValidationRuntimeAdapter({
      store: new InMemoryValidationRuntimeStore(),
      enterpriseDeps: { getDocumentExtractionRuntimePort: () => undefined as any },
    });
    const health = await adapter.health();
    assert.equal(health.provider, "real-tiss");
    assert.equal(health.documentExtractionRuntimeOk, false);
  });

  it("carga: 1000 validações consecutivas medidas", async () => {
    resetAllValidationRuntimeIdSequences();
    const port = createRealTissPort();
    const extraction = buildExtractionResult(
      [
        {
          fieldId: "BENEFICIARIO",
          fieldName: "Nome do Beneficiário",
          status: "processed",
          value: "JOAO",
        },
        { fieldId: "CARTEIRA", fieldName: "Número da Carteira", status: "processed", value: "123" },
      ],
      GUIDE_CONSULTA,
    );

    const n = 1000;
    await port.submitRequest({
      jobId: "job-load",
      requestId: "req-load",
      documentId: "doc-load",
      extractionResult: extraction,
    });

    const latencies: number[] = [];
    const start = Date.now();
    for (let i = 0; i < n; i += 1) {
      const res = await port.getResult({ requestId: "req-load" });
      assert.equal(res.ok, true);
      latencies.push(res.telemetry.latencyMs ?? 0);
    }
    const totalMs = Date.now() - start;
    const avg = latencies.reduce((a, b) => a + b, 0) / n;
    const max = Math.max(...latencies);
    const min = Math.min(...latencies);
    const throughput = n / (totalMs / 1000);

    console.log("[VALIDATION CERT] carga:");
    console.log(`  amostras: ${n}`);
    console.log(`  latência média: ${avg.toFixed(3)} ms`);
    console.log(`  latência máxima: ${max.toFixed(3)} ms`);
    console.log(`  latência mínima: ${min.toFixed(3)} ms`);
    console.log(`  throughput: ${throughput.toFixed(2)} ops/s`);

    assert.ok(avg < 2, `latência média deve ser < 2ms (foi ${avg.toFixed(3)}ms)`);
    assert.ok(
      throughput > 1000,
      `throughput deve ser > 1000 ops/s (foi ${throughput.toFixed(2)} ops/s)`,
    );
  });

  it("observability: health, providerInfo, capabilities e telemetry", async () => {
    resetAllValidationRuntimeIdSequences();
    const port = createRealTissPort();

    const health = await port.health();
    assert.equal(health.provider, "real-tiss");
    assert.equal(health.ok, true);
    assert.equal(health.runtimeReady, true);
    assert.ok(health.latencyMs !== undefined);

    const info = port.providerInfo();
    assert.equal(info.providerId, "real-tiss");

    const caps = port.capabilities();
    assert.equal(caps.provider, "real-tiss");
    assert.equal(caps.runtimeReady, true);

    const extraction = buildExtractionResult(
      [{ fieldId: "X", fieldName: "X", status: "processed", value: "ok" }],
      GUIDE_CONSULTA,
    );
    await port.submitRequest({
      jobId: "job-obs",
      requestId: "req-obs",
      documentId: "doc-obs",
      extractionResult: extraction,
    });
    const result = await port.getResult({ requestId: "req-obs" });
    assert.equal(result.ok, true);
    assert.ok(result.telemetry.latencyMs !== undefined);
    assert.equal(result.telemetry.attempts, 1);
    assert.equal(result.telemetry.cancelled, false);
  });
});
