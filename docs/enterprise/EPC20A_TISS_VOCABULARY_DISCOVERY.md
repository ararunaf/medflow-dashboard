# EPC-20A — TISS Vocabulary Discovery

## 1. Identificação

| Campo | Valor |
|---|---|
| Sprint | EPC-20A |
| Fase | Fase 4 — TISS Intelligence |
| Componente | `EnterpriseTissVocabularyDiscoveryEngine` |
| Capacidade ativada | `tissVocabularyDiscoveryImplemented = true` |

## 2. Objetivo

Estabelecer a fundação estrutural para descoberta de vocabulário TISS Enterprise. Esta sprint não interpreta XML, não realiza mapeamentos, não executa inferências, não utiliza IA, não realiza consultas inteligentes e não persiste dados.

## 3. Componentes criados

- `src/lib/enterprise/tiss-intelligence/ports/capabilities.ts`
- `src/lib/enterprise/tiss-intelligence/vocabulary-discovery/enterprise-tiss-vocabulary-discovery-engine.ts`
- `src/lib/enterprise/tiss-intelligence/vocabulary-discovery/index.ts`
- `scripts/enterprise/tests/enterprise-tiss-vocabulary-discovery-engine.test.ts`

## 4. Interface de capabilities

```ts
export interface EnterpriseTissIntelligenceCapabilities {
  tissVocabularyDiscoveryImplemented: boolean;
  tissVocabularyCanonicalModelImplemented: boolean;
  tissVocabularyRegistryImplemented: boolean;
  tissVocabularyQueryEngineImplemented: boolean;
  tissGenericVocabularyEngineImplemented: boolean;
}
```

## 5. Capabilities

| Capability | Valor |
|---|---|
| `tissVocabularyDiscoveryImplemented` | `true` |
| `tissVocabularyCanonicalModelImplemented` | `false` |
| `tissVocabularyRegistryImplemented` | `false` |
| `tissVocabularyQueryEngineImplemented` | `false` |
| `tissGenericVocabularyEngineImplemented` | `false` |

## 6. Reutilização

A engine consome exclusivamente:

- `GenericTissEngine`
- `GenericTissIntegrationEngine`
- `GenericWorkflowEngine`
- `EnterpriseMasterOrchestrationEngine`

## 7. Constrangimentos

- Não acessa Adapters, Providers, Factories, Registries, Stores ou Blocos A-D.
- Não altera Blocos A até J.
- Não altera XML Runtime, Workflow ou Master Layer.
- Contém apenas propriedades `readonly`, construtor e `getCapabilities()`.

## 8. Conclusão

A Sprint EPC-20A foi concluída com a criação da camada estrutural de Vocabulary Discovery, ativando exclusivamente `tissVocabularyDiscoveryImplemented`.
