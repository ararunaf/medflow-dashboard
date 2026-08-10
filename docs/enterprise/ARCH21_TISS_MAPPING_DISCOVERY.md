# ARCH-21 — Enterprise TISS Mapping Foundation Discovery

## 1. Identificação

| Campo | Valor |
|---|---|
| Sprint | ARCH-21 |
| Fase | Fase 5 — TISS Mapping Foundation |
| Tipo | Descoberta arquitetural |
| Status | ✅ Descoberta concluída |

## 2. Escopo

Definir integralmente a arquitetura permanente da TISS Mapping Foundation (EPC-21). Nenhuma engine é implementada nesta sprint. Apenas a estrutura arquitetural, capabilities, dependências, gateway e regras permanentes são estabelecidas.

## 3. Cadeia arquitetural definida

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

## 4. Capabilities definidas

| Capability | Início | Ativação futura |
|---|---|---|
| `tissMappingDiscoveryImplemented` | `false` | EPC-21A |
| `tissMappingCanonicalModelImplemented` | `false` | EPC-21B |
| `tissMappingRegistryImplemented` | `false` | EPC-21C |
| `tissMappingQueryEngineImplemented` | `false` | EPC-21D |
| `tissGenericMappingEngineImplemented` | `false` | EPC-21E |

Todas as capabilities permanecem `false` até a sua sprint correspondente.

## 5. Gateway oficial

`EnterpriseGenericTissMappingEngine` será o único ponto oficial de acesso à TISS Mapping Foundation.

## 6. Encapsulamento

- Somente `EnterpriseGenericTissMappingEngine` poderá ser consumida externamente.
- Nenhuma engine de Mapping poderá acessar diretamente as engines internas de Vocabulary (Discovery, Canonical, Registry, Query).
- Toda a comunicação entre EPC-21 e EPC-20 deverá ocorrer exclusivamente através do `EnterpriseGenericTissVocabularyEngine`.
- A separação entre Vocabulary Foundation e Mapping Foundation será absoluta.

## 7. Profundidade arquitetural

| Nível | Engine |
|---|---|
| 0 | `EnterpriseGenericTissMappingEngine` |
| 1 | `EnterpriseTissMappingQueryEngine` |
| 2 | `EnterpriseTissMappingRegistryEngine` |
| 3 | `EnterpriseTissMappingCanonicalEngine` |
| 4 | `EnterpriseTissMappingDiscoveryEngine` |
| 5 | `EnterpriseGenericTissVocabularyEngine` |
| 6 | `EnterpriseTissVocabularyQueryEngine` |
| 7 | `EnterpriseTissVocabularyRegistryEngine` |
| 8 | `EnterpriseTissVocabularyCanonicalEngine` |
| 9 | `EnterpriseTissVocabularyDiscoveryEngine` |
| 10 | `GenericTissEngine`, `GenericTissIntegrationEngine`, `GenericWorkflowEngine`, `EnterpriseMasterOrchestrationEngine` |

## 8. Matriz de acoplamento prevista

### Dependências diretas

| Engine | Direct Imports (previsto) | Quantidade |
|---|---|---|
| `EnterpriseGenericTissMappingEngine` | query, registry, canonical, discovery, genericVocabulary, genericTiss, genericTissIntegration, workflow, masterOrchestration | 9 |
| `EnterpriseTissMappingQueryEngine` | registry, canonical, discovery, genericVocabulary, genericTiss, genericTissIntegration, workflow, masterOrchestration | 8 |
| `EnterpriseTissMappingRegistryEngine` | canonical, discovery, genericVocabulary, genericTiss, genericTissIntegration, workflow, masterOrchestration | 7 |
| `EnterpriseTissMappingCanonicalEngine` | discovery, genericVocabulary, genericTiss, genericTissIntegration, workflow, masterOrchestration | 6 |
| `EnterpriseTissMappingDiscoveryEngine` | genericVocabulary, genericTiss, genericTissIntegration, workflow, masterOrchestration | 5 |

### Dependências transitivas

