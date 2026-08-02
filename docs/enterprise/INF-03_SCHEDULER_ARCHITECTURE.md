# INF-03 — Scheduler Architecture

**Sprint:** INF-03 — Scheduler Foundation  
**Padrão:** ECS-01 Ports & Adapters

---

## 1. Camadas

```
Application
  ↓
ExecutionSchedulerPort
  ↓
Adapter (Default | Mock)
  ↓
InMemoryExecutionSchedulerStore
  ↑
ExecutionSchedulerFactory
  ↑
ExecutionSchedulerProvider
```

---

## 2. Adapters permitidos

| Adapter | Id | Uso |
|---------|----|-----|
| `DefaultExecutionSchedulerAdapter` | `default-in-process` | Default da fundação |
| `MockExecutionSchedulerAdapter` | `mock-in-memory` | Testes / homologação |

Não existem adapters específicos para tecnologias de Scheduler.

---

## 3. Integração com Worker Foundation (INF-02)

O Scheduler conhece **exclusivamente** `ExecutionWorkerPort`.

- Sem acesso a adapters/stores do Worker Foundation
- Sem `startWorker` / execução
- Sem disparo de jobs
- `usesExecutionWorkerPortOnly: true`

---

## 4. Integração com Canonical Execution Orchestrator

Ordem estrutural (INF-03):

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
  → Environment Registry
  → Message Queue (INF-01)
  → Worker Foundation (INF-02)
  → Scheduler Foundation (INF-03)
  → Context enriquecido (executionSchedulerId)
```

Anexa **apenas** `executionSchedulerId`.

---

## 5. Consumidores futuros (estrutural)

| Consumidor | Constante | Integração real |
|------------|-----------|-----------------|
| OCR Pipeline | `OCR_PIPELINE_SCHEDULER_FOUNDATION_CONSUMER_REFERENCE` | Não |
| IA | `AI_SCHEDULER_FOUNDATION_CONSUMER_REFERENCE` | Não |
| TISS | `TISS_SCHEDULER_FOUNDATION_CONSUMER_REFERENCE` | Não |

---

## 6. Fronteiras

| Permitido | Proibido |
|-----------|----------|
| Port / Adapter / Store / Factory / Provider | Cron / timers / jobs |
| Modelos canônicos | Backends reais de Scheduler |
| Referências estruturais | Engines OCR / IA / TISS |
| Attachment de `executionSchedulerId` | APIs REST / UI / DB |

---

## 7. Aderência ECS-01

- Application depende apenas do Port
- Adapters implementam o Port
- Store é interno
- Factory instancia adapters
- Provider resolve via Factory
- Desacoplamento total de Engines

---

## 8. Relação com fases anteriores

- Message Queue (INF-01) — intacta  
- Worker Foundation (INF-02) — Port apenas; sem alteração funcional  
- Enterprise Foundation (EPC) — intacta (exceto Orchestrator estrutural)
