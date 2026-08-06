#!/usr/bin/env node
/**
 * D-03 — Enterprise XML Schema Runtime — Schema Selection Functional Foundation
 * Prova: XMLSchemaRuntimePort.select() em Default / Mock / Enterprise adapters.
 * Sem XSD oficial. Sem TISS/ANS. Sem operadoras. Sem contratos.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createXMLSchemaRuntimePort,
  DEFAULT_XML_SCHEMA_RUNTIME_CAPABILITIES,
  MockXMLSchemaAdapter,
  type XMLSchemaRuntimePort,
} from "../../../src/lib/enterprise/xml-schema-runtime/index.ts";

describe("D-03 XMLSchemaRuntimePort.select — schema selection functional foundation", () => {
  it("seleciona schema por schemaId", async () => {
    const port: XMLSchemaRuntimePort = createXMLSchemaRuntimePort({ provider: "enterprise" });
    const registered = await port.register({
      schemaId: "schema-d03-1",
      name: "MyCanonicalSchema",
      documentId: "doc-d03-1",
      request: {
        kind: "canonical-xml-schema-request",
        schemaId: "schema-d03-1",
        name: "MyCanonicalSchema",
        documentId: "doc-d03-1",
      },
    });
    assert.equal(registered.ok, true);

    const selected = await port.select({ schemaId: "schema-d03-1" });
    assert.equal(selected.ok, true);
    assert.equal(selected.schema?.schemaId, "schema-d03-1");
    assert.equal(selected.schema?.implementsOfficialXsd, false);
    assert.equal(selected.result?.operation, "select");
    assert.equal(selected.result?.status, "completed");
  });

  it("seleciona schema por documentId", async () => {
    const port: XMLSchemaRuntimePort = createXMLSchemaRuntimePort({ provider: "enterprise" });
    const registered = await port.register({
      schemaId: "schema-d03-2",
      name: "SchemaByDoc",
      documentId: "doc-d03-2",
      request: {
        kind: "canonical-xml-schema-request",
        schemaId: "schema-d03-2",
        name: "SchemaByDoc",
        documentId: "doc-d03-2",
      },
    });
    assert.equal(registered.ok, true);

    const selected = await port.select({ documentId: "doc-d03-2" });
    assert.equal(selected.ok, true);
    assert.equal(selected.schema?.schemaId, "schema-d03-2");
  });

  it("seleciona schema por nome e versão", async () => {
    const port: XMLSchemaRuntimePort = createXMLSchemaRuntimePort({ provider: "enterprise" });
    const registered = await port.register({
      schemaId: "schema-d03-3",
      name: "VersionedSchema",
      documentId: "doc-d03-3",
      request: {
        kind: "canonical-xml-schema-request",
        schemaId: "schema-d03-3",
        name: "VersionedSchema",
        documentId: "doc-d03-3",
        version: {
          kind: "canonical-xml-schema-version",
          major: 2,
          minor: 1,
          patch: 0,
          label: "v2.1.0",
        },
      },
    });
    assert.equal(registered.ok, true);

    const selected = await port.select({
      name: "VersionedSchema",
      version: {
        kind: "canonical-xml-schema-version",
        major: 2,
        minor: 1,
        patch: 0,
      },
    });
    assert.equal(selected.ok, true);
    assert.equal(selected.schema?.schemaId, "schema-d03-3");
    assert.equal(selected.schema?.version?.major, 2);
    assert.equal(selected.schema?.version?.minor, 1);
  });

  it("não seleciona schema inexistente", async () => {
    const port: XMLSchemaRuntimePort = createXMLSchemaRuntimePort({ provider: "enterprise" });
    const selected = await port.select({ schemaId: "schema-desconhecido" });
    assert.equal(selected.ok, false);
    assert.equal(selected.code, "XML_SCHEMA_RUNTIME_NOT_FOUND");
    assert.equal(selected.schema, undefined);
  });

  it("capabilities declara schemaSelectionImplemented = true", async () => {
    const port: XMLSchemaRuntimePort = createXMLSchemaRuntimePort({ provider: "enterprise" });
    const caps = port.capabilities();
    assert.equal(caps.schemaSelectionImplemented, true);
    assert.equal(caps.engine.schemaSelectionImplemented, true);
    assert.equal(caps.canonical.schemaSelectionImplemented, true);
    assert.equal(caps.canonical.supportsSelect, true);
    assert.equal(caps.implementsOfficialXsd, false);
    assert.equal(caps.implementsXsdValidation, false);
    assert.equal(caps.knowsTissPattern, false);
  });

  it("health expõe schemaSelectionOk = true", async () => {
    const port: XMLSchemaRuntimePort = createXMLSchemaRuntimePort({ provider: "enterprise" });
    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.schemaSelectionOk, true);
  });

  it("mock adapter suporta select e mantém schemaSelectionImplemented", async () => {
    const port: XMLSchemaRuntimePort = new MockXMLSchemaAdapter({ provider: "mock" });
    await port.register({
      schemaId: "mock-schema-d03",
      name: "MockSchema",
      documentId: "mock-doc-d03",
      request: {
        kind: "canonical-xml-schema-request",
        schemaId: "mock-schema-d03",
        name: "MockSchema",
        documentId: "mock-doc-d03",
      },
    });

    const selected = await port.select({ schemaId: "mock-schema-d03" });
    assert.equal(selected.ok, true);
    assert.equal(selected.schema?.schemaId, "mock-schema-d03");
    assert.equal(port.capabilities().schemaSelectionImplemented, true);
    assert.equal((await port.health()).schemaSelectionOk, true);
  });
});
