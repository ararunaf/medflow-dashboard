# INF-01 — Queue Architecture

**Sprint:** INF-01 — Message Queue Foundation  
**Padrão:** ECS-01 Ports & Adapters  
**Baseline:** `medicflow-enterprise-foundation-v1.0.0`

---

## 1. Camadas ECS-01

```
Application
  → ExecutionQueuePort
    → Adapter (DefaultMessageQueueAdapter | MockMessageQueueAdapter)
      → InMemoryMessageQueueStore
        ← MessageQueueFactory
          ← MessageQueueProvider
```

Port operations:

- `enqueue` | `dequeue` | `peek` | `acknowledge` | `reject` | `retry`
- `getQueue` | `getStatistics` | `health` | `capabilities`

---

## 2. Integridade arquitetural

| Regra | Status |
|-------|--------|
| Application depende apenas do Port | ✅ |
| Adapters implementam exclusivamente o Port | ✅ |
| Store é in-memory estrutural | ✅ |
| Factory cria adapters (sem negócio) | ✅ |
| Provider resolve adapter (sem negócio) | ✅ |
| Sem RabbitMQ / Redis / Azure / SQS / PubSub / CF Queues | ✅ |
| Sem Workers / consumidores reais | ✅ |
| Sem publicação real de mensagens | ✅ |
| Desacoplado de OCR / IA / TISS / Engines | ✅ |
| Orchestrator usa exclusivamente ExecutionQueuePort | ✅ |

---

## 3. Integração com Canonical Execution Orchestrator

Ordem estrutural (INF-01):

1. Execution Context  
2. Pipeline Resolver  
3. Execution State Machine  
4. Execution Event Bus  
5. Execution Registry  
6. Execution Trace  
7. Capability Registry  
8. Dependency Registry  
9. Policy Registry  
10. Constraint Registry  
11. Requirement Registry  
12. Resource Registry  
13. Environment Registry  
14. **Message Queue** (`getQueue` estrutural)  
15. Anexar `executionMessageQueueId` ao Context  
16. Pipeline walk estrutural (sem Engines)

O Orchestrator **nunca** chama `enqueue` durante `startExecution`.

---

## 4. Consumidor futuro OCR

```
OCR Pipeline (futuro)
  → ExecutionQueuePort (exclusivo)
  → Adapter / Store (backend trocável via Factory/Provider)
```

Nesta sprint existe apenas:

`OCR_PIPELINE_MESSAGE_QUEUE_CONSUMER_REFERENCE`

com `currentlyUsesQueue: false`.

O módulo `ocr-provider` **não** é alterado.

---

## 5. Extensibilidade futura (fora do escopo)

Backends futuros (RabbitMQ, Redis, Azure Queue, SQS, Pub/Sub, Cloudflare Queues)
deverão ser novos Adapters implementando `ExecutionQueuePort`,
sem alterar Application, Orchestrator Core ou Engines.

---

## 6. Store

`InMemoryMessageQueueStore`:

- `Map` de filas e mensagens
- Sem concorrência
- Sem persistência
- Sem processamento
- `storeId = "in-memory-message-queue"`
