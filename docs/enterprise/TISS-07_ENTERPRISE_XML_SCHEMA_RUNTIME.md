# TISS-07 — Enterprise XML Schema Runtime

**Sprint:** TISS-07 — Enterprise XML Schema Runtime  
**Data:** 03/08/2026  
**Natureza:** Fundação arquitetural de gerenciamento de XML Schemas canônicos  
**Parecer:** **GO COM RESSALVAS**

---

## 1. Objetivo

Implementar exclusivamente a infraestrutura canônica de gerenciamento de XML Schemas dentro da Enterprise Foundation.

Esta Sprint cria o **XML Schema Runtime** como camada única de gerenciamento estrutural de schemas XML utilizados pela Enterprise Foundation.

Nesta Sprint **NÃO** há:

- XSD oficial da ANS
- Validação XSD
- XML TISS/ANS real
- Namespaces oficiais
- SOAP / integração com operadoras
- Regras de negócio / contratos / tenants

Apenas infraestrutura canônica.

---

## 2. Cadeia oficial

```
Produto
  → Enterprise Runtime
  → TISS Runtime
  → TISSCatalogPort
  → RulePackEnginePort
  → XMLRuntimePort
  → XMLGenerationRuntimePort
  → XMLSerializerRuntimePort
  → XMLSchemaRuntimePort
  → DefaultXMLSchemaAdapter
  → InMemoryXMLSchemaRuntimeStore
  → Canonical XML Schema
```

Único contrato de schema canônico: `XMLSchemaRuntimePort`.  
Módulo oficial: `src/lib/enterprise/xml-schema-runtime/`.

Flags obrigatórias do resultado:

- `officialXsdLoaded = false`
- `xsdValidationPerformed = false`
- `realTissXmlValidated = false`
- `realAnsXmlValidated = false`

---

## 3. Entregáveis

| # | Entregável | Status |
|---|------------|--------|
| 1 | `XMLSchemaRuntimePort` | ✓ |
| 2 | Canonical XML Schema models | ✓ |
| 3 | Canonical XML Schema Request / Result | ✓ |
| 4 | XML Schema Provider (`createXMLSchemaRuntimePort`) | ✓ |
| 5 | XML Schema Factory | ✓ |
| 6 | XML Schema Registry | ✓ |
| 7 | Default XML Schema Adapter | ✓ |
| 8 | Mock XML Schema Adapter | ✓ |
| 9 | InMemory XML Schema Store | ✓ |
| 10 | Wiring Enterprise Runtime | ✓ |
| 11 | Wiring TISS Runtime | ✓ |
| 12 | Integração à cadeia XML Runtime → Generation → Serializer → Schema | ✓ |
| 13 | Health Check | ✓ |
| 14 | Capabilities | ✓ |
| 15 | Demo (`getXMLSchemaRuntimeHealthSummary`) | ✓ |
| 16 | Testes (`enterprise:xml-schema-runtime:test`) | ✓ |
| 17 | Documentação | ✓ |

---

## 4. Escopo explícito fora desta Sprint

- XSD oficial ANS / Schema TISS / Schema ANS
- Validação XML / Validação XSD
- Namespaces oficiais / SOAP / WebService
- Operadoras / contratos / tenants
- Regras de negócio / conhecimento TISS específico
- Alteração de produto, telas, banco ou migrations

---

## 5. Integração

- `DefaultEnterpriseRuntime` resolve e expõe `getXMLSchemaRuntimePort()`
- `DefaultTISSRuntimeAdapter` exige `getXMLSchemaRuntimePort()` em `enterpriseDeps`
- Após `XMLSerializerRuntimePort.serialize()`, o TISS Runtime registra um schema canônico estrutural exclusivamente via `XMLSchemaRuntimePort.register()`
- Health agregado inclui `xmlSchemaRuntimeOk`
- Módulos `xml-runtime`, `xml-generation-runtime` e `xml-serializer-runtime` **não** importam o Schema Runtime (composição no Enterprise/TISS Runtime)

---

## 6. Roadmap

**Não** iniciar imediatamente validação de XML ou leitura de XSD oficial.

Executar obrigatoriamente a Sprint **TISS-SCHEMA-GATE-01** para certificar exclusividade do Port, ausência de bypasses e aderência ao ECS-01.

Somente após essa certificação liberar qualquer implementação funcional de XSD/validação.
