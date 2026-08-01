# EPC-24 — Execution Event Model

**Sprint:** EPC-24 Sprint 05 — Execution Event Bus Foundation  
**Baseline Foundation:** `medicflow-enterprise-foundation-v1.0.0` (`e6e0eda61e47102a8b8853a62640e0788946ec27`)

---

## 1. Modelos canônicos (estruturais)

| Modelo | Kind | Função |
|--------|------|--------|
| `ExecutionEvent` | `execution-event` | Evento estrutural (nunca entregue) |
| `ExecutionEventEnvelope` | `execution-event-envelope` | Envelope de armazenamento |
| `ExecutionEventMetadata` | `execution-event-metadata` | Metadados opacos |
| `ExecutionEventType` | (union) | Catálogo de tipos estruturais |
| `ExecutionEventContext` | `execution-event-context` | Contexto opaco do evento |
| `ExecutionEventPublisher` | `execution-event-publisher` | Descriptor de publicador |
| `ExecutionEventSubscriber` | `execution-event-subscriber` | Descriptor **sem callback** |
| `ExecutionEventRegistration` | `execution-event-registration` | Registro estrutural |
| `ExecutionEventHistory` | `execution-event-history` | Histórico de envelopes |
| `ExecutionEventCapabilities` | `execution-event-capabilities` | Capacidades embutidas |
| `ExecutionEventResult` | `execution-event-result` | Resultado de operação |
| `ExecutionEventBus` | `execution-event-bus` | Agregado do barramento |

**Total canônico declarado na certificação:** 11 modelos listados no brief + agregado `ExecutionEventBus` = **12** tipos estruturais.

---

## 2. Tipos estruturais de evento

```
execution.created
execution.context-attached
execution.state-changed
execution.pipeline-resolved
execution.pipeline-attached
execution.event-bus-attached
execution.structural-walk
execution.completed
execution.cancelled
execution.failed
execution.custom
```

Catálogo em `EXECUTION_EVENT_TYPES`. Nenhuma ação associada.

---

## 3. Invariantes de modelo

- `delivered: false` em Event / Envelope / Result  
- `callbacksExecuted: false` em Subscriber / Result / Envelope  
- `subscribersNotified: false` / `subscribersMatched: 0`  
- `hasCallback: false` no Subscriber  
- `queuesImplemented: false` / `pubSubImplemented: false` / `eventEmitterUsed: false` / `workersUsed: false`  
- `enginesInvoked: false` / `stagesExecuted: false` / `processingPerformed: false`  
- `noDirectEngineCoupling: true` / `decoupledFromEngines: true`  

Nenhum modelo contém regra de negócio.

---

## 4. Agregado ExecutionEventBus

```
ExecutionEventBus
├── publisher: ExecutionEventPublisher
├── registrations: ExecutionEventRegistration[]
├── history: ExecutionEventHistory
│     └── envelopes: ExecutionEventEnvelope[]
│           └── event: ExecutionEvent
├── metadata: ExecutionEventMetadata
└── capability: ExecutionEventCapabilities
```

O Orchestrator cria o bus e anexa apenas `eventBusId` ao Execution Context via referências opacas.
