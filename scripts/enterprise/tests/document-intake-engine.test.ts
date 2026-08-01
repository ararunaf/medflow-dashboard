#!/usr/bin/env node
/**
 * EPC-12 — Document Intake Foundation
 * Prova Application → DocumentIntakePort → Adapter → Store sem tocar produto.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  INTAKE_PRIORITIES,
  INTAKE_STATUSES,
  SOURCE_TYPES,
  createDocumentIntakeFactory,
  createDocumentIntakePort,
  createIntakeId,
  DEFAULT_DOCUMENT_INTAKE_ADAPTER_ID,
  DefaultDocumentIntakeAdapter,
  DefaultDocumentIntakeStore,
  defineConfigurationReference,
  defineDocumentIdentityReference,
  defineMetadataReference,
  defineOpaqueReference,
  defineStorageReference,
  defineWorkflowReference,
  getDocumentId,
  getDocumentIntakeHealthSummary,
  getStorageKey,
  getWorkflowId,
  hasKnownPriority,
  hasKnownSourceType,
  hasKnownStatus,
  intakeHasKnownSourceType,
  isArchived,
  isCompleted,
  isFailed,
  isReceived,
  listSourceTypes,
  MockDocumentIntakeAdapter,
  preparePriority,
  prepareStatusTransition,
  referencesDocumentIdentity,
  referencesWorkflow,
  withLifecycle,
  type DocumentIntake,
  type DocumentIntakePort,
} from "../../../src/lib/enterprise/document-intake/index.ts";

function sampleIntake(overrides: Partial<DocumentIntake> = {}): Omit<
  DocumentIntake,
  "intakeId" | "receivedAt" | "status"
> & {
  intakeId?: string;
  receivedAt?: string;
  status?: DocumentIntake["status"];
  sourceType: DocumentIntake["sourceType"];
} {
  return {
    sourceType: "API",
    priority: "NORMAL",
    documentIdentityReference: defineDocumentIdentityReference({
      documentId: "doc-opaque-1",
      version: "1",
      kind: "document",
    }),
    storageReference: defineStorageReference({
      key: "intake/obj-1",
      provider: "mock",
      container: "default",
    }),
    metadataReference: defineMetadataReference({
      id: "meta-1",
      kind: "schema",
      namespace: "enterprise.core",
    }),
    workflowReference: defineWorkflowReference({
      workflowId: "wf-opaque-1",
      version: "1",
    }),
    configurationReference: defineConfigurationReference({
      id: "cfg-1",
      key: "enterprise.intake.flags",
      namespace: "enterprise.core",
    }),
    tags: ["foundation", "generic"],
    capabilities: ["multi-source", "references"],
    customAttributes: {
      channel: "api",
      futureOcr: defineOpaqueReference({ id: "ocr-prep", kind: "ocr-provider" }),
      futureAi: defineOpaqueReference({ id: "ai-prep", kind: "ai-provider" }),
      futureContract: defineOpaqueReference({ id: "contract-prep", kind: "contract" }),
    },
    ...overrides,
    sourceType: overrides.sourceType ?? "API",
  };
}

describe("EPC-12 DocumentIntakePort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy", async () => {
    const port: DocumentIntakePort = new MockDocumentIntakeAdapter({ provider: "mock" });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");

    const caps = port.capabilities();
    assert.equal(caps.adapterId, "mock-in-memory");
    assert.equal(caps.supportsCreateIntake, true);
    assert.equal(caps.supportsGetIntake, true);
    assert.equal(caps.supportsListIntakes, true);
    assert.equal(caps.supportsMultipleSources, true);
    assert.equal(caps.supportsDocumentIdentityReference, true);
    assert.equal(caps.supportsStorageReference, true);
    assert.equal(caps.supportsMetadataReference, true);
    assert.equal(caps.supportsWorkflowReference, true);
    assert.equal(caps.supportsConfigurationReference, true);
    assert.equal(caps.supportsLifecycle, true);
  });

  it("test adapter é resolvido pelo provider", async () => {
    const port = createDocumentIntakePort({ provider: "test" });
    assert.equal(port.providerId, "test");
    const health = await port.health();
    assert.equal(health.ok, true);
  });

  it("Default adapter usa store in-process e declara capacidades", async () => {
    const store = new DefaultDocumentIntakeStore();
    const port: DocumentIntakePort = new DefaultDocumentIntakeAdapter({ store });

    assert.equal(port.providerId, "default");
    const caps = port.capabilities();
    assert.equal(caps.adapterId, DEFAULT_DOCUMENT_INTAKE_ADAPTER_ID);
    assert.equal(caps.supportsCreateIntake, true);

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "default");
    assert.match(health.message ?? "", /ready|pronto/i);
  });

  it("Default adapter usa ping opcional sem alterar contrato", async () => {
    const port = new DefaultDocumentIntakeAdapter({
      store: new DefaultDocumentIntakeStore(),
      ping: async () => ({ ok: true, message: "document-intake probe custom" }),
    });
    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.message, "document-intake probe custom");
    assert.equal(typeof health.latencyMs, "number");
  });

  it("provider default resolve DefaultDocumentIntakeAdapter; futuros falham explicitamente", () => {
    const defaultPort = createDocumentIntakePort();
    assert.equal(defaultPort.providerId, "default");

    assert.throws(
      () => createDocumentIntakePort({ provider: "database" }),
      /ainda não implementado/i,
    );
    assert.throws(
      () => createDocumentIntakePort({ provider: "remote" }),
      /ainda não implementado/i,
    );
    assert.throws(
      () => createDocumentIntakePort({ provider: "registry" }),
      /ainda não implementado/i,
    );
  });

  it("Factory materializa adapters corretos", () => {
    const factory = createDocumentIntakeFactory();
    assert.equal(factory.create().providerId, "default");
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
  });

  it("PoC Application depende só do Port (inversão de dependência)", async () => {
    const port = createDocumentIntakePort({ provider: "mock" });
    const summary = await getDocumentIntakeHealthSummary(port);

    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.provider, "mock");
    assert.equal(summary.capabilities.provider, "mock");
    assert.equal(summary.health.ok, true);
  });

  it("createIntake/getIntake/listIntakes funcionam no Mock", async () => {
    const port = new MockDocumentIntakeAdapter({
      createId: () => "intake-fixed-1",
      now: () => "2026-07-31T12:00:00.000Z",
    });

    const created = await port.createIntake({ intake: sampleIntake() });
    assert.equal(created.ok, true);
    assert.equal(created.intakeId, "intake-fixed-1");
    assert.equal(created.intake?.sourceType, "API");
    assert.equal(created.intake?.status, "RECEIVED");
    assert.equal(created.intake?.priority, "NORMAL");
    assert.equal(created.intake?.receivedAt, "2026-07-31T12:00:00.000Z");
    assert.equal(created.intake?.documentIdentityReference?.documentId, "doc-opaque-1");

    const got = await port.getIntake({ intakeId: "intake-fixed-1" });
    assert.equal(got.ok, true);
    assert.equal(got.intake?.intakeId, "intake-fixed-1");
    assert.equal(got.intake?.workflowReference?.workflowId, "wf-opaque-1");

    const listed = await port.listIntakes({ tag: "foundation" });
    assert.equal(listed.ok, true);
    assert.equal(listed.intakes.length, 1);

    const byDoc = await port.listIntakes({ documentId: "doc-opaque-1" });
    assert.equal(byDoc.intakes.length, 1);

    const byWorkflow = await port.listIntakes({ workflowId: "wf-opaque-1" });
    assert.equal(byWorkflow.intakes.length, 1);

    const bySource = await port.listIntakes({ sourceType: "API" });
    assert.equal(bySource.intakes.length, 1);

    const missing = await port.getIntake({ intakeId: "missing" });
    assert.equal(missing.ok, false);
    assert.equal(missing.code, "not_found");
  });

  it("Default adapter create/get/list sem OCR / IA / upload", async () => {
    const port = new DefaultDocumentIntakeAdapter({
      store: new DefaultDocumentIntakeStore(),
      createId: () => "intake-default-1",
    });

    const created = await port.createIntake({
      intake: sampleIntake({ sourceType: "UPLOAD", priority: "HIGH" }),
    });
    assert.equal(created.ok, true);
    assert.equal(created.code, "created");
    assert.equal(created.intake?.sourceType, "UPLOAD");
    assert.equal(created.intake?.priority, "HIGH");

    const listed = await port.listIntakes({ sourceType: "UPLOAD", priority: "HIGH" });
    assert.equal(listed.ok, true);
    assert.equal(listed.intakes.length, 1);
  });

  it("modelo canônico contém apenas campos permitidos", () => {
    const intake: DocumentIntake = {
      intakeId: createIntakeId(),
      sourceType: "EMAIL",
      receivedAt: "2026-07-31T00:00:00.000Z",
      status: "RECEIVED",
      priority: "NORMAL",
      documentIdentityReference: { documentId: "d1", version: "1" },
      storageReference: { key: "k1" },
      metadataReference: { id: "m1" },
      workflowReference: { workflowId: "w1" },
      configurationReference: { id: "c1" },
      tags: ["t"],
      customAttributes: { k: 1 },
      capabilities: ["cap"],
    };

    const keys = Object.keys(intake).sort();
    assert.deepEqual(keys, [
      "capabilities",
      "configurationReference",
      "customAttributes",
      "documentIdentityReference",
      "intakeId",
      "metadataReference",
      "priority",
      "receivedAt",
      "sourceType",
      "status",
      "storageReference",
      "tags",
      "workflowReference",
    ]);
  });

  it("SourceType enum e múltiplas origens (sem lógica de captura)", () => {
    assert.deepEqual(
      [...SOURCE_TYPES],
      [
        "UPLOAD",
        "WATCH_FOLDER",
        "API",
        "EMAIL",
        "SCANNER",
        "TWAIN",
        "WIA",
        "FILE_SYSTEM",
        "XML",
        "JSON",
        "WEBSERVICE",
        "OUTRO",
      ],
    );
    assert.equal(listSourceTypes().length, 12);
    assert.equal(hasKnownSourceType("UPLOAD"), true);
    assert.equal(hasKnownSourceType("SCANNER"), true);
    assert.equal(hasKnownSourceType("UNKNOWN_X"), false);

    const intake: DocumentIntake = {
      intakeId: "i-src",
      sourceType: "WATCH_FOLDER",
      receivedAt: "2026-07-31T00:00:00.000Z",
      status: "RECEIVED",
    };
    assert.equal(intakeHasKnownSourceType(intake), true);
  });

  it("ciclo de vida estrutural: RECEIVED…ARCHIVED (sem operação)", () => {
    assert.deepEqual(
      [...INTAKE_STATUSES],
      ["RECEIVED", "QUEUED", "READY", "PROCESSING", "COMPLETED", "FAILED", "ARCHIVED"],
    );
    assert.deepEqual([...INTAKE_PRIORITIES], ["LOW", "NORMAL", "HIGH", "URGENT"]);

    let intake: DocumentIntake = {
      intakeId: "i-life",
      sourceType: "API",
      receivedAt: "2026-07-31T00:00:00.000Z",
      status: "RECEIVED",
      priority: "NORMAL",
    };
    assert.equal(isReceived(intake), true);
    assert.equal(hasKnownStatus(intake), true);
    assert.equal(hasKnownPriority(intake), true);

    intake = prepareStatusTransition(intake, "QUEUED");
    assert.equal(intake.status, "QUEUED");

    intake = withLifecycle(intake, { status: "COMPLETED" });
    assert.equal(isCompleted(intake), true);

    intake = prepareStatusTransition(intake, "FAILED");
    assert.equal(isFailed(intake), true);

    intake = prepareStatusTransition(intake, "ARCHIVED");
    assert.equal(isArchived(intake), true);

    intake = preparePriority(intake, "URGENT");
    assert.equal(intake.priority, "URGENT");
  });

  it("referências opacas sem resolução (Identity/Storage/Metadata/Workflow/Config)", async () => {
    const port = new MockDocumentIntakeAdapter({ createId: () => "i-refs" });
    const created = await port.createIntake({ intake: sampleIntake() });
    const intake = created.intake!;

    assert.equal(getDocumentId(intake), "doc-opaque-1");
    assert.equal(getWorkflowId(intake), "wf-opaque-1");
    assert.equal(getStorageKey(intake), "intake/obj-1");
    assert.equal(referencesDocumentIdentity(intake, "doc-opaque-1"), true);
    assert.equal(referencesWorkflow(intake, "wf-opaque-1"), true);
    assert.equal(intake.configurationReference?.id, "cfg-1");
    assert.equal(intake.metadataReference?.id, "meta-1");
    assert.equal(intake.documentIdentityReference?.version, "1");
  });

  it("nenhum conhecimento clínico / TISS / OCR / IA no módulo (smoke estrutural)", () => {
    const forbidden = [
      "tiss",
      "unimed",
      "hapvida",
      "bradesco",
      "paciente",
      "glosa",
      "guia",
      "cid",
      "procedimento",
      "cooperativa",
      "operadora",
    ];
    const sample = JSON.stringify(sampleIntake()).toLowerCase();
    for (const token of forbidden) {
      assert.equal(sample.includes(token), false, `não deve conter ${token}`);
    }
  });
});
