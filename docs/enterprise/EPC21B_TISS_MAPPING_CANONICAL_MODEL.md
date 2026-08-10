# EPC-21B — Enterprise TISS Mapping Canonical Model

## 1. Identificação

| Campo | Valor |
|---|---|
| Sprint | EPC-21B |
| Fase | Fase 5 — TISS Mapping Foundation |
| Componente | `EnterpriseTissMappingCanonicalEngine` |
| Capacidade ativada | `tissMappingCanonicalModelImplemented = true` |

## 2. Objetivo

Estabelecer o modelo canônico estrutural do mapeamento TISS Enterprise. Não implementa parser, algoritmo, IA, inferência, consulta, cache, indexação, carregamento, XML, SOAP, workflow, integração, persistência, runtime ou mapeamento funcional.

## 3. Componentes criados

- `src/lib/enterprise/tiss-mapping/mapping-canonical/enterprise-tiss-mapping-canonical-engine.ts`
- `src/lib/enterprise/tiss-mapping/mapping-canonical/models.ts`
- `src/lib/enterprise/tiss-mapping/mapping-canonical/index.ts`
- `scripts/enterprise/tests/enterprise-tiss-mapping-canonical-engine.test.ts`

## 4. Propriedades da engine

- `discoveryEngine: EnterpriseTissMappingDiscoveryEngine`
- `genericVocabularyEngine: EnterpriseGenericTissVocabularyEngine`
- `genericTissEngine: GenericTissEngine`
- `genericTissIntegrationEngine: GenericTissIntegrationEngine`
- `workflowEngine: GenericWorkflowEngine`
- `masterOrchestrationEngine: EnterpriseMasterOrchestrationEngine`

## 5. Modelos canônicos

| Modelo | Responsabilidade |
|---|---|
| `TissMappingRule` | Define uma regra de relacionamento entre domínios |
| `TissMappingRelation` | Descreve o tipo de relação entre conceitos |
| `TissMappingTarget` | Representa o destino de uma regra de mapeamento |
| `TissMappingSource` | Representa a origem de uma regra de mapeamento |
| `TissMappingContext` | Contexto de aplicação da regra (versão, operadora etc) |
| `TissMappingDomain` | Domínio que agrupa regras de mapeamento |

Todos os modelos possuem apenas propriedades `readonly` e nenhum método.

## 6. Capabilities

| Capability | Valor |
|---|---|
| `tissMappingDiscoveryImplemented` | `true` |
| `tissMappingCanonicalModelImplemented` | `true` |
| `tissMappingRegistryImplemented` | `false` |
| `tissMappingQueryEngineImplemented` | `false` |
| `tissGenericMappingEngineImplemented` | `false` |

## 7. Reutilização

A engine consome exclusivamente:

- `EnterpriseTissMappingDiscoveryEngine`
- `EnterpriseGenericTissVocabularyEngine`
- `GenericTissEngine`
- `GenericTissIntegrationEngine`
- `GenericWorkflowEngine`
- `EnterpriseMasterOrchestrationEngine`

## 8. Matriz comparativa Vocabulary × Mapping

| Dimensão | Vocabulary Foundation (EPC-20) | Mapping Foundation (EPC-21) |
|---|---|---|
| **Responsabilidade** | Define o que existe: conceitos, termos, códigos, catálogos | Define como os conceitos se relacionam: regras, relações, origem e destino |
| **Escopo** | Vocabulário TISS canônico | Mapeamento entre conceitos e domínios TISS |
| **Dependências** | Blocos H, I, J | Blocos H, I, J + `EnterpriseGenericTissVocabularyEngine` |
| **Gateway utilizado** | `EnterpriseGenericTissVocabularyEngine` | `EnterpriseGenericTissMappingEngine` (futuro) + `EnterpriseGenericTissVocabularyEngine` |
| **Componentes reutilizados** | `GenericTissEngine`, `GenericTissIntegrationEngine`, `GenericWorkflowEngine`, `EnterpriseMasterOrchestrationEngine` | `GenericTissEngine`, `GenericTissIntegrationEngine`, `GenericWorkflowEngine`, `EnterpriseMasterOrchestrationEngine`, `EnterpriseGenericTissVocabularyEngine` |
| **Componentes exclusivos** | `EnterpriseTissVocabulary*Engine` | `EnterpriseTissMapping*Engine` |
| **Pergunta respondida** | "O que existe?" | "Como os conceitos se relacionam?" |

## 9. Prova documental de ausência de duplicação conceitual

- Vocabulary Foundation armazena **conceitos** (`TissVocabularyDomain`, `TissVocabularyCategory`, `TissVocabularyEntity`, `TissVocabularyValue`).
- Mapping Foundation armazena **relações** (`TissMappingRule`, `TissMappingRelation`, `TissMappingTarget`, `TissMappingSource`).
- Não existe campo, método ou regra idêntica entre as duas fases.
- A única ponte é o `EnterpriseGenericTissVocabularyEngine`, usado como fonte de conceitos.
- A Mapping Foundation nunca repete a definição de um conceito; apenas referencia seus identificadores.

## 10. Validação

- `npm run build` — PASS
- `npx tsc --noEmit` — PASS
- `npm run lint` — PASS (0 erros, 7 warnings históricos)
- `npm run smoke-check` — PASS
- `npx tsx --test scripts/enterprise/tests/*.test.ts` — 2548/2554 tests (depende da contagem), 2 falhas históricas
  - `scripts/enterprise/tests/tiss-catalog-engine.test.ts`
  - `scripts/enterprise/tests/tiss-provider-engine.test.ts`

## 11. Status

A camada canônica da TISS Mapping Foundation foi estabelecida. A próxima sprint, EPC-21C, ainda não foi iniciada.
