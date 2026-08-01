#!/usr/bin/env node
/**
 * EPC-08 — Document Identity Foundation
 * Prova Application → DocumentIdentityPort → Adapter → Store sem tocar produto.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createDocumentIdentityFactory,
  createDocumentIdentityPort,
  createDocumentUuid,
  DEFAULT_DOCUMENT_IDENTITY_ADAPTER_ID,
  DefaultDocumentIdentityAdapter,
  DefaultDocumentIdentityStore,
  defineCanonicalIdentity,
  defineChecksum,
  defineFingerprint,
  defineHash,
  findPageById,
  findPageBySequence,
  getCorrelationId,
  getDocumentIdentityHealthSummary,
  getExternalId,
  getPageCount,
  getSourceId,
  hasCanonicalIdentity,
  MockDocumentIdentityAdapter,
  resequencePages,
  sortPagesBySequence,
  type DocumentIdentity,
  type DocumentIdentityPort,
  type DocumentPage,
} from "../../../src/lib/enterprise/document-identity/index.ts";

function samplePages(): DocumentPage[] {
  return [
    {
      pageId: "page-2",
      sequence: 2,
      width: 1240,
      height: 1754,
      rotation: 0,
      checksum: defineChecksum("abc2", "sha256"),
      imageReference: { uri: "opaque://img/2" },
      thumbnailReference: { uri: "opaque://thumb/2" },
    },
    {
      pageId: "page-1",
      sequence: 1,
      width: 1240,
      height: 1754,
      rotation: 90,
      checksum: defineChecksum("abc1", "sha256"),
      imageReference: { uri: "opaque://img/1" },
    },
  ];
}

function sampleDocument(overrides: Partial<DocumentIdentity> = {}): Omit<
  DocumentIdentity,
  "documentId" | "createdAt" | "updatedAt" | "status"
> & {
  documentId?: string;
  status?: DocumentIdentity["status"];
} {
  return {
    documentType: "generic",
    source: "upload",
    pages: samplePages(),
    attachments: [
      {
        id: "att-1",
        name: "sidecar.bin",
        mimeType: "application/octet-stream",
        fileSize: 128,
        storageReference: { key: "docs/att-1", container: "default" },
      },
    ],
    images: [{ id: "img-1", sequence: 1, mimeType: "image/png", width: 100, height: 100 }],
    metadataReference: { id: "meta-1", kind: "schema", namespace: "enterprise.core" },
    storageReference: { key: "docs/doc-1", provider: "mock", container: "default" },
    checksum: defineChecksum("root-checksum", "sha256"),
    version: "1",
    mimeType: "application/pdf",
    fileSize: 2048,
    language: "pt-BR",
    tags: ["foundation", "generic"],
    customAttributes: { channel: "api", batch: 7 },
    identity: defineCanonicalIdentity({
      hash: defineHash("hash-1", "sha256"),
      fingerprint: defineFingerprint("fp-1", "content"),
      sourceId: "src-99",
      correlationId: "corr-42",
      externalId: "ext-7",
      origin: "ingest-pipeline",
    }),
    ...overrides,
  };
}

describe("EPC-08 DocumentIdentityPort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy", async () => {
    const port: DocumentIdentityPort = new MockDocumentIdentityAdapter({ provider: "mock" });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");

    const caps = port.capabilities();
    assert.equal(caps.adapterId, "mock-in-memory");
    assert.equal(caps.supportsCreateDocument, true);
    assert.equal(caps.supportsGetDocument, true);
    assert.equal(caps.supportsListDocuments, true);
    assert.equal(caps.supportsPages, true);
    assert.equal(caps.supportsCanonicalIdentity, true);
    assert.equal(caps.supportsMetadataReference, true);
    assert.equal(caps.supportsStorageReference, true);
  });

  it("test adapter é resolvido pelo provider", async () => {
    const port = createDocumentIdentityPort({ provider: "test" });
    assert.equal(port.providerId, "test");
    const health = await port.health();
    assert.equal(health.ok, true);
  });

  it("Default adapter usa store in-process e declara capacidades", async () => {
    const store = new DefaultDocumentIdentityStore();
    const port: DocumentIdentityPort = new DefaultDocumentIdentityAdapter({ store });

    assert.equal(port.providerId, "default");
    const caps = port.capabilities();
    assert.equal(caps.adapterId, DEFAULT_DOCUMENT_IDENTITY_ADAPTER_ID);
    assert.equal(caps.supportsCreateDocument, true);

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "default");
    assert.match(health.message ?? "", /ready|pronto/i);
  });

  it("Default adapter usa ping opcional sem alterar contrato", async () => {
    const port = new DefaultDocumentIdentityAdapter({
      store: new DefaultDocumentIdentityStore(),
      ping: async () => ({ ok: true, message: "document-identity probe custom" }),
    });
    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.message, "document-identity probe custom");
    assert.equal(typeof health.latencyMs, "number");
  });

  it("provider default resolve DefaultDocumentIdentityAdapter; futuros falham explicitamente", () => {
    const defaultPort = createDocumentIdentityPort();
    assert.equal(defaultPort.providerId, "default");

    assert.throws(
      () => createDocumentIdentityPort({ provider: "database" }),
      /ainda não implementado/i,
    );
    assert.throws(
      () => createDocumentIdentityPort({ provider: "remote" }),
      /ainda não implementado/i,
    );
    assert.throws(
      () => createDocumentIdentityPort({ provider: "registry" }),
      /ainda não implementado/i,
    );
  });

  it("Factory materializa adapters corretos", () => {
    const factory = createDocumentIdentityFactory();
    assert.equal(factory.create().providerId, "default");
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
  });

  it("PoC Application depende só do Port (inversão de dependência)", async () => {
    const port = createDocumentIdentityPort({ provider: "mock" });
    const summary = await getDocumentIdentityHealthSummary(port);

    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.provider, "mock");
    assert.equal(summary.capabilities.provider, "mock");
    assert.equal(summary.health.ok, true);
  });

  it("createDocument/getDocument/listDocuments funcionam no Mock", async () => {
    const port = new MockDocumentIdentityAdapter({
      createId: () => "doc-fixed-1",
      now: () => "2026-07-31T12:00:00.000Z",
    });

    const created = await port.createDocument({ document: sampleDocument() });
    assert.equal(created.ok, true);
    assert.equal(created.documentId, "doc-fixed-1");
    assert.equal(created.document?.documentType, "generic");
    assert.equal(created.document?.status, "draft");
    assert.equal(created.document?.identity?.uuid, "doc-fixed-1");
    assert.equal(created.document?.identity?.correlationId, "corr-42");

    const get = await port.getDocument({ documentId: "doc-fixed-1" });
    assert.equal(get.ok, true);
    assert.equal(get.document?.mimeType, "application/pdf");
    assert.equal(get.document?.fileSize, 2048);

    const list = await port.listDocuments({
      documentType: "generic",
      tag: "foundation",
      correlationId: "corr-42",
    });
    assert.equal(list.ok, true);
    assert.equal(list.documents.length, 1);

    const missing = await port.getDocument({ documentId: "nope" });
    assert.equal(missing.ok, false);
  });

  it("createDocument no Default gera id, timestamps e permite update", async () => {
    let idSeq = 0;
    let clock = 0;
    const store = new DefaultDocumentIdentityStore();
    const port = new DefaultDocumentIdentityAdapter({
      store,
      createId: () => `doc-gen-${++idSeq}`,
      now: () => `2026-07-31T1${++clock}:00:00.000Z`,
    });

    const first = await port.createDocument({
      document: sampleDocument({ documentType: "invoice-like", status: "active" }),
    });
    assert.equal(first.ok, true);
    assert.equal(first.documentId, "doc-gen-1");
    assert.equal(first.document?.status, "active");
    assert.equal(first.document?.createdAt, "2026-07-31T11:00:00.000Z");

    const second = await port.createDocument({
      document: sampleDocument({
        documentId: "doc-gen-1",
        documentType: "invoice-like",
        version: "2",
        status: "archived",
      }),
    });
    assert.equal(second.ok, true);
    assert.equal(second.message, "document updated");
    assert.equal(second.document?.createdAt, "2026-07-31T11:00:00.000Z");
    assert.equal(second.document?.updatedAt, "2026-07-31T12:00:00.000Z");
    assert.equal(second.document?.version, "2");
    assert.equal(second.document?.status, "archived");
  });

  it("filtros de listagem cobrem source/status/ids de identidade", async () => {
    const port = new MockDocumentIdentityAdapter();
    await port.createDocument({
      document: sampleDocument({
        documentId: "a-1",
        source: "scan",
        status: "active",
        identity: defineCanonicalIdentity({
          sourceId: "S1",
          externalId: "E1",
          correlationId: "C1",
        }),
      }),
    });
    await port.createDocument({
      document: sampleDocument({
        documentId: "b-2",
        source: "upload",
        status: "draft",
        documentType: "other",
      }),
    });

    const bySource = await port.listDocuments({ source: "scan" });
    assert.equal(bySource.documents.length, 1);

    const byStatus = await port.listDocuments({ status: "draft" });
    assert.equal(byStatus.documents.length, 1);

    const byPrefix = await port.listDocuments({ idPrefix: "a-" });
    assert.equal(byPrefix.documents.length, 1);

    const byExt = await port.listDocuments({ externalId: "E1", sourceId: "S1" });
    assert.equal(byExt.documents.length, 1);
  });
});

describe("EPC-08 modelo canônico / páginas / identidade", () => {
  it("modelo canônico aceita apenas campos genéricos (sem domínio clínico)", async () => {
    const port = createDocumentIdentityPort({ provider: "mock" });
    const result = await port.createDocument({
      document: sampleDocument({ documentId: "canon-1" }),
    });
    const doc = result.document!;

    // Campos canônicos presentes
    assert.equal(doc.documentId, "canon-1");
    assert.equal(typeof doc.documentType, "string");
    assert.ok(doc.createdAt);
    assert.ok(doc.updatedAt);
    assert.ok(doc.status);
    assert.ok(Array.isArray(doc.pages));
    assert.ok(Array.isArray(doc.attachments));
    assert.ok(Array.isArray(doc.images));
    assert.ok(doc.metadataReference);
    assert.ok(doc.storageReference);
    assert.ok(doc.checksum);
    assert.ok(doc.version);
    assert.ok(doc.mimeType);
    assert.equal(typeof doc.fileSize, "number");
    assert.ok(doc.language);
    assert.ok(doc.tags);
    assert.ok(doc.customAttributes);

    // Ausência de conhecimento de domínio (chaves proibidas não existem no modelo tipado)
    const asRecord = doc as unknown as Record<string, unknown>;
    assert.equal(asRecord.tissGuide, undefined);
    assert.equal(asRecord.patientId, undefined);
    assert.equal(asRecord.contractId, undefined);
    assert.equal(asRecord.clinicalNotes, undefined);
  });

  it("páginas são estruturais (sequence/geometry) sem informação clínica", () => {
    const pages = samplePages();
    const sorted = sortPagesBySequence(pages);
    assert.equal(sorted[0]?.pageId, "page-1");
    assert.equal(sorted[1]?.pageId, "page-2");

    const reseq = resequencePages([
      { pageId: "p-a", sequence: 9 },
      { pageId: "p-b", sequence: 3 },
    ]);
    assert.deepEqual(
      reseq.map((p) => [p.pageId, p.sequence]),
      [
        ["p-b", 1],
        ["p-a", 2],
      ],
    );

    const document: DocumentIdentity = {
      documentId: "d1",
      documentType: "generic",
      createdAt: "t0",
      updatedAt: "t0",
      status: "draft",
      pages: sorted,
    };
    assert.equal(getPageCount(document), 2);
    assert.equal(findPageById(document, "page-2")?.sequence, 2);
    assert.equal(findPageBySequence(document, 1)?.pageId, "page-1");

    for (const page of sorted) {
      const rec = page as unknown as Record<string, unknown>;
      assert.equal(rec.diagnosis, undefined);
      assert.equal(rec.procedureCode, undefined);
    }
  });

  it("identidade canônica expõe UUID/Hash/Fingerprint/Checksum/SourceId/CorrelationId/ExternalId/Origin", () => {
    const uuid = createDocumentUuid();
    assert.match(uuid, /^[0-9a-f-]{36}$/i);

    const identity = defineCanonicalIdentity({
      uuid,
      hash: defineHash("h", "sha256"),
      fingerprint: defineFingerprint("f", "method"),
      checksum: defineChecksum("c", "md5"),
      sourceId: "s",
      correlationId: "c1",
      externalId: "e",
      origin: "o",
    });

    const document: DocumentIdentity = {
      documentId: "d",
      documentType: "generic",
      createdAt: "t",
      updatedAt: "t",
      status: "draft",
      identity,
    };

    assert.equal(hasCanonicalIdentity(document), true);
    assert.equal(getCorrelationId(document), "c1");
    assert.equal(getExternalId(document), "e");
    assert.equal(getSourceId(document), "s");
    assert.equal(document.identity?.origin, "o");
    assert.equal(document.identity?.hash?.value, "h");
    assert.equal(document.identity?.fingerprint?.value, "f");
    assert.equal(document.identity?.checksum?.value, "c");
  });

  it("documentType é string livre — qualquer tipo sem enum de domínio", async () => {
    const port = new MockDocumentIdentityAdapter();
    for (const documentType of ["generic", "scan", "import", "unknown-xyz", "future-type"]) {
      const r = await port.createDocument({
        document: { documentType, documentId: `id-${documentType}` },
      });
      assert.equal(r.ok, true);
      assert.equal(r.document?.documentType, documentType);
    }
  });
});
