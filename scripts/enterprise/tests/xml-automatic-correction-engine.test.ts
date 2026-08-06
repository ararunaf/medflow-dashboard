#!/usr/bin/env node
/**
 * D-09 — XML Automatic Correction Functional Foundation
 *
 * Prova: XMLAutomaticCorrector / correctXML sobre CanonicalXMLDocument (D-01).
 *        Aplica correções automáticas genéricas sem referenciar TISS/ANS/Operadoras.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseXML } from "../../../src/lib/enterprise/xml-runtime/parser/xml-parser.ts";
import {
  XMLAutomaticCorrector,
  correctXML,
} from "../../../src/lib/enterprise/xml-validation-runtime/automatic-correction/xml-automatic-correction-engine.ts";
import type { XMLAutomaticCorrectionRule } from "../../../src/lib/enterprise/xml-validation-runtime/automatic-correction/canonical.ts";
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

describe("D-09 XML Automatic Correction — functional cases", () => {
  it("adiciona atributo ausente no root", () => {
    const document = parse(`<root></root>`);
    const rules: XMLAutomaticCorrectionRule[] = [
      { kind: "set-attribute", target: "root", attribute: "version", value: "3.0" },
    ];
    const result = correctXML(document, { rules });
    assert.equal(result.ok, true);
    assert.equal(result.corrected, true);
    const attr = result.document.rootNode?.attributes?.find((a) => a.localName === "version");
    assert.equal(attr?.value, "3.0");
  });

  it("atualiza atributo existente no root", () => {
    const document = parse(`<root version="2.0"></root>`);
    const rules: XMLAutomaticCorrectionRule[] = [
      { kind: "set-attribute", target: "root", attribute: "version", value: "3.0" },
    ];
    const result = correctXML(document, { rules });
    assert.equal(result.ok, true);
    assert.equal(result.corrected, true);
    const attr = result.document.rootNode?.attributes?.find((a) => a.localName === "version");
    assert.equal(attr?.value, "3.0");
  });

  it("adiciona elemento filho ausente no root", () => {
    const document = parse(`<root></root>`);
    const rules: XMLAutomaticCorrectionRule[] = [
      { kind: "set-child", target: "root", child: "status", value: "active" },
    ];
    const result = correctXML(document, { rules });
    assert.equal(result.ok, true);
    assert.equal(result.corrected, true);
    const child = result.document.rootNode?.children?.find(
      (c) => c.nodeType === "element" && c.localName === "status",
    );
    assert.ok(child);
    assert.equal(child?.textContent, "active");
  });

  it("atualiza elemento filho existente no root", () => {
    const document = parse(`<root><status>inactive</status></root>`);
    const rules: XMLAutomaticCorrectionRule[] = [
      { kind: "set-child", target: "root", child: "status", value: "active" },
    ];
    const result = correctXML(document, { rules });
    assert.equal(result.ok, true);
    assert.equal(result.corrected, true);
    const child = result.document.rootNode?.children?.find(
      (c) => c.nodeType === "element" && c.localName === "status",
    );
    assert.equal(child?.textContent, "active");
  });

  it("remove atributo do root", () => {
    const document = parse(`<root version="3.0"></root>`);
    const rules: XMLAutomaticCorrectionRule[] = [
      { kind: "remove-attribute", target: "root", attribute: "version" },
    ];
    const result = correctXML(document, { rules });
    assert.equal(result.ok, true);
    assert.equal(result.corrected, true);
    const attr = result.document.rootNode?.attributes?.find((a) => a.localName === "version");
    assert.equal(attr, undefined);
  });

  it("não altera documento original", () => {
    const document = parse(`<root></root>`);
    const rules: XMLAutomaticCorrectionRule[] = [
      { kind: "set-attribute", target: "root", attribute: "version", value: "3.0" },
    ];
    const result = correctXML(document, { rules });
    assert.equal(result.ok, true);
    assert.equal(result.corrected, true);
    assert.equal(document.rootNode?.attributes?.length ?? 0, 0);
    assert.equal(result.document.rootNode?.attributes?.length ?? 0, 1);
  });

  it("XMLAutomaticCorrector instanciável e funcional", () => {
    const document = parse(`<root></root>`);
    const rules: XMLAutomaticCorrectionRule[] = [
      { kind: "set-attribute", target: "root", attribute: "operator", value: "OP-123" },
    ];
    const corrector = new XMLAutomaticCorrector();
    const result = corrector.correct(document, { rules });
    assert.equal(result.ok, true);
    assert.equal(result.corrected, true);
  });
});

describe("D-09 XMLValidationRuntimePort.correctXML", () => {
  it("Port corrige XML e expõe automaticCorrectionImplemented = true", async () => {
    const port: XMLValidationRuntimePort = createXMLValidationRuntimePort("default");
    const document = parse(`<root></root>`);
    const rules: XMLAutomaticCorrectionRule[] = [
      { kind: "set-attribute", target: "root", attribute: "version", value: "3.0" },
    ];
    const result = await port.correctXML({ document, rules });
    assert.equal(result.ok, true);
    assert.equal(result.corrected, true);

    const caps = port.capabilities();
    assert.equal(caps.automaticCorrectionImplemented, true);

    const health = await port.health();
    assert.equal(health.automaticCorrectionOk, true);
  });
});
