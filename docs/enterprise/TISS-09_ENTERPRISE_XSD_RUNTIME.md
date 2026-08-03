# TISS-09 — Enterprise XSD Runtime

**Sprint:** TISS-09 — Enterprise XSD Runtime Foundation  
**Data:** 03/08/2026  
**Natureza:** Fundação arquitetural do XSD Runtime  
**Parecer:** **GO COM RESSALVAS**

---

## 1. Objetivo

Implementar exclusivamente a infraestrutura canônica do XSD Runtime dentro da Enterprise Foundation.

Esta Sprint cria o **XSD Runtime** como camada única responsável, no futuro, pelo gerenciamento estrutural de XSDs da plataforma.

Nesta Sprint **NÃO** há:

- XSD oficial da ANS
- Arquivos `.xsd`
- Validação XSD real
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
  → XSDRuntimePort
  → DefaultXSDRuntimeAdapter
  → InMemoryXSDRuntimeStore
  → Canonical XSD Runtime Result
```

Único contrato de XSD canônico: `XSDRuntimePort`.  
Módulo oficial: `src/lib/enterprise/xsd-runtime/`.

Flags obrigatórias do resultado:

- `officialXsdLoaded = false`
- `realXsdLoaded = false`
- `realValidationAvailable = false`
- `officialNamespacesLoaded = false`
- `officialSchemasLoaded = false`
- `schemaParsingEnabled = false`
- `schemaValidationEnabled = false`
- `runtimeReady = true`

---

## 3. Entregáveis

| # | Entregável | Status |
|---|------------|--------|
| 1 | `XSDRuntimePort` | ✓ |
| 2 | Canonical XSD models | ✓ |
| 3 | Canonical XSD Runtime Request / Result / Schema / Profile | ✓ |
| 4 | XSD Runtime Provider (`createXSDRuntimePort`) | ✓ |
| 5 | XSD Runtime Factory | ✓ |
| 6 | XSD Runtime Registry | ✓ |
| 7 | Default XSD Runtime Adapter | ✓ |
| 8 | Mock XSD Runtime Adapter | ✓ |
| 9 | InMemory XSD Runtime Store | ✓ |
| 10 | Wiring Enterprise Runtime | ✓ |
| 11 | Wiring TISS Runtime | ✓ |
| 12 | Integração à cadeia XML → … → Validation → XSD | ✓ |
| 13 | Health Check | ✓ |
| 14 | Capabilities | ✓ |
| 15 | Demo (`getXSDRuntimeHealthSummary`) | ✓ |
| 16 | Testes (`enterprise:xsd-runtime:test`) | ✓ |
| 17 | Documentação | ✓ |

---

## 4. Fora de escopo (explícito)

- XSD oficial ANS / arquivos `.xsd`
- Validação XSD real / namespaces oficiais
- XML TISS / XML ANS
- SOAP / envio a operadoras
- Contratos / tenants / regras de negócio
- Alteração de telas, produto, banco, migrations
- Qualquer bypass ao `XSDRuntimePort`

---

## 5. Integração

- **Enterprise Runtime:** `getXSDRuntimePort()` + health `xsdRuntimeOk`
- **TISS Runtime:** `enterpriseDeps.getXSDRuntimePort()` obrigatório; `prepare()` após `validate()`
- **Providers:** `enterprise` | `default` | `mock` | `test`
- **AER:** AER-XSD-B1 (escape hatch) · AER-XSD-B2 (barrel/`getStore()`)

---

## 6. Próximo roadmap

**TISS-XSD-GATE-01** — certificar oficialmente a infraestrutura do XSD Runtime antes de qualquer XSD oficial, validação XSD real, namespaces ANS ou regras de negócio.

**IMPORTANTE:** TISS-XSD-GATE-01 não é iniciada nesta Sprint.
