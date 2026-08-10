# TISS Intelligence — Permanent Architecture Rule

## 1. Escopo

Este documento rege a Fase 4 — TISS Intelligence do projeto `medflow-dashboard`.

## 2. Princípios permanentes

- Uma sprint ativa exatamente uma capability.
- Nenhum Bloco A-J pode ser alterado pelas sprints da Fase 4.
- Nenhum XML Runtime, Workflow, Master Layer, Provider, Port, Adapter, Registry, Factory ou Store existente pode ser modificado.
- Criar novos Ports, Providers, Factories, Registries, Adapters ou Stores somente mediante necessidade técnica comprovada.
- Reutilizar antes de criar.
- Cada engine da Fase 4 deve conter apenas propriedades `readonly`, construtor e `getCapabilities()` até que uma sprint específica autorize funcionalidade.

## 3. Roadmap

| Entrega | Status |
|---|---|
| ARCH-TI00 | ✅ Descoberta arquitetural |
| EPC-20A Vocabulary Discovery | ✅ Implementada |
| EPC-20B Vocabulary Canonical Model | ✅ Implementada |
| EPC-20C Vocabulary Registry | ✅ Implementada |
| EPC-20D Vocabulary Query Engine | 🚧 Autorizada (não iniciada) |
| EPC-20D Vocabulary Query Engine | ⏳ Não iniciada |
| EPC-20E GenericTissVocabularyEngine | ⏳ Não iniciada |
| EPC-20R Final Certification | ⏳ Não iniciada |
| AUDIT-20 Final Audit | ⏳ Não iniciada |

## 4. Componentes certificados

- `src/lib/enterprise/tiss-intelligence/ports/capabilities.ts`
- `src/lib/enterprise/tiss-intelligence/vocabulary-discovery/enterprise-tiss-vocabulary-discovery-engine.ts`
- `src/lib/enterprise/tiss-intelligence/vocabulary-discovery/index.ts`
- `src/lib/enterprise/tiss-intelligence/vocabulary-canonical/models.ts`
- `src/lib/enterprise/tiss-intelligence/vocabulary-canonical/enterprise-tiss-vocabulary-canonical-engine.ts`
- `src/lib/enterprise/tiss-intelligence/vocabulary-canonical/index.ts`
- `src/lib/enterprise/tiss-intelligence/vocabulary-registry/enterprise-tiss-vocabulary-registry-engine.ts`
- `src/lib/enterprise/tiss-intelligence/vocabulary-registry/index.ts`
- `scripts/enterprise/tests/enterprise-tiss-vocabulary-discovery-engine.test.ts`
- `scripts/enterprise/tests/enterprise-tiss-vocabulary-canonical-engine.test.ts`
- `scripts/enterprise/tests/enterprise-tiss-vocabulary-registry-engine.test.ts`
- `docs/enterprise/EPC20A_TISS_VOCABULARY_DISCOVERY.md`
- `docs/enterprise/EPC20B_TISS_VOCABULARY_CANONICAL_MODEL.md`
- `docs/enterprise/EPC20C_TISS_VOCABULARY_REGISTRY.md`

## 5. Capabilities

| Capability | Valor |
|---|---|
| `tissVocabularyDiscoveryImplemented` | `true` |
| `tissVocabularyCanonicalModelImplemented` | `true` |
| `tissVocabularyRegistryImplemented` | `true` |
| `tissVocabularyQueryEngineImplemented` | `false` |
| `tissGenericVocabularyEngineImplemented` | `false` |

## 6. Cadeia de dependências

```text
EnterpriseTissVocabularyDiscoveryEngine (EPC-20A)
            │
            ▼
EnterpriseTissVocabularyCanonicalEngine (EPC-20B)
            │
            ▼
EnterpriseTissVocabularyRegistryEngine (EPC-20C)
            │
            ▼
EnterpriseTissVocabularyQueryEngine (EPC-20D)
            │
            ▼
GenericTissVocabularyEngine (EPC-20E)

Cadeia de consumo da EPC-20C:
  ├─ EnterpriseTissVocabularyCanonicalEngine (EPC-20B)
  ├─ EnterpriseTissVocabularyDiscoveryEngine (EPC-20A)
  ├─ GenericTissEngine (H)
  ├─ GenericTissIntegrationEngine (H)
  ├─ GenericWorkflowEngine (I)
  └─ EnterpriseMasterOrchestrationEngine (J-10)
       └─ ... → J-01 → fachadas E-I
```

## 7. Matriz de acoplamento

| Métrica | Valor |
|---|---|
| Imports diretos | 6 |
| Dependências obrigatórias (diretas) | 6 (canonical + discovery + tiss + tissIntegration + workflow + masterOrchestration) |
| Dependências opcionais | 0 |
| Dependências redundantes | 0 |
| Dependências circulares | 0 |
| Acoplamentos indevidos (Adapters/Providers/Registries/Stores/Blocos A-D) | 0 |

## 8. Recomendação

A Fase 4 evoluiu corretamente de EPC-20A até EPC-20C. A próxima sprint, EPC-20D, pode ser autorizada quando houver requisito funcional aprovado.
