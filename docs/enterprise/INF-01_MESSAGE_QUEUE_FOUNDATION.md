# INF-01 — Message Queue Foundation

**Sprint:** INF-01 — Message Queue Foundation (Fase B — Enterprise Infrastructure)  
**Data:** 01/08/2026  
**Baseline Foundation:** `medicflow-enterprise-foundation-v1.0.0`  
**Padrão:** ECS-01 Ports & Adapters  
**Resultado esperado:** infraestrutura estrutural de filas; comportamento do produto inalterado

---

## 1. Objetivo

Criar a infraestrutura canônica de filas da plataforma Enterprise.

O objetivo **NÃO** é implementar mensageria.

O objetivo é definir a arquitetura oficial que permitirá, futuramente, qualquer backend de filas sem alterar o Core.

---

## 2. Proibições (congelamento)

É **PROIBIDO** nesta sprint:

- alterar qualquer módulo EPC-00 até EPC-24 (exceto Canonical Execution Orchestrator);
- alterar Rule Engine, Workflow, OCR, IA, Capture, Processing, TISS;
- alterar qualquer tela do produto;
- alterar banco de dados / criar migrations;
- criar APIs REST;
- criar Workers reais / filas reais;
- integrar RabbitMQ, Redis, Azure Queue, AWS SQS, Google Pub/Sub, Cloudflare Queues;
- publicar / consumir / processar mensagens;
- executar Engines.

---

## 3. Arquitetura obrigatória (ECS-01)

```
Application
  → ExecutionQueuePort
    → Adapter (DefaultMessageQueueAdapter | MockMessageQueueAdapter)
      → InMemoryMessageQueueStore
        ← MessageQueueFactory
          ← MessageQueueProvider
```

---

## 4. Módulo

`src/lib/enterprise/message-queue/`

| Camada | Artefato |
|--------|----------|
| Port | `ExecutionQueuePort` |
| Adapters | `DefaultMessageQueueAdapter`, `MockMessageQueueAdapter` |
| Store | `InMemoryMessageQueueStore` |
| Factory | `MessageQueueFactory` |
| Provider | `MessageQueueProvider` / `createExecutionQueuePort` |
| Consumer ref | `OCR_PIPELINE_MESSAGE_QUEUE_CONSUMER_REFERENCE` (estrutural) |

---

## 5. Operações do Port

- `enqueue()` — estrutural (não publica)
- `dequeue()` — estrutural (não consome)
- `peek()` — estrutural
- `acknowledge()` — estrutural
- `reject()` — estrutural
- `retry()` — estrutural
- `getQueue()` — cria/obtém fila estrutural
- `getStatistics()` — estatísticas in-memory
- `health()` — prontidão estrutural
- `capabilities()` — declaração estática de capacidades

Nenhuma operação executa lógica real de mensageria.

---

## 6. Fluxo de orquestração

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
  → Message Queue (ExecutionQueuePort)
  → Context enriquecido (executionMessageQueueId)
```

Anexa **apenas** `executionMessageQueueId`.  
Nenhuma mensagem é publicada. Nenhuma fila recebe mensagens reais.

---

## 7. Consumidor OCR (referência estrutural)

O OCR **NÃO** utiliza a fila nesta sprint.

Existe apenas a referência estrutural:

`OCR_PIPELINE_MESSAGE_QUEUE_CONSUMER_REFERENCE`

Declarando que, futuramente, o OCR Pipeline utilizará o Message Queue **exclusivamente** através do `ExecutionQueuePort`.

---

## 8. Testes

```bash
npm run enterprise:message-queue:test
```

---

## 9. Documentação relacionada

- `INF-01_QUEUE_MODEL.md`
- `INF-01_QUEUE_ARCHITECTURE.md`
- `INF-01_QUEUE_CERTIFICATION.md`
