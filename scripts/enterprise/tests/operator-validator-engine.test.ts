#!/usr/bin/env node
/**
 * D-07 — Operator Validation Functional Foundation
 *
 * Prova: OperatorValidator / validateOperator sobre CanonicalXMLDocument (D-01).
 *        Valida identificador de operador em atributo/elemento do root.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseXML } from "../../../src/lib/enterprise/xml-runtime/parser/xml-parser.ts";
import {
  OperatorValidator,
  validateOperator,
} from "../../../src/lib/enterprise/xml-validation-runtime/operator-validation/operator-validator.ts";
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

describe("D-07 Operator Validator — functional cases", () => {
  it("valida operador em atributo do root", () => {
    const document = parse(`<root operator="OP-123"></root>`);
    const result = validateOperator(document, { operatorId: "OP-123" });
    assert.equal(result.ok, true);
    assert.equal(result.valid, true);
    assert.equal(result.issues.length, 0);
    assert.equal(result.code, "XML_OPERATOR_RUNTIME_OK");
  });

  it("rejeita operador diferente", () => {
    const document = parse(`<root operator="OP-123"></root>`);
    const result = validateOperator(document, { operatorId: "OP-999" });
    assert.equal(result.ok, true);
    assert.equal(result.valid, false);
    assert.ok(result.issues.some((i) => i.code === "XML_OPERATOR_RUNTIME_MISMATCH"));
  });

  it("rejeita atributo de operador ausente", () => {
    const document = parse(`<root></root>`);
    const result = validateOperator(document, { operatorId: "OP-123" });
    assert.equal(result.ok, true);
    assert.equal(result.valid, false);
    assert.ok(result.issues.some((i) => i.code === "XML_OPERATOR_RUNTIME_FIELD_MISSING"));
  });

  it("reconhece operador em elemento filho do root", () => {
    const document = parse(`<root><operator>OP-123</operator></root>`);
    const result = validateOperator(document, { operatorId: "OP-123" });
    assert.equal(result.ok, true);
    assert.equal(result.valid, true);
  });

  it("valida nome de campo customizado", () => {
    const document = parse(`<root><operatorId>OP-123</operatorId></root>`);
    const result = validateOperator(document, { operatorId: "OP-123", fieldName: "operatorId" });
    assert.equal(result.ok, true);
    assert.equal(result.valid, true);
  });

  it("valida nome do root", () => {
    const document = parse(`<invoice operator="OP-123"></invoice>`);
    const result = validateOperator(document, {
      operatorId: "OP-123",
      rootElementName: "invoice",
    });
    assert.equal(result.ok, true);
    assert.equal(result.valid, true);
  });

  it("rejeita root com nome inesperado", () => {
    const document = parse(`<root operator="OP-123"></root>`);
    const result = validateOperator(document, {
      operatorId: "OP-123",
      rootElementName: "invoice",
    });
    assert.equal(result.ok, true);
    assert.equal(result.valid, false);
    assert.ok(result.issues.some((i) => i.code === "XML_OPERATOR_RUNTIME_ROOT_MISMATCH"));
  });

  it("OperatorValidator instanciável e funcional", () => {
    const document = parse(`<root operator="OP-123"></root>`);
    const validator = new OperatorValidator();
    const result = validator.validate(document, { operatorId: "OP-123" });
    assert.equal(result.ok, true);
    assert.equal(result.valid, true);
  });
});

describe("D-07 XMLValidationRuntimePort.validateOperator", () => {
  it("Port valida operador e expõe operatorValidationImplemented = true", async () => {
    const port: XMLValidationRuntimePort = createXMLValidationRuntimePort("default");
    const document = parse(`<root operator="OP-123"></root>`);
    const result = await port.validateOperator({ document, operatorId: "OP-123" });
    assert.equal(result.ok, true);
    assert.equal(result.valid, true);

    const caps = port.capabilities();
    assert.equal(caps.operatorValidationImplemented, true);

    const health = await port.health();
    assert.equal(health.operatorValidationOk, true);
  });
});
