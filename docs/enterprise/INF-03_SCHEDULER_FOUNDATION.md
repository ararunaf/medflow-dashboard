# INF-03 — Scheduler Foundation

**Sprint:** INF-03 — Scheduler Foundation (Fase B — Enterprise Infrastructure)  
**Data:** 01/08/2026  
**Baseline Foundation:** `medicflow-enterprise-foundation-v1.0.0`  
**Padrão:** ECS-01 Ports & Adapters  
**Referência INF-02:** `dc86950`  
**Resultado esperado:** infraestrutura estrutural de Schedulers; comportamento do produto inalterado

---

## 1. Objetivo

Criar a infraestrutura canônica de agendamento da plataforma Enterprise.

O objetivo **NÃO** é executar agendamentos.

O objetivo é estabelecer a arquitetura oficial para gerenciamento futuro de tarefas programadas.

---

## 2. Proibições (congelamento)

É **PROIBIDO** nesta sprint:

- alterar qualquer módulo EPC-00 até EPC-24 (exceto Canonical Execution Orchestrator);
- alterar Rule Engine, Workflow, OCR, IA, Capture, Processing, TISS;
- alterar qualquer tela do produto;
- alterar banco de dados / criar migrations;
- criar APIs REST;
- implementar agendamento real;
- executar jobs / Workers / Threads;
- utilizar cron / node-cron / BullMQ Scheduler / Quartz / Hangfire / Azure Scheduler / Cloudflare Cron / Kubernetes CronJobs;
- executar OCR / IA automaticamente.

---

## 3. Arquitetura obrigatória (ECS-01)

```
Application
  → ExecutionSchedulerPort
    → Adapter (DefaultExecutionSchedulerAdapter | MockExecutionSchedulerAdapter)
      → InMemoryExecutionSchedulerStore
        ← ExecutionSchedulerFactory
          ← ExecutionSchedulerProvider
```

Integração com Workers: exclusivamente via `ExecutionWorkerPort` (INF-02).

---

## 4. Módulo

`src/lib/enterprise/scheduler-foundation/`

| Camada | Artefato |
|--------|----------|
| Port | `ExecutionSchedulerPort` |
| Adapters | `DefaultExecutionSchedulerAdapter`, `MockExecutionSchedulerAdapter` |
| Store | `InMemoryExecutionSchedulerStore` |
| Factory | `ExecutionSchedulerFactory` |
| Provider | `ExecutionSchedulerProvider` / `createExecutionSchedulerPort` |
| Consumer refs | OCR Pipeline + IA + TISS (estrutural) |

---

## 5. Operações do Port

- `registerSchedule()` — estrutural (não executa)
- `unregisterSchedule()` — estrutural
- `enableSchedule()` — estrutural (não agenda)
- `disableSchedule()` — estrutural
- `pauseSchedule()` — estrutural
- `resumeSchedule()` — estrutural
- `getSchedule()` — cria/obtém Schedule estrutural
- `listSchedules()` — lista estrutural in-memory
- `statistics()` — estatísticas in-memory
- `health()` — prontidão estrutural
- `capabilities()` — declaração estática de capacidades

Nenhuma operação executa lógica real de agendamento.

---

## 6. Integração com Orchestrator

Fluxo estrutural:

```
Execution Context
  → … registries …
  → Message Queue
  → Worker Foundation
  → Scheduler Foundation
  → Context enriquecido (executionSchedulerId)
```

Anexa exclusivamente `executionSchedulerId`. Nenhum Schedule é executado.

---

## 7. Consumidores estruturais futuros

- `OCR_PIPELINE_SCHEDULER_FOUNDATION_CONSUMER_REFERENCE`
- `AI_SCHEDULER_FOUNDATION_CONSUMER_REFERENCE`
- `TISS_SCHEDULER_FOUNDATION_CONSUMER_REFERENCE`

Nenhuma integração real. Nenhum processamento.

---

## 8. Testes

```bash
npm run enterprise:scheduler-foundation:test
```

---

## 9. Documentação correlata

- `INF-03_SCHEDULER_MODEL.md`
- `INF-03_SCHEDULER_ARCHITECTURE.md`
- `INF-03_SCHEDULER_CERTIFICATION.md`
