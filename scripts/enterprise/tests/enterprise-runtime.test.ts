#!/usr/bin/env node
/**
 * ARCH-01 / DIP-02 / DIP-03 — Enterprise Runtime Integration
 * Prova: Produto → Runtime → CaptureEngine → Orchestrator → DocumentIntakeRuntime
 *        → DocumentIntakePort → OCRRuntime → OCR Provider Adapter (estrutural)
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createEnterpriseRuntime,
  getEnterpriseRuntime,
  resetEnterpriseRuntimeForTests,
  setEnterpriseRuntimeForTests,
  type EnterpriseRuntime,
} from "../../../src/lib/enterprise/runtime/index.ts";
import { createDocumentIntakePort } from "../../../src/lib/enterprise/document-intake/index.ts";
import { createCanonicalExecutionOrchestratorPort } from "../../../src/lib/enterprise/canonical-execution-orchestrator/index.ts";

describe("ARCH-01 Enterprise Runtime", () => {
  it("cria runtime com Ports DocumentIntake + Orchestrator + DocumentIntakeRuntime + CaptureEngineRuntime + OCRRuntime", async () => {
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    assert.equal(runtime.runtimeId, "test");

    const intake = runtime.getDocumentIntakePort();
    const orchestrator = runtime.getOrchestratorPort();
    const intakeRuntime = runtime.getDocumentIntakeRuntimePort();
    const captureRuntime = runtime.getCaptureEngineRuntimePort();
    const ocrRuntime = runtime.getOCRRuntimePort();
    assert.ok(intake);
    assert.ok(orchestrator);
    assert.ok(intakeRuntime);
    assert.ok(captureRuntime);
    assert.ok(ocrRuntime);

    const health = await runtime.health();
    assert.equal(health.ok, true);
    assert.equal(health.documentIntakeOk, true);
    assert.equal(health.orchestratorOk, true);
    assert.equal(health.documentIntakeRuntimeOk, true);
    assert.equal(health.captureEngineRuntimeOk, true);
    assert.equal(health.ocrRuntimeOk, true);
    assert.equal(health.ocrProviderOk, true);
  });

  it("registerCaptureDocumentIntake passa pelo CaptureEngine → Orchestrator → DocumentIntakeRuntime → DocumentIntakePort → OCRRuntime", async () => {
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const result = await runtime.registerCaptureDocumentIntake({
      sessionId: "sess-arch-01",
      documentId: "doc-arch-01",
      storagePath: "tenant/sess-arch-01/original.pdf",
      tenantRef: "tenant-1",
      correlationId: "corr-1",
      channel: "file_upload",
    });

    assert.equal(result.ok, true);
    assert.ok(result.intakeId);
    assert.ok(result.executionId);
    assert.ok(result.runtimeSessionId);
    assert.ok(result.ocrRuntimeSessionId);
    assert.equal(result.intake?.ok, true);
    assert.equal(result.execution?.ok, true);
    assert.equal(result.intake?.intake?.sourceType, "UPLOAD");
    assert.equal(result.intake?.intake?.documentIdentityReference?.documentId, "doc-arch-01");

    const stored = await runtime.getDocumentIntakePort().getIntake({
      intakeId: result.intakeId!,
    });
    assert.equal(stored.ok, true);
    assert.equal(stored.intake?.metadataReference?.id, "sess-arch-01");

    const execution = await runtime.getOrchestratorPort().getExecution({
      executionId: result.executionId!,
    });
    assert.equal(execution.ok, true);

    const captureSession = await runtime.getCaptureEngineRuntimePort().getSession({
      runtimeSessionId: result.runtimeSessionId!,
    });
    assert.equal(captureSession.ok, true);
    assert.equal(captureSession.session?.status, "registered");
    assert.ok(captureSession.session?.ocrRuntimeSessionId);

    const intakeSessions = await runtime.getDocumentIntakeRuntimePort().listSessions({
      sessionId: "sess-arch-01",
    });
    assert.equal(intakeSessions.ok, true);
    assert.equal(intakeSessions.sessions.length, 1);
    assert.equal(intakeSessions.sessions[0]?.status, "registered");

    const ocrSession = await runtime.getOCRRuntimePort().getSession({
      runtimeSessionId: result.ocrRuntimeSessionId!,
    });
    assert.equal(ocrSession.ok, true);
    assert.equal(ocrSession.session?.status, "coordinated");
    assert.equal(ocrSession.session?.realOcrExecuted, false);
    assert.equal(runtime.getOCRRuntimePort().capabilities().implementsRealOcr, false);
  });

  it("não lança em input inválido — retorna ok:false", async () => {
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const result = await runtime.registerCaptureDocumentIntake({
      sessionId: "",
      documentId: "",
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "INVALID_INPUT");
  });

  it("aceita Ports injetados (DI / testes)", async () => {
    const documentIntakePort = createDocumentIntakePort({ provider: "mock" });
    const orchestratorPort = createCanonicalExecutionOrchestratorPort({ provider: "mock" });
    const runtime = createEnterpriseRuntime({
      runtimeId: "test",
      documentIntakePort,
      orchestratorPort,
    });

    assert.equal(runtime.getDocumentIntakePort().providerId, "mock");
    assert.equal(runtime.getOrchestratorPort().providerId, "mock");

    const result = await runtime.registerCaptureDocumentIntake({
      sessionId: "s-1",
      documentId: "d-1",
    });
    assert.equal(result.ok, true);
  });

  it("singleton getEnterpriseRuntime é estável e resetável", () => {
    resetEnterpriseRuntimeForTests();
    const a = getEnterpriseRuntime();
    const b = getEnterpriseRuntime();
    assert.equal(a, b);

    const custom = createEnterpriseRuntime({ runtimeId: "test" });
    const restore = setEnterpriseRuntimeForTests(custom);
    assert.equal(getEnterpriseRuntime(), custom);
    restore();
    assert.equal(getEnterpriseRuntime(), a);
    resetEnterpriseRuntimeForTests();
  });

  it("Runtime não expõe Adapters concretos na superfície pública", () => {
    const runtime: EnterpriseRuntime = createEnterpriseRuntime();
    const keys = Object.keys(runtime);
    assert.ok(!keys.some((k) => /adapter/i.test(k)));
    assert.equal(typeof runtime.getDocumentIntakePort, "function");
    assert.equal(typeof runtime.getOrchestratorPort, "function");
    assert.equal(typeof runtime.getDocumentIntakeRuntimePort, "function");
    assert.equal(typeof runtime.getCaptureEngineRuntimePort, "function");
    assert.equal(typeof runtime.getOCRRuntimePort, "function");
    assert.equal(typeof runtime.registerCaptureDocumentIntake, "function");
  });
});
