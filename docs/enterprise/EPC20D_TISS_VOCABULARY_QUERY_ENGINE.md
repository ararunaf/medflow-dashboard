# EPC-20D — Enterprise TISS Vocabulary Query Engine

## 1. Identificação

| Campo | Valor |
|---|---|
| Sprint | EPC-20D |
| Fase | Fase 4 — TISS Intelligence |
| Componente | `EnterpriseTissVocabularyQueryEngine` |
| Capacidade ativada | `tissVocabularyQueryEngineImplemented = true` |

## 2. Objetivo

Estabelecer a camada estrutural de query do vocabulário TISS Enterprise. Não implementa consulta real, parser, IA, inferência, carregamento, indexação, cache, persistência, algoritmo de busca ou infraestrutura runtime.

## 3. Componentes criados

- `src/lib/enterprise/tiss-intelligence/vocabulary-query/enterprise-tiss-vocabulary-query-engine.ts`
- `src/lib/enterprise/tiss-intelligence/vocabulary-query/index.ts`
- `scripts/enterprise/tests/enterprise-tiss-vocabulary-query-engine.test.ts`

## 4. Propriedades

- `registryEngine: EnterpriseTissVocabularyRegistryEngine`
- `canonicalEngine: EnterpriseTissVocabularyCanonicalEngine`
- `discoveryEngine: EnterpriseTissVocabularyDiscoveryEngine`
- `genericTissEngine: GenericTissEngine`
- `genericTissIntegrationEngine: GenericTissIntegrationEngine`
- `workflowEngine: GenericWorkflowEngine`
- `masterOrchestrationEngine: EnterpriseMasterOrchestrationEngine`

## 5. Capabilities

| Capability | Valor |
|---|---|
| `tissVocabularyDiscoveryImplemented` | `true` |
| `tissVocabularyCanonicalModelImplemented` | `true` |
| `tissVocabularyRegistryImplemented` | `true` |
| `tissVocabularyQueryEngineImplemented` | `true` |
| `tissGenericVocabularyEngineImplemented` | `false` |

## 6. Reutilização

A engine consome exclusivamente engines Enterprise:

- `EnterpriseTissVocabularyRegistryEngine`
- `EnterpriseTissVocabularyCanonicalEngine`
- `EnterpriseTissVocabularyDiscoveryEngine`
- `GenericTissEngine`
- `GenericTissIntegrationEngine`
- `GenericWorkflowEngine`
- `EnterpriseMasterOrchestrationEngine`
