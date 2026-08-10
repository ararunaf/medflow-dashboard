# EPC-21D — Enterprise TISS Mapping Query Engine

## 1. Identificação

| Campo | Valor |
|---|---|
| Sprint | EPC-21D |
| Fase | Fase 5 — TISS Mapping Foundation |
| Componente | `EnterpriseTissMappingQueryEngine` |
| Capacidade ativada | `tissMappingQueryEngineImplemented = true` |

## 2. Objetivo

Estabelecer a camada estrutural de preparação para consultas do mapeamento TISS Enterprise. A Query Engine consome o Registry, mas **não executa consultas reais** nesta sprint.

## 3. Componentes criados

- `src/lib/enterprise/tiss-mapping/mapping-query/enterprise-tiss-mapping-query-engine.ts`
- `src/lib/enterprise/tiss-mapping/mapping-query/index.ts`
- `scripts/enterprise/tests/enterprise-tiss-mapping-query-engine.test.ts`

## 4. Propriedades da engine

- `registryEngine: EnterpriseTissMappingRegistryEngine`
- `canonicalEngine: EnterpriseTissMappingCanonicalEngine`
- `discoveryEngine: EnterpriseTissMappingDiscoveryEngine`
- `genericVocabularyEngine: EnterpriseGenericTissVocabularyEngine`
- `genericTissEngine: GenericTissEngine`
- `genericTissIntegrationEngine: GenericTissIntegrationEngine`
- `workflowEngine: GenericWorkflowEngine`
- `masterOrchestrationEngine: EnterpriseMasterOrchestrationEngine`

## 5. Capabilities

| Capability | Valor |
|---|---|
| `tissMappingDiscoveryImplemented` | `true` |
| `tissMappingCanonicalModelImplemented` | `true` |
| `tissMappingRegistryImplemented` | `true` |
| `tissMappingQueryEngineImplemented` | `true` |
| `tissGenericMappingEngineImplemented` | `false` |

## 6. Reutilização

A engine consome exclusivamente as engines autorizadas:

- `EnterpriseTissMappingRegistryEngine`
- `EnterpriseTissMappingCanonicalEngine`
- `EnterpriseTissMappingDiscoveryEngine`
- `EnterpriseGenericTissVocabularyEngine`
- `GenericTissEngine`
- `GenericTissIntegrationEngine`
- `GenericWorkflowEngine`
- `EnterpriseMasterOrchestrationEngine`

## 7. Diagrama arquitetural atualizado

```text
EnterpriseGenericTissMappingEngine (EPC-21E — futuro)
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

## 8. Matriz Discovery × Canonical × Registry × Query × Generic Mapping

| Camada | Responsabilidade | Consome | Exposição | Pode consultar? | Pode armazenar? | Pode executar algoritmo? |
|---|---|---|---|---|---|---|
| **Discovery (EPC-21A)** | Descobre o domínio | `EnterpriseGenericTissVocabularyEngine`, Blocos H/I/J | Contexto de mapeamento | Não | Não | Não |
| **Canonical (EPC-21B)** | Modela contratos canônicos | Discovery + Vocabulary Gateway + Blocos H/I/J | Modelos canônicos | Não | Não | Não |
| **Registry (EPC-21C)** | Organiza e referencia contratos | Canonical + Discovery + Vocabulary Gateway + Blocos H/I/J | Referência estrutural | **Não** | **Não** | **Não** |
| **Query (EPC-21D)** | Prepara futuras consultas | Registry + Canonical + Discovery + Vocabulary Gateway + Blocos H/I/J | Capacidade de consulta | **Não** (futuro) | **Não** | **Não** |
| **Generic Mapping (EPC-21E)** | Gateway único da Mapping Foundation | Query + camadas inferiores + Blocos H/I/J | Capabilities consolidadas | Não (delega) | Não | Não |

## 9. Prova documental de que Query permanece exclusivamente estrutural

O `EnterpriseTissMappingQueryEngine` contém unicamente:

- oito propriedades `readonly` referenciando engines homologadas;
- um construtor;
- um método `getCapabilities()`.

Não possui:

- métodos `find`, `search`, `query`, `list`, `filter`, `execute`;
- propriedades `store`, `cache`, `index`;
- dependências de banco de dados, parser, XML, SOAP, runtime ou IA.

Portanto, a Query Engine **está estruturalmente posicionada**, mas **não executa nenhuma consulta real** nesta sprint.

## 10. Prova documental de que Registry e Query possuem responsabilidades distintas

| Aspecto | Registry (EPC-21C) | Query (EPC-21D) |
|---|---|---|
| **Responsabilidade** | Organizar e referenciar contratos canônicos | Preparar a futura camada de consultas |
| **Consome** | `EnterpriseTissMappingCanonicalEngine` | `EnterpriseTissMappingRegistryEngine` |
| **Foco semântico** | Referência | Interrogação (futura) |
| **Ação real** | Nenhuma | Nenhuma (nesta sprint) |
| **Pode substituir a outra?** | Não | Não |

O Registry **não consulta**, **não pesquisa** e **não resolve**. A Query **não armazena** e **não referencia contratos diretamente** (consome o Registry para isso).

## 11. Confirmação de ausência de duplicação arquitetural

- `Discovery` descobre.
- `Canonical` modela.
- `Registry` organiza.
- `Query` prepara futuras consultas.
- `Generic Mapping` será o Gateway.

Cada camada tem uma responsabilidade única. Não existe sobreposição semântica ou funcional.

## 12. Validação

- `npm run build` — PASS
- `npx tsc --noEmit` — PASS
- `npm run lint` — PASS (0 erros, 7 warnings históricos)
- `npm run smoke-check` — PASS
- `npx tsx --test scripts/enterprise/tests/*.test.ts` — suíte Enterprise completa

## 13. Status

A camada de Query da TISS Mapping Foundation foi estabelecida como estrutura sem execução de consultas reais. A próxima sprint, EPC-21E, ainda não foi iniciada.
