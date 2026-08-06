# D-03 — Enterprise XML Schema Runtime — Schema Selection Functional Foundation

**Sprint:** D-03 — Enterprise XML Schema Runtime Functional Foundation
**Bloco:** BLOCO D — Funcionalização Progressiva dos Runtimes
**Data:** 2026-08-06
**Branch:** `feat/inf-10-enterprise-scalability-runtime`
**Base:** D-02 — OFFICIAL RELEASE BASELINE (`f552553`)
**Natureza:** Entrega funcional incremental conforme RULE_20

---

## 1. Objetivo

Entregar a **única capacidade funcional** autorizada para o `xml-schema-runtime` na D-03:
**Schema Selection** (`schemaSelectionImplemented = true`).

A D-03 adiciona a operação `XMLSchemaRuntimePort.select()` ao runtime de gerenciamento
canônico de XML Schemas, sem carregar XSD oficial, sem validação XSD, sem XML
TISS/ANS, sem operadoras, contratos, tenants ou regras de negócio.

---

## 2. Capacidade ativada

| Capacidade                          | Flag                                             | Status  |
| ----------------------------------- | ------------------------------------------------ | ------- |
| Schema Selection                    | `schemaSelectionImplemented`                     | `true`  |
| Suporte à operação `select` no Port | `supportsSelect`                                 | `true`  |
| Health de schema selection          | `schemaSelectionOk`                              | `true`  |
| XSD oficial                         | `implementsOfficialXsd`                          | `false` |
| Validação XSD                       | `implementsXsdValidation`                        | `false` |
| XML TISS/ANS real                   | `implementsRealTissXml` / `implementsRealAnsXml` | `false` |
| Operadoras / contratos / tenants    | `knows*`                                         | `false` |

---

## 3. Operação canônica `select`

```
XMLSchemaRuntimePort.select(input)
  → critérios: schemaId | documentId | name (+ versão)
  → retorna: CanonicalXMLSchema + CanonicalXMLSchemaResult (operação "select")
  → sem persistir novo registro
  → sem conhecimento de padrão TISS/ANS
```

A seleção é puramente canônica e genérica. Os critérios suportados são:

- `schemaId`: identificador único do schema.
- `documentId`: identificador do documento associado.
- `name` (+ `version` opcional): nome do schema e versão major/minor/patch.

Se nenhum schema corresponder, retorna `ok: false` e `code: XML_SCHEMA_RUNTIME_NOT_FOUND`.

---

## 4. Arquivos alterados (D-03)

| Arquivo                                                                        | Alteração                                                                                                                                                      |
| ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/enterprise/xml-schema-runtime/ports/canonical.ts`                     | `select` como operação; `schemaSelectionOk` em `CanonicalXMLSchemaHealth`; `supportsSelect` e `schemaSelectionImplemented` em `CanonicalXMLSchemaCapabilities` |
| `src/lib/enterprise/xml-schema-runtime/ports/capabilities.ts`                  | `supportsSelect` e `schemaSelectionImplemented` no engine e canônico                                                                                           |
| `src/lib/enterprise/xml-schema-runtime/ports/types.ts`                         | `SelectCanonicalXMLSchemaInput/Result`; `schemaSelectionImplemented` no `XMLSchemaRuntimePortCapabilities`; importa `CanonicalXMLSchemaVersion`                |
| `src/lib/enterprise/xml-schema-runtime/ports/xml-schema-runtime-port.ts`       | método `select` na interface                                                                                                                                   |
| `src/lib/enterprise/xml-schema-runtime/ports/index.ts`                         | exporta novos tipos                                                                                                                                            |
| `src/lib/enterprise/xml-schema-runtime/index.ts`                               | exporta novos tipos                                                                                                                                            |
| `src/lib/enterprise/xml-schema-runtime/adapters/default-xml-schema-adapter.ts` | implementação de `select()`; `schemaSelectionOk` e `schemaSelectionImplemented`                                                                                |
| `src/lib/enterprise/xml-schema-runtime/adapters/mock-xml-schema-adapter.ts`    | delega `select()` e declara `schemaSelectionImplemented`                                                                                                       |

## 5. Arquivos novos (D-03)

| Arquivo                                                           | Motivo                                   |
| ----------------------------------------------------------------- | ---------------------------------------- |
| `scripts/enterprise/tests/xml-schema-selection-engine.test.ts`    | Testes D-03 — schema selection funcional |
| `docs/enterprise/D03_XML_SCHEMA_RUNTIME_FUNCTIONAL_FOUNDATION.md` | Documentação oficial da D-03             |

---

## 5. Integridade preservada

| Superfície                              | Status                           |
| --------------------------------------- | -------------------------------- |
| XML Parser (D-01)                       | Inalterado                       |
| XML Validation Runtime (D-02)           | Inalterado                       |
| XSD Validation                          | Inalterado                       |
| XML Schema Runtime estrutural (TISS-07) | Estendido sem quebra de contrato |

---

## 6. Gates

| Gate                          | Resultado                                 |
| ----------------------------- | ----------------------------------------- |
| Build                         | PASS                                      |
| TypeScript                    | PASS (0 erros)                            |
| ESLint                        | PASS (0 erros; 7 warnings pré-existentes) |
| Smoke                         | PASS                                      |
| XML Parser (D-01)             | PASS — 13 / 0                             |
| XML Runtime (D-01)            | PASS — 20 / 0                             |
| XML Validation Runtime (D-02) | PASS — 22 / 0                             |
| XSD Validator (D-02)          | PASS — 17 / 0                             |
| XML Schema Runtime (C-03)     | PASS — 18 / 0                             |
| XML Schema Selection (D-03)   | PASS — 7 / 0                              |
| Enterprise Runtime            | PASS — 6 / 0                              |

**Regressão:** nenhuma.

---

## 7. Próxima Sprint

D-04 — a ser definida no Roadmap do BLOCO D.
