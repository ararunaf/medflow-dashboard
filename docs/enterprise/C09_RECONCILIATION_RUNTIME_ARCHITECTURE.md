# C-09 — Reconciliation Runtime Architecture

**Sprint:** C-09 — Enterprise Reconciliation Runtime Foundation  
**Gate:** C-09A — Enterprise Reconciliation Runtime Gate  
**Padrão:** ECS-01  
**Regra permanente:** nº 16 — RECONCILIATION IS DETERMINISTIC  
**Regra permanente:** nº 17 — DECISION AFTER RECONCILIATION

---

## Camadas ECS-01

```
Application
  → Enterprise Runtime (composition root)
    → ReconciliationRuntimePort
      → Adapter (Default / Enterprise / Mock)
        ← Factory ← Registry (mock | test | default | enterprise)
        → InMemoryReconciliationRuntimeStore
          → ReconciliationManifest
          → CanonicalReconciliationResult
          → ReconciliationCorrelation
          → ReconciliationStateMachine
```

## Port

`ReconciliationRuntimePort` — contrato único. Operações estruturais:

| Operação | Papel nesta Sprint |
|----------|-------------------|
| `prepareReconciliation` | Envelope estrutural; `reconciled = false` |
| `getReconciliation` | Leitura in-memory |
| `listReconciliations` | Listagem in-memory |
| `correlateReconciliation` | Envelope estrutural; `matched = false` |
| `stats` | Contagens in-process |
| `health` / `capabilities` / `providerInfo` | Observabilidade estrutural |

## State Machine

Estados canônicos (somente declaração — **sem transições**):

```
PENDING
CORRELATED
RECONCILING
RECONCILED
PARTIALLY_RECONCILED
CONFLICT
FAILED
CANCELLED
```

`transitionsImplemented = false`  
`stateMachineImplemented = false`

## CanonicalReconciliationResult

Contrato exclusivo com:

- `transactionId`
- `batchId`
- `operatorId`
- `matchedDocuments`
- `unmatchedDocuments`
- `conflicts`
- `differences`
- `pendingItems`
- `statistics`
- `recommendations`
- `auditReference`
- `metadata`

Sem implementação funcional.

## Capabilities (literais `false`)

```
reconciliationImplemented = false
conflictResolutionImplemented = false
automaticMatchingImplemented = false
workflowIntegrationImplemented = false
```

## Integrações estruturais

Peers injetados via `enterpriseDeps` (lazy getters). Em `health()`: **shape-check apenas**.

| Peer | Status |
|------|--------|
| Return Runtime | Estrutural |
| Protocol Runtime | Estrutural |
| Batch Runtime | Estrutural |
| Authorization Runtime | Estrutural |
| Operator Runtime | Estrutural |
| Audit Runtime | Estrutural |
| Workflow Runtime | Futuro (prep) |

## Observabilidade (RULE_04)

`ReconciliationContext` prevê:

`operationId` · `transactionId` · `correlationId` · `startedAt` · `finishedAt` · `executionStatus` · `executionDuration` · `warnings` · `errors` · `traceMetadata`

Sem telemetria funcional.

## Determinismo (RULE_16)

A fundação declara que qualquer reconciliação futura **deve** ser:

- determinística
- reproduzível
- auditável
- idempotente

Proibido depender de ordem de processamento, horário, interface, estado externo ou variáveis não declaradas.

Nesta Sprint: **apenas contratos**.

## DECISION AFTER RECONCILIATION (RULE_17)

Registrada oficialmente na Sprint C-09A:

- toda decisão operacional ocorre **somente** após a conclusão formal da reconciliação;
- o Workflow **não** age sem um `CanonicalReconciliationResult` válido;
- Reconciliation Runtime **produz fatos**; Workflow Runtime **consome fatos**;
- Workflow Runtime **não** produz reconciliação;
- nenhuma implementação funcional foi realizada nesta Sprint.

Ver [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_17.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_17.md).

## O que NÃO existe

- Reconciliação funcional
- Matching automático
- Resolução automática de conflitos
- Comparação entre documentos
- Parser XML / SOAP
- Banco / status / workflow / IA / APIs / filas / scheduler / workers
- Decisão operacional / faturamento / reenvio / encerramento pós-reconciliação (apenas RULE_17 documentada)
