/**
 * EPC-24D — Enterprise Runtime Review / TISS / XML / Bloco C Convergence.
 *
 * Valida que Review, TISS/XML e Bloco C entram pelo composition root Enterprise,
 * com engines legado apenas como implementação interna dos gateways.
 * Não altera comportamento funcional nem Foundations 4–7.
 * Cutover Dual Path concluído em EPC-24E.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CAPTURE_ENTERPRISE_RUNTIME_ENTRY,
  resolveCaptureEnterpriseRuntime,
} from "../../../src/lib/capture/enterprise/resolve-enterprise-runtime";
import { probeCaptureEnterpriseRuntimeBinding } from "../../../src/lib/capture/enterprise/capture-runtime-binding";
import { probeCaptureReviewViaEnterprise } from "../../../src/lib/capture/enterprise/process-review-via-enterprise";
import { probeCaptureXmlViaEnterprise } from "../../../src/lib/capture/enterprise/process-xml-via-enterprise";
import {
  coordinateBlocoCViaEnterprise,
  probeCaptureBlocoCViaEnterprise,
} from "../../../src/lib/capture/enterprise/process-bloco-c-via-enterprise";
import {
  getEnterpriseRuntime,
  resetEnterpriseRuntimeForTests,
} from "../../../src/lib/enterprise/runtime";

function nowMs(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

async function avgMs(samples: number, fn: () => Promise<void>): Promise<number> {
  const times: number[] = [];
  for (let i = 0; i < samples; i += 1) {
    const t0 = nowMs();
    await fn();
    times.push(nowMs() - t0);
  }
  return times.reduce((a, b) => a + b, 0) / times.length;
}

describe("EPC-24D — Review / TISS-XML / Bloco C Convergence", () => {
  it("mantém getEnterpriseRuntime como único entrypoint oficial do Capture", () => {
    assert.equal(CAPTURE_ENTERPRISE_RUNTIME_ENTRY, "getEnterpriseRuntime");
    resetEnterpriseRuntimeForTests();
    assert.equal(resolveCaptureEnterpriseRuntime(), getEnterpriseRuntime());
  });

  it("Review é alcançado via ValidationRuntimePort do Enterprise Runtime", async () => {
    resetEnterpriseRuntimeForTests();
    const probe = await probeCaptureReviewViaEnterprise();
    assert.ok(probe, "probe de review não deve falhar");
    assert.equal(probe.entry, "getEnterpriseRuntime");
    assert.equal(probe.validationRuntimeOk, true);
    assert.ok(probe.providerId);
  });

  it("TISS/XML é alcançado via XMLGeneration / XML-TISS / XML Runtime", async () => {
    resetEnterpriseRuntimeForTests();
    const probe = await probeCaptureXmlViaEnterprise();
    assert.ok(probe, "probe de xml não deve falhar");
    assert.equal(probe.entry, "getEnterpriseRuntime");
    assert.equal(probe.xmlGenerationRuntimeOk, true);
    assert.equal(probe.xmlTissRuntimeOk, true);
    assert.equal(probe.xmlRuntimeOk, true);
    assert.ok(probe.providerId);
  });

  it("Bloco C é alcançado via Workflow / Batch / Protocol Ports", async () => {
    resetEnterpriseRuntimeForTests();
    const probe = await probeCaptureBlocoCViaEnterprise();
    assert.ok(probe, "probe de Bloco C não deve falhar");
    assert.equal(probe.entry, "getEnterpriseRuntime");
    assert.equal(probe.workflowRuntimeOk, true);
    assert.equal(probe.batchRuntimeOk, true);
    assert.equal(probe.protocolRuntimeOk, true);
    assert.equal(probe.authorizationRuntimeOk, true);
    assert.equal(probe.operatorRuntimeOk, true);
    assert.equal(probe.soapRuntimeOk, true);
    assert.equal(probe.returnRuntimeOk, true);
    assert.equal(probe.reconciliationRuntimeOk, true);
    assert.equal(probe.xmlTissRuntimeOk, true);
    assert.ok(probe.providerId);
  });

  it("binding estrutural cobre Review / XML / Bloco C além de Decision Ports", async () => {
    resetEnterpriseRuntimeForTests();
    const probe = await probeCaptureEnterpriseRuntimeBinding();
    assert.ok(probe, "probe de binding não deve falhar");
    assert.equal(probe.entry, "getEnterpriseRuntime");
    assert.equal(probe.orchestratorOk, true);
    assert.equal(probe.validationRuntimeOk, true);
    assert.equal(probe.xmlGenerationRuntimeOk, true);
    assert.equal(probe.xmlTissRuntimeOk, true);
    assert.equal(probe.workflowRuntimeOk, true);
    assert.equal(probe.batchRuntimeOk, true);
    assert.equal(probe.protocolRuntimeOk, true);
  });

  it("coordenação estrutural Review openJob→submit→close funciona via Runtime", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = resolveCaptureEnterpriseRuntime();
    const validation = runtime.getValidationRuntimePort();

    const opened = await validation.openJob({
      correlationId: "epc-24d-test-session",
      requestId: "epc-24d-test-review-job",
    });
    assert.equal(opened.ok, true);
    const jobId = opened.job?.jobId;
    assert.ok(jobId, "openJob deve retornar jobId estrutural");

    const submitted = await validation.submitRequest({
      jobId,
      requestId: "epc-24d-test-review-req",
    });
    assert.equal(submitted.ok, true);

    const closed = await validation.closeJob({
      jobId,
      requestId: "epc-24d-test-review-close",
    });
    assert.equal(closed.ok, true);
  });

  it("coordenação estrutural XML Generation generate funciona via Runtime", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = resolveCaptureEnterpriseRuntime();
    const generation = runtime.getXMLGenerationRuntimePort();

    const generated = await generation.generate({
      requestId: "epc-24d-test-xml-gen",
      generationId: "epc-24d-test-generation",
      documentId: "epc-24d-test-doc",
      request: {
        kind: "canonical-xml-generation-request",
        requestId: "epc-24d-test-xml-gen",
        generationId: "epc-24d-test-generation",
        documentId: "epc-24d-test-doc",
        structuralNotes: "epc-24d-test",
      },
    });
    assert.equal(generated.ok, true);
    assert.equal(generated.result?.realXmlGenerated, false);
  });

  it("coordenação estrutural Bloco C Workflow→Batch→Protocol funciona via Runtime", async () => {
    resetEnterpriseRuntimeForTests();
    const result = await coordinateBlocoCViaEnterprise({
      sessionId: "epc-24d-test-session",
      trigger: "probe",
    });
    assert.equal(result.viaEnterpriseRuntime, true);
    assert.equal(result.singlePipeline, true);
    assert.ok(result.coordinationId);
    assert.ok(result.workflowExecutionId);
    assert.ok(result.batchId);
    assert.ok(result.protocolProfileId);
  });

  it("mede latência média do pipeline único Enterprise Runtime (estrutural)", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = resolveCaptureEnterpriseRuntime();

    const enterpriseAvg = await avgMs(5, async () => {
      await runtime.getValidationRuntimePort().health();
      await runtime.getXMLGenerationRuntimePort().health();
      await runtime.getWorkflowRuntimePort().health();
      await runtime.getBatchRuntimePort().health();
      await runtime.getProtocolRuntimePort().health();
    });

    const entryAvg = await avgMs(5, async () => {
      void resolveCaptureEnterpriseRuntime();
    });

    assert.ok(enterpriseAvg >= 0);
    assert.ok(entryAvg >= 0);

    console.log(
      JSON.stringify({
        epc24dLatencyMs: {
          enterpriseRuntimeAvgMs: Number(enterpriseAvg.toFixed(3)),
          entrypointAvgMs: Number(entryAvg.toFixed(3)),
          samples: 5,
          note: "Enterprise = health() Review/XML/BlocoC Ports; entry = getEnterpriseRuntime()",
        },
      }),
    );
  });

  it("pipeline único: sem flags de fallback Dual Path", async () => {
    resetEnterpriseRuntimeForTests();
    const bloco = await coordinateBlocoCViaEnterprise({
      sessionId: "epc-24d-single-pipeline",
      trigger: "manual",
    });
    assert.equal(bloco.viaEnterpriseRuntime, true);
    assert.equal(bloco.singlePipeline, true);
    assert.equal(
      "blocoCFallback" in bloco,
      false,
      "flags de fallback Dual Path devem estar ausentes após EPC-24E",
    );
  });
});
