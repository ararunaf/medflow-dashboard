#!/usr/bin/env node
/**
 * ARCH-01 — Enterprise Runtime Integration
 * Prova: Produto → Runtime → Orchestrator → DocumentIntakePort → Adapter
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
  it("cria runtime com Ports DocumentIntake + Orchestrator", async () => {
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    assert.equal(runtime.runtimeId, "test");

    const intake = runtime.getDocumentIntakePort();
    const orchestrator = runtime.getOrchestratorPort();
    assert.ok(intake);
    assert.ok(orchestrator);

    const health = await runtime.health();
    assert.equal(health.ok, true);
    assert.equal(health.documentIntakeOk, true);
    assert.equal(health.orchestratorOk, true);
  });

  it("registerCaptureDocumentIntake passa pelo Orchestrator e DocumentIntakePort", async () => {
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
    assert.equal(typeof runtime.registerCaptureDocumentIntake, "function");
  });
});
