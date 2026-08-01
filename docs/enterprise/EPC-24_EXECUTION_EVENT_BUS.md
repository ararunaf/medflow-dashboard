# EPC-24 — Execution Event Bus Foundation

**Sprint:** EPC-24 Sprint 05 — Execution Event Bus Foundation  
**Baseline Foundation:** `medicflow-enterprise-foundation-v1.0.0` (`e6e0eda61e47102a8b8853a62640e0788946ec27`)  
**Padrão:** ECS-01 Ports & Adapters

---

## 1. Objetivo

Criar o Barramento Canônico de Eventos da Execução — módulo responsável **exclusivamente** por representar estruturalmente o fluxo de eventos das execuções.

Esta Sprint **não** entrega eventos.  
**Não** executa subscribers.  
**Não** cria filas.  
**Não** utiliza Pub/Sub, EventEmitter ou Workers.  
**Não** executa Engines.

---

## 2. Fluxo oficial

```
Execution Context
  ↓
Execution State Machine
  ↓
Execution Event Bus
  ↓
Execution Context atualizado (referência estrutural)
```

Fluxo do Orchestrator (Sprint 05):

1. Criar Execution Context  
2. Resolver Pipeline  
3. Criar Execution State Machine  
4. Criar Execution Event Bus  
5. Anexar Event Bus ao Context (referência)  
6. Devolver Context enriquecido  

Nenhum evento é publicado de fato. Nenhum Engine é invocado.

---

## 3. Arquitetura obrigatória (ECS-01)

```
Application
  → ExecutionEventBusPort
    → Adapter (Default | Mock)
      → Store (in-memory)
        ← Factory
          ← Provider (createExecutionEventBusPort)
```

---

## 4. Port — operações estruturais

| Operação | Descrição |
|----------|-----------|
| `createEventBus()` | Cria barramento estrutural vazio |
| `publish()` | Armazena envelope estruturalmente — **sem entrega** |
| `register()` | Registra descriptor de subscriber — **sem callback** |
| `unregister()` | Remove registro estruturalmente |
| `listSubscribers()` | Lista registros estruturais |
| `listEvents()` | Lista envelopes armazenados |
| `health()` | Prontidão |
| `capabilities()` | Capacidades estáticas |

Nenhuma operação executa callbacks, entrega eventos, cria filas ou invoca Engines.

---

## 5. Integração

- **Canonical Execution Orchestrator** — único módulo atualizado  
- Integração exclusiva via `ExecutionEventBusPort`  
- Execution Context permanece objeto de transporte (apenas referência `eventBusId`)  
- Pipeline Resolver e Execution State Machine permanecem intactos e independentes  
- Enterprise Foundation (EPC-00–23) permanece congelada  

---

## 6. Proibições (cumpridas)

- Sem OCR / Parser XML / Rule Engine / Workflow / AI / TISS / FHIR / DICOM  
- Sem filas (RabbitMQ, Kafka, Redis Streams, Cloudflare Queues)  
- Sem Pub/Sub / EventEmitter / Workers / HTTP / Banco / Persistência  
- Sem threads / execução paralela / subscribers reais  

---

## 7. Localização

`src/lib/enterprise/execution-event-bus/`

Testes: `scripts/enterprise/tests/execution-event-bus-engine.test.ts`  
Script: `npm run enterprise:execution-event-bus:test`
