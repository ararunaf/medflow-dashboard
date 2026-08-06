#!/usr/bin/env node
/**
 * D-06 — Business Validation Functional Foundation
 *
 * Prova: BusinessValidator / validateBusiness sobre CanonicalXMLDocument (D-01).
 *        Valida regras de negócio genéricas (required, allowed-values, numeric-range).
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseXML } from "../../../src/lib/enterprise/xml-runtime/parser/xml-parser.ts";
import {
  BusinessValidator,
  validateBusiness,
} from "../../../src/lib/enterprise/xml-validation-runtime/business-validation/business-validator.ts";
import type { BusinessValidationRule } from "../../../src/lib/enterprise/xml-validation-runtime/business-validation/canonical.ts";
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

describe("D-06 Business Validator — functional cases", () => {
  it("valida campo obrigatório presente", () => {
    const document = parse(`<root><code>A</code></root>`);
    const rules: BusinessValidationRule[] = [{ kind: "required-field", field: "code" }];
    const result = validateBusiness(document, { rules });
    assert.equal(result.ok, true);
    assert.equal(result.valid, true);
    assert.equal(result.issues.length, 0);
    assert.equal(result.code, "XML_BUSINESS_RUNTIME_OK");
  });

  it("rejeita campo obrigatório ausente", () => {
    const document = parse(`<root></root>`);
    const rules: BusinessValidationRule[] = [{ kind: "required-field", field: "code" }];
    const result = validateBusiness(document, { rules });
    assert.equal(result.ok, true);
    assert.equal(result.valid, false);
    assert.ok(result.issues.some((i) => i.code === "XML_BUSINESS_RUNTIME_REQUIRED_FIELD_MISSING"));
  });

  it("valida allowed-values", () => {
    const document = parse(`<root><status>active</status></root>`);
    const rules: BusinessValidationRule[] = [
      { kind: "allowed-values", field: "status", values: ["active", "inactive"] },
    ];
    const result = validateBusiness(document, { rules });
    assert.equal(result.ok, true);
    assert.equal(result.valid, true);
    assert.equal(result.issues.length, 0);
  });

  it("rejeita allowed-values inválido", () => {
    const document = parse(`<root><status>unknown</status></root>`);
    const rules: BusinessValidationRule[] = [
      { kind: "allowed-values", field: "status", values: ["active", "inactive"] },
    ];
    const result = validateBusiness(document, { rules });
    assert.equal(result.ok, true);
    assert.equal(result.valid, false);
    assert.ok(result.issues.some((i) => i.code === "XML_BUSINESS_RUNTIME_VALUE_NOT_ALLOWED"));
  });

  it("valida numeric-range", () => {
    const document = parse(`<root><quantity>5</quantity></root>`);
    const rules: BusinessValidationRule[] = [
      { kind: "numeric-range", field: "quantity", min: 1, max: 10 },
    ];
    const result = validateBusiness(document, { rules });
    assert.equal(result.ok, true);
    assert.equal(result.valid, true);
  });

  it("rejeita numeric-range fora", () => {
    const document = parse(`<root><quantity>15</quantity></root>`);
    const rules: BusinessValidationRule[] = [
      { kind: "numeric-range", field: "quantity", min: 1, max: 10 },
    ];
    const result = validateBusiness(document, { rules });
    assert.equal(result.ok, true);
    assert.equal(result.valid, false);
    assert.ok(result.issues.some((i) => i.code === "XML_BUSINESS_RUNTIME_NUMERIC_RANGE_VIOLATION"));
  });

  it("rejeita numeric-range com valor não numérico", () => {
    const document = parse(`<root><quantity>five</quantity></root>`);
    const rules: BusinessValidationRule[] = [
      { kind: "numeric-range", field: "quantity", min: 1, max: 10 },
    ];
    const result = validateBusiness(document, { rules });
    assert.equal(result.ok, true);
    assert.equal(result.valid, false);
    assert.ok(result.issues.some((i) => i.code === "XML_BUSINESS_RUNTIME_FIELD_NOT_NUMERIC"));
  });

  it("BusinessValidator instanciável e funcional", () => {
    const document = parse(`<root><status>active</status></root>`);
    const rules: BusinessValidationRule[] = [
      { kind: "required-field", field: "status" },
      { kind: "allowed-values", field: "status", values: ["active", "inactive"] },
    ];
    const validator = new BusinessValidator();
    const result = validator.validate(document, { rules });
    assert.equal(result.ok, true);
    assert.equal(result.valid, true);
  });
});

describe("D-06 XMLValidationRuntimePort.validateBusiness", () => {
  it("Port valida regras de negócio e expõe businessValidationImplemented = true", async () => {
    const port: XMLValidationRuntimePort = createXMLValidationRuntimePort("default");
    const document = parse(`<root><status>active</status></root>`);
    const rules: BusinessValidationRule[] = [
      { kind: "required-field", field: "status" },
      { kind: "allowed-values", field: "status", values: ["active", "inactive"] },
    ];
    const result = await port.validateBusiness({ document, rules });
    assert.equal(result.ok, true);
    assert.equal(result.valid, true);

    const caps = port.capabilities();
    assert.equal(caps.businessValidationImplemented, true);

    const health = await port.health();
    assert.equal(health.businessValidationOk, true);
  });
});
