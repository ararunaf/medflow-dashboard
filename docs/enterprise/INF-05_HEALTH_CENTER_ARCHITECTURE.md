# INF-05 — Health Center Architecture

**Sprint:** INF-05 — Health Center Foundation  
**Padrão:** ECS-01 Ports & Adapters  
**Data:** 01/08/2026

---

## 1. Camadas

```
Application
    ↓
ExecutionHealthCenterPort
    ↓
Adapter (Default | Mock)
    ↓
InMemoryExecutionHealthCenterStore
    ↑
ExecutionHealthCenterFactory
    ↑
ExecutionHealthCenterProvider
```

---

## 2. Dependência estrutural

```
INF-01 Message Queue
  → INF-02 Worker Foundation
    → INF-03 Scheduler Foundation
      → INF-04 Observability Foundation
        → INF-05 Health Center Foundation
```

Health Center conhece **exclusivamente** `ExecutionObservabilityPort`.

É proibido:

- importar adapters/stores do Observability Foundation;
- chamar `getObservation` / `listObservations`;
- acoplar OCR, IA, Rule Engine, Workflow, TISS, Capture, Processing.

---

## 3. Fluxo no Canonical Execution Orchestrator

```
Execution Context
  → Pipeline Resolver
  → Execution State Machine
  → Execution Event Bus
  → Execution Registry
  → Execution Trace
  → Capability Registry
  → Dependency Registry
  → Policy Registry
  → Constraint Registry
  → Requirement Registry
  → Resource Registry
  → Message Queue
  → Worker Foundation
  → Scheduler Foundation
  → Observability Foundation
  → Health Center Foundation
  → Context enriquecido (executionHealthCenterId)
```

Passos estruturais adicionados:

33. `registerHealthCenterForContext` — registra os 12 componentes do catálogo  
34. `attachHealthCenterToExecutionContext` — anexa apenas `executionHealthCenterId`

---

## 4. Adapters

| Adapter | ID | Uso |
|---------|----|-----|
| `DefaultExecutionHealthCenterAdapter` | `default-in-process` | Default de produção da fundação |
| `MockExecutionHealthCenterAdapter` | `mock-in-memory` | Testes / homologação (`mock` \| `test`) |

Nenhum adapter específico de tecnologia (Prometheus, Datadog, K8s probes, etc.).

---

## 5. Store

`InMemoryExecutionHealthCenterStore`

- Map primário por `healthComponentId`
- Índice `healthCenterId + key`
- Índice por `executionHealthCenterId`
- Índice por `executionId`

Sem persistência. Sem consultas externas. Sem monitoramento.

---

## 6. Garantias arquiteturais

| Garantia | Status |
|----------|--------|
| ECS-01 Ports & Adapters | ✓ |
| 1 Port | ✓ |
| 2 Adapters | ✓ |
| Store in-memory | ✓ |
| Factory + Provider | ✓ |
| Apenas Orchestrator alterado (além do novo módulo) | ✓ |
| INF-01…INF-04 intactas | ✓ |
| Engines desacoplados | ✓ |
| Sem monitoramento real | ✓ |
