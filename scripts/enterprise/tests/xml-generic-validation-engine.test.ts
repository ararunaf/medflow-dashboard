#!/usr/bin/env node
/**
 * D-11 — Generic XML Validation Functional Foundation
 *
 * Prova: XMLGenericValidator orquestra D-02 a D-10 sem referenciar TISS/ANS/Operadoras.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseXML } from "../../../src/lib/enterprise/xml-runtime/parser/xml-parser.ts";
import { XMLGenericValidator } from "../../../src/lib/enterprise/xml-validation-runtime/generic-xml-validation/xml-generic-validator.ts";
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

describe("D-11 XML Generic Validation — functional cases", () => {
  it("orquestra validação com todas as capabilities passando", () => {
    const document = parse(`<root version="1.0" operator="OP-01"><value>10</value></root>`);
    const validator = new XMLGenericValidator();
    const result = validator.validate({
      document,
      options: {
        version: true,
        operator: true,
        business: true,
        report: true,
      },
      rules: {
        versionExpected: "1.0",
        operatorExpected: "OP-01",
        businessRules: [{ kind: "required-field", field: "value" }],
      },
    });
    assert.equal(result.ok, true);
    assert.equal(result.version?.ok, true);
    assert.equal(result.operator?.ok, true);
    assert.equal(result.business?.ok, true);
    assert.equal(result.report?.ok, true);
    assert.equal(result.report?.items.length, 3);
  });

  it("detecta falha em regra de negócio", () => {
    const document = parse(`<root version="2.0"></root>`);
    const validator = new XMLGenericValidator();
    const result = validator.validate({
      document,
      options: {
        business: true,
        report: true,
      },
      rules: {
        businessRules: [{ kind: "required-field", field: "missing" }],
      },
    });
    assert.equal(result.ok, false);
    assert.equal(result.business?.valid, false);
    assert.equal(result.report?.ok, false);
    assert.equal(
      result.report?.items.some((i) => i.operation === "business" && !i.ok),
      true,
    );
  });

  it("aplica repair e correction e atualiza documento", () => {
    const document = parse(`<root></root>`);
    const validator = new XMLGenericValidator();
    const result = validator.validate({
      document,
      options: {
        repair: true,
        correction: true,
        report: true,
      },
      rules: {
        repairRules: [
          { kind: "add-missing-attribute", target: "root", attribute: "version", value: "1.0" },
        ],
        correctionRules: [
          { kind: "set-attribute", target: "root", attribute: "operator", value: "OP-01" },
        ],
      },
    });
    assert.equal(result.ok, true);
    assert.equal(result.repair?.repaired, true);
    assert.equal(result.correction?.corrected, true);
    assert.equal(
      result.document.rootNode?.attributes?.some(
        (a) => a.localName === "operator" && a.value === "OP-01",
      ),
      true,
    );
  });

  it("não executa operações desabilitadas", () => {
    const document = parse(`<root></root>`);
    const validator = new XMLGenericValidator();
    const result = validator.validate({
      document,
      options: {},
    });
    assert.equal(result.ok, true);
    assert.equal(result.report, undefined);
    assert.equal(result.xsd, undefined);
    assert.equal(result.version, undefined);
  });

  it("relatório vazio é ok quando nenhuma validação é ativada", () => {
    const document = parse(`<root></root>`);
    const validator = new XMLGenericValidator();
    const result = validator.validate({
      document,
      options: { report: true },
    });
    assert.equal(result.ok, true);
    assert.equal(result.report?.items.length, 0);
  });
});

describe("D-11 XMLValidationRuntimePort.validateGenericXML", () => {
  it("Port orquestra validação genérica e expõe xmlValidationImplemented = true", async () => {
    const port: XMLValidationRuntimePort = createXMLValidationRuntimePort("default");
    const document = parse(`<root version="1.0" operator="OP-01"></root>`);
    const result = await port.validateGenericXML({
      document,
      options: { version: true, operator: true, report: true },
      rules: { versionExpected: "1.0", operatorExpected: "OP-01" },
    });
    assert.equal(result.ok, true);
    assert.ok(result.validation);
    assert.equal(result.validation?.ok, true);

    const caps = port.capabilities();
    assert.equal(caps.xmlValidationImplemented, true);

    const health = await port.health();
    assert.equal(health.xmlValidationOk, true);
  });
});
