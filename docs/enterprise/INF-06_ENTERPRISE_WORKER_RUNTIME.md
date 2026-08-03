# INF-06 — Enterprise Worker Runtime Foundation

**Sprint:** INF-06 — Enterprise Worker Runtime Foundation (Fase 2 — Enterprise Operational Platform)  
**Data:** 03/08/2026  
**Padrão:** ECS-01 Ports & Adapters  
**Resultado esperado:** infraestrutura canônica estrutural de Workers; comportamento do produto inalterado  
**Pré-requisitos congelados:** INF-05 e INF-05A homologadas

---

## 1. Objetivo

Criar a infraestrutura Enterprise Worker Runtime totalmente desacoplada, tornando-se o único ponto oficial para gerenciamento de Workers na Foundation Enterprise.

Toda comunicação ocorre exclusivamente através do `WorkerRuntimePort`.

O objetivo **NÃO** é implementar Workers reais, Scheduler, Thread Pool ou processamento paralelo.

---

## 2. Proibições (congelamento)

É **PROIBIDO** nesta sprint:

- implementar Workers reais / Thread Pool / Scheduler / Cron;
- processamento paralelo / distribuído / assíncrono funcional;
- RabbitMQ / Kafka / Azure Service Bus / Redis / BullMQ / filas reais;
- Retry Engine / Dead Letter Queue;
- alterar Capture / OCR / XML* / XSD / Namespace (além da integração obrigatória);
- alterar comportamento do produto;
- iniciar INF-06A.

---

## 3. Arquitetura obrigatória (ECS-01)

```
Produto
  → Enterprise Runtime
    → WorkerRuntimePort
      → Adapter (Default | Enterprise | Mock)
        → InMemoryWorkerRuntimeStore
          ← WorkerRuntimeFactory
            ← WorkerRuntimeRegistry
              ← createWorkerRuntimePort()
```

- Queue Runtime recebe `getWorkerRuntimePort()` como dependência preparada — **sem** alocar/executar Workers.
- Worker Runtime recebe `getQueueRuntimePort()` como dependência preparada — **sem** consumir/executar filas.
- TISS Runtime recebe `getWorkerRuntimePort()` como dependência preparada — **sem** utilização funcional.

---

## 4. Módulo

`src/lib/enterprise/worker-runtime/`

| Camada | Artefato |
|--------|----------|
| Port | `WorkerRuntimePort` |
| Canonical Models | `CanonicalWorker`, `CanonicalWorkerTask`, `CanonicalWorkerExecution`, `CanonicalWorkerStatistics`, `CanonicalWorkerHealth`, `CanonicalWorkerCapabilities`, `CanonicalWorkerMetadata`, `CanonicalWorkerIdentity`, `CanonicalWorkerProvider`, `CanonicalWorkerResult`, `CanonicalWorkerStatus` |
| Adapters | `DefaultWorkerRuntimeAdapter`, `EnterpriseWorkerRuntimeAdapter`, `MockWorkerRuntimeAdapter` |
| Store | `InMemoryWorkerRuntimeStore` |
| Factory | `WorkerRuntimeFactory` |
| Registry | `WorkerRuntimeRegistry` |
| Provider | `createWorkerRuntimePort()` / `WorkerRuntimeProvider` |
| Demo | `getWorkerRuntimeHealthSummary()` |

Providers: `default` · `enterprise` · `mock` · `test`

---

## 5. Operações do Port

- `register()` — estrutural (não cria threads)
- `unregister()` — estrutural
- `allocate()` — estrutural (não executa tasks)
- `release()` — estrutural
- `heartbeat()` — estrutural (não implica liveness real)
- `stats()` — estatísticas in-memory
- `health()` — prontidão estrutural
- `capabilities()` / `providerInfo()` — declaração estática

Todas retornam resultados canônicos. Nenhuma operação executa Workers reais.

---

## 6. Integração

| Componente | Integração |
|------------|------------|
| Enterprise Runtime | `getWorkerRuntimePort()` + health `workerRuntimeOk` |
| Queue Runtime | `enterpriseDeps.getWorkerRuntimePort()` + capability `usesWorkerRuntimePort` — **sem alocação** |
| Worker Runtime | `enterpriseDeps.getQueueRuntimePort()` + capability `usesQueueRuntimePort` — **sem consumo** |
| TISS Runtime | `enterpriseDeps.getWorkerRuntimePort()` + health `workerRuntimeOk` — **sem utilização funcional** |

---

## 7. Testes / docs

- Script: `npm run enterprise:worker-runtime:test`
- Docs: `INF-06_ENTERPRISE_WORKER_RUNTIME.md`, `INF-06_WORKER_RUNTIME_ARCHITECTURE.md`, `INF-06_WORKER_RUNTIME_CERTIFICATION.md`

---

## 8. Encerramento

INF-06 encerra após foundation + gates. **INF-06A não iniciada.**
