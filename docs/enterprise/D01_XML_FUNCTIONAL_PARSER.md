# D-01 — Enterprise XML Functional Parser Foundation

**Sprint:** D-01 — Enterprise XML Runtime — Functional Parser Foundation  
**Bloco:** BLOCO D — Funcionalização Progressiva dos Runtimes  
**Data:** 2026-08-05  
**Branch:** `feat/inf-10-enterprise-scalability-runtime`  
**Regra permanente:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_20.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_20.md) (Incremental Functional Evolution)  
**Certificação:** [`D01_XML_PARSER_CERTIFICATION.md`](./D01_XML_PARSER_CERTIFICATION.md)

---

## Objetivo

Transformar o **Enterprise XML Runtime** (TISS-04 Foundation) em Runtime com
**uma única capacidade funcional**: o **Parser XML** genérico.

Blocos A, B e C permanecem **homologados e congelados**.

---

## Escopo implementado (EXATAMENTE UMA capacidade)

| Capacidade | Status |
|------------|--------|
| `XMLParser` (string → DOM canônico) | **Implementado** |
| `parserImplemented` | `true` |
| Demais capacidades funcionais (XSD, Validation, SOAP, XPath, TISS, Operadoras, …) | `false` |

---

## Fora de escopo (NÃO implementado)

- XSD / Schema / XML Validation
- SOAP / HTTP / Operadoras / Authorization
- Batch / Workflow / Return / Reconciliation
- IA / Banco / APIs / Persistência / Scheduler / Filas
- XPath
- Conhecimento TISS

---

## Contratos canônicos (D-01)

| Contrato | Papel |
|----------|-------|
| `CanonicalXMLDocument` | Documento parseado |
| `CanonicalXMLNode` | Nó da árvore DOM |
| `CanonicalXMLAttribute` | Atributo |
| `CanonicalXMLHeader` | Prolog XML (version / encoding / standalone) |
| `CanonicalXMLMetadata` | Metadata (TISS-04 + campos D-01 encoding/version/standalone) |
| `CanonicalXMLParsingResult` | Resultado do parse |
| `CanonicalXMLParsingError` | Erro de sintaxe |

## XMLRuntimeContext (expandido)

Campos D-01:

- `document`
- `metadata`
- `rootNode`
- `namespaces`
- `parserStatistics`
- `parsingWarnings`
- `parsingErrors`

---

## Superfície funcional

```text
XMLRuntimePort.parse({ xml: string }) → ParseXMLResult
  → CanonicalXMLParsingResult
  → CanonicalXMLDocument + XMLRuntimeContext
```

`XMLParser` é genérico: valida sintaxe XML, constrói árvore, identifica Header
(prolog), Body, Nodes, Attributes, Namespace, Encoding e Version — **sem**
conhecimento de TISS ou Operadoras.

---

## Health

| Flag | Significado |
|------|-------------|
| `xmlParserOk` | Parser funcional disponível no XML Runtime |
| `xmlRuntimeOk` | Saúde agregada do XML Runtime (inalterada em espírito) |

---

## Teste

```bash
npm run enterprise:xml-parser:test
```

---

## Regra Permanente nº 20

Cada Sprint funcional do BLOCO D implementa **apenas UMA** nova capacidade
(`INCREMENTAL FUNCTIONAL EVOLUTION`). Antes e depois: Build, TypeScript,
ESLint, Smoke e Enterprise devem permanecer PASS.
