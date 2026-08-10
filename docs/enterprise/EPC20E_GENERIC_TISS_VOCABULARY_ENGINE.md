# EPC-20E — Enterprise Generic TISS Vocabulary Engine

## 1. Identificação

| Campo | Valor |
|---|---|
| Sprint | EPC-20E |
| Fase | Fase 4 — TISS Intelligence |
| Componente | `EnterpriseGenericTissVocabularyEngine` |
| Capacidade ativada | `tissGenericVocabularyEngineImplemented = true` |

## 2. Objetivo

Estabelecer o Gateway oficial do Vocabulário TISS Enterprise. Consolidar as camadas estruturais de descoberta, modelo canônico, registro e query como o único ponto de acesso autorizado ao Vocabulário TISS. Não implementa consulta real, parser, IA, inferência, carregamento, indexação, cache, persistência, algoritmo de busca ou infraestrutura runtime.

## 3. Componentes criados

- `src/lib/enterprise/tiss-intelligence/generic-vocabulary/enterprise-generic-tiss-vocabulary-engine.ts`
- `src/lib/enterprise/tiss-intelligence/generic-vocabulary/index.ts`
- `scripts/enterprise/tests/enterprise-generic-tiss-vocabulary-engine.test.ts`

## 4. Propriedades

- `queryEngine: EnterpriseTissVocabularyQueryEngine`
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
| `tissGenericVocabularyEngineImplemented` | `true` |

## 6. Reutilização

A engine consome exclusivamente engines Enterprise existentes:

- `EnterpriseTissVocabularyQueryEngine`
- `EnterpriseTissVocabularyRegistryEngine`
- `EnterpriseTissVocabularyCanonicalEngine`
- `EnterpriseTissVocabularyDiscoveryEngine`
- `GenericTissEngine`
- `GenericTissIntegrationEngine`
- `GenericWorkflowEngine`
- `EnterpriseMasterOrchestrationEngine`

## 7. Gateway oficial

A partir de EPC-20E, `EnterpriseGenericTissVocabularyEngine` é o único ponto oficial de acesso ao Vocabulário TISS. Todas as consultas, integrações e operações futuras deverão ser roteadas por este gateway, preservando o desacoplamento e a arquitetura em camadas.
