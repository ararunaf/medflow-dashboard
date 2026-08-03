# INF-05 — Queue Runtime Architecture

**Sprint:** INF-05 — Enterprise Queue Runtime Foundation  
**Padrão:** ECS-01  
**Data:** 03/08/2026

---

## 1. Posição na arquitetura

```
Produto
  → Enterprise Runtime
       ├─ getQueueRuntimePort() ──────────────┐
       │                                      ▼
       │                              QueueRuntimePort
       │                                      │
       │                    ┌─────────────────┼─────────────────┐
       │                    ▼                 ▼                 ▼
       │         DefaultQueueRuntime   EnterpriseQueue   MockQueueRuntime
       │              Adapter              Adapter            Adapter
       │                    └─────────────────┬─────────────────┘
       │                                      ▼
       │                        InMemoryQueueRuntimeStore
       │
       └─ TISS Runtime
            enterpriseDeps.getQueueRuntimePort()
            (dependência obrigatória preparada —
             NÃO enqueue/dequeue/peek/ack/nack/purge)
```

---

## 2. Fluxo oficial de resolução

1. Application / composition root chama `createEnterpriseRuntime()`.
2. Enterprise Runtime resolve `createQueueRuntimePort({ provider: "enterprise" })`.
3. Provider → Factory → Registry → Adapter oficial.
4. Adapter opera exclusivamente sobre `InMemoryQueueRuntimeStore`.
5. Resultados são modelos canônicos (`CanonicalQueueResult`, etc.).
6. TISS Runtime recebe o Port via `enterpriseDeps` e apenas o consulta em `health()` / capabilities — **sem consumo de filas**.

---

## 3. Contratos

### QueueRuntimePort

Único contrato público. Sem bypass. Sem acesso direto ao Store pelo produto.

### Canonical models

Estruturais apenas:

- `CanonicalQueue`
- `CanonicalQueueMessage`
- `CanonicalQueueBatch`
- `CanonicalQueueOperation`
- `CanonicalQueueStatistics`
- `CanonicalQueueMetadata`
- `CanonicalQueueResult`
- `CanonicalQueueHealth`
- `CanonicalQueueCapabilities`
- `CanonicalQueueProvider`
- `CanonicalQueueIdentity`

### Providers

| Id | Adapter |
|----|---------|
| `enterprise` | `DefaultQueueRuntimeAdapter` (alias `EnterpriseQueueRuntimeAdapter`) |
| `default` | `DefaultQueueRuntimeAdapter` |
| `mock` / `test` | `MockQueueRuntimeAdapter` |

Providers desconhecidos falham explicitamente (sem fallback silencioso).

---

## 4. Fronteiras explícitas

| Presente | Ausente |
|----------|---------|
| Port / Adapter / Factory / Registry / Store in-memory | RabbitMQ / Kafka / Azure / Redis |
| Operações estruturais enqueue…stats | Workers / Scheduler / Dead Letter |
| Health `queueRuntimeOk` | Persistência / HTTP / WebSocket |
| Dependência TISS preparada | Consumo/execução de filas no TISS |

---

## 5. Relação com INF-01 Message Queue

INF-01 (`message-queue` / `ExecutionQueuePort`) permanece intacto.  
INF-05 introduz o **Queue Runtime** como ponto oficial de gerenciamento de filas na Foundation Enterprise via Enterprise Runtime.  
Não há alteração do módulo `message-queue` nesta sprint.

---

## 6. ECS-01

- Um Port oficial
- Um Registry oficial
- Uma Factory oficial
- Adapters oficiais apenas (Default / Enterprise alias / Mock)
- Store in-memory exclusivo do Adapter
- Sem Runtime paralelo / Provider paralelo / Adapter paralelo
