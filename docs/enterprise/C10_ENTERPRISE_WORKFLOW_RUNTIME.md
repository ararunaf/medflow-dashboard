# C-10 — Enterprise Corporate Workflow Runtime

**Sprint:** C-10 — Enterprise Corporate Workflow Runtime Foundation
**Padrão:** ECS-01
**Status:** Foundation estrutural
**Data:** 2026-08-05

---

## Objetivo

Criar oficialmente a Foundation **Enterprise Corporate Workflow Runtime**,
seguindo ECS-01, exclusivamente estrutural — a base de orquestração
corporativa futura, sem qualquer workflow funcional, BPM, decisão automática
ou execução de runtime.

## Resultado

| Item | Status |
|------|--------|
| `src/lib/enterprise/workflow-runtime/` | Criado |
| `WorkflowRuntimePort` | Criado |
| Provider `createWorkflowRuntimePort` / `getWorkflowRuntimePort` | Criado |
| `WorkflowRuntimeFactory` | Criada |
| Registry `mock` / `test` / `default` / `enterprise` | Criada |
| Adapters Default / Enterprise / Mock | Criados |
| Store in-memory | Criado |
| `workflowRuntimeOk` no Enterprise Runtime | Integrado |
| `WorkflowContext` + RULE_04 | Criado |
| `WorkflowManifest` | Criado |
| `WorkflowExecution` | Criado |
| `WorkflowExecutionResult` | Criado |
| `WorkflowStateMachine` | Criada |
| Regra Permanente nº 18 | Documentada |
| Workflow funcional | **Não** |
| BPM | **Não** |
| Decisão automática | **Não** |
| Execução de runtime | **Não** |
| Validação XML / reconciliação / autorização / SOAP / operadoras / lotes / IA | **Não** |
| Banco / APIs / filas / workers / scheduler | **Não** |

## Fluxo oficial

```
Produto → Enterprise Runtime → WorkflowRuntimePort
  → DefaultWorkflowRuntimeAdapter / EnterpriseWorkflowRuntimeAdapter / MockWorkflowRuntimeAdapter
  → InMemoryWorkflowRuntimeStore → WorkflowManifest / WorkflowExecution / WorkflowExecutionResult / WorkflowStateMachine
```

## Estrutura ECS-01

```
src/lib/enterprise/workflow-runtime/
  ports/
    identity.ts        — WORKFLOW_RUNTIME_IDENTITY, geradores de id, reset de sequências
    canonical.ts        — WorkflowManifest / WorkflowExecution / WorkflowExecutionResult /
                           WorkflowStateMachine / WorkflowContext / helpers createEmpty*
    capabilities.ts      — WorkflowRuntimeEngineCapabilities + DEFAULT_*
    types.ts             — tipos de operação (Prepare/Get/List/Stats) + WorkflowRuntimeEnterpriseDeps
    workflow-runtime-port.ts — contrato WorkflowRuntimePort
    index.ts
  adapters/
    default-workflow-runtime-adapter.ts — adapter oficial default/enterprise
    mock-workflow-runtime-adapter.ts     — adapter mock/test (delega ao default)
    index.ts
  store/
    workflow-runtime-store.ts            — contrato do store
    in-memory-workflow-runtime-store.ts  — implementação in-process
    index.ts
  factory/
    workflow-runtime-factory.ts — instancia o adapter correto
  registry/
    workflow-runtime-registry.ts — catálogo mock/test/default/enterprise
  providers/
    create-workflow-runtime-port.ts — WorkflowRuntimeProvider / factory compartilhada
    index.ts
  demo/
    workflow-runtime-health-query.ts — PoC de aplicação (health summary)
    index.ts
  index.ts — barrel público do módulo
```

## Contextos canônicos

- `WorkflowContext`
- `WorkflowManifest`
- `WorkflowExecution`
- `WorkflowExecutionResult`
- `WorkflowExecutionStatistics`
- `WorkflowExecutionMetadata`
- `WorkflowExecutionPolicy`
- `WorkflowHealth`
- `WorkflowState`
- `WorkflowStateMachine`

## Capacidades (literais `false`)

```
workflowImplemented = false
workflowExecutionImplemented = false
automaticDecisionImplemented = false
runtimeExecutionImplemented = false
```

## Integrações estruturais (shape-check apenas)

Reconciliation Runtime · Return Runtime · Authorization Runtime · Operator
Runtime · Protocol Runtime · Batch Runtime · SOAP Runtime · XML Runtime · XML
Validation Runtime · Audit Runtime

Todos os peers são injetados via `enterpriseDeps` (lazy getters) e verificados
apenas quanto à **forma** (`health` + `capabilities`) dentro de `health()` — sem
qualquer consumo funcional.

## Regra Permanente nº 18

Ver [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_18.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_18.md).

**WORKFLOW IS PURE ORCHESTRATION** — o Workflow Runtime exclusivamente
coordena o envelope estrutural; nunca executa lógica especializada de outro
Runtime; consome resultados dos demais Runtimes; nunca os produz.

## Teste

```bash
npm run enterprise:workflow-runtime:test
```

## Limites

Esta Sprint **não** inicia C-10A. Nenhum workflow funcional, BPM, decisão
automática, execução de runtime, validação XML, reconciliação, autorização,
geração SOAP, integração com operadoras, processamento de lotes, IA, banco,
APIs ou filas. Apenas contratos e wiring ECS-01.

- `WorkflowExecutionResult` representa **apenas** o contrato canônico.
- `WorkflowStateMachine` contém **apenas** estados (sem transições).
- `workflowExecutionId` é sempre gerado novo — **nunca** reaproveitado — e é
  independente de `transactionId`.
- Nenhuma coordenação funcional entre Runtimes existe nesta Sprint.
