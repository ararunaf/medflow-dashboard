# C-10 — Workflow Runtime Architecture

**Sprint:** C-10 — Enterprise Corporate Workflow Runtime Foundation
**Gate:** C-10A — Enterprise Corporate Workflow Runtime Gate (certificado)
**Padrão:** ECS-01
**Regra permanente:** nº 18 — WORKFLOW IS PURE ORCHESTRATION
**Regra permanente:** nº 19 — WORKFLOW EXECUTION IS STATELESS

---

## Camadas ECS-01

```
Application
  → Enterprise Runtime (composition root)
    → WorkflowRuntimePort
      → Adapter (Default / Enterprise / Mock)
        ← Factory ← Registry (mock | test | default | enterprise)
        → InMemoryWorkflowRuntimeStore
          → WorkflowManifest
          → WorkflowExecution
          → WorkflowExecutionResult
          → WorkflowContext
          → WorkflowStateMachine
```

## Port

`WorkflowRuntimePort` — contrato único. Operações estruturais:

| Operação | Papel nesta Sprint |
|----------|---------------------|
| `prepareWorkflowExecution` | Envelope estrutural; `executed = false`; gera `workflowExecutionId` novo |
| `getWorkflowExecution` | Leitura in-memory por `workflowExecutionId` / `transactionId` / `contextId` / `correlationId` |
| `listWorkflowExecutions` | Listagem in-memory (manifests / contexts / executions / results) |
| `stats` | Contagens in-process por estado |
| `health` / `capabilities` / `providerInfo` | Observabilidade estrutural |

## State Machine

Estados canônicos (somente declaração — **sem transições**):

```
CREATED
READY
WAITING
RUNNING
PAUSED
COMPLETED
FAILED
CANCELLED
```

`transitionsImplemented = false`
`stateMachineImplemented = false`

## WorkflowContext — obrigatório (RULE_04)

`WorkflowContext` prevê obrigatoriamente:

`transactionId` · `workflowExecutionId` · `correlationId` · `operationId` ·
`executionStartedAt` · `executionFinishedAt` · `executionDuration` ·
`executionStatus` · `warnings` · `errors` · `traceMetadata`

Sem telemetria funcional.

## `workflowExecutionId` vs `transactionId`

| Campo | Significado |
|-------|--------------|
| `transactionId` | Identifica a transação de negócio corporativa (pode atravessar múltiplos Runtimes) |
| `workflowExecutionId` | Identifica **uma execução específica** de workflow — gerado a cada `prepareWorkflowExecution`; **nunca** reaproveitado, mesmo dentro da mesma `transactionId` |

O adapter oficial (`DefaultWorkflowRuntimeAdapter`) chama
`createWorkflowExecutionId()` a cada preparação — duas chamadas com o mesmo
`transactionId` produzem dois `workflowExecutionId` distintos.

## WorkflowManifest / WorkflowExecution / WorkflowExecutionResult

Contratos exclusivos, sem implementação funcional:

- `WorkflowManifest` — envelope estrutural do workflow (estado, state machine,
  política de execução, peers estruturais, tags, owner).
- `WorkflowExecution` — representa a preparação estrutural de UMA execução
  específica (`workflowExecutionId`, `state`, `nextRuntimeHint`,
  `consumedResults`).
- `WorkflowExecutionResult` — contrato canônico do resultado (`executed =
  false`, `statistics`, `recommendations`, `auditReference`, `metadata`).

## Capabilities (literais `false`)

```
workflowImplemented = false
workflowExecutionImplemented = false
automaticDecisionImplemented = false
runtimeExecutionImplemented = false
```

## Regra Permanente nº 18 — WORKFLOW IS PURE ORCHESTRATION

Registrada oficialmente na Sprint C-10:

- o Workflow **apenas** coordena o envelope estrutural;
- o Workflow **nunca** executa lógica especializada de outro Runtime;
- o Workflow **consome** resultados dos demais Runtimes — nunca os produz;
- `workflowExecutionId` é **independente** de `transactionId`;
- nenhuma implementação funcional foi realizada nesta Sprint.

Ver [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_18.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_18.md).

## Regra Permanente nº 19 — WORKFLOW EXECUTION IS STATELESS

Registrada oficialmente na Sprint C-10A:

- cada execução do Workflow é **independente**;
- `workflowExecutionId` identifica **uma única** execução;
- `transactionId` identifica a **transação corporativa**;
- o Workflow reconstrói seu contexto a partir dos contratos canônicos e dos
  resultados dos demais Runtimes;
- nenhuma dependência de memória interna persistente entre execuções;
- nenhuma implementação funcional foi realizada nesta Sprint.

Ver [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_19.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_19.md).

## Integrações estruturais

Peers injetados via `enterpriseDeps` (lazy getters). Em `health()`:
**shape-check apenas**.

| Peer | Status |
|------|--------|
| Reconciliation Runtime | Estrutural |
| Return Runtime | Estrutural |
| Authorization Runtime | Estrutural |
| Operator Runtime | Estrutural |
| Protocol Runtime | Estrutural |
| Batch Runtime | Estrutural |
| SOAP Runtime | Estrutural |
| XML Runtime | Estrutural |
| XML Validation Runtime | Estrutural |
| Audit Runtime | Estrutural |

## O que NÃO existe

- Workflow funcional / BPM / decisão automática / execução de runtime
- Validação XML funcional
- Reconciliação funcional
- Autorização funcional
- Geração SOAP funcional
- Comunicação com operadoras
- Processamento de lotes (batch)
- IA / ML / LLM
- Banco / status persistido / APIs / filas / scheduler / workers
- Transições de estado funcionais (`WorkflowStateMachine` apenas declara estados)
