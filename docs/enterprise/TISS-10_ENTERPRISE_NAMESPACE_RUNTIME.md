# TISS-10 — Enterprise Namespace Runtime

**Sprint:** TISS-10 — Enterprise Namespace Runtime Foundation  
**Data:** 03/08/2026  
**Natureza:** Fundação arquitetural do Namespace Runtime  
**Parecer:** **GO COM RESSALVAS**

---

## 1. Objetivo

Implementar exclusivamente a infraestrutura canônica do Namespace Runtime dentro da Enterprise Foundation.

Esta Sprint cria o **Namespace Runtime** como camada única responsável, no futuro, pelo gerenciamento estrutural de namespaces XML da plataforma.

Nesta Sprint **NÃO** há:

- Namespace oficial da ANS
- Namespace TISS
- Namespace XML real
- XML TISS / XML ANS
- XSD oficial / validação XSD
- XML Reader / Parser / Validator
- SOAP / integração com operadoras
- Contratos / tenants / regras de negócio
- Download de namespaces / integrações externas
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
  → NamespaceRuntimePort
  → DefaultNamespaceRuntimeAdapter
  → InMemoryNamespaceRuntimeStore
  → Canonical Namespace Runtime Result
```

Único contrato de namespace canônico: `NamespaceRuntimePort`.  
Módulo oficial: `src/lib/enterprise/namespace-runtime/`.

Flags obrigatórias do resultado:

- `officialNamespacesLoaded = false`
- `realNamespacesLoaded = false`
- `namespaceResolutionEnabled = false`
- `namespaceValidationEnabled = false`
- `officialAnsNamespacesLoaded = false`
- `officialTissNamespacesLoaded = false`
- `runtimeReady = true`

---

## 3. Entregáveis

| # | Entregável | Status |
|---|------------|--------|
| 1 | `NamespaceRuntimePort` | ✓ |
| 2 | Canonical Namespace models | ✓ |
| 3 | Canonical Namespace Runtime Request / Result / Definition / Profile | ✓ |
| 4 | Namespace Runtime Provider (`createNamespaceRuntimePort`) | ✓ |
| 5 | Namespace Runtime Factory | ✓ |
| 6 | Namespace Runtime Registry | ✓ |
| 7 | Default Namespace Runtime Adapter | ✓ |
| 8 | Mock Namespace Runtime Adapter | ✓ |
| 9 | InMemory Namespace Runtime Store | ✓ |
| 10 | Wiring Enterprise Runtime | ✓ |
| 11 | Wiring TISS Runtime | ✓ |
| 12 | Integração à cadeia … → XSD → Namespace | ✓ |
| 13 | Health Check | ✓ |
| 14 | Capabilities | ✓ |
| 15 | Demo (`getNamespaceRuntimeHealthSummary`) | ✓ |
| 16 | Testes (`enterprise:namespace-runtime:test`) | ✓ |
| 17 | Documentação | ✓ |

---

## 4. Fora de escopo (explícito)

- Namespace oficial ANS / TISS / XML real
- Resolução ou validação de namespace real
- XML TISS / XML ANS
- XSD oficial / validação XSD
- SOAP / Reader / Parser / Validator
- Envio a operadoras
- Contratos / tenants / regras de negócio
- Alteração de telas, produto, banco, migrations
- Qualquer bypass ao `NamespaceRuntimePort`

---

## 5. Integração

- **Enterprise Runtime:** `getNamespaceRuntimePort()` + health `namespaceRuntimeOk`
- **TISS Runtime:** `enterpriseDeps.getNamespaceRuntimePort()` obrigatório; `prepare()` após `xsdRuntimePort.prepare()`
- **Providers:** `enterprise` | `default` | `mock` | `test`
- **AER:** AER-NS-B1 (escape hatch) · AER-NS-B2 (barrel/`getStore()`)

---

## 6. Próximo roadmap

**TISS-NAMESPACE-GATE-01** — certificar oficialmente a infraestrutura do Namespace Runtime antes de qualquer namespace oficial ANS/TISS, resolução real ou regras de negócio.

**IMPORTANTE:** TISS-NAMESPACE-GATE-01 não é iniciada nesta Sprint.
