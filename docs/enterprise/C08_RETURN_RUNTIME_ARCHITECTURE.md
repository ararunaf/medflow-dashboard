# C-08 — Return Runtime Architecture

**Sprint:** C-08 — Enterprise Return Runtime Foundation  
**Padrão:** ECS-01  
**Status:** Foundation estrutural  
**Data:** 2026-08-04

---

## Layout ECS-01

```
src/lib/enterprise/return-runtime/
  ports/
  providers/
  factory/
  registry/
  adapters/
  store/
  demo/
  index.ts
```

## Camadas

| Camada | Papel |
|--------|-------|
| Port | `ReturnRuntimePort` — contrato único |
| Provider | `createReturnRuntimePort` / `getReturnRuntimePort` |
| Factory | `ReturnRuntimeFactory` |
| Registry | `mock` · `test` · `default` · `enterprise` |
| Adapters | Default / Enterprise / Mock |
| Store | `ReturnRuntimeStore` / `InMemoryReturnRuntimeStore` |
| Demo | Health summary (Application PoC) |

## Contratos de domínio

| Contrato | Papel |
|----------|-------|
| `ReturnManifest` | Contrato canônico do retorno |
| `ReturnCorrelation` | Mecanismo de correlação (contrato) |
| `ReturnStateMachine` | Estados apenas — sem transições |
| `ReturnContext` | Envelope operacional (RULE_04) |
| `ReturnMetadata` / `ReturnStatus` / `ReturnState` | Metadados e estados |
| `ReturnStatistics` / `ReturnHealth` | Observabilidade estrutural |
| `ReturnPolicy` / `ReturnOrigin` / `ReturnEnvelope` | Política, origem e envelope |

## Capabilities (literais `false`)

```
returnProcessingImplemented = false
automaticCorrelationImplemented = false
statusUpdateImplemented = false
reconciliationImplemented = false
workflowIntegrationImplemented = false
```

## Regra Permanente nº 14

**CORRELATION BEFORE PROCESSING**

Nenhum retorno poderá ser processado antes de ser correlacionado com sua transação canônica.

Ver [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_14.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_14.md).

## Integrações estruturais

Peers preparados via `enterpriseDeps` (shape-check em `health()` apenas):

- Protocol Runtime
- Batch Runtime
- Authorization Runtime
- Operator Runtime
- SOAP Runtime
- XML Runtime
- XML Validation Runtime
- Audit Runtime

## O que esta arquitetura NÃO é

- Não processa retornos
- Não correlaciona automaticamente
- Não reconcilia
- Não lê / faz parse de XML
- Não comunica SOAP / operadoras
- Não atualiza banco / status / workflow
- Não expõe APIs / filas funcionais
