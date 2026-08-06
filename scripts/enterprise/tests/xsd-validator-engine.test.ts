#!/usr/bin/env node
/**
 * D-02 — XSD Validation Functional Foundation
 *
 * Prova: XSDValidator / validateXSD sobre CanonicalXMLDocument (D-01).
 *        XML válido, XML inválido, XSD válido, elementos obrigatórios/opcionais,
 *        minOccurs, maxOccurs, sequence, choice, atributos obrigatórios/opcionais,
 *        tipos simples, tipos complexos, mensagens de erro e casos de borda.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseXML } from "../../../src/lib/enterprise/xml-runtime/parser/xml-parser.ts";
import {
  validateXSD,
  XSDValidator,
} from "../../../src/lib/enterprise/xml-validation-runtime/xsd-validation/xsd-validator.ts";

function parse(xml: string) {
  const result = parseXML(xml);
  assert.ok(result.ok, `XML parse failed: ${result.errors.map((e) => e.message).join(", ")}`);
  assert.ok(result.document, "XML parse did not produce a document");
  return result.document;
}

function assertValid(xml: string, xsd: string) {
  const document = parse(xml);
  const result = validateXSD(document, xsd);
  assert.equal(result.ok, true, `validation ok was false: ${result.message ?? ""}`);
  assert.equal(
    result.valid,
    true,
    `expected valid but got issues: ${result.issues.map((i) => `${i.code}: ${i.message}`).join("; ")}`,
  );
}

function assertInvalid(xml: string, xsd: string, expectedCode?: string) {
  const document = parse(xml);
  const result = validateXSD(document, xsd);
  assert.equal(result.ok, true, `validation crashed: ${result.message ?? ""}`);
  assert.equal(result.valid, false, "expected invalid but validation passed");
  assert.ok(
    result.issues.some((i) => i.severity === "error"),
    "expected at least one error issue",
  );
  if (expectedCode) {
    assert.ok(
      result.issues.some((i) => i.code === expectedCode),
      `expected issue code ${expectedCode} not found in [${result.issues.map((i) => i.code).join(", ")}]`,
    );
  }
}

describe("D-02 XSD Validator — functional cases", () => {
  it("XML válido contra XSD simples", () => {
    const xsd = `
      <xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
        <xs:element name="root" type="xs:string"/>
      </xs:schema>
    `;
    assertValid("<root>hello</root>", xsd);
  });

  it("XML inválido contra XSD simples (type mismatch)", () => {
    const xsd = `
      <xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
        <xs:element name="count" type="xs:integer"/>
      </xs:schema>
    `;
    assertInvalid("<count>not-a-number</count>", xsd);
  });

  it("XSD válido é parseável", () => {
    const xsd = `
      <xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
        <xs:element name="note" type="xs:string"/>
      </xs:schema>
    `;
    const document = parse("<note>ok</note>");
    const result = new XSDValidator().validate(document, xsd);
    assert.equal(result.ok, true);
    assert.equal(result.valid, true);
  });

  it("elementos obrigatórios são exigidos", () => {
    const xsd = `
      <xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
        <xs:element name="root">
          <xs:complexType>
            <xs:sequence>
              <xs:element name="required" type="xs:string"/>
              <xs:element name="alsoRequired" type="xs:string"/>
            </xs:sequence>
          </xs:complexType>
        </xs:element>
      </xs:schema>
    `;
    assertInvalid("<root><required>ok</required></root>", xsd);
  });

  it("elementos opcionais não são exigidos", () => {
    const xsd = `
      <xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
        <xs:element name="root">
          <xs:complexType>
            <xs:sequence>
              <xs:element name="required" type="xs:string"/>
              <xs:element name="optional" type="xs:string" minOccurs="0"/>
            </xs:sequence>
          </xs:complexType>
        </xs:element>
      </xs:schema>
    `;
    assertValid("<root><required>ok</required></root>", xsd);
  });

  it("minOccurs = 0 permite ausência", () => {
    const xsd = `
      <xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
        <xs:element name="root">
          <xs:complexType>
            <xs:sequence>
              <xs:element name="a" type="xs:string" minOccurs="0"/>
            </xs:sequence>
          </xs:complexType>
        </xs:element>
      </xs:schema>
    `;
    assertValid("<root></root>", xsd);
  });

  it("minOccurs = 1 exige presença", () => {
    const xsd = `
      <xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
        <xs:element name="root">
          <xs:complexType>
            <xs:sequence>
              <xs:element name="a" type="xs:string" minOccurs="1"/>
            </xs:sequence>
          </xs:complexType>
        </xs:element>
      </xs:schema>
    `;
    assertInvalid("<root></root>", xsd);
  });

  it("maxOccurs é respeitado", () => {
    const xsd = `
      <xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
        <xs:element name="root">
          <xs:complexType>
            <xs:sequence>
              <xs:element name="item" type="xs:string" minOccurs="0" maxOccurs="2"/>
            </xs:sequence>
          </xs:complexType>
        </xs:element>
      </xs:schema>
    `;
    assertValid("<root><item>a</item><item>b</item></root>", xsd);
    assertInvalid("<root><item>a</item><item>b</item><item>c</item></root>", xsd);
  });

  it("sequence exige ordem dos elementos", () => {
    const xsd = `
      <xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
        <xs:element name="root">
          <xs:complexType>
            <xs:sequence>
              <xs:element name="a" type="xs:string"/>
              <xs:element name="b" type="xs:string"/>
            </xs:sequence>
          </xs:complexType>
        </xs:element>
      </xs:schema>
    `;
    assertInvalid("<root><b>second</b><a>first</a></root>", xsd);
  });

  it("choice permite exatamente uma alternativa", () => {
    const xsd = `
      <xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
        <xs:element name="root">
          <xs:complexType>
            <xs:choice>
              <xs:element name="a" type="xs:string"/>
              <xs:element name="b" type="xs:string"/>
            </xs:choice>
          </xs:complexType>
        </xs:element>
      </xs:schema>
    `;
    assertValid("<root><a>ok</a></root>", xsd);
    assertInvalid("<root><a>ok</a><b>not-ok</b></root>", xsd);
  });

  it("atributos obrigatórios são exigidos", () => {
    const xsd = `
      <xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
        <xs:element name="root">
          <xs:complexType>
            <xs:attribute name="id" type="xs:string" use="required"/>
          </xs:complexType>
        </xs:element>
      </xs:schema>
    `;
    assertInvalid("<root></root>", xsd);
    assertValid("<root id=\"123\"></root>", xsd);
  });

  it("atributos opcionais não são exigidos", () => {
    const xsd = `
      <xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
        <xs:element name="root">
          <xs:complexType>
            <xs:attribute name="id" type="xs:string" use="optional"/>
          </xs:complexType>
        </xs:element>
      </xs:schema>
    `;
    assertValid("<root></root>", xsd);
  });

  it("tipos simples: string, boolean, decimal, date", () => {
    const xsd = `
      <xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
        <xs:element name="root">
          <xs:complexType>
            <xs:sequence>
              <xs:element name="flag" type="xs:boolean"/>
              <xs:element name="amount" type="xs:decimal"/>
              <xs:element name="when" type="xs:date"/>
            </xs:sequence>
          </xs:complexType>
        </xs:element>
      </xs:schema>
    `;
    assertValid(
      "<root><flag>true</flag><amount>19.99</amount><when>2026-08-06</when></root>",
      xsd,
    );
    assertInvalid(
      "<root><flag>nope</flag><amount>19.99</amount><when>2026-08-06</when></root>",
      xsd,
    );
  });

  it("tipos complexos: atributos e elementos aninhados", () => {
    const xsd = `
      <xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
        <xs:element name="person">
          <xs:complexType>
            <xs:sequence>
              <xs:element name="name" type="xs:string"/>
              <xs:element name="age" type="xs:integer"/>
            </xs:sequence>
            <xs:attribute name="id" type="xs:string" use="required"/>
          </xs:complexType>
        </xs:element>
      </xs:schema>
    `;
    assertValid('<person id="p1"><name>Ada</name><age>42</age></person>', xsd);
    assertInvalid("<person><name>Ada</name><age>42</age></person>", xsd);
    assertInvalid('<person id="p1"><name>Ada</name><age>not-a-number</age></person>', xsd);
  });

  it("mensagens de erro contêm código, severidade e path", () => {
    const xsd = `
      <xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
        <xs:element name="root">
          <xs:complexType>
            <xs:sequence>
              <xs:element name="a" type="xs:string"/>
            </xs:sequence>
          </xs:complexType>
        </xs:element>
      </xs:schema>
    `;
    const document = parse("<root></root>");
    const result = validateXSD(document, xsd);
    assert.equal(result.ok, true);
    assert.equal(result.valid, false);
    assert.ok(result.issues.length > 0);
    const issue = result.issues[0];
    assert.ok(issue.code, "issue code is missing");
    assert.equal(issue.severity, "error");
    assert.ok(issue.message, "issue message is missing");
    assert.ok(issue.path !== undefined, "issue path is missing");
  });

  it("casos de borda: documento vazio sem root", () => {
    const xsd = `
      <xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
        <xs:element name="root" type="xs:string"/>
      </xs:schema>
    `;
    const document = parse("<?xml version=\"1.0\"?><emptyNotRoot></emptyNotRoot>");
    const result = validateXSD(document, xsd);
    assert.equal(result.ok, true);
    assert.equal(result.valid, false);
  });

  it("casos de borda: XSD sem schema root", () => {
    const document = parse("<root>ok</root>");
    const result = validateXSD(document, "<not-schema></not-schema>");
    assert.equal(result.ok, true);
    assert.equal(result.valid, false);
    assert.ok(result.issues.some((i) => i.severity === "error"));
  });
});
