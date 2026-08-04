# F3-CAP-11 — TISS Mapping Runtime Certification

## Certificação estrutural

Sprint: **F3-CAP-11 — Enterprise TISS Mapping Runtime Foundation**

Tipo: ECS-01 Foundation (estrutural apenas)

## Checklist de certificação

| Critério | Status |
|----------|--------|
| ECS-01 seguido (`ports/providers/factory/registry/adapters/store/demo/index.ts`) | ✓ |
| `TISSMappingRuntimePort` criado | ✓ |
| Provider `createTISSMappingRuntimePort()` | ✓ |
| Factory `TISSMappingRuntimeFactory` | ✓ |
| Registry `mock/test/default/enterprise` | ✓ |
| Adapters Default / Enterprise (alias) / Mock | ✓ |
| Store in-memory sem persistência | ✓ |
| `getTISSMappingRuntimePort()` no Enterprise Runtime | ✓ |
| `tissMappingRuntimeOk` no health | ✓ |
| `TISSMappingContext` criado | ✓ |
| Modelo Canônico (contratos) criado | ✓ |
| Contratos de guias criados | ✓ |
| Contratos de operadoras criados | ✓ |
| Contratos de versões TISS criados | ✓ |
| Nenhum mapeamento funcional | ✓ |
| Nenhuma operadora implementada | ✓ |
| Nenhum XML criado | ✓ |
| Nenhum preenchimento automático | ✓ |
| Demo `getTISSMappingRuntimeHealthSummary()` | ✓ |
| Teste `enterprise:tiss-mapping-runtime:test` | ✓ |

## Declarações negativas (obrigatórias)

- Nenhum mapeamento TISS foi implementado.
- Nenhuma operadora foi implementada.
- Nenhum XML foi criado.
- Nenhum preenchimento automático existe.
- Toda a Sprint é exclusivamente estrutural.

## Gate F3-CAP-11A

**Não iniciar** F3-CAP-11A nesta sprint.

Parecer do gate estrutural: emitido no relatório obrigatório da entrega após gates de build/tsc/lint/smoke/enterprise.
