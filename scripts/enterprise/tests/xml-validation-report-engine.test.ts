#!/usr/bin/env node
/**
 * D-10 — XML Validation Report Functional Foundation
 *
 * Prova: XMLValidationReportEngine / generateXMLValidationReport
 * consolida resultados existentes sem referenciar TISS/ANS/Operadoras.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  generateXMLValidationReport,
  XMLValidationReportEngine,
} from "../../../src/lib/enterprise/xml-validation-runtime/validation-report/xml-validation-report-engine.ts";
import type { XMLValidationReportInput } from "../../../src/lib/enterprise/xml-validation-runtime/validation-report/canonical.ts";
import {
  createXMLValidationRuntimePort,
  type XMLValidationRuntimePort,
} from "../../../src/lib/enterprise/xml-validation-runtime/index.ts";

describe("D-10 XML Validation Report — functional cases", () => {
  it("consolida relatório com todos os resultados passando", () => {
    const input: XMLValidationReportInput = {
      results: [
        { ok: true, operation: "xsd" },
        { ok: true, operation: "namespace" },
        { ok: true, operation: "version" },
      ],
    };
    const result = generateXMLValidationReport(input);
    assert.equal(result.ok, true);
    assert.equal(result.items.length, 3);
    assert.equal(result.summary.total, 3);
    assert.equal(result.summary.passed, 3);
    assert.equal(result.summary.failed, 0);
    assert.equal(result.summary.byOperation["xsd"].passed, 1);
  });

  it("consolida relatório com falhas", () => {
    const input: XMLValidationReportInput = {
      results: [
        { ok: true, operation: "xsd" },
        { ok: false, operation: "business", code: "BUSINESS_RULE_ERROR", message: "Campo ausente" },
      ],
    };
    const result = generateXMLValidationReport(input);
    assert.equal(result.ok, false);
    assert.equal(result.items.length, 2);
    assert.equal(result.summary.total, 2);
    assert.equal(result.summary.passed, 1);
    assert.equal(result.summary.failed, 1);
    assert.equal(result.summary.byOperation["business"].failed, 1);
  });

  it("relatório vazio é considerado ok sem falhas", () => {
    const result = generateXMLValidationReport({ results: [] });
    assert.equal(result.ok, true);
    assert.equal(result.summary.total, 0);
    assert.equal(result.items.length, 0);
  });

  it("preserva reportId quando fornecido", () => {
    const input: XMLValidationReportInput = {
      reportId: "my-report-123",
      results: [{ ok: true, operation: "version" }],
    };
    const result = generateXMLValidationReport(input);
    assert.equal(result.reportId, "my-report-123");
  });

  it("gera reportId quando omitido", () => {
    const result = generateXMLValidationReport({
      results: [{ ok: true, operation: "operator" }],
    });
    assert.ok(result.reportId.length > 0);
  });

  it("XMLValidationReportEngine instanciável e funcional", () => {
    const engine = new XMLValidationReportEngine();
    const result = engine.generate({
      results: [{ ok: true, operation: "repair" }],
    });
    assert.equal(result.ok, true);
    assert.equal(result.summary.passed, 1);
  });
});

describe("D-10 XMLValidationRuntimePort.generateXMLValidationReport", () => {
  it("Port gera relatório e expõe validationReportImplemented = true", async () => {
    const port: XMLValidationRuntimePort = createXMLValidationRuntimePort("default");
    const result = await port.generateXMLValidationReport({
      results: [
        { ok: true, operation: "xsd" },
        { ok: true, operation: "namespace" },
        { ok: false, operation: "version", code: "VERSION_MISMATCH" },
      ],
    });
    assert.equal(result.ok, false);
    assert.ok(result.report);
    assert.equal(result.report?.summary.total, 3);

    const caps = port.capabilities();
    assert.equal(caps.validationReportImplemented, true);

    const health = await port.health();
    assert.equal(health.validationReportOk, true);
  });
});
