# C-06 — Enterprise Batch Runtime

**Sprint:** C-06 — Enterprise Batch Runtime Foundation  
**Padrão:** ECS-01  
**Status:** Foundation estrutural  
**Data:** 2026-08-04

---

## Objetivo

Criar oficialmente a Foundation **Enterprise Batch Runtime**, seguindo ECS-01, exclusivamente estrutural.

## Resultado

| Item | Status |
|------|--------|
| `src/lib/enterprise/batch-runtime/` | Criado |
| `BatchRuntimePort` | Criado |
| Provider `createBatchRuntimePort` / `getBatchRuntimePort` | Criado |
| `BatchRuntimeFactory` | Criada |
| Registry `mock` / `test` / `default` / `enterprise` | Criada |
| Adapters Default / Enterprise / Mock | Criados |
| Store in-memory | Criado |
| `batchRuntimeOk` no Enterprise Runtime | Integrado |
| `BatchContext` + RULE_04 | Criado |
| `BatchManifest` | Criado |
| `BatchStateMachine` | Criada |
| Regra Permanente nº 11 | Documentada |
| Processamento em lote | **Não** |
| Fila / workers / retry / scheduler / paralelismo | **Não** |
| SOAP / XML / banco / APIs / operadoras | **Não** |

## Fluxo oficial

```
Produto → Enterprise Runtime → BatchRuntimePort
  → DefaultBatchRuntimeAdapter / EnterpriseBatchRuntimeAdapter / MockBatchRuntimeAdapter
  → InMemoryBatchRuntimeStore → BatchManifest / BatchStateMachine
```

## Contextos canônicos

- `BatchContext`
- `BatchManifest`
- `BatchDocument`
- `BatchMetadata`
- `BatchStatistics`
- `BatchCapabilities`
- `BatchDependencies`
- `BatchPriority`
- `BatchState`
- `BatchStateMachine`
- `BatchPolicy`
- `BatchHealth`

## Integrações estruturais (shape-check apenas)

Authorization Runtime · Operator Runtime · SOAP Runtime · XML Runtime · XML Validation Runtime · Quality Runtime · Audit Runtime

## Regra Permanente nº 11

Ver [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_11.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_11.md).

## Teste

```bash
npm run enterprise:batch-runtime:test
```

## Limites

Esta Sprint **não** inicia C-06A. Nenhum processamento em lote, fila, worker, retry, scheduler, paralelismo, SOAP, XML, banco, API ou envio para operadoras funcional.
