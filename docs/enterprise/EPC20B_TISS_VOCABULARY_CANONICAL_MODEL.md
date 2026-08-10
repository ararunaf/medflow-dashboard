# EPC-20B — TISS Vocabulary Canonical Model

## 1. Identificação

| Campo | Valor |
|---|---|
| Sprint | EPC-20B |
| Fase | Fase 4 — TISS Intelligence |
| Componente | `EnterpriseTissVocabularyCanonicalEngine` |
| Capacidades ativas | `tissVocabularyDiscoveryImplemented = true`, `tissVocabularyCanonicalModelImplemented = true` |

## 2. Objetivo

Criar exclusivamente os modelos canônicos que representarão semanticamente o domínio TISS. Não implementar carregamento, parser, armazenamento, consultas, inferência, mapeamento, integração ou persistência.

## 3. Modelos canônicos

| Modelo | Descrição |
|---|---|
| `TissVocabularyValue` | Valor codificado do domínio TISS |
| `TissVocabularyField` | Campo de uma entidade com tipo, cardinalidade e valores |
| `TissVocabularyEntity` | Entidade composta por campos |
| `TissVocabularyGroup` | Grupo de entidades |
| `TissVocabularyCategory` | Categoria de grupos |
| `TissVocabularyDomain` | Domínio completo com categorias e versão |

## 4. Imutabilidade

Todos os modelos são classes com propriedades `readonly` e construtores. Não possuem métodos mutacionais.

## 5. Componentes criados

- `src/lib/enterprise/tiss-intelligence/vocabulary-canonical/models.ts`
- `src/lib/enterprise/tiss-intelligence/vocabulary-canonical/enterprise-tiss-vocabulary-canonical-engine.ts`
- `src/lib/enterprise/tiss-intelligence/vocabulary-canonical/index.ts`
- `scripts/enterprise/tests/enterprise-tiss-vocabulary-canonical-engine.test.ts`

## 6. Reutilização

A engine consome exclusivamente:

- `EnterpriseTissVocabularyDiscoveryEngine`
- `GenericTissEngine`
- `GenericTissIntegrationEngine`
- `GenericWorkflowEngine`
- `EnterpriseMasterOrchestrationEngine`

## 7. Capabilities

| Capability | Valor |
|---|---|
| `tissVocabularyDiscoveryImplemented` | `true` |
| `tissVocabularyCanonicalModelImplemented` | `true` |
| `tissVocabularyRegistryImplemented` | `false` |
| `tissVocabularyQueryEngineImplemented` | `false` |
| `tissGenericVocabularyEngineImplemented` | `false` |
