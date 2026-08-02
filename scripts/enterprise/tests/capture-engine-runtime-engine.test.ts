#!/usr/bin/env node
/**
 * DIP-02 — Capture Engine Runtime
 * Prova: Runtime → Port → Adapter → Store → Factory → Provider
 *         + Enterprise Runtime + Orchestrator + DocumentIntakeRuntime + DocumentIntakePort
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_CAPTURE_ENGINE_RUNTIME_ADAPTER_ID,
  DefaultCaptureEngineRuntimeAdapter,
  CaptureEngineRuntimeFactory,
  IN_MEMORY_CAPTURE_ENGINE_RUNTIME_STORE_ID,
  InMemoryCaptureEngineRuntimeStore,
  MOCK_CAPTURE_ENGINE_RUNTIME_ADAPTER_ID,
  MockCaptureEngineRuntimeAdapter,
  createCaptureEngineRuntimeFactory,
  createCaptureEngineRuntimePort,
  createCaptureRuntimeSessionId,
  getCaptureEngineRuntimeHealthSummary,
  resetAllCaptureEngineRuntimeIdSequences,
  type CanonicalCaptureRequest,
  type CaptureEngineRuntimePort,
} from "../../../src/lib/enterprise/capture-engine-runtime/index.ts";
import { createDocumentIntakePort } from "../../../src/lib/enterprise/document-intake/index.ts";
import { createDocumentIntakeRuntimePort } from "../../../src/lib/enterprise/document-intake-runtime/index.ts";
import { createCanonicalExecutionOrchestratorPort } from "../../../src/lib/enterprise/canonical-execution-orchestrator/index.ts";
import { createOCRProviderPort } from "../../../src/lib/enterprise/ocr-provider/index.ts";
import { createOCRRuntimePort } from "../../../src/lib/enterprise/ocr-runtime/index.ts";
import { createDocumentClassificationProviderPort } from "../../../src/lib/enterprise/document-classification-provider/index.ts";
import { createDocumentClassificationRuntimePort } from "../../../src/lib/enterprise/document-classification-runtime/index.ts";
import { createStorageManagerRuntimePort } from "../../../src/lib/enterprise/storage-manager-runtime/index.ts";
import { createDocumentSearchRuntimePort } from "../../../src/lib/enterprise/document-search-runtime/index.ts";
import {
  createEnterpriseRuntime,
  resetEnterpriseRuntimeForTests,
} from "../../../src/lib/enterprise/runtime/index.ts";

function sampleRequest(
  overrides: Partial<CanonicalCaptureRequest> = {},
): CanonicalCaptureRequest {
  return {
    kind: "canonical-capture-request",
    identity: {
      kind: "canonical-capture-identity",
      documentId: "doc-dip-02",
      documentKind: "capture-document",
    },
    metadata: {
      kind: "canonical-capture-metadata",
      sessionId: "sess-dip-02",
      tenantRef: "tenant-1",
      correlationId: "corr-dip-02",
      channel: "file_upload",
      tags: ["dip-02"],
    },
    reference: {
      kind: "canonical-capture-reference",
      storageKey: "tenant/sess-dip-02/original.pdf",
      storageContainer: "clinical-documents",
      storageProvider: "product-capture",
      metadataId: "sess-dip-02",
      metadataNamespace: "product.capture",
    },
    capabilities: {
      kind: "canonical-capture-capabilities",
      declared: ["capture-engine-runtime"],
    },
    configuration: {
      kind: "canonical-capture-configuration",
      sourceType: "UPLOAD",
      channel: "file_upload",
      priority: "NORMAL",
    },
    ...overrides,
  };
}

function enterpriseDeps() {
  const documentIntakePort = createDocumentIntakePort({ provider: "mock" });
  const orchestratorPort = createCanonicalExecutionOrchestratorPort({ provider: "mock" });
  const documentIntakeRuntimePort = createDocumentIntakeRuntimePort({
    provider: "default",
    enterpriseDeps: {
      getDocumentIntakePort: () => documentIntakePort,
      getOrchestratorPort: () => orchestratorPort,
    },
  });
  const ocrProviderPort = createOCRProviderPort({ provider: "mock" });
  const ocrRuntimePort = createOCRRuntimePort({
    provider: "default",
    enterpriseDeps: {
      getOrchestratorPort: () => orchestratorPort,
      getOCRProviderPort: () => ocrProviderPort,
    },
  });
  const documentClassificationProviderPort = createDocumentClassificationProviderPort({
    provider: "rule-based",
  });
  const documentClassificationRuntimePort = createDocumentClassificationRuntimePort({
    provider: "default",
    enterpriseDeps: {
      getOrchestratorPort: () => orchestratorPort,
      getOCRRuntimePort: () => ocrRuntimePort,
      getDocumentClassificationProviderPort: () => documentClassificationProviderPort,
    },
  });
  const storageManagerRuntimePort = createStorageManagerRuntimePort({
    provider: "default",
    enterpriseDeps: {
      getOrchestratorPort: () => orchestratorPort,
      getDocumentClassificationRuntimePort: () => documentClassificationRuntimePort,
    },
  });
  const documentSearchRuntimePort = createDocumentSearchRuntimePort({
    provider: "default",
    enterpriseDeps: {
      getOrchestratorPort: () => orchestratorPort,
      getStorageManagerRuntimePort: () => storageManagerRuntimePort,
    },
  });
  return {
    documentIntakePort,
    orchestratorPort,
    documentIntakeRuntimePort,
    ocrRuntimePort,
    documentClassificationRuntimePort,
    storageManagerRuntimePort,
    documentSearchRuntimePort,
    deps: {
      getDocumentIntakeRuntimePort: () => documentIntakeRuntimePort,
      getOrchestratorPort: () => orchestratorPort,
      getOCRRuntimePort: () => ocrRuntimePort,
      getDocumentClassificationRuntimePort: () => documentClassificationRuntimePort,
      getStorageManagerRuntimePort: () => storageManagerRuntimePort,
      getDocumentSearchRuntimePort: () => documentSearchRuntimePort,
    },
  };
}

describe("DIP-02 CaptureEngineRuntimePort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy", async () => {
    const port: CaptureEngineRuntimePort = new MockCaptureEngineRuntimeAdapter({
      provider: "mock",
    });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");

    const caps = port.capabilities();
    assert.equal(caps.adapterId, MOCK_CAPTURE_ENGINE_RUNTIME_ADAPTER_ID);
    assert.equal(caps.supportsRegisterCapture, true);
    assert.equal(caps.supportsProcessOcr, true);
    assert.equal(caps.implementsOcr, false);
    assert.equal(caps.implementsAi, false);
    assert.equal(caps.implementsTiss, false);
    assert.equal(caps.implementsStorageManager, false);
    assert.equal(caps.implementsSearch, false);
  });

  it("default adapter exige enterpriseDeps (sem implementação paralela)", () => {
    assert.throws(
      () =>
        // @ts-expect-error — enterpriseDeps obrigatório
        new DefaultCaptureEngineRuntimeAdapter({}),
      /enterpriseDeps/,
    );
  });

  it("default adapter registra via Orchestrator + DocumentIntakeRuntime + OCRRuntime + ClassificationRuntime", async () => {
    resetAllCaptureEngineRuntimeIdSequences();
    const {
      deps,
      documentIntakePort,
      orchestratorPort,
      documentIntakeRuntimePort,
      ocrRuntimePort,
      documentClassificationRuntimePort,
      storageManagerRuntimePort,
      documentSearchRuntimePort,
    } = enterpriseDeps();
    const port = new DefaultCaptureEngineRuntimeAdapter({ enterpriseDeps: deps });

    assert.equal(port.providerId, "default");
    assert.equal(port.capabilities().adapterId, DEFAULT_CAPTURE_ENGINE_RUNTIME_ADAPTER_ID);
    assert.equal(port.capabilities().usesDocumentIntakeRuntime, true);
    assert.equal(port.capabilities().usesCanonicalExecutionOrchestrator, true);
    assert.equal(port.capabilities().usesDocumentIntakePort, true);
    assert.equal(port.capabilities().usesOCRRuntime, true);
    assert.equal(port.capabilities().supportsProcessOcr, true);
    assert.equal(port.capabilities().usesDocumentClassificationRuntime, true);
    assert.equal(port.capabilities().usesStorageManagerRuntime, true);
    assert.equal(port.capabilities().usesDocumentSearchRuntime, true);
    assert.equal(port.capabilities().implementsOcr, false);
    assert.equal(port.capabilities().implementsClassification, false);
    assert.equal(port.capabilities().implementsStorageManager, false);
    assert.equal(port.capabilities().implementsSearch, false);

    const result = await port.registerCapture(sampleRequest());
    assert.equal(result.ok, true);
    assert.ok(result.intakeId);
    assert.ok(result.executionId);
    assert.ok(result.runtimeSessionId);
    assert.ok(result.intakeRuntimeSessionId);
    assert.ok(result.ocrRuntimeSessionId);
    assert.ok(result.classificationRuntimeSessionId);
    assert.ok(result.storageManagerRuntimeSessionId);
    assert.ok(result.documentSearchRuntimeSessionId);
    assert.equal(result.session?.status, "registered");

    const ocrSession = await ocrRuntimePort.getSession({
      runtimeSessionId: result.ocrRuntimeSessionId!,
    });
    assert.equal(ocrSession.ok, true);
    assert.equal(ocrSession.session?.status, "coordinated");
    assert.equal(ocrSession.session?.realOcrExecuted, false);

    const classificationSession = await documentClassificationRuntimePort.getSession({
      runtimeSessionId: result.classificationRuntimeSessionId!,
    });
    assert.equal(classificationSession.ok, true);
    assert.equal(classificationSession.session?.status, "coordinated");
    assert.equal(classificationSession.session?.realClassificationExecuted, false);

    const storageSession = await storageManagerRuntimePort.getSession({
      runtimeSessionId: result.storageManagerRuntimeSessionId!,
    });
    assert.equal(storageSession.ok, true);
    assert.equal(storageSession.session?.status, "coordinated");
    assert.equal(storageSession.session?.realStorageExecuted, false);
    assert.equal(storageSession.session?.realUploadExecuted, false);

    const searchSession = await documentSearchRuntimePort.getSession({
      runtimeSessionId: result.documentSearchRuntimeSessionId!,
    });
    assert.equal(searchSession.ok, true);
    assert.equal(searchSession.session?.status, "coordinated");
    assert.equal(searchSession.session?.realSearchExecuted, false);
    assert.equal(searchSession.session?.realIndexingExecuted, false);

    const storedIntake = await documentIntakePort.getIntake({ intakeId: result.intakeId! });
    assert.equal(storedIntake.ok, true);
    assert.equal(storedIntake.intake?.sourceType, "UPLOAD");
    assert.equal(storedIntake.intake?.documentIdentityReference?.documentId, "doc-dip-02");

    const storedExec = await orchestratorPort.getExecution({
      executionId: result.executionId!,
    });
    assert.equal(storedExec.ok, true);

    const intakeSession = await documentIntakeRuntimePort.getSession({
      runtimeSessionId: result.intakeRuntimeSessionId!,
    });
    assert.equal(intakeSession.ok, true);
    assert.equal(intakeSession.session?.status, "registered");

    const session = await port.getSession({ runtimeSessionId: result.runtimeSessionId! });
    assert.equal(session.ok, true);
    assert.equal(session.session?.intakeId, result.intakeId);
  });

  it("InMemoryCaptureEngineRuntimeStore persiste sessões", () => {
    const store = new InMemoryCaptureEngineRuntimeStore();
    assert.equal(store.storeId, IN_MEMORY_CAPTURE_ENGINE_RUNTIME_STORE_ID);
    assert.equal(store.health().ok, true);

    const stamp = new Date().toISOString();
    store.setSession({
      kind: "canonical-capture-session",
      runtimeSessionId: "sess-store-1",
      status: "registered",
      request: sampleRequest(),
      createdAt: stamp,
      updatedAt: stamp,
    });
    assert.equal(store.sessionCount(), 1);
    assert.equal(store.getSession("sess-store-1")?.status, "registered");
    assert.equal(store.listSessions().length, 1);
    assert.equal(store.removeSession("sess-store-1"), true);
    assert.equal(store.sessionCount(), 0);
  });

  it("Factory e Provider resolvem default / mock / test", () => {
    const { deps } = enterpriseDeps();
    const factory = createCaptureEngineRuntimeFactory({ enterpriseDeps: deps });
    assert.ok(factory instanceof CaptureEngineRuntimeFactory);

    const defaultPort = factory.create({ provider: "default" });
    assert.equal(defaultPort.providerId, "default");

    const mockPort = createCaptureEngineRuntimePort({ provider: "mock" });
    assert.equal(mockPort.providerId, "mock");

    const testPort = createCaptureEngineRuntimePort({ provider: "test", enterpriseDeps: deps });
    assert.equal(testPort.providerId, "test");

    assert.throws(
      () => createCaptureEngineRuntimePort({ provider: "default" }),
      /enterpriseDeps/,
    );
  });

  it("Provider desconhecido não existe — ids restritos a default|mock|test", () => {
    const factory = createCaptureEngineRuntimeFactory();
    assert.throws(
      () =>
        factory.create({
          // @ts-expect-error — provider inválido
          provider: "database",
        }),
      /desconhecido|exige enterpriseDeps/,
    );
  });

  it("demo health summary depende apenas do Port", async () => {
    const port = createCaptureEngineRuntimePort({ provider: "mock" });
    const summary = await getCaptureEngineRuntimeHealthSummary(port);
    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.ok, true);
    assert.equal(summary.capabilities.supportsRegisterCapture, true);
  });

  it("registerCapture rejeita input inválido", async () => {
    const { deps } = enterpriseDeps();
    const port = createCaptureEngineRuntimePort({ provider: "default", enterpriseDeps: deps });
    const result = await port.registerCapture(
      sampleRequest({
        identity: {
          kind: "canonical-capture-identity",
          documentId: "",
        },
        metadata: {
          kind: "canonical-capture-metadata",
          sessionId: "",
        },
      }),
    );
    assert.equal(result.ok, false);
    assert.equal(result.code, "INVALID_INPUT");
  });

  it("createCaptureRuntimeSessionId é determinístico após reset", () => {
    resetAllCaptureEngineRuntimeIdSequences();
    assert.equal(createCaptureRuntimeSessionId(), "dip-capture-session-1");
    assert.equal(createCaptureRuntimeSessionId(), "dip-capture-session-2");
    resetAllCaptureEngineRuntimeIdSequences();
    assert.equal(createCaptureRuntimeSessionId(), "dip-capture-session-1");
  });
});

describe("DIP-02 integração Enterprise Runtime", () => {
  it("Enterprise Runtime expõe CaptureEngineRuntimePort", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const captureRuntime = runtime.getCaptureEngineRuntimePort();
    assert.ok(captureRuntime);
    assert.equal(captureRuntime.providerId, "default");

    const health = await runtime.health();
    assert.equal(health.ok, true);
    assert.equal(health.captureEngineRuntimeOk, true);
    assert.equal(health.documentIntakeRuntimeOk, true);
    assert.equal(health.documentIntakeOk, true);
    assert.equal(health.orchestratorOk, true);
  });

  it("registerCaptureDocumentIntake usa Capture Engine + Orchestrator + DocumentIntakeRuntime + OCRRuntime + ClassificationRuntime + StorageManagerRuntime + DocumentSearchRuntime", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });

    const result = await runtime.registerCaptureDocumentIntake({
      sessionId: "sess-arch-dip-02",
      documentId: "doc-arch-dip-02",
      storagePath: "tenant/sess-arch-dip-02/original.pdf",
      tenantRef: "tenant-1",
      correlationId: "corr-arch-dip-02",
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

    const captureSessions = await runtime.getCaptureEngineRuntimePort().listSessions({
      sessionId: "sess-arch-dip-02",
    });
    assert.equal(captureSessions.ok, true);
    assert.equal(captureSessions.sessions.length, 1);
    assert.equal(captureSessions.sessions[0]?.status, "registered");
    assert.ok(captureSessions.sessions[0]?.ocrRuntimeSessionId);
    assert.ok(captureSessions.sessions[0]?.classificationRuntimeSessionId);
    assert.ok(captureSessions.sessions[0]?.storageManagerRuntimeSessionId);
    assert.ok(captureSessions.sessions[0]?.documentSearchRuntimeSessionId);

    const intakeSessions = await runtime.getDocumentIntakeRuntimePort().listSessions({
      sessionId: "sess-arch-dip-02",
    });
    assert.equal(intakeSessions.ok, true);
    assert.equal(intakeSessions.sessions.length, 1);
    assert.equal(intakeSessions.sessions[0]?.status, "registered");

    const ocrSessions = await runtime.getOCRRuntimePort().listSessions({
      sessionId: "sess-arch-dip-02",
    });
    assert.equal(ocrSessions.ok, true);
    assert.equal(ocrSessions.sessions.length, 1);
    assert.equal(ocrSessions.sessions[0]?.status, "coordinated");
    assert.equal(ocrSessions.sessions[0]?.realOcrExecuted, false);

    const classificationSessions = await runtime
      .getDocumentClassificationRuntimePort()
      .listSessions({
        sessionId: "sess-arch-dip-02",
      });
    assert.equal(classificationSessions.ok, true);
    assert.equal(classificationSessions.sessions.length, 1);
    assert.equal(classificationSessions.sessions[0]?.status, "coordinated");
    assert.equal(classificationSessions.sessions[0]?.realClassificationExecuted, false);

    const storageSessions = await runtime.getStorageManagerRuntimePort().listSessions({
      sessionId: "sess-arch-dip-02",
    });
    assert.equal(storageSessions.ok, true);
    assert.equal(storageSessions.sessions.length, 1);
    assert.equal(storageSessions.sessions[0]?.status, "coordinated");
    assert.equal(storageSessions.sessions[0]?.realStorageExecuted, false);
    assert.equal(storageSessions.sessions[0]?.realUploadExecuted, false);

    const searchSessions = await runtime.getDocumentSearchRuntimePort().listSessions({
      sessionId: "sess-arch-dip-02",
    });
    assert.equal(searchSessions.ok, true);
    assert.equal(searchSessions.sessions.length, 1);
    assert.equal(searchSessions.sessions[0]?.status, "coordinated");
    assert.equal(searchSessions.sessions[0]?.realSearchExecuted, false);
    assert.equal(searchSessions.sessions[0]?.realIndexingExecuted, false);

    const stored = await runtime.getDocumentIntakePort().getIntake({
      intakeId: result.intakeId!,
    });
    assert.equal(stored.ok, true);

    const execution = await runtime.getOrchestratorPort().getExecution({
      executionId: result.executionId!,
    });
    assert.equal(execution.ok, true);

    const captureSession = await runtime.getCaptureEngineRuntimePort().getSession({
      runtimeSessionId: result.runtimeSessionId!,
    });
    assert.equal(captureSession.ok, true);
    assert.equal(captureSession.session?.status, "registered");
  });

  it("produto não instancia Adapter diretamente no bridge Runtime", () => {
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const keys = Object.keys(runtime);
    assert.ok(!keys.some((k) => /adapter/i.test(k)));
    assert.equal(typeof runtime.getCaptureEngineRuntimePort, "function");
    assert.equal(typeof runtime.getDocumentIntakeRuntimePort, "function");
    assert.equal(typeof runtime.getOCRRuntimePort, "function");
    assert.equal(typeof runtime.getDocumentClassificationRuntimePort, "function");
    assert.equal(typeof runtime.getStorageManagerRuntimePort, "function");
    assert.equal(typeof runtime.getDocumentSearchRuntimePort, "function");
    assert.equal(typeof runtime.registerCaptureDocumentIntake, "function");
  });
});