| Engine | Transitivas dentro da Fase 5 |
|---|---|
| `EnterpriseGenericTissMappingEngine` | query, registry, canonical, discovery |
| `EnterpriseTissMappingQueryEngine` | registry, canonical, discovery |
| `EnterpriseTissMappingRegistryEngine` | canonical, discovery |
| `EnterpriseTissMappingCanonicalEngine` | discovery |
| `EnterpriseTissMappingDiscoveryEngine` | — |

### Dependências com Fase 4

A única dependência externa à Fase 5 será o `EnterpriseGenericTissVocabularyEngine`. Nenhuma outra engine da EPC-20 poderá ser importada diretamente.

### Regras de acoplamento

| Tipo | Quantidade/Valor |
|---|---|
| Acoplamentos permitidos | cadeia hierárquica EPC-21 + Gateway EPC-20 |
| Acoplamentos laterais | 0 |
| Dependências circulares | 0 |
| Acessos diretos a Vocabulary Discovery/Canonical/Registry/Query | 0 |

## 9. Fluxo arquitetural

```text
Consumidor externo
       │
       ▼
EnterpriseGenericTissMappingEngine
       │
       ▼
[ Cadeia EPC-21: Query → Registry → Canonical → Discovery ]
       │
       ▼
EnterpriseGenericTissVocabularyEngine (Gateway da Fase 4)
       │
       ▼
[ Cadeia EPC-20: Query → Registry → Canonical → Discovery ]
       │
       ▼
GenericTissEngine | GenericTissIntegrationEngine | GenericWorkflowEngine | EnterpriseMasterOrchestrationEngine
```

## 10. Componentes reutilizados

- `EnterpriseGenericTissVocabularyEngine`
- `GenericTissEngine`
- `GenericTissIntegrationEngine`
- `GenericWorkflowEngine`
- `EnterpriseMasterOrchestrationEngine`

## 11. Componentes exclusivos

- `EnterpriseGenericTissMappingEngine`
- `EnterpriseTissMappingQueryEngine`
- `EnterpriseTissMappingRegistryEngine`
- `EnterpriseTissMappingCanonicalEngine`
- `EnterpriseTissMappingDiscoveryEngine`

## 12. Regras permanentes

- Uma sprint ativa exatamente uma capability.
- Nenhuma Bloco A-J pode ser alterado pelas sprints da Fase 5.
- Nenhum Port, Provider, Adapter, Registry, Factory, Store ou Model existente pode ser modificado.
- Criar novos Ports, Providers, Factories, Registries, Adapters ou Stores somente mediante necessidade técnica comprovada.
- Reutilizar antes de criar.
- Cada engine da Fase 5 deve conter apenas propriedades `readonly`, construtor e `getCapabilities()` até que uma sprint específica autorize funcionalidade.
- Somente `EnterpriseGenericTissMappingEngine` poderá ser consumida externamente.
- Toda a reutilização da Fase 4 ocorre exclusivamente através do `EnterpriseGenericTissVocabularyEngine`.
- Nenhuma dependência circular.
- Nenhum acesso lateral.

## 13. Roadmap da Fase 5

| Entrega | Status |
|---|---|
| ARCH-21 Mapping Discovery | ✅ Descoberta concluída |
| EPC-21A Mapping Discovery | ⏳ Não iniciada |
| EPC-21B Mapping Canonical Model | ⏳ Não iniciada |
| EPC-21C Mapping Registry | ⏳ Não iniciada |
| EPC-21D Mapping Query Engine | ⏳ Não iniciada |
| EPC-21E GenericTissMappingEngine | ⏳ Não iniciada |
| EPC-21R Final Certification | ⏳ Não iniciada |
| AUDIT-21 Final Audit | ⏳ Não iniciada |

## 14. Validação desta descoberta

- `npm run build` — PASS
- `npx tsc --noEmit` — PASS
- `npm run lint` — PASS (0 erros, 7 warnings históricos)
- `npm run smoke-check` — PASS
- `npx tsx --test scripts/enterprise/tests/*.test.ts` — 2542 tests, 2540 pass, 2 falhas históricas

## 15. Status

A arquitetura da Fase 5 — TISS Mapping Foundation foi descoberta e documentada. Nenhuma engine foi implementada. A EPC-21A está autorizada para início quando houver requisito aprovado.
