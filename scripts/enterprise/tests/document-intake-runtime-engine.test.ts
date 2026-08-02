#!/usr/bin/env node
/**
 * DIP-01 — Document Intake Runtime
 * Prova: Runtime → Port → Adapter → Store → Factory → Provider
 *         + Enterprise Runtime + Orchestrator + DocumentIntakePort
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_DOCUMENT_INTAKE_RUNTIME_ADAPTER_ID,
  DefaultDocumentIntakeRuntimeAdapter,
  DocumentIntakeRuntimeFactory,
  IN_MEMORY_DOCUMENT_INTAKE_RUNTIME_STORE_ID,
  InMemoryDocumentIntakeRuntimeStore,
  MOCK_DOCUMENT_INTAKE_RUNTIME_ADAPTER_ID,
  MockDocumentIntakeRuntimeAdapter,
  createDocumentIntakeRuntimeFactory,
  createDocumentIntakeRuntimePort,
  createRuntimeSessionId,
  getDocumentIntakeRuntimeHealthSummary,
  resetAllDocumentIntakeRuntimeIdSequences,
  type CanonicalDocumentIntakeRequest,
  type DocumentIntakeRuntimePort,
} from "../../../src/lib/enterprise/document-intake-runtime/index.ts";
import { createDocumentIntakePort } from "../../../src/lib/enterprise/document-intake/index.ts";
import { createCanonicalExecutionOrchestratorPort } from "../../../src/lib/enterprise/canonical-execution-orchestrator/index.ts";
import {
  createEnterpriseRuntime,
  resetEnterpriseRuntimeForTests,
} from "../../../src/lib/enterprise/runtime/index.ts";

function sampleRequest(
  overrides: Partial<CanonicalDocumentIntakeRequest> = {},
): CanonicalDocumentIntakeRequest {
  return {
    kind: "canonical-document-intake-request",
    identity: {
      kind: "canonical-document-intake-identity",
      documentId: "doc-dip-01",
      documentKind: "capture-document",
    },
    metadata: {
      kind: "canonical-document-intake-metadata",
      sessionId: "sess-dip-01",
      tenantRef: "tenant-1",
      correlationId: "corr-dip-01",
      channel: "file_upload",
      tags: ["dip-01"],
    },
    source: {
      kind: "canonical-document-intake-source",
      sourceType: "UPLOAD",
      channel: "file_upload",
    },
    reference: {
      kind: "canonical-document-intake-reference",
      storageKey: "tenant/sess-dip-01/original.pdf",
      storageContainer: "clinical-documents",
      storageProvider: "product-capture",
      metadataId: "sess-dip-01",
      metadataNamespace: "product.capture",
    },
    capabilities: {
      kind: "canonical-document-intake-capabilities",
      declared: ["document-intake-runtime"],
    },
    ...overrides,
  };
}

function enterpriseDeps() {
  const documentIntakePort = createDocumentIntakePort({ provider: "mock" });
  const orchestratorPort = createCanonicalExecutionOrchestratorPort({ provider: "mock" });
  return {
    documentIntakePort,
    orchestratorPort,
    deps: {
      getDocumentIntakePort: () => documentIntakePort,
      getOrchestratorPort: () => orchestratorPort,
    },
  };
}

describe("DIP-01 DocumentIntakeRuntimePort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy", async () => {
    const port: DocumentIntakeRuntimePort = new MockDocumentIntakeRuntimeAdapter({
      provider: "mock",
    });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");

    const caps = port.capabilities();
    assert.equal(caps.adapterId, MOCK_DOCUMENT_INTAKE_RUNTIME_ADAPTER_ID);
    assert.equal(caps.supportsRegisterIntake, true);
    assert.equal(caps.implementsOcr, false);
    assert.equal(caps.implementsAi, false);
    assert.equal(caps.implementsTiss, false);
  });

  it("default adapter exige enterpriseDeps (sem implementação paralela)", () => {
    assert.throws(
      () =>
        // @ts-expect-error — enterpriseDeps obrigatório
        new DefaultDocumentIntakeRuntimeAdapter({}),
      /enterpriseDeps/,
    );
  });

  it("default adapter registra via Orchestrator + DocumentIntakePort", async () => {
    resetAllDocumentIntakeRuntimeIdSequences();
    const { deps, documentIntakePort, orchestratorPort } = enterpriseDeps();
    const port = new DefaultDocumentIntakeRuntimeAdapter({ enterpriseDeps: deps });

    assert.equal(port.providerId, "default");
    assert.equal(port.capabilities().adapterId, DEFAULT_DOCUMENT_INTAKE_RUNTIME_ADAPTER_ID);
    assert.equal(port.capabilities().usesDocumentIntakePort, true);
    assert.equal(port.capabilities().usesCanonicalExecutionOrchestrator, true);

    const result = await port.registerIntake(sampleRequest());
    assert.equal(result.ok, true);
    assert.ok(result.intakeId);
    assert.ok(result.executionId);
    assert.ok(result.runtimeSessionId);
    assert.equal(result.session?.status, "registered");

    const storedIntake = await documentIntakePort.getIntake({ intakeId: result.intakeId! });
    assert.equal(storedIntake.ok, true);
    assert.equal(storedIntake.intake?.sourceType, "UPLOAD");
    assert.equal(storedIntake.intake?.documentIdentityReference?.documentId, "doc-dip-01");

    const storedExec = await orchestratorPort.getExecution({
      executionId: result.executionId!,
    });
    assert.equal(storedExec.ok, true);

    const session = await port.getSession({ runtimeSessionId: result.runtimeSessionId! });
    assert.equal(session.ok, true);
    assert.equal(session.session?.intakeId, result.intakeId);
  });

  it("InMemoryDocumentIntakeRuntimeStore persiste sessões", () => {
    const store = new InMemoryDocumentIntakeRuntimeStore();
    assert.equal(store.storeId, IN_MEMORY_DOCUMENT_INTAKE_RUNTIME_STORE_ID);
    assert.equal(store.health().ok, true);

    const stamp = new Date().toISOString();
    store.setSession({
      kind: "canonical-document-intake-session",
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
    const factory = createDocumentIntakeRuntimeFactory({ enterpriseDeps: deps });
    assert.ok(factory instanceof DocumentIntakeRuntimeFactory);

    const defaultPort = factory.create({ provider: "default" });
    assert.equal(defaultPort.providerId, "default");

    const mockPort = createDocumentIntakeRuntimePort({ provider: "mock" });
    assert.equal(mockPort.providerId, "mock");

    const testPort = createDocumentIntakeRuntimePort({ provider: "test", enterpriseDeps: deps });
    assert.equal(testPort.providerId, "test");

    assert.throws(
      () => createDocumentIntakeRuntimePort({ provider: "default" }),
      /enterpriseDeps/,
    );
  });

  it("Provider desconhecido não existe — ids restritos a default|mock|test", () => {
    const factory = createDocumentIntakeRuntimeFactory();
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
    const port = createDocumentIntakeRuntimePort({ provider: "mock" });
    const summary = await getDocumentIntakeRuntimeHealthSummary(port);
    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.ok, true);
    assert.equal(summary.capabilities.supportsRegisterIntake, true);
  });

  it("registerIntake rejeita input inválido", async () => {
    const { deps } = enterpriseDeps();
    const port = createDocumentIntakeRuntimePort({ provider: "default", enterpriseDeps: deps });
    const result = await port.registerIntake(
      sampleRequest({
        identity: {
          kind: "canonical-document-intake-identity",
          documentId: "",
        },
        metadata: {
          kind: "canonical-document-intake-metadata",
          sessionId: "",
        },
      }),
    );
    assert.equal(result.ok, false);
    assert.equal(result.code, "INVALID_INPUT");
  });

  it("createRuntimeSessionId é determinístico após reset", () => {
    resetAllDocumentIntakeRuntimeIdSequences();
    assert.equal(createRuntimeSessionId(), "dip-intake-session-1");
    assert.equal(createRuntimeSessionId(), "dip-intake-session-2");
    resetAllDocumentIntakeRuntimeIdSequences();
    assert.equal(createRuntimeSessionId(), "dip-intake-session-1");
  });
});

describe("DIP-01 integração Enterprise Runtime", () => {
  it("Enterprise Runtime expõe DocumentIntakeRuntimePort", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const intakeRuntime = runtime.getDocumentIntakeRuntimePort();
    assert.ok(intakeRuntime);
    assert.equal(intakeRuntime.providerId, "default");

    const health = await runtime.health();
    assert.equal(health.ok, true);
    assert.equal(health.documentIntakeRuntimeOk, true);
    assert.equal(health.documentIntakeOk, true);
    assert.equal(health.orchestratorOk, true);
  });

  it("registerCaptureDocumentIntake usa DocumentIntakeRuntime + Orchestrator + DocumentIntakePort", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });

    const result = await runtime.registerCaptureDocumentIntake({
      sessionId: "sess-arch-dip",
      documentId: "doc-arch-dip",
      storagePath: "tenant/sess-arch-dip/original.pdf",
      tenantRef: "tenant-1",
      correlationId: "corr-arch-dip",
      channel: "file_upload",
    });

    assert.equal(result.ok, true);
    assert.ok(result.intakeId);
    assert.ok(result.executionId);
    assert.ok(result.runtimeSessionId);
    assert.equal(result.intake?.ok, true);
    assert.equal(result.execution?.ok, true);
    assert.equal(result.intake?.intake?.sourceType, "UPLOAD");

    const sessions = await runtime.getDocumentIntakeRuntimePort().listSessions({
      sessionId: "sess-arch-dip",
    });
    assert.equal(sessions.ok, true);
    assert.equal(sessions.sessions.length, 1);
    assert.equal(sessions.sessions[0]?.status, "registered");

    const stored = await runtime.getDocumentIntakePort().getIntake({
      intakeId: result.intakeId!,
    });
    assert.equal(stored.ok, true);

    const execution = await runtime.getOrchestratorPort().getExecution({
      executionId: result.executionId!,
    });
    assert.equal(execution.ok, true);
  });

  it("produto não instancia DocumentIntakeAdapter diretamente no bridge Runtime", () => {
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const keys = Object.keys(runtime);
    assert.ok(!keys.some((k) => /adapter/i.test(k)));
    assert.equal(typeof runtime.getDocumentIntakeRuntimePort, "function");
    assert.equal(typeof runtime.registerCaptureDocumentIntake, "function");
  });
});
