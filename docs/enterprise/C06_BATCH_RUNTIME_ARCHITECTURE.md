# C-06 — Batch Runtime Architecture

**Sprint:** C-06 — Enterprise Batch Runtime Foundation  
**Padrão:** ECS-01  
**Status:** Foundation estrutural  
**Data:** 2026-08-04

---

## Visão

O **Enterprise Batch Runtime** é a fundação estrutural para o lote corporativo como **unidade transacional**.

Nesta Sprint existem apenas contratos e wiring ECS-01. Não há processamento em lote.

## ECS-01

```
src/lib/enterprise/batch-runtime/
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

| Camada | Responsabilidade |
|--------|------------------|
| Port | `BatchRuntimePort` — contrato único |
| Provider | `createBatchRuntimePort` / `getBatchRuntimePort` |
| Factory | `BatchRuntimeFactory` |
| Registry | `mock` / `test` / `default` / `enterprise` |
| Adapters | Default / Enterprise (alias) / Mock |
| Store | `BatchRuntimeStore` + `InMemoryBatchRuntimeStore` |
| Demo | Health summary application-layer |

## BatchManifest

Contrato canônico do lote. Campos mínimos:

`batchId`, `batchName`, `documents`, `operatorProfile`, `submissionStrategy`, `priority`, `state`, `statistics`, `requiredCapabilities`, `dependencies`, `retryPolicy`, `creationTimestamp`, `requestedExecutionTime`, `owner`, `tags`, `metadata`

Sem lógica funcional.

## BatchStateMachine

Estados canônicos apenas (RULE_11):

`CREATED` · `VALIDATED` · `QUEUED` · `READY_TO_SEND` · `SENT` · `ACKNOWLEDGED` · `PROCESSING` · `PARTIALLY_COMPLETED` · `COMPLETED` · `FAILED` · `TIMEOUT` · `CANCELLED`

- `transitionsImplemented = false`
- `stateMachineImplemented = false`
- Nenhuma transição funcional

## Observabilidade (RULE_04)

`BatchContext` prevê:

`operationId`, `correlationId`, `startedAt`, `finishedAt`, `executionStatus`, `executionDuration`, `processedItems`, `warnings`, `errors`, `traceMetadata`

Sem implementação de telemetria.

## Capabilities

Flags literais `false`:

- `batchProcessingImplemented`
- `parallelExecutionImplemented`
- `retryImplemented`
- `schedulerImplemented`
- `workerImplemented`
- `queueImplemented`

## Integrações estruturais

Peers via `enterpriseDeps` (shape-check em `health()` apenas):

Authorization · Operator · SOAP · XML · XML Validation · Quality · Audit

## Composition Root

```
getEnterpriseRuntime().getBatchRuntimePort()
health.batchRuntimeOk
```

## Não-objetivos (C-06)

Processamento em lote · Workers · Queues · Retry funcional · Scheduler · Paralelismo · SOAP/REST · Banco · Operadoras · XML funcional
