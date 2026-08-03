# INF-05 — Enterprise Queue Runtime Foundation

**Sprint:** INF-05 — Enterprise Queue Runtime Foundation (Fase 2 — Enterprise Operational Platform)  
**Data:** 03/08/2026  
**Padrão:** ECS-01 Ports & Adapters  
**Resultado esperado:** infraestrutura canônica estrutural de filas; comportamento do produto inalterado  
**Nota de nomenclatura:** distinta da INF-05 (Fase B) Health Center Foundation; esta sprint cria o **Queue Runtime** oficial.

---

## 1. Objetivo

Criar a infraestrutura Enterprise Queue Runtime totalmente desacoplada, tornando-se o único ponto oficial para gerenciamento de filas na Foundation Enterprise.

Toda comunicação ocorre exclusivamente através do `QueueRuntimePort`.

O objetivo **NÃO** é implementar mensageria real.

---

## 2. Proibições (congelamento)

É **PROIBIDO** nesta sprint:

- alterar módulos já homologados (exceto injeção obrigatória no Enterprise Runtime e preparação de dependência no TISS Runtime);
- alterar comportamento do Capture / OCR / XML* / XSD / Namespace / TISS Runtime (além da dependência);
- implementar RabbitMQ, Azure Service Bus, Kafka, Redis Queue;
- implementar filas reais, workers, scheduler, processamento assíncrono/distribuído;
- implementar retry real, dead letter, persistência, threads, cron, HTTP, WebSocket;
- alterar qualquer comportamento do produto.

---

## 3. Arquitetura obrigatória (ECS-01)

```
Produto
  → Enterprise Runtime
    → QueueRuntimePort
      → Adapter (Default | Enterprise | Mock)
        → InMemoryQueueRuntimeStore
          ← QueueRuntimeFactory
            ← QueueRuntimeRegistry
              ← createQueueRuntimePort()
```

TISS Runtime recebe `getQueueRuntimePort()` como dependência obrigatória preparada — **sem** consumir/executar filas.

---

## 4. Módulo

`src/lib/enterprise/queue-runtime/`

| Camada | Artefato |
|--------|----------|
| Port | `QueueRuntimePort` |
| Canonical Models | `CanonicalQueue`, `CanonicalQueueMessage`, `CanonicalQueueBatch`, `CanonicalQueueOperation`, `CanonicalQueueStatistics`, `CanonicalQueueMetadata`, `CanonicalQueueResult`, `CanonicalQueueHealth`, `CanonicalQueueCapabilities`, `CanonicalQueueProvider`, `CanonicalQueueIdentity` |
| Adapters | `DefaultQueueRuntimeAdapter`, `EnterpriseQueueRuntimeAdapter`, `MockQueueRuntimeAdapter` |
| Store | `InMemoryQueueRuntimeStore` |
| Factory | `QueueRuntimeFactory` |
| Registry | `QueueRuntimeRegistry` |
| Provider | `createQueueRuntimePort()` / `QueueRuntimeProvider` |
| Demo | `getQueueRuntimeHealthSummary()` |

Providers: `default` · `enterprise` · `mock` · `test`

---

## 5. Operações do Port

- `enqueue()` — estrutural (não publica)
- `dequeue()` — estrutural (não consome)
- `peek()` — estrutural
- `ack()` — estrutural
- `nack()` — estrutural
- `purge()` — estrutural
- `stats()` — estatísticas in-memory
- `health()` — prontidão estrutural
- `capabilities()` / `providerInfo()` — declaração estática

Todas retornam resultados canônicos. Nenhuma operação acessa filas reais.

---

## 6. Integração

| Componente | Integração |
|------------|------------|
| Enterprise Runtime | `getQueueRuntimePort()` + health `queueRuntimeOk` |
| TISS Runtime | `enterpriseDeps.getQueueRuntimePort()` + health `queueRuntimeOk` + capability `usesQueueRuntimePort` — **sem consumo** |

---

## 7. Testes / docs

- Script: `npm run enterprise:queue-runtime:test`
- Docs: `INF-05_ENTERPRISE_QUEUE_RUNTIME.md`, `INF-05_QUEUE_RUNTIME_ARCHITECTURE.md`, `INF-05_QUEUE_RUNTIME_CERTIFICATION.md`

---

## 8. Encerramento

Esta sprint encerra a INF-05 Queue Runtime Foundation.  
**NÃO** iniciar INF-05A nesta entrega.
