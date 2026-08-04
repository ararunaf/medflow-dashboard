#!/usr/bin/env node
/**
 * ARCH-01 / DIP-02…DIP-06 / ARCH-02 (DIP-07) — Enterprise Runtime Integration
 * Prova: Produto → Runtime → CaptureEngine → Orchestrator → DocumentIntakeRuntime
 *        → DocumentIntakePort → OCRRuntime → OCR Provider Adapter (estrutural)
 *        → DocumentClassificationRuntime → Classification Provider Adapter (estrutural)
 *        → StorageManagerRuntime → Storage Provider Adapter (estrutural)
 *        → DocumentSearchRuntime → Search Provider Adapter (estrutural)
 *        → AIProviderRuntime → AIProviderPort → Adapter → Provider
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
  it("cria runtime com Ports DocumentIntake + Orchestrator + DocumentIntakeRuntime + CaptureEngineRuntime + OCRRuntime + ClassificationRuntime + StorageManagerRuntime + DocumentSearchRuntime + AIProviderRuntime", async () => {
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    assert.equal(runtime.runtimeId, "test");

    const intake = runtime.getDocumentIntakePort();
    const orchestrator = runtime.getOrchestratorPort();
    const intakeRuntime = runtime.getDocumentIntakeRuntimePort();
    const captureRuntime = runtime.getCaptureEngineRuntimePort();
    const ocrRuntime = runtime.getOCRRuntimePort();
    const classificationRuntime = runtime.getDocumentClassificationRuntimePort();
    const documentExtractionRuntime = runtime.getDocumentExtractionRuntimePort();
    const validationRuntime = runtime.getValidationRuntimePort();
    const aiOrchestrationRuntime = runtime.getAIOrchestrationRuntimePort();
    const auditRuntime = runtime.getAuditRuntimePort();
    const tissMappingRuntime = runtime.getTISSMappingRuntimePort();
    const autoFillRuntime = runtime.getAutoFillRuntimePort();
    const qualityRuntime = runtime.getQualityRuntimePort();
    const storageManagerRuntime = runtime.getStorageManagerRuntimePort();
    const documentSearchRuntime = runtime.getDocumentSearchRuntimePort();
    const aiProvider = runtime.getAIProviderPort();
    const aiProviderRuntime = runtime.getAIProviderRuntimePort();
    assert.ok(intake);
    assert.ok(orchestrator);
    assert.ok(intakeRuntime);
    assert.ok(captureRuntime);
    assert.ok(ocrRuntime);
    assert.ok(classificationRuntime);
    assert.ok(documentExtractionRuntime);
    assert.ok(validationRuntime);
    assert.ok(aiOrchestrationRuntime);
    assert.ok(auditRuntime);
    assert.ok(tissMappingRuntime);
    assert.ok(autoFillRuntime);
    assert.ok(qualityRuntime);
    assert.ok(storageManagerRuntime);
    assert.ok(documentSearchRuntime);
    assert.ok(aiProvider);
    assert.ok(aiProviderRuntime);
    assert.equal(aiProvider.providerId, "openai");
    assert.equal(aiProviderRuntime.providerId, "default");
    assert.equal(documentExtractionRuntime.providerId, "enterprise");
    assert.equal(validationRuntime.providerId, "enterprise");
    assert.equal(aiOrchestrationRuntime.providerId, "enterprise");
    assert.equal(auditRuntime.providerId, "enterprise");
    assert.equal(tissMappingRuntime.providerId, "enterprise");
    assert.equal(autoFillRuntime.providerId, "enterprise");
    assert.equal(qualityRuntime.providerId, "enterprise");

    const health = await runtime.health();
    assert.equal(health.ok, true);
    assert.equal(health.documentIntakeOk, true);
    assert.equal(health.orchestratorOk, true);
    assert.equal(health.documentIntakeRuntimeOk, true);
    assert.equal(health.captureEngineRuntimeOk, true);
    assert.equal(health.ocrRuntimeOk, true);
    assert.equal(health.ocrProviderOk, true);
    assert.equal(health.documentClassificationRuntimeOk, true);
    assert.equal(health.documentExtractionRuntimeOk, true);
    assert.equal(health.validationRuntimeOk, true);
    assert.equal(health.aiOrchestrationRuntimeOk, true);
    assert.equal(health.auditRuntimeOk, true);
    assert.equal(health.tissMappingRuntimeOk, true);
    assert.equal(health.autoFillRuntimeOk, true);
    assert.equal(health.qualityRuntimeOk, true);
    assert.equal(health.storageManagerRuntimeOk, true);
    assert.equal(health.documentSearchRuntimeOk, true);
    assert.equal(health.aiProviderRuntimeOk, true);
    assert.equal(health.aiProviderOk, true);
  });

  it("registerCaptureDocumentIntake passa pelo CaptureEngine → Orchestrator → DocumentIntakeRuntime → DocumentIntakePort → OCRRuntime → ClassificationRuntime → StorageManagerRuntime → DocumentSearchRuntime", async () => {
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
    assert.ok(result.classificationRuntimeSessionId);
    assert.ok(result.storageManagerRuntimeSessionId);
    assert.ok(result.documentSearchRuntimeSessionId);
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
    assert.ok(captureSession.session?.classificationRuntimeSessionId);
    assert.ok(captureSession.session?.storageManagerRuntimeSessionId);
    assert.ok(captureSession.session?.documentSearchRuntimeSessionId);

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
    assert.equal(runtime.getOCRRuntimePort().capabilities().implementsRealOcr, true);
    assert.equal(runtime.getOCRRuntimePort().capabilities().implementsAzure, false);
    assert.equal(runtime.getOCRProviderPort().providerId, "azure");
    assert.equal(runtime.getCaptureEngineRuntimePort().capabilities().implementsOcr, false);

    const classificationSession = await runtime.getDocumentClassificationRuntimePort().getSession({
      runtimeSessionId: result.classificationRuntimeSessionId!,
    });
    assert.equal(classificationSession.ok, true);
    assert.equal(classificationSession.session?.status, "coordinated");
    assert.equal(classificationSession.session?.realClassificationExecuted, false);
    assert.equal(
      runtime.getDocumentClassificationRuntimePort().capabilities().implementsRealClassification,
      true,
    );
    assert.equal(runtime.getDocumentClassificationProviderPort().providerId, "rule-based");

    const storageSession = await runtime.getStorageManagerRuntimePort().getSession({
      runtimeSessionId: result.storageManagerRuntimeSessionId!,
    });
    assert.equal(storageSession.ok, true);
    assert.equal(storageSession.session?.status, "coordinated");
    assert.equal(storageSession.session?.realStorageExecuted, false);
    assert.equal(storageSession.session?.realUploadExecuted, false);
    assert.equal(
      runtime.getStorageManagerRuntimePort().capabilities().implementsRealStorage,
      true,
    );
    assert.equal(
      runtime.getStorageManagerRuntimePort().capabilities().usesStorageProviderPort,
      true,
    );
    assert.equal(runtime.getStorageProviderPort().providerId, "supabase");

    const searchSession = await runtime.getDocumentSearchRuntimePort().getSession({
      runtimeSessionId: result.documentSearchRuntimeSessionId!,
    });
    assert.equal(searchSession.ok, true);
    assert.equal(searchSession.session?.status, "coordinated");
    assert.equal(searchSession.session?.realSearchExecuted, false);
    assert.equal(searchSession.session?.realIndexingExecuted, false);
    assert.equal(
      runtime.getDocumentSearchRuntimePort().capabilities().implementsRealSearch,
      true,
    );
    assert.equal(typeof runtime.getSearchProviderPort, "function");
    assert.equal(runtime.getSearchProviderPort().providerId, "storage-backed");
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
    assert.equal(typeof runtime.getDocumentClassificationRuntimePort, "function");
    assert.equal(typeof runtime.getDocumentExtractionRuntimePort, "function");
    assert.equal(typeof runtime.getValidationRuntimePort, "function");
    assert.equal(typeof runtime.getAIOrchestrationRuntimePort, "function");
    assert.equal(typeof runtime.getAuditRuntimePort, "function");
    assert.equal(typeof runtime.getTISSMappingRuntimePort, "function");
    assert.equal(typeof runtime.getAutoFillRuntimePort, "function");
    assert.equal(typeof runtime.getQualityRuntimePort, "function");
    assert.equal(typeof runtime.getStorageManagerRuntimePort, "function");
    assert.equal(typeof runtime.getDocumentSearchRuntimePort, "function");
    assert.equal(typeof runtime.getAIProviderPort, "function");
    assert.equal(typeof runtime.getAIProviderRuntimePort, "function");
    assert.equal(typeof runtime.registerCaptureDocumentIntake, "function");
  });
});
