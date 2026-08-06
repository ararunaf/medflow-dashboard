#!/usr/bin/env node
/**
 * D-05 — Version Validation Functional Foundation
 *
 * Prova: VersionValidator / validateVersion sobre CanonicalXMLDocument (D-01).
 *        Valida atributo/elemento de versão.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseXML } from "../../../src/lib/enterprise/xml-runtime/parser/xml-parser.ts";
import {
  validateVersion,
  VersionValidator,
} from "../../../src/lib/enterprise/xml-validation-runtime/version-validation/version-validator.ts";
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

describe("D-05 Version Validator — functional cases", () => {
  it("valida versão em atributo do root", () => {
    const document = parse(`<root version="1.0"/>`);
    const result = validateVersion(document, { versionId: "1.0" });
    assert.equal(result.ok, true);
    assert.equal(result.valid, true);
    assert.equal(result.matched, true);
    assert.equal(result.foundVersion, "1.0");
    assert.equal(result.issues.length, 0);
    assert.equal(result.code, "XML_VERSION_RUNTIME_OK");
  });

  it("rejeita versão diferente", () => {
    const document = parse(`<root version="1.0"/>`);
    const result = validateVersion(document, { versionId: "2.0" });
    assert.equal(result.ok, true);
    assert.equal(result.valid, false);
    assert.equal(result.matched, false);
    assert.equal(result.foundVersion, "1.0");
    assert.ok(result.issues.some((i) => i.code === "XML_VERSION_RUNTIME_VERSION_MISMATCH"));
  });

  it("rejeita atributo de versão ausente", () => {
    const document = parse(`<root/>`);
    const result = validateVersion(document, { versionId: "1.0" });
    assert.equal(result.ok, true);
    assert.equal(result.valid, false);
    assert.equal(result.matched, false);
    assert.ok(result.issues.some((i) => i.code === "XML_VERSION_RUNTIME_VERSION_NOT_FOUND"));
  });

  it("valida nome de atributo customizado", () => {
    const document = parse(`<root versao="3.1"/>`);
    const result = validateVersion(document, { versionId: "3.1", attributeName: "versao" });
    assert.equal(result.ok, true);
    assert.equal(result.valid, true);
    assert.equal(result.matched, true);
    assert.equal(result.foundVersion, "3.1");
    assert.equal(result.attributeName, "versao");
  });

  it("reconhece versão em elemento filho do root", () => {
    const document = parse(`<root><version>4.0</version></root>`);
    const result = validateVersion(document, { versionId: "4.0" });
    assert.equal(result.ok, true);
    assert.equal(result.valid, true);
    assert.equal(result.matched, true);
    assert.equal(result.foundVersion, "4.0");
  });

  it("valida nome do root", () => {
    const document = parse(`<root version="1.0"/>`);
    const result = validateVersion(document, { versionId: "1.0", rootElementName: "root" });
    assert.equal(result.ok, true);
    assert.equal(result.valid, true);
  });

  it("rejeita root com nome inesperado", () => {
    const document = parse(`<root version="1.0"/>`);
    const result = validateVersion(document, { versionId: "1.0", rootElementName: "other" });
    assert.equal(result.ok, true);
    assert.equal(result.valid, false);
    assert.ok(result.issues.some((i) => i.code === "XML_VERSION_RUNTIME_ROOT_MISMATCH"));
  });

  it("VersionValidator instanciável e funcional", () => {
    const document = parse(`<root version="2.0"/>`);
    const validator = new VersionValidator();
    const result = validator.validate(document, { versionId: "2.0" });
    assert.equal(result.ok, true);
    assert.equal(result.valid, true);
  });
});

describe("D-05 XMLValidationRuntimePort.validateVersion", () => {
  it("Port valida versão e expõe versionValidationImplemented = true", async () => {
    const port: XMLValidationRuntimePort = createXMLValidationRuntimePort("default");
    const document = parse(`<root version="1.0"/>`);
    const result = await port.validateVersion({
      document,
      versionId: "1.0",
      rootElementName: "root",
    });
    assert.equal(result.ok, true);
    assert.equal(result.valid, true);

    const caps = port.capabilities();
    assert.equal(caps.versionValidationImplemented, true);

    const health = await port.health();
    assert.equal(health.versionValidationOk, true);
  });
});
