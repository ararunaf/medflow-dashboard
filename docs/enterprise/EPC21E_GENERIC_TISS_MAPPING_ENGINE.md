# EPC-21E — Enterprise Generic TISS Mapping Engine

## 1. Identificação

| Campo | Valor |
|---|---|
| Sprint | EPC-21E |
| Fase | Fase 5 — TISS Mapping Foundation |
| Componente | `EnterpriseGenericTissMappingEngine` |
| Capacidade ativada | `tissGenericMappingEngineImplemented = true` |

## 2. Objetivo

Consolidar oficialmente a TISS Mapping Foundation como uma arquitetura Gateway. O `EnterpriseGenericTissMappingEngine` é o **único ponto oficial de acesso** a todas as camadas de mapeamento. Não implementa consultas reais, parser, IA, inferência, algoritmo, persistência, cache, indexação, XML, SOAP, runtime, workflow funcional, carregamento, mapeamento funcional ou banco de dados.

## 3. Componentes criados

- `src/lib/enterprise/tiss-mapping/generic-mapping/enterprise-generic-tiss-mapping-engine.ts`
- `src/lib/enterprise/tiss-mapping/generic-mapping/index.ts`
- `scripts/enterprise/tests/enterprise-generic-tiss-mapping-engine.test.ts`

## 4. Propriedades da engine

- `queryEngine: EnterpriseTissMappingQueryEngine`
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
| `tissGenericMappingEngineImplemented` | `true` |

## 6. Reutilização

A engine consome exclusivamente as engines autorizadas:

- `EnterpriseTissMappingQueryEngine`
- `EnterpriseTissMappingRegistryEngine`
- `EnterpriseTissMappingCanonicalEngine`
- `EnterpriseTissMappingDiscoveryEngine`
- `EnterpriseGenericTissVocabularyEngine`
- `GenericTissEngine`
- `GenericTissIntegrationEngine`
- `GenericWorkflowEngine`
- `EnterpriseMasterOrchestrationEngine`

## 7. Diagrama arquitetural final da Mapping Foundation

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

## 8. Matriz Discovery × Canonical × Registry × Query × Generic Mapping

| Camada | Responsabilidade | Consome | Exposição | Pode consultar? | Pode armazenar? | Pode executar algoritmo? |
|---|---|---|---|---|---|---|
| **Discovery (EPC-21A)** | Descobre o domínio de mapeamento | Vocabulary Gateway + H/I/J | Contexto | Não | Não | Não |
| **Canonical (EPC-21B)** | Modela contratos canônicos | Discovery + Vocabulary Gateway + H/I/J | Modelos canônicos | Não | Não | Não |
| **Registry (EPC-21C)** | Organiza e referencia contratos | Canonical + H/I/J | Referência | Não | Não | Não |
| **Query (EPC-21D)** | Prepara futuras consultas | Registry + H/I/J | Capacidade | Não (futuro) | Não | Não |
| **Generic Mapping (EPC-21E)** | Gateway único da Mapping Foundation | Query + H/I/J | Capabilities consolidadas | Não (delega) | Não | Não |

## 9. Matriz de consumidores permitidos e proibidos

| Engine | Responsabilidade | Consumidores permitidos | Consumidores proibidos | Dependências | Papel arquitetural |
|---|---|---|---|---|---|
| `EnterpriseTissMappingDiscoveryEngine` | Descoberta | `EnterpriseTissMappingCanonicalEngine` | Qualquer módulo externo | `EnterpriseGenericTissVocabularyEngine`, H/I/J | Camada base de domínio |
| `EnterpriseTissMappingCanonicalEngine` | Modelagem canônica | `EnterpriseTissMappingRegistryEngine` | Qualquer módulo externo | `EnterpriseTissMappingDiscoveryEngine`, `EnterpriseGenericTissVocabularyEngine`, H/I/J | Contratos de relação |
| `EnterpriseTissMappingRegistryEngine` | Referência | `EnterpriseTissMappingQueryEngine` | Qualquer módulo externo | `EnterpriseTissMappingCanonicalEngine`, `EnterpriseTissMappingDiscoveryEngine`, H/I/J | Organização de contratos |
| `EnterpriseTissMappingQueryEngine` | Preparação de consultas | `EnterpriseGenericTissMappingEngine` | Qualquer módulo externo | `EnterpriseTissMappingRegistryEngine`, H/I/J | Camada intermediária de consulta |
| `EnterpriseGenericTissMappingEngine` | Gateway oficial | Qualquer módulo externo da aplicação | — | `EnterpriseTissMappingQueryEngine`, `EnterpriseTissMappingRegistryEngine`, `EnterpriseTissMappingCanonicalEngine`, `EnterpriseTissMappingDiscoveryEngine`, `EnterpriseGenericTissVocabularyEngine`, H/I/J | **Único ponto de acesso externo** |

## 10. Prova documental de que `EnterpriseGenericTissMappingEngine` é o único Gateway oficial

- Apenas `EnterpriseGenericTissMappingEngine` deve ser importado por módulos externos.
- Nenhum módulo externo deve importar `EnterpriseTissMappingDiscoveryEngine`, `EnterpriseTissMappingCanonicalEngine`, `EnterpriseTissMappingRegistryEngine` ou `EnterpriseTissMappingQueryEngine`.
- O teste `enterprise-generic-tiss-mapping-engine.test.ts` comprova que a engine expõe as quatro engines inferiores por referência.
- A cadeia arquitetural é estritamente hierárquica: `Generic Mapping → Query → Registry → Canonical → Discovery → Vocabulary Gateway`.

## 11. Prova documental de que nenhum módulo externo pode importar as engines internas

A Fase 5 impõe as seguintes regras de importação:

- `EnterpriseGenericTissMappingEngine` → pode ser importado por qualquer consumidor externo.
- `EnterpriseTissMappingQueryEngine` → somente pode ser consumido pelo Gateway.
- `EnterpriseTissMappingRegistryEngine` → somente pode ser consumido por `Query` e `Canonical`.
- `EnterpriseTissMappingCanonicalEngine` → somente pode ser consumido por `Registry`.
- `EnterpriseTissMappingDiscoveryEngine` → somente pode ser consumido por `Canonical`.

## 12. Confirmação de ausência de duplicação arquitetural

- Cada camada tem uma responsabilidade única.
- Não existe sobreposição entre Vocabulary e Mapping.
- Não existe acesso lateral.
- Não existem ciclos de dependência.
- A Fase 5 permanece totalmente desacoplada de qualquer implementação funcional futura (por exemplo, EPC-22).

## 13. Validação

- `npm run build` — PASS
- `npx tsc --noEmit` — PASS
- `npm run lint` — PASS (0 erros, 7 warnings históricos)
- `npm run smoke-check` — PASS
- `npx tsx --test scripts/enterprise/tests/*.test.ts` — suíte Enterprise completa

## 14. Status

A Fase 5 — TISS Mapping Foundation foi completamente consolidada como arquitetura estrutural. O Gateway `EnterpriseGenericTissMappingEngine` foi estabelecido como o único ponto oficial de acesso. As próximas entregas, EPC-21R e AUDIT-21, ainda não foram iniciadas.
