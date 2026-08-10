# TISS Runtime Engine — Permanent Architecture Rule

## 1. Escopo

Este documento rege a Fase 7 — Enterprise Runtime Foundation do projeto `medflow-dashboard`.

## 2. Princípios permanentes

- Uma sprint ativa exatamente uma capability.
- Nenhuma engine das Fases 4, 5 e 6 pode ser alterada pelas sprints da Fase 7.
- Nenhum Bloco A-J pode ser alterado pelas sprints da Fase 7.
- Nenhum Port, Provider, Adapter, Registry, Factory, Store ou Model existente pode ser modificado.
- Criar novos Ports, Providers, Factories, Registries, Adapters ou Stores somente mediante necessidade técnica comprovada.
- Reutilizar antes de criar.
- Cada engine da Fase 7 deve conter apenas propriedades `readonly`, construtor e `getCapabilities()` até que uma sprint específica autorize funcionalidade.
- A Fase 7 consome a Fase 6 (`EnterpriseGenericTissIntelligenceEngine`) exclusivamente através do Gateway oficial.
- A Fase 7 consome a Fase 5 (`EnterpriseGenericTissMappingEngine`) exclusivamente através do Gateway oficial.
- A Fase 7 consome a Fase 4 (`EnterpriseGenericTissVocabularyEngine`) exclusivamente através do Gateway oficial.
- A Fase 7 nunca importa diretamente as engines internas de Vocabulary, Mapping ou Intelligence.
- `EnterpriseGenericTissRuntimeEngine` será o único ponto oficial de acesso à TISS Runtime Foundation.

## 3. Roadmap

| Entrega | Status |
|---|---|
| ARCH-23 Runtime Discovery | ✅ Certificada / Congelada |
| EPC-23A Runtime Discovery Engine | ✅ Certificada / Congelada |
| EPC-23B Runtime Canonical Model | ✅ Certificada / Congelada |
| EPC-23C Runtime Registry | ✅ Certificada / Congelada |
| EPC-23D Runtime Orchestration Engine | ✅ Certificada / Congelada |
| EPC-23E EnterpriseGenericTissRuntimeEngine | ✅ Certificada / Congelada |
| EPC-23R Runtime Final Certification | ✅ Certificada / Congelada |
| AUDIT-23 Runtime Final Audit | ⏳ Autorizada (não iniciada) |

## 4. Capabilities

| Capability | Valor |
|---|---|
| `tissRuntimeDiscoveryImplemented` | `true` |
| `tissRuntimeCanonicalModelImplemented` | `true` |
| `tissRuntimeRegistryImplemented` | `true` |
| `tissRuntimeOrchestrationImplemented` | `true` |
| `tissGenericRuntimeEngineImplemented` | `true` |

## 5. Cadeia arquitetural

```text
EnterpriseGenericTissRuntimeEngine
            │
            ▼
EnterpriseTissRuntimeOrchestrationEngine
            │
            ▼
EnterpriseTissRuntimeRegistryEngine
            │
            ▼
EnterpriseTissRuntimeCanonicalEngine
            │
            ▼
EnterpriseTissRuntimeDiscoveryEngine
            │
            ▼
EnterpriseGenericTissIntelligenceEngine
            │
            ▼
EnterpriseGenericTissMappingEngine
            │
            ▼
EnterpriseGenericTissVocabularyEngine
            │
            ▼
  ├─ GenericTissEngine
  ├─ GenericTissIntegrationEngine
  ├─ GenericWorkflowEngine
  └─ EnterpriseMasterOrchestrationEngine
```

## 6. Regras de encapsulamento

- `EnterpriseGenericTissRuntimeEngine` será o único ponto oficial de acesso à TISS Runtime Foundation.
- Nenhuma engine interna de Vocabulary, Mapping, Intelligence ou Runtime será consumida diretamente por módulos externos.
- A Fase 7 consome as Fases 4, 5 e 6 somente pelos respectivos Gateways oficiais.
- Não são permitidos acessos laterais entre as engines das fundações.
- Não são permitidos ciclos de dependência.

## 7. Fronteiras arquiteturais

| Foundation | Pergunta que responde |
|---|---|
| Vocabulary Foundation | "O que existe?" |
| Mapping Foundation | "Como os conceitos se relacionam?" |
| Intelligence Foundation | "Como essas informações apoiam decisões?" |
| Runtime Foundation | "Como executar de forma orquestrada as decisões produzidas pela arquitetura Enterprise?" |

## 8. Reutilização autorizada

A Fase 7 poderá reutilizar, sem modificar:

