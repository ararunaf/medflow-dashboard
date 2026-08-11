/**
 * EPC-24B — Enterprise Runtime Intake & Extraction Convergence.
 *
 * Valida que Intake e Parser entram pelo composition root Enterprise,
 * com Parser legado apenas como fallback atrás do gateway.
 * Não altera comportamento funcional nem Foundations.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CAPTURE_ENTERPRISE_RUNTIME_ENTRY,
  resolveCaptureEnterpriseRuntime,
} from "../../../src/lib/capture/enterprise/resolve-enterprise-runtime";
import {
  probeCaptureEnterpriseRuntimeBinding,
} from "../../../src/lib/capture/enterprise/capture-runtime-binding";
import {
  probeCaptureIntakeViaEnterprise,
} from "../../../src/lib/capture/enterprise/register-capture-intake";
import {
  probeCaptureParserViaEnterprise,
} from "../../../src/lib/capture/enterprise/process-parser-via-enterprise";
import {
  getEnterpriseRuntime,
  resetEnterpriseRuntimeForTests,
} from "../../../src/lib/enterprise/runtime";

describe("EPC-24B — Intake & Extraction Convergence", () => {
  it("mantém getEnterpriseRuntime como único entrypoint oficial do Capture", () => {
    assert.equal(CAPTURE_ENTERPRISE_RUNTIME_ENTRY, "getEnterpriseRuntime");
    resetEnterpriseRuntimeForTests();
    assert.equal(resolveCaptureEnterpriseRuntime(), getEnterpriseRuntime());
  });

  it("Intake é alcançado via DocumentIntakeRuntimePort do Enterprise Runtime", async () => {
    resetEnterpriseRuntimeForTests();
    const probe = await probeCaptureIntakeViaEnterprise();
    assert.ok(probe, "probe de intake não deve falhar");
    assert.equal(probe.entry, "getEnterpriseRuntime");
    assert.equal(probe.documentIntakeRuntimeOk, true);
    assert.equal(probe.documentIntakePortOk, true);
  });

  it("Parser/Extraction é alcançado via DocumentExtractionRuntimePort do Enterprise Runtime", async () => {
    resetEnterpriseRuntimeForTests();
    const probe = await probeCaptureParserViaEnterprise();
    assert.ok(probe, "probe de extraction não deve falhar");
    assert.equal(probe.entry, "getEnterpriseRuntime");
    assert.equal(probe.extractionRuntimeOk, true);
    assert.ok(probe.providerId);
  });

  it("binding estrutural cobre Intake + Extraction além de Orchestrator/Capture Engine", async () => {
    resetEnterpriseRuntimeForTests();
    const probe = await probeCaptureEnterpriseRuntimeBinding();
    assert.ok(probe, "probe de binding não deve falhar");
    assert.equal(probe.entry, "getEnterpriseRuntime");
    assert.equal(probe.orchestratorOk, true);
    assert.equal(probe.captureEngineOk, true);
    assert.equal(probe.documentIntakeRuntimeOk, true);
    assert.equal(probe.documentExtractionRuntimeOk, true);
  });

  it("coordenação estrutural Extraction openJob→register→submit→close funciona via Runtime", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = resolveCaptureEnterpriseRuntime();
    const extraction = runtime.getDocumentExtractionRuntimePort();

    const opened = await extraction.openJob({
      correlationId: "epc-24b-test-session",
      requestId: "epc-24b-test-job",
    });
    assert.equal(opened.ok, true);
    const jobId = opened.job?.jobId;
    assert.ok(jobId, "openJob deve retornar jobId estrutural");

    const registered = await extraction.registerDocument({
      jobId,
      documentId: "epc-24b-doc",
      requestId: "epc-24b-test-doc",
    });
    assert.equal(registered.ok, true);

    const submitted = await extraction.submitRequest({
      jobId,
      documentId: "epc-24b-doc",
      requestId: "epc-24b-test-req",
    });
    assert.equal(submitted.ok, true);

    const closed = await extraction.closeJob({
      jobId,
      requestId: "epc-24b-test-close",
    });
    assert.equal(closed.ok, true);
  });
});
