# EPC-24 — Execution Registry Architecture

**Sprint:** EPC-24 Sprint 06 — Execution Registry Foundation  
**Padrão:** ECS-01 Ports & Adapters  
**Baseline Foundation:** `medicflow-enterprise-foundation-v1.0.0`

---

## 1. Camadas (ECS-01)

```
Application
  ↓
ExecutionRegistryPort
  ↓
Adapter (DefaultExecutionRegistryAdapter | MockExecutionRegistryAdapter)
  ↓
Store (DefaultExecutionRegistryStore — in-memory)
  ↑
Factory (ExecutionRegistryFactory)
  ↑
Provider (createExecutionRegistryPort)
```

---

## 2. Árvore do módulo

```
src/lib/enterprise/execution-registry/
  index.ts
  ports/
    execution-registry-port.ts
    models.ts
    types.ts
    identity.ts
    index.ts
  adapters/
    default-execution-registry-adapter.ts
    mock-execution-registry-adapter.ts
    registry-helpers.ts
    index.ts
  store/
    execution-registry-store.ts
    default-execution-registry-store.ts
    index.ts
  factory/
    execution-registry-factory.ts
    index.ts
  providers/
    create-execution-registry-port.ts
    index.ts
  demo/
    execution-registry-health-query.ts
    index.ts
```

---

## 3. Integração com Orchestrator

```
startExecution
  1. createExecutionContextFromRequest          → ExecutionContextPort
  2. resolvePipelineComposition                 → PipelineResolverPort
  3. createExecutionStateMachineForContext      → ExecutionStateMachinePort
  4. attachStateMachineToExecutionContext
  5. createExecutionEventBusForContext          → ExecutionEventBusPort
  6. attachEventBusToExecutionContext
  7. registerExecutionInRegistry                → ExecutionRegistryPort
  8. attachRegistryToExecutionContext           → executionRegistryId no Context
  9. transitions + attachPipeline + structural walk
 10. finalizeExecutionContext
```

DI: `executionRegistry?: ExecutionRegistryPort` no runtime/factory do Orchestrator.  
Capabilities: `dependsOnExecutionRegistry: true`, `usesExecutionRegistryStructurally: true`.

---

## 4. Store

- Map in-process por `executionRegistryId`
- Índice secundário por `executionId`
- Sem banco, sem Redis, sem cache distribuído, sem persistência em disco

---

## 5. Fronteiras

| Pode | Não pode |
|------|----------|
| Registrar/consultar/listar/remover estruturalmente | Persistir em banco / Supabase |
| Anexar refs ao Context via Port | Embutir Engine / OCR / IA |
| Estatísticas e health in-memory | HTTP / Workers / filas |
| Mock + Default adapters | Alterar Foundation EPC-00–23 |

---

## 6. Aderência ECS-01

- Application depende apenas do Port  
- Adapter isola Store  
- Factory/Provider materializam o Port  
- Orchestrator consome exclusivamente via `ExecutionRegistryPort`  
- Sem acoplamento direto entre Engines  
