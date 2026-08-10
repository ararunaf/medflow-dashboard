# TISS Mapping — Permanent Architecture Rule

## 1. Escopo

Este documento rege a Fase 5 — TISS Mapping Foundation do projeto `medflow-dashboard`.

## 2. Princípios permanentes

- Uma sprint ativa exatamente uma capability.
- Nenhum Bloco A-J pode ser alterado pelas sprints da Fase 5.
- Nenhum Port, Provider, Adapter, Registry, Factory, Store ou Model existente pode ser modificado.
- Nenhum XML Runtime, Workflow, Master Layer, Provider, Port, Adapter, Registry, Factory ou Store existente pode ser modificado.
- Criar novos Ports, Providers, Factories, Registries, Adapters ou Stores somente mediante necessidade técnica comprovada.
- Reutilizar antes de criar.
- Cada engine da Fase 5 deve conter apenas propriedades `readonly`, construtor e `getCapabilities()` até que uma sprint específica autorize funcionalidade.
- A Fase 5 reutiliza a Fase 4 exclusivamente através do `EnterpriseGenericTissVocabularyEngine`.
- Nenhuma engine de Mapping pode importar diretamente as engines internas de Vocabulary.

## 3. Roadmap

| Entrega | Status |
|---|---|
| ARCH-21 Mapping Discovery | ✅ Concluída |
| EPC-21A Mapping Discovery | ✅ Implementada |
| EPC-21B Mapping Canonical Model | ✅ Implementada |
| EPC-21C Mapping Registry | ✅ Implementada |
| EPC-21D Mapping Query Engine | ⏳ Não iniciada |
| EPC-21E GenericTissMappingEngine | ⏳ Não iniciada |
| EPC-21R Final Certification | ⏳ Não iniciada |
| AUDIT-21 Final Audit | ⏳ Não iniciada |

## 4. Capabilities

| Capability | Valor |
|---|---|
| `tissMappingDiscoveryImplemented` | `true` |
| `tissMappingCanonicalModelImplemented` | `true` |
| `tissMappingRegistryImplemented` | `true` |
| `tissMappingQueryEngineImplemented` | `false` |
| `tissGenericMappingEngineImplemented` | `false` |

## 5. Cadeia arquitetural

```text
EnterpriseGenericTissMappingEngine (EPC-21E)
            │
            ▼
EnterpriseTissMappingQueryEngine (EPC-21D)
            │
            ▼
EnterpriseTissMappingRegistryEngine (EPC-21C)
            │
            ▼
EnterpriseTissMappingCanonicalEngine (EPC-21B)
            │
            ▼
EnterpriseTissMappingDiscoveryEngine (EPC-21A)
            │
            ▼
EnterpriseGenericTissVocabularyEngine (EPC-20E)
            │
            ▼
  ├─ EnterpriseTissVocabularyQueryEngine (EPC-20D)
  ├─ EnterpriseTissVocabularyRegistryEngine (EPC-20C)
  ├─ EnterpriseTissVocabularyCanonicalEngine (EPC-20B)
  ├─ EnterpriseTissVocabularyDiscoveryEngine (EPC-20A)
  ├─ GenericTissEngine (Bloco H)
  ├─ GenericTissIntegrationEngine (Bloco H)
  ├─ GenericWorkflowEngine (Bloco I)
  └─ EnterpriseMasterOrchestrationEngine (Bloco J)
```

## 6. Regras de encapsulamento

- `EnterpriseGenericTissMappingEngine` é o único ponto oficial de acesso à TISS Mapping Foundation.
- Nenhuma engine de Mapping é consumida diretamente por módulos externos, exceto o `EnterpriseGenericTissMappingEngine`.
- A Fase 5 consome a Fase 4 somente por meio de `EnterpriseGenericTissVocabularyEngine`.
- Não são permitidos acessos laterais entre as engines de Mapping e as engines de Vocabulary.
- Não são permitidos ciclos de dependência.

## 7. Recomendação

A Fase 5 foi descoberta. A próxima entrega, EPC-21A, pode ser autorizada quando houver requisito aprovado.
