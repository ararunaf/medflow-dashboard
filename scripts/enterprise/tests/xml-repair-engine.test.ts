#!/usr/bin/env node
/**
 * D-08 — XML Repair Functional Foundation
 *
 * Prova: XMLRepairEngine / repairXML sobre CanonicalXMLDocument (D-01).
 *        Aplica reparos genéricos sem referenciar TISS/ANS/Operadoras.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseXML } from "../../../src/lib/enterprise/xml-runtime/parser/xml-parser.ts";
import {
  XMLRepairEngine,
  repairXML,
} from "../../../src/lib/enterprise/xml-validation-runtime/xml-repair/xml-repair-engine.ts";
import type { XMLRepairRule } from "../../../src/lib/enterprise/xml-validation-runtime/xml-repair/canonical.ts";
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

describe("D-08 XML Repair — functional cases", () => {
  it("adiciona atributo ausente no root", () => {
    const document = parse(`<root></root>`);
    const rules: XMLRepairRule[] = [
      { kind: "add-missing-attribute", target: "root", attribute: "version", value: "3.0" },
    ];
    const result = repairXML(document, { rules });
    assert.equal(result.ok, true);
    assert.equal(result.repaired, true);
    assert.equal(
      result.actions.some((a) => a.applied),
      true,
    );
    const attr = result.document.rootNode?.attributes?.find((a) => a.localName === "version");
    assert.equal(attr?.value, "3.0");
  });

  it("adiciona elemento filho ausente no root", () => {
    const document = parse(`<root></root>`);
    const rules: XMLRepairRule[] = [
      { kind: "add-missing-child", target: "root", child: "status", value: "active" },
    ];
    const result = repairXML(document, { rules });
    assert.equal(result.ok, true);
    assert.equal(result.repaired, true);
    const child = result.document.rootNode?.children?.find(
      (c) => c.nodeType === "element" && c.localName === "status",
    );
    assert.ok(child);
    assert.equal(child?.textContent, "active");
  });

  it("remove atributo do root", () => {
    const document = parse(`<root version="3.0"></root>`);
    const rules: XMLRepairRule[] = [
      { kind: "remove-attribute", target: "root", attribute: "version" },
    ];
    const result = repairXML(document, { rules });
    assert.equal(result.ok, true);
    assert.equal(result.repaired, true);
    const attr = result.document.rootNode?.attributes?.find((a) => a.localName === "version");
    assert.equal(attr, undefined);
  });

  it("não sobrescreve atributo existente", () => {
    const document = parse(`<root version="2.0"></root>`);
    const rules: XMLRepairRule[] = [
      { kind: "add-missing-attribute", target: "root", attribute: "version", value: "3.0" },
    ];
    const result = repairXML(document, { rules });
    assert.equal(result.ok, true);
    assert.equal(result.repaired, false);
    const attr = result.document.rootNode?.attributes?.find((a) => a.localName === "version");
    assert.equal(attr?.value, "2.0");
  });

  it("não altera documento original", () => {
    const document = parse(`<root></root>`);
    const rules: XMLRepairRule[] = [
      { kind: "add-missing-attribute", target: "root", attribute: "version", value: "3.0" },
    ];
    const result = repairXML(document, { rules });
    assert.equal(result.ok, true);
    assert.equal(result.repaired, true);
    assert.equal(document.rootNode?.attributes?.length ?? 0, 0);
    assert.equal(result.document.rootNode?.attributes?.length ?? 0, 1);
  });

  it("XMLRepairEngine instanciável e funcional", () => {
    const document = parse(`<root></root>`);
    const rules: XMLRepairRule[] = [
      { kind: "add-missing-attribute", target: "root", attribute: "operator", value: "OP-123" },
    ];
    const engine = new XMLRepairEngine();
    const result = engine.repair(document, { rules });
    assert.equal(result.ok, true);
    assert.equal(result.repaired, true);
  });
});

describe("D-08 XMLValidationRuntimePort.repairXML", () => {
  it("Port repara XML e expõe xmlRepairImplemented = true", async () => {
    const port: XMLValidationRuntimePort = createXMLValidationRuntimePort("default");
    const document = parse(`<root></root>`);
    const rules: XMLRepairRule[] = [
      { kind: "add-missing-attribute", target: "root", attribute: "version", value: "3.0" },
    ];
    const result = await port.repairXML({ document, rules });
    assert.equal(result.ok, true);
    assert.equal(result.repaired, true);

    const caps = port.capabilities();
    assert.equal(caps.xmlRepairImplemented, true);

    const health = await port.health();
    assert.equal(health.xmlRepairOk, true);
  });
});
