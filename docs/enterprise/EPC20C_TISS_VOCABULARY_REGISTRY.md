# EPC-20C — Enterprise TISS Vocabulary Registry

## 1. Identificação

| Campo | Valor |
|---|---|
| Sprint | EPC-20C |
| Fase | Fase 4 — TISS Intelligence |
| Componente | `EnterpriseTissVocabularyRegistryEngine` |
| Capacidade ativada | `tissVocabularyRegistryImplemented = true` |

## 2. Objetivo

Estabelecer a camada estrutural de registro do vocabulário TISS Enterprise. Não implementa consulta, cache, parser, IA, XML, persistência, carregamento, mapeamento, registry funcional ou infraestrutura runtime.

## 3. Componentes criados

- `src/lib/enterprise/tiss-intelligence/vocabulary-registry/enterprise-tiss-vocabulary-registry-engine.ts`
- `src/lib/enterprise/tiss-intelligence/vocabulary-registry/index.ts`
- `scripts/enterprise/tests/enterprise-tiss-vocabulary-registry-engine.test.ts`

## 4. Propriedades

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
| `tissVocabularyQueryEngineImplemented` | `false` |
| `tissGenericVocabularyEngineImplemented` | `false` |

## 6. Reutilização

A engine consome exclusivamente engines Enterprise:

- `EnterpriseTissVocabularyCanonicalEngine`
- `EnterpriseTissVocabularyDiscoveryEngine`
- `GenericTissEngine`
- `GenericTissIntegrationEngine`
- `GenericWorkflowEngine`
- `EnterpriseMasterOrchestrationEngine`
