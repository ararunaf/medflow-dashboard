# C-08 — Enterprise Return Runtime

**Sprint:** C-08 — Enterprise Return Runtime Foundation  
**Padrão:** ECS-01  
**Status:** Foundation estrutural  
**Data:** 2026-08-04

---

## Objetivo

Criar oficialmente a Foundation **Enterprise Return Runtime**, seguindo ECS-01, exclusivamente estrutural.

## Resultado

| Item | Status |
|------|--------|
| `src/lib/enterprise/return-runtime/` | Criado |
| `ReturnRuntimePort` | Criado |
| Provider `createReturnRuntimePort` / `getReturnRuntimePort` | Criado |
| `ReturnRuntimeFactory` | Criada |
| Registry `mock` / `test` / `default` / `enterprise` | Criada |
| Adapters Default / Enterprise / Mock | Criados |
| Store in-memory | Criado |
| `returnRuntimeOk` no Enterprise Runtime | Integrado |
| `ReturnContext` + RULE_04 | Criado |
| `ReturnManifest` | Criado |
| `ReturnCorrelation` | Criado |
| `ReturnStateMachine` | Criada |
| Regra Permanente nº 14 | Documentada |
| Processamento de retorno | **Não** |
| Correlação automática | **Não** |
| Reconciliação | **Não** |
| Parser XML / SOAP / operadoras / banco / APIs / filas | **Não** |

## Fluxo oficial

```
Produto → Enterprise Runtime → ReturnRuntimePort
  → DefaultReturnRuntimeAdapter / EnterpriseReturnRuntimeAdapter / MockReturnRuntimeAdapter
  → InMemoryReturnRuntimeStore → ReturnManifest / ReturnCorrelation / ReturnStateMachine
```

## Contextos canônicos

- `ReturnContext`
- `ReturnManifest`
- `ReturnCorrelation`
- `ReturnMetadata`
- `ReturnStatus`
- `ReturnState`
- `ReturnStateMachine`
- `ReturnStatistics`
- `ReturnHealth`
- `ReturnPolicy`
- `ReturnOrigin`
- `ReturnEnvelope`

## Integrações estruturais (shape-check apenas)

Protocol Runtime · Batch Runtime · Authorization Runtime · Operator Runtime · SOAP Runtime · XML Runtime · XML Validation Runtime · Audit Runtime

## Regra Permanente nº 14

Ver [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_14.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_14.md).

**CORRELATION BEFORE PROCESSING** — nenhum retorno é processado antes da correlação.

Sequência futura oficial:

```
Recebimento → Correlação → Validação → Atualização de Estado → Workflow → Auditoria
```

## Teste

```bash
npm run enterprise:return-runtime:test
```

## Limites

Esta Sprint **não** inicia C-08A. Nenhum processamento de retorno, correlação automática, reconciliação, parser XML, SOAP, comunicação com operadoras, atualização de banco, alteração de status, workflow, APIs ou filas funcionais. Apenas contratos e wiring ECS-01.
