# EPC-21A — Enterprise TISS Mapping Discovery Engine

## 1. Identificação

| Campo | Valor |
|---|---|
| Sprint | EPC-21A |
| Fase | Fase 5 — TISS Mapping Foundation |
| Componente | `EnterpriseTissMappingDiscoveryEngine` |
| Capacidade ativada | `tissMappingDiscoveryImplemented = true` |

## 2. Objetivo

Estabelecer a camada estrutural de descoberta do mapeamento TISS Enterprise. Não implementa consulta real, parser, IA, inferência, carregamento, indexação, cache, persistência, algoritmo de busca ou infraestrutura runtime.

## 3. Componentes criados

- `src/lib/enterprise/tiss-mapping/ports/capabilities.ts`
- `src/lib/enterprise/tiss-mapping/mapping-discovery/enterprise-tiss-mapping-discovery-engine.ts`
- `src/lib/enterprise/tiss-mapping/mapping-discovery/index.ts`
- `scripts/enterprise/tests/enterprise-tiss-mapping-discovery-engine.test.ts`

## 4. Propriedades

- `genericVocabularyEngine: EnterpriseGenericTissVocabularyEngine`
- `genericTissEngine: GenericTissEngine`
- `genericTissIntegrationEngine: GenericTissIntegrationEngine`
- `workflowEngine: GenericWorkflowEngine`
- `masterOrchestrationEngine: EnterpriseMasterOrchestrationEngine`

## 5. Capabilities

| Capability | Valor |
|---|---|
| `tissMappingDiscoveryImplemented` | `true` |
| `tissMappingCanonicalModelImplemented` | `false` |
| `tissMappingRegistryImplemented` | `false` |
| `tissMappingQueryEngineImplemented` | `false` |
| `tissGenericMappingEngineImplemented` | `false` |

## 6. Reutilização

A engine consome exclusivamente:

- `EnterpriseGenericTissVocabularyEngine` (Gateway da Fase 4)
- `GenericTissEngine`
- `GenericTissIntegrationEngine`
- `GenericWorkflowEngine`
- `EnterpriseMasterOrchestrationEngine`

## 7. Isolamento semântico da Vocabulary Foundation

`EnterpriseTissMappingDiscoveryEngine` **não importa** diretamente:

- `EnterpriseTissVocabularyDiscoveryEngine`
- `EnterpriseTissVocabularyCanonicalEngine`
- `EnterpriseTissVocabularyRegistryEngine`
- `EnterpriseTissVocabularyQueryEngine`

A única dependência da Fase 4 é o `EnterpriseGenericTissVocabularyEngine`.

## 8. Diagrama de separação semântica

```text
┌─────────────────────────────────────────────────────────────┐
│                    Vocabulary Foundation                      │
│  (EPC-20) — responsável por conceitos, termos e catálogos  │
│                                                               │
│  EnterpriseGenericTissVocabularyEngine                        │
│            │                                                  │
│            ▼                                                  │
│  EnterpriseTissVocabularyQueryEngine                          │
│            │                                                  │
│            ▼                                                  │
│  EnterpriseTissVocabularyRegistryEngine                       │
│            │                                                  │
│            ▼                                                  │
│  EnterpriseTissVocabularyCanonicalEngine                      │
│            │                                                  │
│            ▼                                                  │
│  EnterpriseTissVocabularyDiscoveryEngine                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ fornece conceitos
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Mapping Foundation                        │
│  (EPC-21) — responsável por relacionamentos e mapeamentos    │
│                                                               │
│  EnterpriseGenericTissMappingEngine                           │
│            │                                                  │
│            ▼                                                  │
│  EnterpriseTissMappingQueryEngine                             │
│            │                                                  │
│            ▼                                                  │
│  EnterpriseTissMappingRegistryEngine                          │
│            │                                                  │
│            ▼                                                  │
│  EnterpriseTissMappingCanonicalEngine                         │
│            │                                                  │
│            ▼                                                  │
│  EnterpriseTissMappingDiscoveryEngine                         │
└─────────────────────────────────────────────────────────────┘
```

## 9. Confirmação de ausência de duplicação semântica

- Vocabulary Foundation gerencia **conceitos** (o que é).
- Mapping Foundation gerencia **relações** (como se conecta).
- Não existe sobreposição de responsabilidades.
- Não existe duplicação de estruturas ou lógica.

## 10. Validação

- `npm run build` — PASS
- `npx tsc --noEmit` — PASS
- `npm run lint` — PASS (0 erros, 7 warnings históricos)
- `npm run smoke-check` — PASS
- `npx tsx --test scripts/enterprise/tests/*.test.ts` — 2542 tests, 2540 pass, 2 falhas históricas
  - `scripts/enterprise/tests/tiss-catalog-engine.test.ts`
  - `scripts/enterprise/tests/tiss-provider-engine.test.ts`
