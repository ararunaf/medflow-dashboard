# INF-08 — Enterprise Persistent Queue Runtime Foundation

**Sprint:** INF-08 — Enterprise Persistent Queue Runtime Foundation (Fase 2 — Enterprise Operational Platform)  
**Data:** 03/08/2026  
**Padrão:** ECS-01 Ports & Adapters  
**Resultado esperado:** infraestrutura canônica estrutural de filas persistentes futuras; comportamento do produto inalterado  
**Pré-requisitos congelados:** INF-07A homologada

---

## 1. Objetivo

Criar a Foundation do Enterprise Persistent Queue Runtime, preparando a arquitetura para futuramente suportar RabbitMQ, Azure Service Bus, Kafka, Azure Queue Storage, Redis Streams, BullMQ, filas persistentes, DLQ, Retry Queue, Delay Queue, Priority Queue e Message Persistence — **sem** implementar qualquer backend real.

Toda comunicação ocorre exclusivamente através do `PersistentQueueRuntimePort`.

---

## 2. Proibições (congelamento)

É **PROIBIDO** nesta sprint:

- RabbitMQ / Kafka / Azure Service Bus / Azure Queue Storage / Redis Streams / BullMQ;
- filas persistentes reais / banco de mensagens / persistência real;
- Dead Letter Queue / Retry Queue / Delay Queue / Priority Queue reais;
- Workers / Scheduler / Thread Pool / processamento assíncrono / Auto Scaling;
- alterar Capture / OCR / Queue / Worker / Scheduler / XML* / XSD / Namespace (além do wiring obrigatório);
- alterar comportamento do produto;
- iniciar INF-08A.

---

## 3. Arquitetura obrigatória (ECS-01)

```
Produto
  → Enterprise Runtime
    → PersistentQueueRuntimePort
      → Adapter (Default | Enterprise | Mock)
        → InMemoryPersistentQueueRuntimeStore
          ← PersistentQueueRuntimeFactory
            ← PersistentQueueRuntimeRegistry
              ← createPersistentQueueRuntimePort()
```

- Persistent Queue Runtime recebe `getQueueRuntimePort()` + `getWorkerRuntimePort()` + `getSchedulerRuntimePort()` como deps preparadas — **sem** consumo.
- Queue / Worker / Scheduler Runtime recebem `getPersistentQueueRuntimePort()` como dependência preparada — **sem** persist/release.
- TISS Runtime recebe `getPersistentQueueRuntimePort()` como dependência preparada — **sem** utilização funcional.

---

## 4. Módulo

`src/lib/enterprise/persistent-queue-runtime/`

| Camada | Artefato |
|--------|----------|
| Port | `PersistentQueueRuntimePort` |
| Canonical Models | `CanonicalPersistentQueue`, `CanonicalPersistentMessage`, `CanonicalPersistentEnvelope`, `CanonicalPersistentQueueStatistics`, `CanonicalPersistentQueueHealth`, `CanonicalPersistentQueueCapabilities`, … |
| Adapters | `DefaultPersistentQueueRuntimeAdapter`, `EnterprisePersistentQueueRuntimeAdapter`, `MockPersistentQueueRuntimeAdapter` |
| Store | `InMemoryPersistentQueueRuntimeStore` |
| Factory | `PersistentQueueRuntimeFactory` |
| Registry | `PersistentQueueRuntimeRegistry` |
| Provider | `createPersistentQueueRuntimePort()` / `PersistentQueueRuntimeProvider` |
| Demo | `getPersistentQueueRuntimeHealthSummary()` |

Providers: `default` · `enterprise` · `mock` · `test`

---

## 5. Operações do Port

- `register()` — estrutural (não cria fila real)
- `unregister()` — estrutural
- `persist()` — estrutural (não persiste em banco / backend)
- `release()` — estrutural
- `list()` — listagem in-memory
- `stats()` — estatísticas in-memory
- `health()` — prontidão estrutural
- `capabilities()` / `providerInfo()` — declaração estática

Todas retornam resultados canônicos. Nenhuma operação usa backend persistente real.

---

## 6. Integração

| Componente | Integração |
|------------|------------|
| Enterprise Runtime | `getPersistentQueueRuntimePort()` + health `persistentQueueRuntimeOk` |
| Queue Runtime | `enterpriseDeps.getPersistentQueueRuntimePort()` + capability `usesPersistentQueueRuntimePort` — **sem persist** |
| Worker Runtime | idem — **sem persist** |
| Scheduler Runtime | idem — **sem persist** |
| Persistent Queue Runtime | `getQueueRuntimePort()` + `getWorkerRuntimePort()` + `getSchedulerRuntimePort()` — **sem consumo** |
| TISS Runtime | `enterpriseDeps.getPersistentQueueRuntimePort()` + health `persistentQueueRuntimeOk` — **sem utilização funcional** |

---

## 7. Testes / docs

- Teste: `scripts/enterprise/tests/persistent-queue-runtime-engine.test.ts`
- Script: `npm run enterprise:persistent-queue-runtime:test`
- Docs: `INF-08_ENTERPRISE_PERSISTENT_QUEUE_RUNTIME.md`, `INF-08_PERSISTENT_QUEUE_RUNTIME_ARCHITECTURE.md`, `INF-08_PERSISTENT_QUEUE_RUNTIME_CERTIFICATION.md`

---

## 8. Encerramento

INF-08 certifica **somente** a Foundation.  
INF-08A **não iniciada**. Roadmap permanece congelado.
