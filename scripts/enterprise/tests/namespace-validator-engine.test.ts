#!/usr/bin/env node
/**
 * D-04 — Namespace Validation Functional Foundation
 *
 * Prova: NamespaceValidator / validateNamespace sobre CanonicalXMLDocument (D-01).
 *        Valida URI de namespace, prefixo e raiz.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseXML } from "../../../src/lib/enterprise/xml-runtime/parser/xml-parser.ts";
import {
  NamespaceValidator,
  validateNamespace,
} from "../../../src/lib/enterprise/xml-validation-runtime/namespace-validation/namespace-validator.ts";
import {
  createXMLValidationRuntimePort,
  type XMLValidationRuntimePort,
} from "../../../src/lib/enterprise/xml-validation-runtime/index.ts";

function parse(xml: string) {
  const result = parseXML(xml);
  assert.ok(result.ok, `XML parse failed: ${result.errors.map((e) => e.message).join(", ")}`);
  assert.ok(result.document, "XML parse did not produce a document");
  return result.document;
}

describe("D-04 Namespace Validator — functional cases", () => {
  it("valida namespace padrão pela URI", () => {
    const document = parse(`<root xmlns="http://example.com/ns">hello</root>`);
    const result = validateNamespace(document, { namespaceUri: "http://example.com/ns" });
    assert.equal(result.ok, true);
    assert.equal(result.valid, true);
    assert.equal(result.matched, true);
    assert.equal(result.issues.length, 0);
    assert.equal(result.code, "XML_NAMESPACE_RUNTIME_OK");
  });

  it("rejeita URI de namespace inexistente", () => {
    const document = parse(`<root xmlns="http://example.com/ns">hello</root>`);
    const result = validateNamespace(document, { namespaceUri: "http://other.com/ns" });
    assert.equal(result.ok, true);
    assert.equal(result.valid, false);
    assert.equal(result.matched, false);
    assert.ok(result.issues.some((i) => i.code === "XML_NAMESPACE_RUNTIME_URI_NOT_FOUND"));
  });

  it("valida prefixo declarado", () => {
    const document = parse(`<ex:root xmlns:ex="http://example.com/ns"/>`);
    const result = validateNamespace(document, {
      namespaceUri: "http://example.com/ns",
      prefix: "ex",
    });
    assert.equal(result.ok, true);
    assert.equal(result.valid, true);
    assert.equal(result.matched, true);
    assert.equal(result.matchedPrefix, "ex");
  });

  it("rejeita prefixo com URI incorreta", () => {
    const document = parse(`<ex:root xmlns:ex="http://example.com/ns"/>`);
    const result = validateNamespace(document, {
      namespaceUri: "http://other.com/ns",
      prefix: "ex",
    });
    assert.equal(result.ok, true);
    assert.equal(result.valid, false);
    assert.ok(result.issues.some((i) => i.code === "XML_NAMESPACE_RUNTIME_PREFIX_URI_MISMATCH"));
  });

  it("rejeita prefixo não declarado", () => {
    const document = parse(`<root/>`);
    const result = validateNamespace(document, {
      namespaceUri: "http://example.com/ns",
      prefix: "ex",
    });
    assert.equal(result.ok, true);
    assert.equal(result.valid, false);
    assert.ok(result.issues.some((i) => i.code === "XML_NAMESPACE_RUNTIME_PREFIX_NOT_DECLARED"));
  });

  it("valida elemento raiz pelo nome", () => {
    const document = parse(`<root xmlns="http://example.com/ns"/>`);
    const result = validateNamespace(document, {
      namespaceUri: "http://example.com/ns",
      rootElementName: "root",
    });
    assert.equal(result.ok, true);
    assert.equal(result.valid, true);
  });

  it("rejeita raiz com nome inesperado", () => {
    const document = parse(`<root xmlns="http://example.com/ns"/>`);
    const result = validateNamespace(document, {
      namespaceUri: "http://example.com/ns",
      rootElementName: "other",
    });
    assert.equal(result.ok, true);
    assert.equal(result.valid, false);
    assert.ok(result.issues.some((i) => i.code === "XML_NAMESPACE_RUNTIME_ROOT_MISMATCH"));
  });

  it("NamespaceValidator instanciável e funcional", () => {
    const document = parse(`<ns:doc xmlns:ns="http://example.com/ns"/>`);
    const validator = new NamespaceValidator();
    const result = validator.validate(document, { namespaceUri: "http://example.com/ns" });
    assert.equal(result.ok, true);
    assert.equal(result.valid, true);
  });
});

describe("D-04 XMLValidationRuntimePort.validateNamespace", () => {
  it("Port valida namespace e expõe namespaceValidationImplemented = true", async () => {
    const port: XMLValidationRuntimePort = createXMLValidationRuntimePort("default");
    const document = parse(`<root xmlns="http://example.com/ns"/>`);
    const result = await port.validateNamespace({
      document,
      namespaceUri: "http://example.com/ns",
      rootElementName: "root",
    });
    assert.equal(result.ok, true);
    assert.equal(result.valid, true);

    const caps = port.capabilities();
    assert.equal(caps.namespaceValidationImplemented, true);

    const health = await port.health();
    assert.equal(health.namespaceValidationOk, true);
  });
});