- `EnterpriseGenericTissIntelligenceEngine`
- `EnterpriseGenericTissMappingEngine`
- `EnterpriseGenericTissVocabularyEngine`
- `GenericTissEngine`
- `GenericTissIntegrationEngine`
- `GenericWorkflowEngine`
- `EnterpriseMasterOrchestrationEngine`

## 9. Condição de permanência

Todas as sprints da Fase 7 permanecem estruturais até que uma sprint específica autorize funcionalidade. Nenhum parser, IA, LLM, algoritmo, execução real, cache, persistência, runtime funcional, XML, SOAP, TUSS, OCR, Edge Function, scheduler, fila, banco ou Supabase será introduzido sem autorização explícita.

## 10. Foundation Dependency Matrix

```text
Vocabulary
    ↓ conceitos
Mapping
    ↓ relacionamentos
Intelligence
    ↓ contexto decisório
Runtime
    ↓ execução orquestrada
```

| Foundation | Consome | Não consome |
|---|---|---|
| Vocabulary | Blocos H/I/J | Camadas superiores |
| Mapping | Vocabulary Gateway + Blocos H/I/J | Camadas superiores |
| Intelligence | Mapping Gateway + Vocabulary Gateway + Blocos H/I/J | Runtime |
| Runtime | Intelligence Gateway + Mapping Gateway + Vocabulary Gateway + Blocos H/I/J | Engines internas das Foundations |

A Runtime Foundation:

- Depende apenas dos Gateways oficiais.
- Não cria dependência reversa.
- Não aumenta o acoplamento das Foundations anteriores.
- Preserva a independência arquitetural de Vocabulary, Mapping e Intelligence.

## 11. Runtime Visibility Matrix

| Camada | Consumível externamente | Consumidor permitido |
|---|---|---|
| Discovery | ❌ Não | Canonical |
| Canonical | ❌ Não | Registry |
| Registry | ❌ Não | Orchestration |
| Orchestration | ❌ Não | Generic Runtime |
| Generic Runtime | ✅ Sim | Módulos Enterprise autorizados |

## 12. Runtime Gateway Proof

- `EnterpriseGenericTissRuntimeEngine` é o único Gateway oficial da TISS Runtime Foundation.
- Nenhuma engine interna de Vocabulary, Mapping, Intelligence ou Runtime é consumida diretamente por módulos externos.
- Não existem acessos laterais entre as camadas da Runtime Foundation.
- Não existem ciclos de dependência.
- O encapsulamento permanece integral: toda comunicação externa passa pelo Gateway `EnterpriseGenericTissRuntimeEngine`.

## 13. Foundation Independence Matrix

| Foundation | Gateway oficial |
|---|---|
| Vocabulary Foundation | `EnterpriseGenericTissVocabularyEngine` |
| Mapping Foundation | `EnterpriseGenericTissMappingEngine` |
| Intelligence Foundation | `EnterpriseGenericTissIntelligenceEngine` |
| Runtime Foundation | `EnterpriseGenericTissRuntimeEngine` |

## 14. Runtime Dependency Evolution Matrix

| Camada | Discovery | Canonical | Registry | Orchestration | Generic Runtime | Gateways | Motores Base |
|---|---|---|---|---|---|---|---|
| **Discovery** | — | ❌ Não | ❌ Não | ❌ Não | ❌ Não | ✅ Sim | ✅ Sim |
| **Canonical** | ✅ Sim | — | ❌ Não | ❌ Não | ❌ Não | ✅ Sim | ✅ Sim |
| **Registry** | ✅ Sim | ✅ Sim | — | ❌ Não | ❌ Não | ✅ Sim | ✅ Sim |
| **Orchestration** | ✅ Sim | ✅ Sim | ✅ Sim | — | ❌ Não | ✅ Sim | ✅ Sim |
| **Generic Runtime** | ✅ Sim | ✅ Sim | ✅ Sim | ✅ Sim | — | ✅ Sim | ✅ Sim |

## 15. Conclusão

A Fase 7 foi implementada estruturalmente em todas as sprints EPC-23A, EPC-23B, EPC-23C, EPC-23D e EPC-23E. O `EnterpriseGenericTissRuntimeEngine` foi estabelecido como o único Gateway oficial da TISS Runtime Foundation. Nenhum código funcional, execução real, persistência, cache, fila, IA, XML, SOAP, REST, GraphQL, OCR, Rule Engine, algoritmo ou integração externa foi introduzido. A Fase 7 permanece 100% estrutural. A Fase 8 não foi iniciada.
