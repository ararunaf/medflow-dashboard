# INF-07 — Enterprise Scheduler Runtime Foundation

**Sprint:** INF-07 — Enterprise Scheduler Runtime Foundation (Fase 2 — Enterprise Operational Platform)  
**Data:** 03/08/2026  
**Padrão:** ECS-01 Ports & Adapters  
**Resultado esperado:** infraestrutura canônica estrutural de Schedulers; comportamento do produto inalterado  
**Pré-requisitos congelados:** INF-06 e INF-06A homologadas

---

## 1. Objetivo

Criar a infraestrutura Enterprise Scheduler Runtime totalmente desacoplada, tornando-se o único ponto oficial para gerenciamento estrutural de Schedules na Foundation Enterprise.

Toda comunicação ocorre exclusivamente através do `SchedulerRuntimePort`.

O objetivo **NÃO** é implementar Scheduler real, Cron, Timer, Retry Scheduling, Workers ou processamento paralelo.

---

## 2. Proibições (congelamento)

É **PROIBIDO** nesta sprint:

- implementar Scheduler real / Cron / Quartz / Hangfire / Celery / BullMQ;
- Azure Functions Timer / Task Scheduler / Background Services;
- Timer real / Clock real / Delay Queue / Retry Engine;
- Workers / Thread Pool / processamento paralelo / filas reais;
- RabbitMQ / Kafka / Azure Service Bus / Redis Streams;
- alterar Capture / OCR / XML* / XSD / Namespace / Queue Runtime / Worker Runtime (além da integração obrigatória de wiring);
- alterar comportamento do produto;
- iniciar INF-07A.

---

## 3. Arquitetura obrigatória (ECS-01)

```
Produto
  → Enterprise Runtime
    → SchedulerRuntimePort
      → Adapter (Default | Enterprise | Mock)
        → InMemorySchedulerRuntimeStore
          ← SchedulerRuntimeFactory
            ← SchedulerRuntimeRegistry
              ← createSchedulerRuntimePort()
```

- Scheduler Runtime recebe `getQueueRuntimePort()` + `getWorkerRuntimePort()` como deps preparadas — **sem** consumo/orquestração.
- Queue Runtime recebe `getSchedulerRuntimePort()` como dependência preparada — **sem** schedule/cancel.
- Worker Runtime recebe `getSchedulerRuntimePort()` como dependência preparada — **sem** schedule/cancel.
- TISS Runtime recebe `getSchedulerRuntimePort()` como dependência preparada — **sem** utilização funcional.

---

## 4. Módulo

`src/lib/enterprise/scheduler-runtime/`

| Camada | Artefato |
|--------|----------|
| Port | `SchedulerRuntimePort` |
| Canonical Models | `CanonicalSchedule`, `CanonicalSchedulerJob`, `CanonicalSchedulerDispatch`, `CanonicalSchedulerStatistics`, `CanonicalSchedulerHealth`, `CanonicalSchedulerCapabilities`, `CanonicalSchedulerMetadata`, `CanonicalSchedulerIdentity`, `CanonicalSchedulerProvider`, `CanonicalSchedulerResult`, `CanonicalSchedulerStatus` |
| Adapters | `DefaultSchedulerRuntimeAdapter`, `EnterpriseSchedulerRuntimeAdapter`, `MockSchedulerRuntimeAdapter` |
| Store | `InMemorySchedulerRuntimeStore` |
| Factory | `SchedulerRuntimeFactory` |
| Registry | `SchedulerRuntimeRegistry` |
| Provider | `createSchedulerRuntimePort()` / `SchedulerRuntimeProvider` |
| Demo | `getSchedulerRuntimeHealthSummary()` |

Providers: `default` · `enterprise` · `mock` · `test`

---

## 5. Operações do Port

- `register()` — estrutural (não cria timers)
- `unregister()` — estrutural
- `schedule()` — estrutural (não usa Cron/Timer)
- `cancel()` — estrutural
- `list()` — listagem in-memory
- `stats()` — estatísticas in-memory
- `health()` — prontidão estrutural
- `capabilities()` / `providerInfo()` — declaração estática

Todas retornam resultados canônicos. Nenhuma operação agenda/executa Scheduler real.

---

## 6. Integração

| Componente | Integração |
|------------|------------|
| Enterprise Runtime | `getSchedulerRuntimePort()` + health `schedulerRuntimeOk` |
| Queue Runtime | `enterpriseDeps.getSchedulerRuntimePort()` + capability `usesSchedulerRuntimePort` — **sem schedule** |
| Worker Runtime | `enterpriseDeps.getSchedulerRuntimePort()` + capability `usesSchedulerRuntimePort` — **sem schedule** |
| Scheduler Runtime | `getQueueRuntimePort()` + `getWorkerRuntimePort()` — **sem consumo/orquestração** |
| TISS Runtime | `enterpriseDeps.getSchedulerRuntimePort()` + health `schedulerRuntimeOk` — **sem utilização funcional** |

---

## 7. Testes / docs

- Teste: `scripts/enterprise/tests/scheduler-runtime-engine.test.ts`
- Script: `npm run enterprise:scheduler-runtime:test`
- Docs: `INF-07_ENTERPRISE_SCHEDULER_RUNTIME.md`, `INF-07_SCHEDULER_RUNTIME_ARCHITECTURE.md`, `INF-07_SCHEDULER_RUNTIME_CERTIFICATION.md`

---

## 8. Encerramento

INF-07 certifica **somente** a Foundation.  
INF-07A **não iniciada**. Roadmap permanece congelado.
