# INF-01 — Queue Model

**Sprint:** INF-01 — Message Queue Foundation  
**Padrão:** ECS-01 Ports & Adapters  
**Escopo:** modelos canônicos estruturais (sem mensageria real)

---

## 1. Modelos canônicos (8)

| Modelo | Kind | Propósito |
|--------|------|-----------|
| `CanonicalQueue` | `canonical-queue` | Agregado raiz da fila estrutural (`executionMessageQueueId`) |
| `CanonicalQueueMessage` | `canonical-queue-message` | Mensagem estrutural in-memory (não publicada / não consumida) |
| `CanonicalQueueMetadata` | `canonical-queue-metadata` | Metadados opacos (tags, timestamps, notes) |
| `CanonicalQueueStatistics` | `canonical-queue-statistics` | Contagens estruturais do store |
| `CanonicalQueueHealth` | `canonical-queue-health` | Saúde estrutural (modelo canônico) |
| `CanonicalQueueCapabilities` | `canonical-queue-capabilities` | Declaração explícita do que NÃO é feito |
| `CanonicalQueueConfiguration` | `canonical-queue-configuration` | Configuração opaca da fila (sem backend) |
| `CanonicalQueueReference` | `canonical-queue-reference` | Referência opaca name/value |

---

## 2. Identidade

| Helper | Prefixo |
|--------|---------|
| `createExecutionMessageQueueId()` | `execution-message-queue-####` |
| `createCanonicalQueueMessageId()` | `canonical-queue-message-####` |

O Orchestrator anexa ao Context exclusivamente:

```
executionMessageQueueId
```

---

## 3. Flags de negação (obrigatórias)

Todos os modelos relevantes declaram explicitamente:

- `messagesPublished: false`
- `messagesConsumed: false`
- `workersInvoked: false`
- `processingPerformed: false`
- `realQueueBackend: false`
- `enginesInvoked: false`
- `persistenceImplemented: false`
- `databaseUsed: false`
- `implementsRabbitMq: false`
- `implementsRedis: false`
- `implementsAzureQueue: false`
- `implementsAwsSqs: false`
- `implementsGooglePubSub: false`
- `implementsCloudflareQueues: false`
- `implementsOcr: false`
- `implementsAi: false`
- `implementsTiss: false`
- `decoupledFromEngines: true`
- `noDirectEngineCoupling: true`

---

## 4. Status estrutural de mensagem

```
structural
enqueued-structural
dequeued-structural
acknowledged-structural
rejected-structural
retry-structural
unknown
```

Estados são apenas rotulagem in-memory — **não** implicam entrega, consumo ou reprocessamento.

---

## 5. Constante canônica

```typescript
STRUCTURAL_MESSAGE_QUEUE_CAPABILITY
```

Embutida em toda `CanonicalQueue` criada estruturalmente.
