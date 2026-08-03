# TISS-08 — Enterprise XML Validation Runtime

**Sprint:** TISS-08 — Enterprise XML Validation Runtime  
**Data:** 03/08/2026  
**Natureza:** Fundação arquitetural do XML Validation Runtime  
**Parecer:** **GO COM RESSALVAS**

---

## 1. Objetivo

Implementar exclusivamente a infraestrutura canônica do XML Validation Runtime dentro da Enterprise Foundation.

Esta Sprint cria o **XML Validation Runtime** como camada única responsável, no futuro, pela validação estrutural de documentos XML da plataforma.

Nesta Sprint **NÃO** há:

- Validação XSD real
- XSD oficial da ANS
- XML TISS/ANS real
- Namespaces oficiais
- SOAP / integração com operadoras
- Contratos / tenants / regras de negócio
- Alteração de produto, telas, banco ou migrations

Apenas infraestrutura canônica estrutural.

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
  → XMLValidationRuntimePort
  → DefaultXMLValidationAdapter
  → InMemoryXMLValidationRuntimeStore
  → Canonical XML Validation Result
```

Único contrato de validação canônica: `XMLValidationRuntimePort`.  
Módulo oficial: `src/lib/enterprise/xml-validation-runtime/`.

Flags obrigatórias do resultado:

- `validationExecuted = false`
- `realValidationPerformed = false`
- `officialXsdLoaded = false`
- `officialAnsValidation = false`
- `officialTissValidation = false`
- `validationRulesLoaded = false`
- `validationEngineReady = true`

---

## 3. Entregáveis

| # | Entregável | Status |
|---|------------|--------|
| 1 | `XMLValidationRuntimePort` | ✓ |
| 2 | Canonical XML Validation models | ✓ |
| 3 | Canonical XML Validation Request / Result / Issue / Summary | ✓ |
| 4 | XML Validation Provider (`createXMLValidationRuntimePort`) | ✓ |
| 5 | XML Validation Factory | ✓ |
| 6 | XML Validation Registry | ✓ |
| 7 | Default XML Validation Adapter | ✓ |
| 8 | Mock XML Validation Adapter | ✓ |
| 9 | InMemory XML Validation Store | ✓ |
| 10 | Wiring Enterprise Runtime | ✓ |
| 11 | Wiring TISS Runtime | ✓ |
| 12 | Integração à cadeia XML → Generation → Serializer → Schema → Validation | ✓ |
| 13 | Health Check | ✓ |
| 14 | Capabilities | ✓ |
| 15 | Demo (`getXMLValidationRuntimeHealthSummary`) | ✓ |
| 16 | Testes (`enterprise:xml-validation-runtime:test`) | ✓ |
| 17 | Documentação | ✓ |

---

## 4. Fora de escopo (explícito)

- Validação XSD real / XSD oficial ANS
- XML TISS / XML ANS / namespaces oficiais
- SOAP / envio a operadoras
- Contratos / tenants / regras de negócio
- Alteração de telas, produto, banco, migrations
- Qualquer bypass ao `XMLValidationRuntimePort`

---

## 5. Integração

- **Enterprise Runtime:** `getXMLValidationRuntimePort()` + health `xmlValidationRuntimeOk`
- **TISS Runtime:** `enterpriseDeps.getXMLValidationRuntimePort` obrigatório; `validate()` após `XMLSchemaRuntimePort.register()`
- **XML Runtime / Generation / Serializer / Schema:** sem import do Validation Runtime (composição no Enterprise/TISS Runtime)
- **Produto Capture:** sem consumo de Validation Runtime / Store / Adapter

---

## 6. Próximo roadmap

Após aprovação desta Sprint, **NÃO** implementar validações XML reais.

Próxima Sprint obrigatória: **TISS-VALIDATION-GATE-01**

Objetivo: certificar oficialmente toda a infraestrutura do XML Validation Runtime antes da introdução de qualquer XSD oficial, validação XML, namespaces ANS ou regras de negócio.
