/**
 * EPC-24C — Enterprise Runtime Business Pipeline Convergence.
 *
 * Valida que Audit / Contract / Risk / Correction entram pelo composition root
 * Enterprise, com engines legado apenas como implementação interna dos gateways.
 * Não altera comportamento funcional nem Foundations 4–7.
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
  probeCaptureAuditViaEnterprise,
} from "../../../src/lib/capture/enterprise/process-audit-via-enterprise";
import {
  probeCaptureContractViaEnterprise,
} from "../../../src/lib/capture/enterprise/process-contract-via-enterprise";
import {
  probeCaptureRiskViaEnterprise,
} from "../../../src/lib/capture/enterprise/process-risk-via-enterprise";
import {
  probeCaptureCorrectionViaEnterprise,
} from "../../../src/lib/capture/enterprise/process-correction-via-enterprise";
import {
  getEnterpriseRuntime,
  resetEnterpriseRuntimeForTests,
} from "../../../src/lib/enterprise/runtime";

describe("EPC-24C — Business Pipeline Convergence", () => {
  it("mantém getEnterpriseRuntime como único entrypoint oficial do Capture", () => {
    assert.equal(CAPTURE_ENTERPRISE_RUNTIME_ENTRY, "getEnterpriseRuntime");
    resetEnterpriseRuntimeForTests();
    assert.equal(resolveCaptureEnterpriseRuntime(), getEnterpriseRuntime());
  });

  it("Audit é alcançado via AuditRuntimePort do Enterprise Runtime", async () => {
    resetEnterpriseRuntimeForTests();
    const probe = await probeCaptureAuditViaEnterprise();
    assert.ok(probe, "probe de audit não deve falhar");
    assert.equal(probe.entry, "getEnterpriseRuntime");
    assert.equal(probe.auditRuntimeOk, true);
    assert.ok(probe.providerId);
  });

  it("Contract é alcançado via RulePackEnginePort do Enterprise Runtime", async () => {
    resetEnterpriseRuntimeForTests();
    const probe = await probeCaptureContractViaEnterprise();
    assert.ok(probe, "probe de contract não deve falhar");
    assert.equal(probe.entry, "getEnterpriseRuntime");
    assert.equal(probe.rulePackEngineOk, true);
    assert.ok(probe.providerId);
  });

  it("Risk é alcançado via QualityRuntimePort do Enterprise Runtime", async () => {
    resetEnterpriseRuntimeForTests();
    const probe = await probeCaptureRiskViaEnterprise();
    assert.ok(probe, "probe de risk não deve falhar");
    assert.equal(probe.entry, "getEnterpriseRuntime");
    assert.equal(probe.qualityRuntimeOk, true);
    assert.ok(probe.providerId);
  });

  it("Correction é alcançado via AutoFillRuntimePort do Enterprise Runtime", async () => {
    resetEnterpriseRuntimeForTests();
    const probe = await probeCaptureCorrectionViaEnterprise();
    assert.ok(probe, "probe de correction não deve falhar");
    assert.equal(probe.entry, "getEnterpriseRuntime");
    assert.equal(probe.autoFillRuntimeOk, true);
    assert.ok(probe.providerId);
  });

  it("binding estrutural cobre Decision Ports além de Intake/Extraction", async () => {
    resetEnterpriseRuntimeForTests();
    const probe = await probeCaptureEnterpriseRuntimeBinding();
    assert.ok(probe, "probe de binding não deve falhar");
    assert.equal(probe.entry, "getEnterpriseRuntime");
    assert.equal(probe.orchestratorOk, true);
    assert.equal(probe.captureEngineOk, true);
    assert.equal(probe.documentIntakeRuntimeOk, true);
    assert.equal(probe.documentExtractionRuntimeOk, true);
    assert.equal(probe.auditRuntimeOk, true);
    assert.equal(probe.rulePackEngineOk, true);
    assert.equal(probe.qualityRuntimeOk, true);
    assert.equal(probe.autoFillRuntimeOk, true);
  });

  it("coordenação estrutural Audit openJob→submit→close funciona via Runtime", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = resolveCaptureEnterpriseRuntime();
    const audit = runtime.getAuditRuntimePort();

    const opened = await audit.openJob({
      correlationId: "epc-24c-test-session",
      requestId: "epc-24c-test-audit-job",
    });
    assert.equal(opened.ok, true);
    const jobId = opened.job?.jobId;
    assert.ok(jobId, "openJob deve retornar jobId estrutural");

    const submitted = await audit.submitRequest({
      jobId,
      requestId: "epc-24c-test-audit-req",
    });
    assert.equal(submitted.ok, true);

    const closed = await audit.closeJob({
      jobId,
      requestId: "epc-24c-test-audit-close",
    });
    assert.equal(closed.ok, true);
  });

  it("coordenação estrutural Risk prepareQualityAssessment funciona via Runtime", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = resolveCaptureEnterpriseRuntime();
    const quality = runtime.getQualityRuntimePort();

    const prepared = await quality.prepareQualityAssessment({
      requestId: "epc-24c-test-quality",
      assessmentId: "epc-24c-test-assessment",
      qualityContext: {
        kind: "canonical-quality-context",
        assessmentId: "epc-24c-test-assessment",
        structuralNotes: "epc-24c-test",
      },
    });
    assert.equal(prepared.ok, true);
    assert.ok(prepared.assessment?.assessmentId);
  });

  it("coordenação estrutural Correction prepareAutoFill funciona via Runtime", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = resolveCaptureEnterpriseRuntime();
    const autoFill = runtime.getAutoFillRuntimePort();

    const prepared = await autoFill.prepareAutoFill({
      requestId: "epc-24c-test-autofill",
      autoFillId: "epc-24c-test-correction",
      autoFillContext: {
        kind: "canonical-auto-fill-context",
        autoFillId: "epc-24c-test-correction",
        structuralNotes: "epc-24c-test",
      },
    });
    assert.equal(prepared.ok, true);
    assert.ok(prepared.session?.autoFillId);
  });

  it("coordenação estrutural Contract listPacks funciona via RulePackEngine", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = resolveCaptureEnterpriseRuntime();
    const packs = runtime.getRulePackEnginePort();
    const listed = await packs.listPacks({ requestId: "epc-24c-test-packs" });
    assert.equal(listed.ok, true);
    assert.ok(Array.isArray(listed.packs));
  });
});
