#!/usr/bin/env node
/**
 * D-01 — Enterprise XML Functional Parser Foundation
 *
 * Valida:
 * - XML válido / inválido
 * - Encoding / Namespaces / Header / Body / Attributes / Nós
 * - Erro de parsing
 * - CanonicalXMLDocument
 * - parserImplemented = true / demais capacidades funcionais = false
 * - xmlParserOk
 * - Parser genérico (sem TISS / sem Operadoras)
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_XML_RUNTIME_CAPABILITIES,
  DefaultXMLRuntimeAdapter,
  XMLParser,
  createXMLRuntimePort,
  parseXML,
  type CanonicalXMLDocument,
  type XMLRuntimePort,
} from "../../../src/lib/enterprise/xml-runtime/index.ts";
import { createTISSCatalogPort } from "../../../src/lib/enterprise/tiss-catalog/index.ts";
import { createRulePackEnginePort } from "../../../src/lib/enterprise/rule-pack-engine/index.ts";
import { createXMLGenerationRuntimePort } from "../../../src/lib/enterprise/xml-generation-runtime/index.ts";
import {
  createEnterpriseRuntime,
  resetEnterpriseRuntimeForTests,
} from "../../../src/lib/enterprise/runtime/index.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "../../..");
const parserDir = join(repoRoot, "src/lib/enterprise/xml-runtime/parser");

function collectTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...collectTsFiles(full));
    else if (entry.endsWith(".ts")) out.push(full);
  }
  return out;
}

function withEnterpriseDeps() {
  const catalog = createTISSCatalogPort({ provider: "mock" });
  const rulePackEngine = createRulePackEnginePort({
    provider: "mock",
    enterpriseDeps: { getTISSCatalogPort: () => catalog },
  });
  const xmlGenerationRuntime = createXMLGenerationRuntimePort({ provider: "mock" });
  return {
    getTISSCatalogPort: () => catalog,
    getRulePackEnginePort: () => rulePackEngine,
    getXMLGenerationRuntimePort: () => xmlGenerationRuntime,
  };
}

describe("D-01 XMLParser — functional foundation", () => {
  it("parseia XML válido e produz CanonicalXMLDocument", () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<root id="1">
  <Header><meta>h</meta></Header>
  <Body><item>ok</item></Body>
</root>`;
    const result = parseXML(xml);
    assert.equal(result.ok, true);
    assert.equal(result.document?.kind, "canonical-xml-document");
    const doc: CanonicalXMLDocument = result.document!;
    assert.equal(doc.rootNode?.localName, "root");
    assert.equal(doc.rootNode?.role, "root");
    assert.ok(doc.body);
    assert.equal(doc.structuralHeaderNode?.role, "header");
    assert.equal(doc.body?.role === "body" || doc.body?.localName === "root", true);
    assert.equal(result.context?.kind, "canonical-xml-runtime-context");
    assert.ok((result.context?.rootNode?.children?.length ?? 0) >= 2);
  });

  it("rejeita XML inválido (tag não fechada) com CanonicalXMLParsingError", () => {
    const result = parseXML(`<?xml version="1.0"?><root><child>`);
    assert.equal(result.ok, false);
    assert.ok(result.errors.length >= 1);
    assert.equal(result.errors[0]?.kind, "canonical-xml-parsing-error");
    assert.equal(result.document, null);
    assert.ok(result.context?.parsingErrors.length ?? 0 >= 1);
  });

  it("identifica Encoding e Version no Header", () => {
    const result = parseXML(
      `<?xml version="1.0" encoding="ISO-8859-1" standalone="yes"?><doc/>`,
    );
    assert.equal(result.ok, true);
    assert.equal(result.document?.header?.kind, "canonical-xml-header");
    assert.equal(result.document?.header?.version, "1.0");
    assert.equal(result.document?.header?.encoding, "ISO-8859-1");
    assert.equal(result.document?.header?.standalone, true);
    assert.equal(result.document?.encoding, "ISO-8859-1");
    assert.equal(result.document?.version, "1.0");
    assert.equal(result.document?.metadata?.encoding, "ISO-8859-1");
    assert.equal(result.document?.metadata?.version, "1.0");
  });

  it("identifica Namespaces e Attributes", () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<a:root xmlns:a="urn:example:a" xmlns="urn:default" a:flag="1" plain="x">
  <a:child b="2"/>
</a:root>`;
    const result = parseXML(xml);
    assert.equal(result.ok, true);
    assert.equal(result.document?.rootNode?.prefix, "a");
    assert.equal(result.document?.rootNode?.namespaceUri, "urn:example:a");
    assert.ok(result.document?.namespaces["a"] === "urn:example:a");
    assert.ok(result.document?.namespaces[""] === "urn:default");
    const attrs = result.document?.rootNode?.attributes ?? [];
    assert.ok(attrs.some((a) => a.localName === "flag" && a.value === "1"));
    assert.ok(attrs.some((a) => a.name === "plain" && a.value === "x"));
    assert.ok((result.statistics?.attributeCount ?? 0) >= 2);
    assert.ok((result.statistics?.namespaceCount ?? 0) >= 2);
  });

  it("identifica Header, Body e Nodes", () => {
    const xml = `<?xml version="1.0"?><envelope><Header/><Body><n>1</n></Body></envelope>`;
    const result = parseXML(xml);
    assert.equal(result.ok, true);
    assert.ok(result.document?.header);
    assert.equal(result.document?.structuralHeaderNode?.localName, "Header");
    assert.equal(result.document?.body?.localName, "Body");
    assert.ok((result.statistics?.elementCount ?? 0) >= 3);
    assert.ok((result.statistics?.nodeCount ?? 0) >= 3);
  });

  it("propaga erro de mismatch de tags", () => {
    const result = parseXML(`<a><b></a></b>`);
    assert.equal(result.ok, false);
    assert.equal(result.errors[0]?.code, "XML_PARSER_MISMATCH");
  });

  it("XMLParser class e parseXML helper são equivalentes", () => {
    const xml = `<x y="1"/>`;
    const a = new XMLParser().parse(xml);
    const b = parseXML(xml);
    assert.equal(a.ok, b.ok);
    assert.equal(a.document?.rootNode?.localName, "x");
    assert.equal(b.document?.rootNode?.localName, "x");
  });
});

describe("D-01 XMLRuntimePort.parse + capabilities + health", () => {
  it("Port.parse produz CanonicalXMLDocument e preenche XMLRuntimeContext", async () => {
    const port: XMLRuntimePort = new DefaultXMLRuntimeAdapter({
      enterpriseDeps: withEnterpriseDeps(),
    });
    const parsed = await port.parse({
      xml: `<?xml version="1.0" encoding="UTF-8"?><root><item attr="v">t</item></root>`,
    });
    assert.equal(parsed.ok, true);
    assert.equal(parsed.parsing?.ok, true);
    assert.equal(parsed.document?.kind, "canonical-xml-document");
    assert.equal(parsed.context?.kind, "canonical-xml-runtime-context");
    assert.equal(parsed.context?.rootNode?.localName, "root");
    assert.ok(parsed.context?.parserStatistics);
    assert.equal(parsed.context?.parsingErrors.length, 0);
  });

  it("parserImplemented=true e demais capacidades funcionais=false", () => {
    const port = createXMLRuntimePort({
      provider: "enterprise",
      enterpriseDeps: withEnterpriseDeps(),
    });
    const caps = port.capabilities();
    assert.equal(caps.parserImplemented, true);
    assert.equal(caps.canonical.parserImplemented, true);
    assert.equal(DEFAULT_XML_RUNTIME_CAPABILITIES.parserImplemented, true);
    assert.equal(caps.xsdImplemented, false);
    assert.equal(caps.xmlValidationImplemented, false);
    assert.equal(caps.schemaImplemented, false);
    assert.equal(caps.xpathImplemented, false);
    assert.equal(caps.soapImplemented, false);
    assert.equal(caps.tissKnowledgeImplemented, false);
    assert.equal(caps.operatorKnowledgeImplemented, false);
    assert.equal(caps.httpImplemented, false);
    assert.equal(caps.batchImplemented, false);
    assert.equal(caps.workflowImplemented, false);
    assert.equal(caps.returnImplemented, false);
    assert.equal(caps.reconciliationImplemented, false);
    assert.equal(caps.authorizationImplemented, false);
    assert.equal(caps.persistenceImplemented, false);
    assert.equal(caps.implementsRealXml, false);
    assert.equal(caps.knowsOperatorOrCooperative, false);
  });

  it("health expõe xmlParserOk=true", async () => {
    const port = createXMLRuntimePort({
      provider: "enterprise",
      enterpriseDeps: withEnterpriseDeps(),
    });
    const health = await port.health();
    assert.equal(health.xmlParserOk, true);
    assert.equal(health.ok, true);
  });

  it("Enterprise Runtime agrega xmlParserOk", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const health = await runtime.health();
    assert.equal(health.xmlRuntimeOk, true);
    assert.equal(health.xmlParserOk, true);
  });

  it("Port.parse propaga XML inválido sem lançar", async () => {
    const port = createXMLRuntimePort({
      provider: "mock",
      enterpriseDeps: withEnterpriseDeps(),
    });
    const parsed = await port.parse({ xml: `<root><a></b></root>` });
    assert.equal(parsed.ok, false);
    assert.ok((parsed.parsing?.errors.length ?? 0) >= 1);
  });
});

describe("D-01 — parser genérico (sem TISS / sem Operadoras)", () => {
  it("código do parser não importa nem referencia módulos TISS/Operadoras", () => {
    const files = collectTsFiles(parserDir);
    assert.ok(files.length >= 2);
    const forbiddenImport =
      /from\s+["'][^"']*(tiss|operator|soap|xsd|xml-validation|xml-tiss)[^"']*["']/i;
    const forbiddenCall =
      /\b(getTISSCatalogPort|getOperatorRuntimePort|createSOAP|validateXsd|evaluateXPath)\b/;
    for (const file of files) {
      const src = readFileSync(file, "utf8");
      assert.equal(
        forbiddenImport.test(src),
        false,
        `Parser must not import TISS/operator modules: ${file}`,
      );
      assert.equal(
        forbiddenCall.test(src),
        false,
        `Parser must not call TISS/operator APIs: ${file}`,
      );
    }
  });
});
